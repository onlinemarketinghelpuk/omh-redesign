#!/usr/bin/env python3
"""
Generates the four n8n workflows and writes them to n8n/*.json.
Creating them on the instance is a separate, explicit step (push.py), so
nothing lands on a live n8n by accident.

Structure follows the HP4P concierge workflows already running on this
instance, because that shape is proven rather than because it is clever.
"""
import json, os, pathlib, re

HERE = pathlib.Path(__file__).parent

# Where the un-tracked working assets live: .env.local, retell/, kb/.
#
# This file is version controlled (n8n is the brain now, and an untracked
# brain is one that can be lost or quietly changed), but the secrets it
# reads are not and must never be. Python resolves __file__ through the
# symlink to the real path, so HERE.parent lands in the repo rather than in
# the working copy. Look for the thing that actually matters instead of
# assuming a layout.
def _root():
    for c in (HERE.parent, HERE.parent.parent.parent / "widget", pathlib.Path.cwd().parent):
        if (c / ".env.local").exists():
            return c
    raise SystemExit(
        "Cannot find .env.local. Run this from the working copy "
        "(OHM/widget/n8n), not from the repo path."
    )


ROOT = _root()

env = {}
for line in (ROOT / ".env.local").read_text().splitlines():
    t = line.strip()
    if not t or t.startswith("#") or "=" not in t:
        continue
    k, _, v = t.partition("=")
    env[k] = v.strip().strip('"')

CONVEX = env["OHM_WIDGET_CONVEX_SITE"]
SECRET = env["OHM_WIDGET_SECRET"]
TOOL_TOKEN = env["OHM_RETELL_TOOL_TOKEN"]
RETELL_KEY = env["RETELL_API_KEY"]
# The OHM and Anthropic keys both ran out of credit, so the agent thinks through
# OpenRouter. One credential, one account to top up, and the model is a string so
# swapping it does not mean re-authorising anything.
OPENROUTER_CRED = {
    # On srv1836598, which is where these workflows live. The n8n MCP server talks
    # to srv1236458, so a credential made through MCP has an id this instance
    # does not know and the node silently runs without auth.
    "openRouterApi": {"id": "Sj2vuK21qAcp0hJj", "name": "OpenRouter — OMH Site Assistant"}
}
# A plain HTTP call to OpenRouter, for describing a photo. The langchain
# credential above only works on langchain nodes, and describing an image is
# one request rather than an agent, so it goes through httpRequest with the
# key in a header. Same account, same bill.
OPENROUTER_KEY = env["OPENROUTER_API_KEY"]
# Voice notes. Rafiul's own Deepgram account, already used by the Bangla
# voice work. Nova-3 pre-recorded, billed by the minute.
DEEPGRAM_KEY = env["DEEPGRAM_API_KEY"]

# Who the automated email comes from. This used to be typed into three nodes
# by hand, which meant the address a lead sees was a code edit away from the
# address the mailbox actually is. The fallback is the account that has been
# sending until now, so nothing changes until MAIL_FROM is set; once OMH gives
# us a mailbox on their own domain this is a one line config change.
#
# It matters more than it looks: a lead's first automated contact arriving
# from a personal gmail address, with no SPF or DKIM behind it, is both a
# credibility problem and a spam folder problem.
MAIL_FROM = env.get("MAIL_FROM", "videoeditoromh@gmail.com")
assert "@" in MAIL_FROM, f"MAIL_FROM is not an address: {MAIL_FROM!r}"

CHAT_MODEL = "anthropic/claude-sonnet-5.5"     # $2.00 / $10.00 per 1M, 1M context.
                                               # 20x Haiku on both input and output:
                                               # a reply costs ~$0.0014 instead of
                                               # ~$0.00007. Priced into the packages.
CHAT_MODEL_FALLBACK = "openai/gpt-4o-mini"     # different vendor, so one outage is not both

AGENT_ID = "AGENT_ID_PENDING"
_agent_file = ROOT / "retell" / "agent.json"
if _agent_file.exists():
    AGENT_ID = json.loads(_agent_file.read_text()).get("agent_id", AGENT_ID)

CORE_PROMPT = (ROOT / "retell" / "prompt-core.md").read_text()
NOW_EXPR = "{{ $now.setZone('Europe/London').toFormat('cccc d LLLL yyyy, HH:mm') }}"
CHAT_PROMPT = CORE_PROMPT.replace("{{NOW}}", NOW_EXPR)



GATES = ROOT.parent / "website" / "widget" / "gates"


def gate_source(module):
    """The text of a gates module, types stripped, ready for a Code node.

    The point of gates/ is that the tests assert the SAME text the workflow
    runs. So the Code node does not get a hand-written copy of the logic: it
    gets this, bundled from the file the tests import. If the logic changes
    and the tests do not, the tests fail; if the tests change and the node
    does not, the next build moves it. Two copies cannot drift because there
    is only one.

    esbuild is already in the repo for the test runner. `--format=iife` with a
    global name gives a self-contained block with no import statement, which
    is what a Code node can run.
    """
    import subprocess
    # The widget's own esbuild, for the same reason tests/run.sh uses it:
    # it is declared in widget/package.json, where this depends on it.
    esb = ROOT / "node_modules" / ".bin" / "esbuild"
    if not esb.exists():
        esb = ROOT.parent / "website" / "node_modules" / ".bin" / "esbuild"
    out = subprocess.run(
        [str(esb), str(GATES / module), "--bundle", "--format=iife",
         "--global-name=GATE", "--platform=neutral", "--target=es2020",
         "--log-level=warning"],
        capture_output=True, text=True, check=True)
    return out.stdout

def gate_inline(module):
    """A gates module's own text, with its export line removed.

    For a gate that is already plain JavaScript this beats bundling it. The
    file is `var` and `function` declarations plus one `export {...}` line,
    so dropping that line leaves code a Code node runs as-is, with the
    functions in scope under their own names.

    Why not esbuild here: the bundled form assigns an IIFE to a global and
    the Code node could not reach it at runtime ("GATE.tidy is not a
    function"). That took the live chat down for about four minutes on
    2026-11-11, between executions 77760 and 77768, and it was pushed
    because the test ran the gate directly rather than running the node's
    body the way n8n runs it: wrapped in a function, with `return` at the
    top of that function. Anything that changes a Code node is now driven
    through `new Function(...)` first, which is the only shape that would
    have caught it.

    The point of gates/ is that the text the tests assert is the text that
    runs, and every layer between those two is somewhere for them to differ.
    """
    out = []
    for line in (GATES / module).read_text().splitlines():
        if line.startswith("export {") or line.startswith("export default"):
            continue
        out.append(line)
    return "\n".join(out).rstrip() + "\n"


def hdr(name, value):
    return {"sendHeaders": True,
            "headerParameters": {"parameters": [{"name": name, "value": value}]}}


def convex_tool(node_id, name, route, description, body_expr, x=0, y=0):
    """An httpRequestTool the agent can call. Body is an n8n expression that
    pulls arguments out of $fromAI."""
    return {
        "parameters": {
            "toolDescription": description,
            "method": "POST",
            "url": f"{CONVEX}{route}",
            **hdr("x-ohm-secret", SECRET),
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": body_expr,
            "options": {},
        },
        "id": node_id,
        "name": name,
        "type": "n8n-nodes-base.httpRequestTool",
        "typeVersion": 4.2,
        "position": [x, y],
    }


def convex_http(node_id, name, route, body_expr, x=0, y=0, always_output=True):
    n = {
        "parameters": {
            "method": "POST",
            "url": f"{CONVEX}{route}",
            **hdr("x-ohm-secret", SECRET),
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": body_expr,
            "options": {},
        },
        "id": node_id,
        "name": name,
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [x, y],
    }
    if always_output:
        # A logging call must never take the conversation down with it.
        n["onError"] = "continueRegularOutput"
    return n


# The browser widget is the only thing that should be able to call these, so
# the webhooks answer CORS for the live site and local development only.
ALLOWED_ORIGINS = ",".join([
    "https://onlinemarketinghelp.co.uk",
    "https://www.onlinemarketinghelp.co.uk",
    # The site's dev server. Next takes 3000 if it is free and walks up from
    # there when it is not, so the next two are allowed as well: without them
    # the assistant loads, the pill appears, and every message comes back
    # "cannot reach our system", which looks like a broken agent rather than a
    # blocked origin.
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    # Where the site gets started when 3000 is taken by another project
    # entirely, which on this machine it usually is.
    "http://localhost:3100",
    "http://localhost:4455",
    "http://localhost:4477",   # web/embed/test/verify.mjs
    # The hosted preview the MD and the web developer test from, before the
    # widget goes on the WordPress site.
    "https://ohm-assistant-online-marketing-help.vercel.app",
    "https://omh-redesign.vercel.app",
    "https://ohm-roi-calculators.vercel.app",
    "https://ohm-roi-calculators-online-marketing-help.vercel.app",
])

SESSION = "$('Chat Webhook').item.json.body.session_id"

TOOLS = [
    ("tool_kb", "search_knowledge", "/searchKB",
     "Search the verified Online Marketing Help knowledge base, built from the live website: every service and what it includes, who each one suits, solutions, FAQs, case studies, company details, terms and the warranty. Call this BEFORE answering any factual question. Input: a few keywords, not a sentence. Examples: 'local seo what is included', 'shopify migration', 'contract length', 'who are you'.",
     "={{ JSON.stringify({ q: $fromAI('q', 'A few search keywords describing what the visitor wants to know', 'string'), limit: 6 }) }}"),

    ("tool_pkg", "get_packages", "/getPackages",
     "The structured package and price list: 38 packages across 11 service groups, each with its MONTHLY price, contract length and what is included. Use this for EVERY price question. Input: the service name or a keyword, e.g. 'SEO', 'WordPress', 'Google Ads', 'Instagram'. Remember the prices are monthly with a 50% deposit, never a one-off project total.",
     "={{ JSON.stringify({ q: $fromAI('q', 'Service name or keyword to price, e.g. SEO or WordPress', 'string') }) }}"),

    ("tool_lead", "save_lead", "/saveLead",
     "Save the visitor's contact details as a lead. Call this as soon as they give you a name with an email or phone, or show real buying interest. Set hot true when they have a live project, a budget or a deadline.",
     "={{ JSON.stringify({ sessionId: " + SESSION + ", name: $fromAI('name','Their full name','string'), email: $fromAI('email','Their email address if given','string'), phone: $fromAI('phone','Their phone number if given','string'), company: $fromAI('company','Their company name if given','string'), website: $fromAI('website','Their website if given','string'), service: $fromAI('service','Which OMH service they are interested in','string'), budget: $fromAI('budget','Any budget they mentioned','string'), message: $fromAI('message','What they are trying to achieve','string'), hot: $fromAI('hot','true if they have a live project, budget or deadline','boolean'), channel: 'chat' }) }}"),

    ("tool_book", "book_consultation", "/bookAppointment",
     "Book the free 30 minute consultation. You MUST already have their full name, a phone number, a real calendar date and a time before calling this. Date must be YYYY-MM-DD and time HH:mm in 24 hour UK time, weekdays only between 09:00 and 17:00. Returns a booking reference that you must read back to them.",
     "={{ JSON.stringify({ sessionId: " + SESSION + ", name: $fromAI('name','Their full name','string'), phone: $fromAI('phone','Their phone number','string'), email: $fromAI('email','Their email if given','string'), service: $fromAI('service','What the consultation is about, e.g. SEO or a new website','string'), preferredDate: $fromAI('preferredDate','The date as YYYY-MM-DD','string'), preferredTime: $fromAI('preferredTime','The time as HH:mm, 24 hour','string'), notes: $fromAI('notes','Anything useful for the team before the call','string'), channel: 'chat' }) }}"),

    ("tool_manage", "manage_booking", "/manageBooking",
     "Look up, move or cancel an existing booking using its reference (format OMH-XXXXXX). action must be 'lookup', 'move' or 'cancel'. Moving needs a new date and time.",
     "={{ JSON.stringify({ reference: $fromAI('reference','The booking reference, e.g. OMH-ACDEFG','string'), action: $fromAI('action','lookup, move or cancel','string'), preferredDate: $fromAI('preferredDate','New date as YYYY-MM-DD when moving','string'), preferredTime: $fromAI('preferredTime','New time as HH:mm when moving','string') }) }}"),

    ("tool_esc", "escalate_to_team", "/escalate",
     "Send the question straight to a person at OMH. Use this whenever the tools cannot answer, for anything about an existing client account, invoices or project status, for complaints, for legal or contractual questions, and for anything you are not sure about. Using this is the correct move, not a failure.",
     "={{ JSON.stringify({ sessionId: " + SESSION + ", reason: $fromAI('reason','Short reason, e.g. not in knowledge base, existing client account, complaint','string'), question: $fromAI('question','What the visitor actually asked, in their words','string'), contact: $fromAI('contact','Their phone or email if known','string'), channel: 'chat' }) }}"),
]


# =========================================================================
# 1 · Chat
# =========================================================================

def build_chat():
    nodes = [
        {"parameters": {"httpMethod": "POST", "path": "ohm-chat",
                        "responseMode": "responseNode",
                        "options": {"allowedOrigins": ALLOWED_ORIGINS}},
         "id": "wh_chat", "name": "Chat Webhook",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-820, 0]},

        convex_http("log_user", "Log User Message", "/logMessage",
                    "={{ JSON.stringify({ sessionId: $json.body.session_id, role: 'user', text: $json.body.message, channel: 'chat', pageUrl: $json.body.page_url }) }}",
                    -600, -160),

        # By name, not $json: the switch check now sits between the webhook
        # and this node, so $json here is the switch's answer.
        convex_http("load_profile", "Load Profile", "/getProfile",
                    "={{ JSON.stringify({ sessionId: $('Chat Webhook').item.json.body.session_id }) }}",
                    -600, 0),

        # ---- the per-channel switch (plan 014) ---------------------------
        # Off means everything on that channel stops, the assistant
        # included: the message goes to a person instead. Website chat, and
        # Facebook and Instagram DMs (which the Meta workflow sends here).
        # A text reply (page_url "sms") was already judged by the Brain.
        # If the switches cannot be read the chat answers as it always has:
        # a Convex hiccup must not silence the website.
        convex_http("chan_sw", "Read The Switches", "/settings/channels",
                    "={{ JSON.stringify({}) }}", -1040, 160),

        {"parameters": {"jsCode": (
            gate_inline("integrations.js") + "\n"
            "const body = $('Chat Webhook').first().json.body || {};\n"
            "const ch = chatChannel(body);\n"
            "const sw = ($input.first().json || {}).switches;\n"
            "const on = ch === null || !sw || isOn(sw, ch);\n"
            "return [{ json: { on, channel: ch, reply: switchedOffReply() } }];"
        )},
         "id": "chan_on", "name": "Is The Channel On",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-820, 160]},

        {"parameters": {"conditions": {"options": {"caseSensitive": True, "version": 2},
                                       "conditions": [{"leftValue": "={{ $json.on }}",
                                                       "rightValue": True,
                                                       "operator": {"type": "boolean", "operation": "true", "singleValue": True}}],
                                       "combinator": "and"},
                        "options": {}},
         "id": "chan_if", "name": "Channel On",
         "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [-820, 0]},

        convex_http("chan_handover", "Hand It To A Person", "/handover/request",
                    "={{ JSON.stringify({ sessionId: $('Chat Webhook').item.json.body.session_id, "
                    "reason: 'This channel is switched off on the dashboard, so a person answers.', "
                    "question: $('Chat Webhook').item.json.body.message, "
                    "channel: $('Is The Channel On').item.json.channel }) }}",
                    -600, 320),

        convex_http("chan_log", "Log The Holding Reply", "/logMessage",
                    "={{ JSON.stringify({ sessionId: $('Chat Webhook').item.json.body.session_id, role: 'assistant', text: $('Is The Channel On').item.json.reply, channel: 'chat' }) }}",
                    -380, 440),

        {"parameters": {"respondWith": "json",
                        "responseBody": "={{ JSON.stringify({ reply: $('Is The Channel On').item.json.reply, session_id: $('Chat Webhook').item.json.body.session_id, handedOver: true }) }}",
                        "options": {}},
         "id": "chan_resp", "name": "Respond Switched Off",
         "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": [-380, 320]},

        {"parameters": {"jsCode": (
            "// What we already know about this visitor is prepended to the turn so\n"
            "// the agent never asks for a detail it has already been given.\n"
            "//\n"
            "// Read from NAMED nodes, not from $input: this node is reached from\n"
            "// two branches now (with a photo and without), so whatever arrives on\n"
            "// the wire is whichever branch ran, and the profile has to be asked\n"
            "// for by name either way.\n"
            "const wh = $('Chat Webhook').first().json.body;\n"
            "let p = {};\n"
            "try { p = $('Load Profile').first().json || {}; } catch (e) { p = {}; }\n"
            "const known = [];\n"
            "if (p.name) known.push('name: ' + p.name);\n"
            "if (p.email) known.push('email: ' + p.email);\n"
            "if (p.phone) known.push('phone: ' + p.phone);\n"
            "if (p.company) known.push('company: ' + p.company);\n"
            "if (p.website) known.push('website: ' + p.website);\n"
            "if (p.budget) known.push('budget: ' + p.budget);\n"
            "if (Array.isArray(p.interestedIn) && p.interestedIn.length) known.push('interested in: ' + p.interestedIn.join(', '));\n"
            "if (p.notes) known.push('notes: ' + p.notes);\n"
            "const hint = known.length\n"
            "  ? 'ALREADY KNOWN ABOUT THIS VISITOR (do not ask again): ' + known.join(' | ') + '\\n\\n'\n"
            "  : '';\n"
            "const page = wh.page_url ? 'They are on this page: ' + wh.page_url + '\\n\\n' : '';\n"
            "// What the photo showed, when there was one. Asked for by name and\n"
            "// in a try, because the describing branch does not run on an\n"
            "// ordinary turn and referencing a node that did not run throws.\n"
            "let photo = '';\n"
            "try { photo = $('Describe The Photo').first().json.note || ''; } catch (e) { photo = ''; }\n"
            "try { if (!photo) photo = $('Write Down The Voice Note').first().json.note || ''; } catch (e) {}\n"
            "if (photo) photo += '\\n\\n';\n"
            "// A sales brief, from the Brain, when this turn is the assistant\n"
            "// answering a reply to one of our follow-up texts. Honoured ONLY\n"
            "// with the server-side token: this webhook is public, and a brief\n"
            "// from a stranger would be somebody else's instructions.\n"
            "const brief = (wh.brief && wh.brief_token === '" + TOOL_TOKEN + "') ? String(wh.brief) + '\\n\\n' : '';\n"
            "return [{ json: { chat_input: brief + hint + page + photo + 'Visitor says: ' + (wh.message || '') } }];"
        )},
         "id": "build_ctx", "name": "Build Context",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-380, 0]},

        # ----------------------------------------------- the photo path

        {"parameters": {"rules": {"values": [
            {"conditions": {
                "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "loose",
                            "version": 2},
                "conditions": [{
                    "id": "is_image",
                    "leftValue": "={{ $('Chat Webhook').first().json.body.attachment ? $('Chat Webhook').first().json.body.attachment.kind : '' }}",
                    "rightValue": "image",
                    "operator": {"type": "string", "operation": "equals"},
                }],
                "combinator": "and",
             }, "outputKey": "photo"},
            {"conditions": {
                "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "loose",
                            "version": 2},
                "conditions": [{
                    "id": "is_audio",
                    "leftValue": "={{ $('Chat Webhook').first().json.body.attachment ? $('Chat Webhook').first().json.body.attachment.kind : '' }}",
                    "rightValue": "audio",
                    "operator": {"type": "string", "operation": "equals"},
                }],
                "combinator": "and",
             }, "outputKey": "voice"},
         ]},
         # Everything else, which is almost every turn, goes straight on.
         "options": {"fallbackOutput": "extra", "renameFallbackOutput": "plain"}},
         "id": "what_kind", "name": "What Did They Send",
         "type": "n8n-nodes-base.switch", "typeVersion": 3.2, "position": [-480, 0]},

        # The widget sends a storage id, never a URL. Resolving it here is
        # the whole point: a workflow fetching an address chosen in a browser
        # is server-side request forgery, and Convex refuses an id that is
        # not already in a conversation.
        convex_http("photo_url", "Where Is The Photo", "/attachment/urlFor",
                    "={{ JSON.stringify({ storageId: $('Chat Webhook').first().json.body.attachment.storageId }) }}",
                    -340, -220),

        {"parameters": {
            "method": "POST",
            "url": "https://openrouter.ai/api/v1/chat/completions",
            "sendHeaders": True,
            "headerParameters": {"parameters": [
                {"name": "authorization", "value": "Bearer " + OPENROUTER_KEY},
                {"name": "content-type", "value": "application/json"},
            ]},
            "sendBody": True, "specifyBody": "json",
            "jsonBody": "={{ JSON.stringify($json.body) }}",
            "options": {"timeout": 30000},
         },
         "id": "photo_look", "name": "Look At The Photo",
         "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2,
         "position": [-60, -220],
         # A photo we cannot look at must not take the conversation down
         # with it. The describing node turns a failure into an honest
         # sentence.
         "onError": "continueRegularOutput"},

        {"parameters": {"jsCode": (
            gate_inline("vision.js") + "\n"
            "// Build the request. The URL came from Convex, which only\n"
            "// answers for a file already in a conversation.\n"
            "const r = $input.first().json || {};\n"
            "if (!r.ok || !r.url) return [{ json: { body: null, skip: true } }];\n"
            "return [{ json: { body: visionRequest(r.url, '') } }];"
        )},
         "id": "photo_ask", "name": "Ask What It Shows",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-200, -220]},

        {"parameters": {"jsCode": (
            gate_inline("vision.js") + "\n"
            "// What came back, turned into a sentence for the agent. A\n"
            "// failure gets an honest one rather than none: somebody just\n"
            "// sent a photo and silence is not an answer.\n"
            "const d = describeFrom($input.first().json);\n"
            "return [{ json: { note: d.prompt, saw: d.ok, why: d.why } }];"
        )},
         "id": "photo_note", "name": "Describe The Photo",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [80, -220]},

        # ----------------------------------------------- the voice path

        convex_http("voice_url", "Where Is The Voice Note", "/attachment/urlFor",
                    "={{ JSON.stringify({ storageId: $('Chat Webhook').first().json.body.attachment.storageId }) }}",
                    -340, 220),

        {"parameters": {"jsCode": (
            gate_inline("voice-note.js") + "\n"
            "const r = $input.first().json || {};\n"
            "if (!r.ok || !r.url) return [{ json: { skip: true, query: '', body: null } }];\n"
            "const req = transcribeRequest(r.url);\n"
            "return [{ json: req }];"
        )},
         "id": "voice_ask", "name": "Ask What They Said",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-200, 220]},

        {"parameters": {
            "method": "POST",
            "url": "=https://api.deepgram.com/v1/listen?{{ $json.query }}",
            "sendHeaders": True,
            "headerParameters": {"parameters": [
                {"name": "authorization", "value": "Token " + DEEPGRAM_KEY},
                {"name": "content-type", "value": "application/json"},
            ]},
            "sendBody": True, "specifyBody": "json",
            "jsonBody": "={{ JSON.stringify($json.body) }}",
            "options": {"timeout": 60000},
         },
         "id": "voice_hear", "name": "Listen To The Voice Note",
         "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2,
         "position": [-60, 220],
         # A voice note we cannot hear must not end the conversation.
         "onError": "continueRegularOutput"},

        {"parameters": {"jsCode": (
            gate_inline("voice-note.js") + "\n"
            "// A WRONG transcript is worse than none: it reads perfectly and\n"
            "// says something nobody said. transcriptFrom refuses a\n"
            "// low-confidence one rather than passing it on.\n"
            "const d = transcriptFrom($input.first().json);\n"
            "return [{ json: { note: d.prompt, heard: d.ok, why: d.why, seconds: d.seconds } }];"
        )},
         "id": "voice_note", "name": "Write Down The Voice Note",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [80, 220]},

        {"parameters": {"promptType": "define", "text": "={{ $json.chat_input }}",
                        "needsFallback": True,
                        "options": {"systemMessage": "=" + CHAT_PROMPT}},
         "id": "agent", "name": "Melissa",
         "type": "@n8n/n8n-nodes-langchain.agent", "typeVersion": 3.1,
         "position": [-140, 0], "retryOnFail": True, "maxTries": 2, "waitBetweenTries": 3000,
         "onError": "continueErrorOutput"},

        {"parameters": {"model": CHAT_MODEL, "options": {"temperature": 0.2}},
         "id": "llm", "name": "Chat Model",
         "type": "@n8n/n8n-nodes-langchain.lmChatOpenRouter", "typeVersion": 1,
         "position": [-260, 240], "credentials": OPENROUTER_CRED},

        {"parameters": {"model": CHAT_MODEL_FALLBACK, "options": {"temperature": 0.2}},
         "id": "llm_fb", "name": "Fallback Model",
         "type": "@n8n/n8n-nodes-langchain.lmChatOpenRouter", "typeVersion": 1,
         "position": [-120, 240], "credentials": OPENROUTER_CRED},

        {"parameters": {"sessionIdType": "customKey",
                        "sessionKey": "={{ $('Chat Webhook').item.json.body.session_id }}",
                        "contextWindowLength": 10},
         "id": "mem", "name": "Session Memory",
         "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow", "typeVersion": 1.3,
         "position": [-400, 240]},

        {"parameters": {"jsCode": (
            # The markdown stripper is gates/reply-shape.js verbatim, bundled,
            # not a hand-written copy: the widget renders bubbles with
            # textContent, so "**SEO Seed:**" reaches the visitor WITH the
            # asterisks, and 22 assertions hold that it does not.
            #
            # Note what this does not do, despite what the old comment here
            # claimed: it does not cap the reply. Cutting a reply off mid
            # sentence loses the part that mattered and tells the visitor
            # nothing was removed. Length is the system prompt's job; this
            # only records when the prompt is losing.
            #
            # gates/tone.js, also verbatim, is the decidable half of OMH's
            # tone of voice (docs/tone-of-voice.md): em dashes, the never-use
            # words, US dates, prices without "+ VAT", exclamation marks,
            # American spelling. Like `overlong` it REPORTS and never edits:
            # rewriting a model's sentence after the fact can change a fact
            # in it, and a price is the one thing that must arrive exactly as
            # the knowledge base has it. The codes ride along on the item so
            # the execution log shows when the prompt is losing.
            gate_inline("reply-shape.js") + "\n"
            + gate_inline("tone.js") + "\n"
            "let t = tidy($input.first().json.output || '');\n"
            "if (!t) t = \"Sorry, I didn't catch that. Could you say it again?\";\n"
            "return [{ json: { reply: t, overlong: looksOverlong(t),\n"
            "  tone: toneIssues(t).map(function (i) { return i.code; }) } }];"
        )},
         "id": "clean", "name": "Clean Reply",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [120, 0]},

        {"parameters": {"jsCode": (
            "// The agent failed: out of LLM credit, a timeout, anything. The visitor\n"
            "// must still get something they can act on rather than an empty box.\n"
            "return [{ json: { reply: 'Sorry, I cannot answer right now. Please call us on '\n"
            "  + '020 3489 3934 or email support@onlinemarketinghelp.co.uk and the team '\n"
            "  + 'will pick it up. You can also book a free 30 minute consultation at '\n"
            "  + 'onlinemarketinghelp.co.uk/omh-free-consultation' } }];"
        )},
         "id": "fallback", "name": "Agent Unavailable",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [120, 180]},

        convex_http("log_bot", "Log Reply", "/logMessage",
                    "={{ JSON.stringify({ sessionId: $('Chat Webhook').item.json.body.session_id, role: 'assistant', text: $json.reply, channel: 'chat' }) }}",
                    340, -160),

        {"parameters": {"respondWith": "json",
                        "responseBody": "={{ JSON.stringify({ reply: $json.reply, session_id: $('Chat Webhook').item.json.body.session_id }) }}",
                        "options": {}},
         "id": "respond", "name": "Respond",
         "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1,
         "position": [560, 0]},
    ]

    x = 0
    for tid, name, route, desc, body in TOOLS:
        nodes.append(convex_tool(tid, name, route, desc, body, -20 + x * 160, 420))
        x += 1

    conns = {
        "Chat Webhook": {"main": [[{"node": "Log User Message", "type": "main", "index": 0},
                                   {"node": "Read The Switches", "type": "main", "index": 0}]]},
        "Read The Switches": {"main": [[{"node": "Is The Channel On", "type": "main", "index": 0}]]},
        "Is The Channel On": {"main": [[{"node": "Channel On", "type": "main", "index": 0}]]},
        "Channel On": {"main": [[{"node": "Load Profile", "type": "main", "index": 0}],
                                [{"node": "Hand It To A Person", "type": "main", "index": 0}]]},
        "Hand It To A Person": {"main": [[{"node": "Respond Switched Off", "type": "main", "index": 0},
                                          {"node": "Log The Holding Reply", "type": "main", "index": 0}]]},
        "Load Profile": {"main": [[{"node": "What Did They Send", "type": "main", "index": 0}]]},
        # Three ways out: a photo, a voice note, or an ordinary turn. All
        # three end at Build Context, which asks for whichever ran by name.
        "What Did They Send": {"main": [
            [{"node": "Where Is The Photo", "type": "main", "index": 0}],
            [{"node": "Where Is The Voice Note", "type": "main", "index": 0}],
            [{"node": "Build Context", "type": "main", "index": 0}],
        ]},
        "Where Is The Photo": {"main": [[{"node": "Ask What It Shows", "type": "main", "index": 0}]]},
        "Ask What It Shows": {"main": [[{"node": "Look At The Photo", "type": "main", "index": 0}]]},
        "Look At The Photo": {"main": [[{"node": "Describe The Photo", "type": "main", "index": 0}]]},
        "Describe The Photo": {"main": [[{"node": "Build Context", "type": "main", "index": 0}]]},
        "Where Is The Voice Note": {"main": [[{"node": "Ask What They Said", "type": "main", "index": 0}]]},
        "Ask What They Said": {"main": [[{"node": "Listen To The Voice Note", "type": "main", "index": 0}]]},
        "Listen To The Voice Note": {"main": [[{"node": "Write Down The Voice Note", "type": "main", "index": 0}]]},
        "Write Down The Voice Note": {"main": [[{"node": "Build Context", "type": "main", "index": 0}]]},
        "Build Context": {"main": [[{"node": "Melissa", "type": "main", "index": 0}]]},
        "Melissa": {"main": [[{"node": "Clean Reply", "type": "main", "index": 0}],
                          [{"node": "Agent Unavailable", "type": "main", "index": 0}]]},
        "Agent Unavailable": {"main": [[{"node": "Respond", "type": "main", "index": 0}]]},
        "Clean Reply": {"main": [[{"node": "Log Reply", "type": "main", "index": 0},
                                  {"node": "Respond", "type": "main", "index": 0}]]},
        "Chat Model": {"ai_languageModel": [[{"node": "Melissa", "type": "ai_languageModel", "index": 0}]]},
        "Fallback Model": {"ai_languageModel": [[{"node": "Melissa", "type": "ai_languageModel", "index": 1}]]},
        "Session Memory": {"ai_memory": [[{"node": "Melissa", "type": "ai_memory", "index": 0}]]},
    }
    for _, name, *_ in TOOLS:
        conns[name] = {"ai_tool": [[{"node": "Melissa", "type": "ai_tool", "index": 0}]]}

    return {"name": "OHM Assistant — Chat", "nodes": nodes, "connections": conns,
            "settings": wf_settings()}


# =========================================================================
# 2 · Voice: web-call token + Retell tool router
# =========================================================================

def build_voice():
    tool_routes = [
        ("search_knowledge", "/searchKB"),
        ("get_packages", "/getPackages"),
        ("save_lead", "/saveLead"),
        ("book_consultation", "/bookAppointment"),
        ("manage_booking", "/manageBooking"),
        ("escalate_to_team", "/escalate"),
    ]

    nodes = [
        # --- web call token ------------------------------------------------
        {"parameters": {"httpMethod": "POST", "path": "ohm-voice-token",
                        "responseMode": "responseNode",
                        "options": {"allowedOrigins": ALLOWED_ORIGINS}},
         "id": "wh_tok", "name": "Voice Token Webhook",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-820, -300]},

        {"parameters": {
            "method": "POST",
            # v3, not v2. Retell switched v2 off rather than merely
            # deprecating it, and the error it returns is a *warning*-level
            # body with a 200-shaped failure, so the widget simply got no
            # token and the Voice tab did nothing. Every call since at least
            # 12 November failed this way, silently, because nothing was
            # watching n8n executions. That is also why 00-error exists.
            #
            # The body is unchanged between v2 and v3. The RESPONSE is not:
            # it now carries `transport` and `ice_servers`, and the browser
            # needs both, plus `call_id`. See "Respond Token" below.
            "url": "https://api.retellai.com/v3/create-web-call",
            "sendHeaders": True,
            "headerParameters": {"parameters": [
                {"name": "Authorization", "value": f"Bearer {RETELL_KEY}"}]},
            "sendBody": True, "specifyBody": "json",
            # The webhook by name: the switch check now sits in between.
            "jsonBody": "={{ JSON.stringify({ agent_id: '" + AGENT_ID + "', metadata: { session_id: $('Voice Token Webhook').item.json.body.session_id, page_url: $('Voice Token Webhook').item.json.body.page_url }, retell_llm_dynamic_variables: { session_id: $('Voice Token Webhook').item.json.body.session_id, now_uk: $now.setZone('Europe/London').toFormat('cccc d LLLL yyyy, HH:mm') } }) }}",
            "options": {}},
         "id": "mk_call", "name": "Create Retell Web Call",
         "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [-580, -300]},

        {"parameters": {"respondWith": "json",
                        # All four, because the browser SDK needs all four.
                        # v3 answers with transport "gateway", and the gateway
                        # transport REFUSES to connect without `callId` and
                        # builds its peer connection from `ice_servers`.
                        # Returning only the token, as this did, would leave
                        # the call failing in the browser even once the
                        # endpoint was right.
                        "responseBody": "={{ JSON.stringify({ access_token: $json.access_token, call_id: $json.call_id, transport: $json.transport, ice_servers: $json.ice_servers }) }}",
                        "options": {}},
         "id": "resp_tok", "name": "Respond Token",
         "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": [-340, -300]},

        # --- the per-channel switch (plan 014) ------------------------------
        # Website voice switched off: no call token, so no call. The widget
        # already says "The voice line is not available at the moment. Chat
        # still works, or you can ring" the office. Unreadable switches mean
        # on: a Convex hiccup must not take the voice line down.
        convex_http("vsw", "Read The Switches", "/settings/channels",
                    "={{ JSON.stringify({}) }}", -820, -480),

        {"parameters": {"jsCode": (
            gate_inline("integrations.js") + "\n"
            "const sw = ($input.first().json || {}).switches;\n"
            "return [{ json: { on: !sw || isOn(sw, 'website_voice') } }];"
        )},
         "id": "v_on", "name": "Is Voice On",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-700, -480]},

        {"parameters": {"conditions": {"options": {"caseSensitive": True, "version": 2},
                                       "conditions": [{"leftValue": "={{ $json.on }}",
                                                       "rightValue": True,
                                                       "operator": {"type": "boolean", "operation": "true", "singleValue": True}}],
                                       "combinator": "and"},
                        "options": {}},
         "id": "v_if", "name": "Voice On",
         "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [-580, -480]},

        {"parameters": {"respondWith": "json",
                        "responseBody": "={{ JSON.stringify({ error: 'voice_off' }) }}",
                        "options": {}},
         "id": "v_off", "name": "Respond Voice Off",
         "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": [-340, -480]},

        # --- tool router ---------------------------------------------------
        {"parameters": {"httpMethod": "POST", "path": "ohm-retell-tool",
                        "responseMode": "responseNode", "options": {}},
         "id": "wh_tool", "name": "Retell Tool Webhook",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-820, 120]},

        {"parameters": {"conditions": {"options": {"caseSensitive": True, "version": 2},
                                       "conditions": [{"id": "c1",
                                                       "leftValue": "={{ $json.query.token }}",
                                                       "rightValue": TOOL_TOKEN,
                                                       "operator": {"type": "string", "operation": "equals"}}],
                                       "combinator": "and"},
                        "options": {}},
         "id": "chk_tok", "name": "Check Tool Token",
         "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [-600, 120]},

        {"parameters": {"respondWith": "json",
                        "responseBody": "={{ JSON.stringify({ error: 'unauthorized' }) }}",
                        # n8n moved the status code into options; set at the top
                        # level it is silently ignored and a refusal answers 200.
                        "options": {"responseCode": 401}},
         "id": "deny", "name": "Deny",
         "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": [-380, 300]},

        {"parameters": {"rules": {"values": [
            {"conditions": {"options": {"caseSensitive": True, "version": 2},
                            "conditions": [{"id": f"r{i}",
                                            "leftValue": "={{ $json.body.name }}",
                                            "rightValue": name,
                                            "operator": {"type": "string", "operation": "equals"}}],
                            "combinator": "and"},
             "outputKey": name}
            for i, (name, _) in enumerate(tool_routes)]},
            "options": {"fallbackOutput": "extra"}},
         "id": "route", "name": "Route Tool",
         "type": "n8n-nodes-base.switch", "typeVersion": 3.2, "position": [-380, 120]},
    ]

    conns = {
        "Voice Token Webhook": {"main": [[{"node": "Read The Switches", "type": "main", "index": 0}]]},
        "Read The Switches": {"main": [[{"node": "Is Voice On", "type": "main", "index": 0}]]},
        "Is Voice On": {"main": [[{"node": "Voice On", "type": "main", "index": 0}]]},
        "Voice On": {"main": [[{"node": "Create Retell Web Call", "type": "main", "index": 0}],
                              [{"node": "Respond Voice Off", "type": "main", "index": 0}]]},
        "Create Retell Web Call": {"main": [[{"node": "Respond Token", "type": "main", "index": 0}]]},
        "Retell Tool Webhook": {"main": [[{"node": "Check Tool Token", "type": "main", "index": 0}]]},
        "Check Tool Token": {"main": [[{"node": "Route Tool", "type": "main", "index": 0}],
                                      [{"node": "Deny", "type": "main", "index": 0}]]},
        "Route Tool": {"main": []},
    }

    # One Convex call per tool, each answering on the shared respond node.
    for i, (name, route) in enumerate(tool_routes):
        nid = f"call_{i}"
        nodes.append(convex_http(
            nid, f"Convex {name}", route,
            # metadata.session_id is what carries a chat conversation into the
            # voice call, so it wins. call_id is the last resort before
            # 'voice-unknown': without it every call that arrives without
            # metadata shares one sessionId and a booking cannot be traced back
            # to the call that made it.
            "={{ JSON.stringify(Object.assign({ sessionId: ($json.body.args || {}).session_id || ($json.body.call && $json.body.call.metadata && $json.body.call.metadata.session_id) || ($json.body.call && $json.body.call.call_id) || 'voice-unknown', channel: 'voice' }, $json.body.args || {})) }}",
            -140, -120 + i * 110, always_output=False))
        conns[f"Convex {name}"] = {"main": [[{"node": "Respond Tool Result", "type": "main", "index": 0}]]}
        conns["Route Tool"]["main"].append([{"node": f"Convex {name}", "type": "main", "index": 0}])

    # fallback branch for an unknown tool name
    nodes.append({"parameters": {"jsCode":
        "return [{ json: { ok: false, error: 'Unknown tool. Tell the caller you will pass this to the team.' } }];"},
        "id": "unknown", "name": "Unknown Tool",
        "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-140, 560]})
    conns["Route Tool"]["main"].append([{"node": "Unknown Tool", "type": "main", "index": 0}])
    conns["Unknown Tool"] = {"main": [[{"node": "Respond Tool Result", "type": "main", "index": 0}]]}

    # n8n splits a JSON array response into separate items, and $json is only
    # the first of them. Returning $json meant the agent saw one package out of
    # four and would have quoted the cheapest as if it were the only one.
    nodes.append({"parameters": {"respondWith": "json",
                                 "responseBody": "={{ JSON.stringify($input.all().length > 1 ? $input.all().map(i => i.json) : $input.first().json) }}",
                                 "options": {}},
                  "id": "resp_tool", "name": "Respond Tool Result",
                  "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1,
                  "position": [160, 120]})

    return {"name": "OHM Assistant — Voice (Retell tools + web call token)",
            "nodes": nodes, "connections": conns,
            "settings": wf_settings()}


# =========================================================================
# 3 · Retell events: transcript into the same conversation log
# =========================================================================

def build_events():
    nodes = [
        {"parameters": {"httpMethod": "POST", "path": "ohm-retell-events",
                        "responseMode": "lastNode", "options": {}},
         "id": "wh_ev", "name": "Retell Events",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-700, 0]},

        {"parameters": {"conditions": {"options": {"caseSensitive": True, "version": 2},
                                       "conditions": [{"id": "t",
                                                       "leftValue": "={{ $json.query.token }}",
                                                       "rightValue": TOOL_TOKEN,
                                                       "operator": {"type": "string", "operation": "equals"}}],
                                       "combinator": "and"},
                        "options": {}},
         "id": "ev_tok", "name": "Check Token",
         "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [-480, 0]},

        {"parameters": {"conditions": {"options": {"caseSensitive": True, "version": 2},
                                       "conditions": [{"id": "e",
                                                       "leftValue": "={{ $json.body.event }}",
                                                       "rightValue": "call_analyzed",
                                                       "operator": {"type": "string", "operation": "equals"}}],
                                       "combinator": "and"},
                        "options": {}},
         "id": "ev_kind", "name": "Only call_analyzed",
         "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [-260, 0]},

        convex_http("ev_log", "Log Call Transcript", "/logMessage",
                    "={{ JSON.stringify({ sessionId: ($json.body.call && $json.body.call.metadata && $json.body.call.metadata.session_id) || $json.body.call.call_id, role: 'system', channel: 'voice', text: 'VOICE CALL TRANSCRIPT\\n' + ($json.body.call.transcript || '(none)'), retellCallId: $json.body.call.call_id }) }}",
                    -40, -90),

        # How an OUTBOUND call ended. The worker recorded the touch under
        # Retell's call_id when it dialled; this marks it answered or not,
        # which is what decides whether "a text saying we tried" goes.
        {"parameters": {"jsCode": (
            gate_inline("agent.js") + "\n"
            "const call = ($input.first().json.body || {}).call || {};\n"
            "const ours = call.direction === 'outbound' && call.metadata && call.metadata.leadId;\n"
            "return [{ json: { ours: Boolean(ours), callId: call.call_id || '', status: retellOutcome(call) } }];"
        )},
         "id": "ev_out", "name": "Read An Outbound Call",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-40, 270]},

        {"parameters": {"conditions": {"options": {"caseSensitive": True, "version": 2},
                                       "conditions": [{"leftValue": "={{ $json.ours }}",
                                                       "rightValue": True,
                                                       "operator": {"type": "boolean", "operation": "true", "singleValue": True}}],
                                       "combinator": "and"},
                        "options": {}},
         "id": "ev_out_if", "name": "Was It One Of Ours",
         "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [180, 270]},

        convex_http("ev_out_status", "Mark Answered Or Not", "/touch/status",
                    "={{ JSON.stringify({ providerId: $json.callId, status: $json.status }) }}",
                    400, 250),

        convex_http("ev_prof", "Carry Details Into Profile", "/updateProfile",
                    "={{ JSON.stringify({ sessionId: ($json.body.call && $json.body.call.metadata && $json.body.call.metadata.session_id) || $json.body.call.call_id, notes: 'From voice call ' + $json.body.call.call_id + ': ' + (($json.body.call.call_analysis && $json.body.call.call_analysis.call_summary) || '') }) }}",
                    -40, 90),
    ]
    conns = {
        "Retell Events": {"main": [[{"node": "Check Token", "type": "main", "index": 0}]]},
        "Check Token": {"main": [[{"node": "Only call_analyzed", "type": "main", "index": 0}], []]},
        "Only call_analyzed": {"main": [[{"node": "Log Call Transcript", "type": "main", "index": 0},
                                         {"node": "Carry Details Into Profile", "type": "main", "index": 0},
                                         {"node": "Read An Outbound Call", "type": "main", "index": 0}], []]},
        "Read An Outbound Call": {"main": [[{"node": "Was It One Of Ours", "type": "main", "index": 0}]]},
        "Was It One Of Ours": {"main": [[{"node": "Mark Answered Or Not", "type": "main", "index": 0}], []]},
    }
    return {"name": "OHM Assistant — Retell Events", "nodes": nodes, "connections": conns,
            "settings": wf_settings()}


# =========================================================================
# 4 · Calendar sync. Google Calendar credentials are not in place yet, so the
#     workflow is built and left INACTIVE with the calendar node unconfigured.
# =========================================================================

def build_calendar():
    nodes = [
        {"parameters": {"rule": {"interval": [{"field": "minutes", "minutesInterval": 10}]}},
         "id": "cron", "name": "Every 10 Minutes",
         "type": "n8n-nodes-base.scheduleTrigger", "typeVersion": 1.2, "position": [-760, 0]},

        {"parameters": {"httpMethod": "POST", "path": "ohm-calendar-sync-now",
                        "responseMode": "lastNode", "options": {}},
         "id": "wh_cal", "name": "Manual Sync",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-760, 180]},

        convex_http("pend", "Fetch Pending Bookings", "/pendingCalendarSync", "={{ '{}' }}",
                    -520, 60),

        {"parameters": {"fieldToSplitOut": "data", "options": {}},
         "id": "split", "name": "One Per Booking",
         "type": "n8n-nodes-base.splitOut", "typeVersion": 1, "position": [-300, 60]},

        {"parameters": {"jsCode": (
            "// Google Calendar wants an RFC3339 start and end. The booking stores a\n"
            "// London wall-clock date and time, so the offset is applied here rather\n"
            "// than left for the calendar node to guess at.\n"
            "const b = $input.first().json;\n"
            "const start = `${b.date}T${b.time}:00`;\n"
            "const dt = new Date(`${start}Z`);\n"
            "const end = new Date(dt.getTime() + 30 * 60000);\n"
            "const pad = (n) => String(n).padStart(2, '0');\n"
            "const fmt = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;\n"
            "return [{ json: Object.assign({}, b, {\n"
            "  startLocal: start,\n"
            "  endLocal: fmt(end),\n"
            "  summary: `OMH consultation — ${b.name} (${b.service})`,\n"
            "  description: [\n"
            "    `Reference: ${b.reference}`,\n"
            "    `Name: ${b.name}`,\n"
            "    `Phone: ${b.phone}`,\n"
            "    `Email: ${b.email || 'not given'}`,\n"
            "    `About: ${b.service}`,\n"
            "    `Notes: ${b.notes || 'none'}`,\n"
            "    'Booked by the website assistant.'\n"
            "  ].join('\\n')\n"
            "}) }];"
        )},
         "id": "shape", "name": "Shape Event",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-80, 60]},

        {"parameters": {"jsCode": (
            "// PLACEHOLDER. Replace this node with a Google Calendar 'Create Event'\n"
            "// node once the OMH calendar credentials are added in n8n:\n"
            "//   Calendar: the OMH consultations calendar\n"
            "//   Start: {{ $json.startLocal }}  End: {{ $json.endLocal }}\n"
            "//   Timezone: Europe/London\n"
            "//   Summary: {{ $json.summary }}  Description: {{ $json.description }}\n"
            "// Then wire its output into 'Attach Calendar Event', which expects an id.\n"
            "// Until then this passes through without writing anything, so bookings\n"
            "// are still captured in Convex and nothing is silently lost.\n"
            "return $input.all().map(i => ({ json: Object.assign({}, i.json, { id: null, _placeholder: true }) }));"
        )},
         "id": "gcal", "name": "Google Calendar (TO CONFIGURE)",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [140, 60]},

        {"parameters": {"conditions": {"options": {"caseSensitive": True, "version": 2},
                                       "conditions": [{"id": "has",
                                                       "leftValue": "={{ $json.id }}",
                                                       "rightValue": "",
                                                       "operator": {"type": "string", "operation": "exists", "singleValue": True}}],
                                       "combinator": "and"},
                        "options": {}},
         "id": "has_id", "name": "Event Created",
         "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [360, 60]},

        convex_http("attach", "Attach Calendar Event", "/attachCalendarEvent",
                    "={{ JSON.stringify({ reference: $json.reference, calendarEventId: String($json.id) }) }}",
                    580, 0),
    ]
    conns = {
        "Every 10 Minutes": {"main": [[{"node": "Fetch Pending Bookings", "type": "main", "index": 0}]]},
        "Manual Sync": {"main": [[{"node": "Fetch Pending Bookings", "type": "main", "index": 0}]]},
        "Fetch Pending Bookings": {"main": [[{"node": "One Per Booking", "type": "main", "index": 0}]]},
        "One Per Booking": {"main": [[{"node": "Shape Event", "type": "main", "index": 0}]]},
        "Shape Event": {"main": [[{"node": "Google Calendar (TO CONFIGURE)", "type": "main", "index": 0}]]},
        "Google Calendar (TO CONFIGURE)": {"main": [[{"node": "Event Created", "type": "main", "index": 0}]]},
        "Event Created": {"main": [[{"node": "Attach Calendar Event", "type": "main", "index": 0}], []]},
    }
    return {"name": "OHM Assistant — Calendar Sync", "nodes": nodes, "connections": conns,
            "settings": wf_settings()}


# =========================================================================
# 5 · Notify. A booking or an escalation that nobody sees is the same as not
#     capturing it, so this pulls what is new every five minutes and emails it.
# =========================================================================

# The mailbox read by 12-email-inbound. Same story as TWILIO_CRED_ID: n8n owns
# the id once the credential exists, so it is read from .env.local rather than
# typed here.
IMAP_CRED = {"imap": {"id": env.get("IMAP_CRED_ID", "IMAP_CRED_PENDING"),
                      "name": "IMAP — OMH replies"}}

# The account the mail is *sent through*, which is not the same thing as
# MAIL_FROM, the address a lead sees. Gmail refuses to send as an address the
# authenticated account does not own, so setting MAIL_FROM to OMH's new mailbox
# while this still authenticates as ours would have been rejected at the SMTP
# handshake, or silently rewritten back to our address. The two move together.
SMTP_CRED_ID = env.get("SMTP_CRED_ID", "I7yvfVmEpZslNAxV")
SMTP_CRED_NAME = env.get("SMTP_CRED_NAME",
                         "Gmail SMTP — Ads System (app pw 2026-08-04)")
SMTP_CRED = {"smtp": {"id": SMTP_CRED_ID, "name": SMTP_CRED_NAME}}
assert (SMTP_CRED_ID == "I7yvfVmEpZslNAxV") == (MAIL_FROM == "videoeditoromh@gmail.com"), (
    f"MAIL_FROM is {MAIL_FROM!r} but the SMTP credential is {SMTP_CRED_NAME!r}. "
    "Gmail will not send as an address the authenticated mailbox does not own. "
    "Set SMTP_CRED_ID and SMTP_CRED_NAME alongside MAIL_FROM in .env.local.")
NOTIFY_TO = "support@onlinemarketinghelp.co.uk"


# =========================================================================
# 0 · The error handler, and the settings that point every workflow at it.
#
#     Until this existed, a failed execution was invisible. n8n records it,
#     nothing reads the record, and the lead that execution was carrying is
#     gone with no trace: no email, no row, nothing to notice. That is the
#     one failure mode where the system looks fine and the client loses a
#     customer, which is why it is numbered 00 and built first.
# =========================================================================

ERROR_WF_NAME = "OHM Assistant — Error Handler"

# n8n owns the id, and it only exists once the workflow is on the instance.
# So the generated files carry a sentinel and push.py resolves the real id by
# name at push time. The sentinel is never sent: push.py substitutes it, or
# drops the key entirely if it cannot. A bogus id would make n8n try to run a
# workflow that does not exist on every failure.
ERROR_WF_PENDING = "ERROR_WF_PENDING"
ERROR_WORKFLOW_ID = env.get("ERROR_WORKFLOW_ID", ERROR_WF_PENDING)


def wf_settings(handles_own_errors=False):
    """Workflow settings, including who to call when this workflow fails.

    `handles_own_errors` is for 00-error itself. An error workflow pointed at
    itself calls itself when it fails, and the thing most likely to fail in
    it is the email send, so that is a loop that ends in a rate-limited
    mailbox rather than in a report.

    Only the keys in n8n's public API schema go in here: that schema is
    `additionalProperties: false`, so one unknown key rejects the whole PUT.
    """
    s = {"executionOrder": "v1"}
    if not handles_own_errors:
        s["errorWorkflow"] = ERROR_WORKFLOW_ID
    return s


def build_error():
    nodes = [
        {"parameters": {},
         "id": "e_trigger", "name": "Something Failed",
         "type": "n8n-nodes-base.errorTrigger", "typeVersion": 1,
         "position": [-520, 0]},

        {"parameters": {"jsCode": (
            "// n8n sends two different shapes here and the difference matters.\n"
            "//\n"
            "//   a node threw      -> { execution: { id, url, error, lastNodeExecuted }, workflow }\n"
            "//   a trigger threw   -> { trigger:   { error, mode },                      workflow }\n"
            "//\n"
            "// The second has no execution at all, so reading $json.execution.error\n"
            "// would itself throw, inside the error handler, which is the one place\n"
            "// a crash is invisible. Both shapes are read, and anything missing is\n"
            "// reported as missing rather than assumed.\n"
            "const d = $input.first().json || {};\n"
            "const wf = d.workflow || {};\n"
            "const ex = d.execution || {};\n"
            "const tg = d.trigger || {};\n"
            "const err = ex.error || tg.error || {};\n"
            "\n"
            "const name = wf.name || 'an unnamed workflow';\n"
            "const where = ex.lastNodeExecuted || (tg.mode ? 'the trigger' : 'not reported');\n"
            "const msg = String(err.message || 'no message').slice(0, 500);\n"
            "const when = new Date().toISOString();\n"
            "\n"
            "// A cron that fails every minute would otherwise send 1440 emails a day\n"
            "// and get the mailbox throttled, which also silences the notify emails\n"
            "// that share it. So the same failure is reported once per window and\n"
            "// counted after that. Keyed on workflow AND message, because a second,\n"
            "// different failure in the same workflow is news.\n"
            "const WINDOW_MS = 15 * 60 * 1000;\n"
            "const key = (wf.id || name) + '|' + msg.slice(0, 120);\n"
            "let seen = {};\n"
            "try { seen = $getWorkflowStaticData('global').seen || {}; } catch (e) { seen = {}; }\n"
            "const prev = seen[key];\n"
            "const t = Date.now();\n"
            "let repeats = 0;\n"
            "if (prev && t - prev.at < WINDOW_MS) {\n"
            "  prev.n = (prev.n || 1) + 1;\n"
            "  try { $getWorkflowStaticData('global').seen = seen; } catch (e) {}\n"
            "  // Nothing downstream: the failure is counted, not emailed again.\n"
            "  return [];\n"
            "}\n"
            "repeats = prev ? prev.n || 0 : 0;\n"
            "seen[key] = { at: t, n: 1 };\n"
            "// Keep the store small. Anything older than an hour cannot suppress\n"
            "// anything, so it is only taking up space.\n"
            "for (const k of Object.keys(seen)) {\n"
            "  if (t - seen[k].at > 4 * WINDOW_MS) delete seen[k];\n"
            "}\n"
            "try { $getWorkflowStaticData('global').seen = seen; } catch (e) {}\n"
            "\n"
            "const L = [];\n"
            "L.push(`${name} failed.`);\n"
            "L.push('');\n"
            "L.push(`  what broke : ${where}`);\n"
            "L.push(`  error      : ${msg}`);\n"
            "L.push(`  when       : ${when}`);\n"
            "if (ex.id) L.push(`  execution  : ${ex.id}`);\n"
            "if (ex.mode || tg.mode) L.push(`  mode       : ${ex.mode || tg.mode}`);\n"
            "if (ex.retryOf) L.push(`  retry of   : ${ex.retryOf}`);\n"
            "if (ex.url) L.push('', `  open it    : ${ex.url}`);\n"
            "if (repeats > 1) {\n"
            "  L.push('', `This same failure happened ${repeats} times in the last 15 minutes`);\n"
            "  L.push('and was reported once. It is still happening.');\n"
            "}\n"
            "L.push('');\n"
            "L.push('Whatever that execution was carrying did not finish. If it was a');\n"
            "L.push('lead, it has not been contacted.');\n"
            "\n"
            "return [{ json: {\n"
            "  subject: `n8n FAILED: ${name}`.slice(0, 120),\n"
            "  body: L.join('\\n'),\n"
            "  workflowName: name, node: where, message: msg, repeats,\n"
            "} }];"
        )},
         "id": "e_fmt", "name": "Describe The Failure",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-280, 0]},

        {"parameters": {"fromEmail": MAIL_FROM,
                        "toEmail": NOTIFY_TO,
                        "subject": "={{ $json.subject }}",
                        "emailFormat": "text",
                        "text": "={{ $json.body }}",
                        "options": {}},
         "id": "e_mail", "name": "Tell The Team",
         "type": "n8n-nodes-base.emailSend", "typeVersion": 2.1,
         "position": [-40, 0], "credentials": SMTP_CRED},
    ]
    conns = {
        "Something Failed": {"main": [[{"node": "Describe The Failure", "type": "main", "index": 0}]]},
        "Describe The Failure": {"main": [[{"node": "Tell The Team", "type": "main", "index": 0}]]},
    }
    # It reports on the other twelve and must not report on itself.
    return {"name": ERROR_WF_NAME, "nodes": nodes, "connections": conns,
            "settings": wf_settings(handles_own_errors=True)}


def build_notify():
    nodes = [
        {"parameters": {"rule": {"interval": [{"field": "minutes", "minutesInterval": 5}]}},
         "id": "n_cron", "name": "Every 5 Minutes",
         "type": "n8n-nodes-base.scheduleTrigger", "typeVersion": 1.2, "position": [-760, 0]},

        {"parameters": {"httpMethod": "POST", "path": "ohm-notify-now",
                        "responseMode": "lastNode", "options": {}},
         "id": "n_wh", "name": "Send Now",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-760, 180]},

        convex_http("n_pull", "Fetch New Items", "/pendingNotifications", "={{ '{}' }}", -520, 60),

        {"parameters": {"jsCode": (
            "// Build one readable email rather than three. Escalations first: they are\n"
            "// someone waiting on a person. Bookings next, then leads.\n"
            "const d = $input.first().json;\n"
            "const esc = d.escalations || [], bk = d.bookings || [], ld = d.leads || [];\n"
            "const total = esc.length + bk.length + ld.length;\n"
            "if (!total) return [];\n"
            "\n"
            "const L = [];\n"
            "if (esc.length) {\n"
            "  L.push(`SOMEONE IS WAITING ON A PERSON (${esc.length})`);\n"
            "  esc.forEach(e => L.push(\n"
            "    `  - ${e.question}`,\n"
            "    `    reason: ${e.reason} | contact: ${e.contact || 'not given'} | via ${e.channel}`));\n"
            "  L.push('');\n"
            "}\n"
            "if (bk.length) {\n"
            "  L.push(`CONSULTATIONS BOOKED (${bk.length})`);\n"
            "  bk.forEach(b => L.push(...[\n"
            "    `  - ${b.reference}  ${b.date} at ${b.time}`,\n"
            "    `    ${b.name} | ${b.phone} | ${b.email || 'no email'} | about: ${b.service}`,\n"
            "    b.notes ? `    notes: ${b.notes}` : null].filter(Boolean)));\n"
            "  L.push('');\n"
            "}\n"
            "if (ld.length) {\n"
            "  L.push(`NEW ENQUIRIES (${ld.length})`);\n"
            "  ld.forEach(l => L.push(...[\n"
            "    `  - ${l.hot ? '[HOT] ' : ''}${l.name} | ${l.phone || 'no phone'} | ${l.email || 'no email'}`,\n"
            "    `    ${l.company ? l.company + ' | ' : ''}wants: ${l.service || 'not stated'}`,\n"
            "    l.message ? `    said: ${l.message}` : null].filter(Boolean)));\n"
            "  L.push('');\n"
            "}\n"
            "L.push('From the website assistant. Bookings are requests until someone confirms them.');\n"
            "\n"
            "const urgent = esc.length > 0 || ld.some(l => l.hot);\n"
            "const bits = [];\n"
            "if (esc.length) bits.push(`${esc.length} waiting`);\n"
            "if (bk.length) bits.push(`${bk.length} booked`);\n"
            "if (ld.length) bits.push(`${ld.length} enquir${ld.length === 1 ? 'y' : 'ies'}`);\n"
            "\n"
            "return [{ json: {\n"
            "  subject: `${urgent ? 'ACTION: ' : ''}Voice assistant: ${bits.join(', ')}`,\n"
            "  body: L.join('\\n'),\n"
            "  bookings: bk.map(x => x.id), leads: ld.map(x => x.id),\n"
            "  escalations: esc.map(x => x.id),\n"
            "} }];"
        )},
         "id": "n_fmt", "name": "Compose Email",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-300, 60]},

        {"parameters": {"fromEmail": MAIL_FROM,
                        "toEmail": NOTIFY_TO,
                        "subject": "={{ $json.subject }}",
                        "emailFormat": "text",
                        "text": "={{ $json.body }}",
                        "options": {}},
         "id": "n_mail", "name": "Email The Team",
         "type": "n8n-nodes-base.emailSend", "typeVersion": 2.1,
         "position": [-80, 60], "credentials": SMTP_CRED,
         # if the mailbox is down, do NOT mark them notified: better a repeat
         # than a booking nobody ever hears about
         "onError": "stopWorkflow"},

        convex_http("n_mark", "Mark As Told", "/markNotified",
                    "={{ JSON.stringify({ bookings: $('Compose Email').item.json.bookings, leads: $('Compose Email').item.json.leads, escalations: $('Compose Email').item.json.escalations }) }}",
                    160, 60),
    ]
    conns = {
        "Every 5 Minutes": {"main": [[{"node": "Fetch New Items", "type": "main", "index": 0}]]},
        "Send Now": {"main": [[{"node": "Fetch New Items", "type": "main", "index": 0}]]},
        "Fetch New Items": {"main": [[{"node": "Compose Email", "type": "main", "index": 0}]]},
        "Compose Email": {"main": [[{"node": "Email The Team", "type": "main", "index": 0}]]},
        "Email The Team": {"main": [[{"node": "Mark As Told", "type": "main", "index": 0}]]},
    }
    return {"name": "OHM Assistant — Notify", "nodes": nodes, "connections": conns,
            "settings": wf_settings()}


def build_roi():
    """The ROI calculator's lead form.

    The calculators are static pages on a public host, so they cannot hold the
    Convex secret. This webhook is the only thing between them and the lead
    table: it takes the form, writes the lead with the figures the visitor
    actually entered, and answers the browser. The Notify workflow then emails
    the team on its next pass, which is what makes the five minute follow-up
    possible.

    Marked hot: somebody who has filled in their own call volumes and their own
    job value, then asked for the write-up, is not browsing.
    """
    nodes = [
        {"parameters": {"httpMethod": "POST", "path": "ohm-roi-lead",
                        "responseMode": "responseNode",
                        "options": {"allowedOrigins": ALLOWED_ORIGINS}},
         "id": "wh_roi", "name": "ROI Form Webhook",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-600, 0]},

        {"parameters": {"jsCode": (
            "// Keep the message readable: this is what the team sees first.\n"
            "const b = $input.first().json.body || {};\n"
            "const gbp = (n) => '\\u00a3' + Math.round(Number(n) || 0).toLocaleString('en-GB');\n"
            "const t = (x, max) => String(x == null ? '' : x).trim().slice(0, max);\n"
            "const msg = [\n"
            "  'ROI calculator: ' + t(b.industry, 60),\n"
            "  '',\n"
            "  'They entered:',\n"
            "  '  ' + Math.round(Number(b.calls) || 0) + ' calls a month',\n"
            "  '  ' + Math.round(Number(b.missed) || 0) + ' of them missed',\n"
            "  '  ' + gbp(b.value) + ' per ' + t(b.unit || 'customer', 30),\n"
            "  '',\n"
            "  'It showed them:',\n"
            "  '  ' + gbp(b.recovered) + ' a month of work being missed',\n"
            "  '  ' + gbp(b.cost) + ' a month for the ' + t(b.plan, 20) + ' plan',\n"
            "  '  ' + gbp(b.net) + ' a month better off',\n"
            "  '',\n"
            "  'Page: ' + t(b.page_url, 300),\n"
            "].join('\\n');\n"
            "return [{ json: {\n"
            "  name: t(b.name, 80) || 'Unknown',\n"
            "  email: t(b.email, 120),\n"
            "  phone: t(b.phone, 40),\n"
            "  company: t(b.company, 120),\n"
            "  service: 'AI voice agent (' + t(b.industry, 60) + ')',\n"
            "  message: msg,\n"
            "  sessionId: 'roi-' + Date.now().toString(36),\n"
            "} }];"
        )},
         "id": "roi_shape", "name": "Shape The Lead",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-400, 0]},

        convex_http("roi_save", "Save Lead", "/saveLead",
                    "={{ JSON.stringify({ sessionId: $json.sessionId, name: $json.name, "
                    "email: $json.email, phone: $json.phone, company: $json.company, "
                    "service: $json.service, message: $json.message, hot: true, "
                    "channel: 'roi-calculator' }) }}",
                    -200, 0, always_output=False),

        {"parameters": {"respondWith": "json",
                        "responseBody": "={{ JSON.stringify({ ok: true }) }}",
                        "options": {}},
         "id": "roi_ok", "name": "Respond OK",
         "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": [0, 0]},
    ]
    conns = {
        "ROI Form Webhook": {"main": [[{"node": "Shape The Lead", "type": "main", "index": 0}]]},
        "Shape The Lead": {"main": [[{"node": "Save Lead", "type": "main", "index": 0}]]},
        "Save Lead": {"main": [[{"node": "Respond OK", "type": "main", "index": 0}]]},
    }
    return {"name": "OHM Assistant \u2014 ROI Calculator Leads",
            "nodes": nodes, "connections": conns,
            "settings": wf_settings()}


# =========================================================================
# Lead routing. Three workflows: one door in, one worker, one door back.
#
# Convex holds the clock and the rules; these three do the sending. Nothing
# here decides who to text or when. That is deliberate: a decision made in a
# workflow is a decision nobody can unit test.
#
# Twilio is not wired to a real account yet. The credential below is a
# placeholder, and the number comes from an env var that is currently unset,
# so these generate and validate but cannot send until both exist.
# =========================================================================

# The credential is created on srv1836598 once the Twilio account exists, and
# n8n then owns its id. That id is read from .env.local like every other value
# this build needs, rather than being typed in here.
#
# It was a literal until the 2026-11-15 audit. Every other thing tomorrow needs
# lives in .env.local, so the documented path, "put the values in .env.local,
# rebuild, push", silently did not cover this one: three workflows would have
# pushed with a credential reference pointing at nothing. It fails loudly
# rather than sending anything wrong, but the repair is a code edit discovered
# on the day, and the obvious workaround is to fix it in the n8n UI, which the
# next rebuild then overwrites.
TWILIO_CRED_ID = env.get("TWILIO_CRED_ID", "TWILIO_CRED_PENDING")
TWILIO_CRED = {
    "twilioApi": {"id": TWILIO_CRED_ID, "name": "Twilio — OMH"}
}
# A UK domestic long code, not an alphanumeric sender id: routes B, C and E
# all depend on the person being able to reply, and an alphanumeric sender
# cannot receive one.
TWILIO_FROM = env.get("TWILIO_FROM_NUMBER", "TWILIO_NUMBER_PENDING")
RETELL_FROM = env.get("RETELL_FROM_NUMBER", TWILIO_FROM)  # no longer used by the call node: the number comes from Convex

# The booking agent that rings people back, created by
# widget/retell/create-outbound-agent.py. Same tools as the site's voice
# agent; told it is calling them back about their own enquiry, to book.
OUTBOUND_AGENT_ID = "OUTBOUND_AGENT_PENDING"
_out_file = ROOT / "retell" / "outbound-agent.json"
if _out_file.exists():
    OUTBOUND_AGENT_ID = json.loads(_out_file.read_text()).get("agent_id", OUTBOUND_AGENT_ID)

ROUTER_PATH = "ohm-lead-router"
GOOGLE_FORM_PATH = "ohm-google-lead-form"
GOOGLE_FORM_KEY = env.get("GOOGLE_LEAD_FORM_KEY", "GOOGLE_LEAD_FORM_KEY_PENDING")
WORKER_PATH = "ohm-sequence-now"
SMS_IN_PATH = "ohm-sms-inbound"
CALL_STATUS_PATH = "ohm-call-status"


def twilio_sms(node_id, name, to_expr, body_expr, x=0, y=0):
    """One text. Errors continue so the step can be reported as failed and
    retried, rather than the whole run dying on one bad number."""
    return {
        "parameters": {
            "resource": "sms",
            "operation": "send",
            "from": TWILIO_FROM,
            "to": to_expr,
            "message": body_expr,
            "options": {},
        },
        "id": node_id,
        "name": name,
        "type": "n8n-nodes-base.twilio",
        "typeVersion": 1,
        "position": [x, y],
        "credentials": TWILIO_CRED,
        "onError": "continueRegularOutput",
    }


def build_router():
    """Every channel comes in here.

    The job is small on purpose: work out which route this is, save the
    person, ask Convex to enrol them, and send whatever Convex hands back
    immediately. The first touch is sent HERE rather than queued, because
    route B promises two minutes and route E promises sixty seconds, and a
    queue drained by a cron can promise neither.
    """
    nodes = [
        {"parameters": {"httpMethod": "POST", "path": ROUTER_PATH,
                        "responseMode": "responseNode", "options": {}},
         "id": "r_wh", "name": "Lead Webhook",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-1000, -140],
         # A caller left hanging retries, and a retried lead is a second text.
         "onError": "continueRegularOutput"},

        # Google Ads lead forms, through the SAME router rather than a
        # workflow of their own. The router already classifies any source and
        # picks the route; all Google needs is a translator in front of it,
        # because its payload is column_id / string_value pairs rather than
        # fields.
        {"parameters": {"httpMethod": "POST", "path": GOOGLE_FORM_PATH,
                        "responseMode": "responseNode", "options": {}},
         "id": "r_gwh", "name": "Google Lead Form Webhook",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-1000, 140],
         "onError": "continueRegularOutput"},

        {"parameters": {"jsCode": (
            "// Google's shape into ours, and the key check.\n"
            "//\n"
            "// Bundled from widget/gates/google-lead-form.js, the same file\n"
            "// the tests import: do not edit here.\n"
            "//\n"
            "// THIS IS A PUBLIC URL. The key is the only thing between the\n"
            "// internet and rows in the client's lead table.\n"
            + gate_inline("google-lead-form.js") +
            "\n"
            "const KEY = " + json.dumps(GOOGLE_FORM_KEY) + ";\n"
            "const b = $input.first().json.body || $input.first().json;\n"
            "const r = fromGoogleLeadForm(b, KEY);\n"
            "\n"
            "// Google needs a 200 whatever happens, or it reports the webhook\n"
            "// as broken and stops sending. A refusal is still a 200 with a\n"
            "// reason in it, and the reason is in the execution log.\n"
            "if (!r.ok || !r.lead) {\n"
            "  return [{ json: { _stop: true, why: r.why || 'test_lead', isTest: r.isTest === true } }];\n"
            "}\n"
            "return [{ json: r.lead }];"
        )},
         "id": "r_gmap", "name": "Google Form To A Lead",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-780, 140],
         "onError": "continueRegularOutput"},

        # An If node wants more in `options` than a Switch does: the
        # validator flags the two missing keys as errors rather than
        # warnings, and a node n8n refuses to load is a dead branch.
        {"parameters": {"conditions": {
            "options": {"caseSensitive": True, "version": 2,
                        "leftValue": "", "typeValidation": "strict"},
            "conditions": [{"id": "stop",
                            "leftValue": "={{ $json._stop }}",
                            "rightValue": "",
                            "operator": {"type": "boolean", "operation": "true", "singleValue": True}}],
            "combinator": "and"}},
         "id": "r_gstop", "name": "Refused Or A Test",
         "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [-560, 140]},

        # Its own respond node, not the router's.
        #
        # The router's Respond reads $('Shape And Route') and $('Save Lead'),
        # and a refused Google post never passes through either, so routing
        # it there would throw instead of answering. Google reads a failed
        # webhook as a broken one and stops sending leads, which is a silent
        # outage: the client simply stops getting enquiries.
        {"parameters": {"respondWith": "json",
                        "responseBody": "={{ JSON.stringify({ ok: true, "
                                        "handled: false, why: $json.why }) }}",
                        "options": {}},
         "id": "r_gok", "name": "Answer Google",
         "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1,
         "position": [-340, 240]},

        {"parameters": {"jsCode": (
            "// Normalise whatever the caller sent, and pick the route.\n"
            "//\n"
            "// The route is decided from the ACQUISITION channel, not from how\n"
            "// they are talking to us: a Facebook form fill and a website form\n"
            "// are both 'a form', and treating them the same is exactly the\n"
            "// mistake the routing paper is about.\n"
            "const b = $input.first().json.body || $input.first().json;\n"
            "\n"
            "// Channel names follow the fifteen in gates/channels: a message\n"
            "// from an advert and a message from the page are one channel, and\n"
            "// the merged-away names are mapped so an old caller still routes.\n"
            "const BY_SOURCE = {\n"
            "  website_chat: 'A', website_voice: 'A',\n"
            "  website_form: 'B', google_ads: 'B', organic: 'B',\n"
            "  referral: 'B', direct: 'B',\n"
            "  facebook_ads: 'C', instagram_ads: 'C',\n"
            "  facebook: 'D', instagram: 'D', whatsapp: 'D',\n"
            "  phone_missed: 'E', phone_inbound: 'E',\n"
            "  reactivation: 'F',\n"
            "  // Merged away, still accepted from anything built before the merge.\n"
            "  roi_calculator: 'B', google_organic: 'B',\n"
            "  facebook_dm: 'D', facebook_page: 'D',\n"
            "  instagram_dm: 'D', instagram_page: 'D', whatsapp_ads: 'D',\n"
            "};\n"
            "const source = String(b.sourceChannel || b.source_channel || 'unknown');\n"
            "// An explicit route wins, so a caller that knows better is obeyed.\n"
            "const route = String(b.route || BY_SOURCE[source] || 'B');\n"
            "\n"
            "const clean = (v) => (v === undefined || v === null ? undefined : String(v).trim() || undefined);\n"
            "\n"
            "return [{ json: {\n"
            "  route,\n"
            "  sourceChannel: source,\n"
            "  leadId: clean(b.leadId),\n"
            "  sessionId: clean(b.sessionId) || ('router-' + Date.now().toString(36)),\n"
            "  name: clean(b.name) || 'Unknown',\n"
            "  phone: clean(b.phone),\n"
            "  email: clean(b.email),\n"
            "  company: clean(b.company),\n"
            "  service: clean(b.service),\n"
            "  message: clean(b.message),\n"
            "  hot: b.hot === true || b.hot === 'true',\n"
            "  attribution: b.attribution || undefined,\n"
            "} }];"
        )},
         "id": "r_shape", "name": "Shape And Route",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-780, 0]},

        convex_http("r_save", "Save Lead", "/saveLead",
                    "={{ JSON.stringify({ sessionId: $json.sessionId, name: $json.name, "
                    "phone: $json.phone, email: $json.email, company: $json.company, "
                    "service: $json.service, message: $json.message, hot: $json.hot, "
                    "channel: 'chat', sourceChannel: $json.sourceChannel, "
                    "attribution: $json.attribution }) }}",
                    -560, 0, always_output=False),

        convex_http("r_enrol", "Enrol On The Route", "/router/enrol",
                    "={{ JSON.stringify({ leadId: $('Save Lead').item.json.leadId, "
                    "route: $('Shape And Route').item.json.route, "
                    "sessionId: $('Shape And Route').item.json.sessionId }) }}",
                    -340, 0, always_output=False),

        {"parameters": {"jsCode": (
            "// What Convex says to send right now. Usually a text and an email;\n"
            "// nothing at all for route A, which is answered in the conversation,\n"
            "// or route F, whose first message is queued so quiet hours apply.\n"
            "//\n"
            "// `skipped` is carried through rather than dropped: if the email was\n"
            "// refused because they gave no address, the run should say so.\n"
            "const d = $input.first().json;\n"
            "const lead = $('Shape And Route').item.json;\n"
            "const leadId = $('Save Lead').item.json.leadId;\n"
            "const out = (d.immediate || []).map(t => ({ json: {\n"
            "  ...t, leadId, route: d.route,\n"
            "  sessionId: lead.sessionId,\n"
            "  enrolled: d.enrolled === true,\n"
            "  skipped: d.skipped || [],\n"
            "} }));\n"
            "return out;"
        )},
         "id": "r_split", "name": "Immediate Touches",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-120, 0]},

        {"parameters": {"rules": {"values": [
            {"conditions": {"options": {"caseSensitive": True, "version": 2},
                            "conditions": [{"leftValue": "={{ $json.channel }}",
                                            "rightValue": "sms",
                                            "operator": {"type": "string", "operation": "equals"}}],
                            "combinator": "and"},
             "outputKey": "sms"},
            {"conditions": {"options": {"caseSensitive": True, "version": 2},
                            "conditions": [{"leftValue": "={{ $json.channel }}",
                                            "rightValue": "email",
                                            "operator": {"type": "string", "operation": "equals"}}],
                            "combinator": "and"},
             "outputKey": "email"},
        ]},
          # Route C's first touch includes a Messenger reply, and Meta is not
          # connected yet. Without this branch that DM would be dropped on the
          # floor with nothing recorded, which looks identical to "sent" in
          # every report. It is written down as a failure instead.
          "options": {"fallbackOutput": "extra"}},
         "id": "r_switch", "name": "By Channel",
         "type": "n8n-nodes-base.switch", "typeVersion": 3.2, "position": [100, 0]},

        twilio_sms("r_sms", "Send The Text",
                   "={{ $json.to }}", "={{ $json.body }}", 320, -120),

        {"parameters": {"fromEmail": MAIL_FROM,
                        "toEmail": "={{ $json.to }}",
                        "subject": "={{ $json.subject }}",
                        "emailFormat": "text",
                        "text": "={{ $json.body }}",
                        "options": {}},
         "id": "r_email", "name": "Send The Email",
         "type": "n8n-nodes-base.emailSend", "typeVersion": 2.1,
         "position": [320, 120], "credentials": SMTP_CRED,
         "onError": "continueRegularOutput"},

        {"parameters": {"jsCode": (
            "// A channel this workflow cannot send on yet: Messenger and\n"
            "// Instagram, until the Meta app is connected. Recorded as failed\n"
            "// with a reason, so it shows up as a gap rather than passing for\n"
            "// a message that went out.\n"
            "return $input.all().map(i => ({ json: { ...i.json, "
            "error: 'channel not connected: ' + i.json.channel } }));"
        )},
         "id": "r_nochan", "name": "Channel Not Connected",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [320, 300]},

        convex_http("r_touch", "Record The Touch", "/touch/record",
                    "={{ JSON.stringify({ leadId: $('Immediate Touches').item.json.leadId, "
                    "sessionId: $('Immediate Touches').item.json.sessionId, "
                    "direction: 'out', channel: $('Immediate Touches').item.json.channel, "
                    "route: $('Immediate Touches').item.json.route, "
                    "status: $json.error ? 'failed' : 'sent', "
                    "providerId: $json.sid || $json.messageId || undefined, "
                    "body: $('Immediate Touches').item.json.body, "
                    "error: $json.error ? String($json.error).slice(0, 300) : undefined, "
                    "idempotencyKey: $('Immediate Touches').item.json.idempotencyKey }) }}",
                    540, 0),

        {"parameters": {"respondWith": "json",
                        "responseBody": "={{ JSON.stringify({ ok: true, "
                                        "route: $('Shape And Route').item.json.route, "
                                        "leadId: $('Save Lead').item.json.leadId }) }}",
                        "options": {}},
         "id": "r_ok", "name": "Respond",
         "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": [760, 0]},
    ]
    conns = {
        "Lead Webhook": {"main": [[{"node": "Shape And Route", "type": "main", "index": 0}]]},
        "Google Lead Form Webhook": {"main": [[{"node": "Google Form To A Lead", "type": "main", "index": 0}]]},
        "Google Form To A Lead": {"main": [[{"node": "Refused Or A Test", "type": "main", "index": 0}]]},
        # True is refused or a test: answer Google and stop. False is a real
        # lead, which joins the ordinary router path at Shape And Route.
        "Refused Or A Test": {"main": [
            [{"node": "Answer Google", "type": "main", "index": 0}],
            [{"node": "Shape And Route", "type": "main", "index": 0}],
        ]},
        "Shape And Route": {"main": [[{"node": "Save Lead", "type": "main", "index": 0}]]},
        "Save Lead": {"main": [[{"node": "Enrol On The Route", "type": "main", "index": 0}]]},
        "Enrol On The Route": {"main": [[{"node": "Immediate Touches", "type": "main", "index": 0}]]},
        "Immediate Touches": {"main": [[{"node": "By Channel", "type": "main", "index": 0}]]},
        "By Channel": {"main": [
            [{"node": "Send The Text", "type": "main", "index": 0}],
            [{"node": "Send The Email", "type": "main", "index": 0}],
            [{"node": "Channel Not Connected", "type": "main", "index": 0}],
        ]},
        "Send The Text": {"main": [[{"node": "Record The Touch", "type": "main", "index": 0}]]},
        "Send The Email": {"main": [[{"node": "Record The Touch", "type": "main", "index": 0}]]},
        "Channel Not Connected": {"main": [[{"node": "Record The Touch", "type": "main", "index": 0}]]},
        "Record The Touch": {"main": [[{"node": "Respond", "type": "main", "index": 0}]]},
    }
    return {"name": "OHM Assistant — Lead Router",
            "nodes": nodes, "connections": conns,
            "settings": wf_settings()}


def build_worker():
    """Drains what is due.

    Every minute rather than every five: route B calls at fifteen minutes and
    the target for time-to-first-human is under fifteen, so a five minute tick
    would land that call anywhere between 15 and 20. The claim is one indexed
    read that usually returns nothing, so the cost of asking often is close to
    zero.

    The lease is what makes overlapping runs safe. This workflow does not need
    to know that; it just passes the token back.
    """
    nodes = [
        {"parameters": {"rule": {"interval": [{"field": "minutes", "minutesInterval": 1}]}},
         "id": "w_cron", "name": "Every Minute",
         "type": "n8n-nodes-base.scheduleTrigger", "typeVersion": 1.2, "position": [-1000, 0]},

        {"parameters": {"httpMethod": "POST", "path": WORKER_PATH,
                        "responseMode": "lastNode", "options": {}},
         "id": "w_wh", "name": "Run Now",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-1000, 180]},

        convex_http("w_claim", "Claim What Is Due", "/sequence/claimDue",
                    "={{ JSON.stringify({ limit: 25 }) }}", -780, -40),

        # Confirmations are owed because something happened, not because
        # somebody failed to reply, so they are not a route. They are drained
        # by this same worker so they go through the same gate, the same
        # idempotency key and the same touch log. A second sending path would
        # be a second place for consent to be forgotten.
        convex_http("w_conf", "Confirmations Owed", "/confirmations/pending",
                    "={{ JSON.stringify({ limit: 25 }) }}", -780, 160),

        {"parameters": {"jsCode": (
            "// One item per thing to send, from both sources.\n"
            "//\n"
            "// Convex has already decided these are real work: anybody who\n"
            "// replied, booked or opted out was resolved inside claimDue and\n"
            "// never reaches here.\n"
            "const out = [];\n"
            "for (const item of $input.all()) {\n"
            "  const d = item.json || {};\n"
            "  for (const c of (d.claimed || [])) out.push({ json: { kind: 'step', ...c } });\n"
            "  for (const c of (d.items || [])) out.push({ json: c });\n"
            "}\n"
            "return out;"
        )},
         "id": "w_split", "name": "One Per Step",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-560, 60]},

        {"parameters": {"rules": {"values": [
            {"conditions": {"options": {"caseSensitive": True, "version": 2},
                            "conditions": [{"leftValue": "={{ $json.channel }}",
                                            "rightValue": "sms",
                                            "operator": {"type": "string", "operation": "equals"}}],
                            "combinator": "and"},
             "outputKey": "sms"},
            {"conditions": {"options": {"caseSensitive": True, "version": 2},
                            "conditions": [{"leftValue": "={{ $json.channel }}",
                                            "rightValue": "email",
                                            "operator": {"type": "string", "operation": "equals"}}],
                            "combinator": "and"},
             "outputKey": "email"},
            {"conditions": {"options": {"caseSensitive": True, "version": 2},
                            "conditions": [{"leftValue": "={{ $json.channel }}",
                                            "rightValue": "call",
                                            "operator": {"type": "string", "operation": "equals"}}],
                            "combinator": "and"},
             "outputKey": "call"},
        ]},
          # Same reason as the router: an unhandled channel must be recorded,
          # not dropped.
          "options": {"fallbackOutput": "extra"}},
         "id": "w_switch", "name": "Which Channel",
         "type": "n8n-nodes-base.switch", "typeVersion": 3.2, "position": [-340, 60]},

        twilio_sms("w_sms", "Text Them", "={{ $json.to }}", "={{ $json.body }}", -120, -140),

        {"parameters": {"fromEmail": MAIL_FROM,
                        "toEmail": "={{ $json.to }}",
                        "subject": "={{ $json.subject }}",
                        "emailFormat": "text",
                        "text": "={{ $json.body }}",
                        # A Reply-To carrying the touch this answers.
                        #
                        # The second of two ways a reply is matched back.
                        # The first is threading: the mail server's own
                        # Message-ID, recorded on the touch and looked up
                        # through the index that already holds a Twilio SID.
                        # Threading works on any mailbox with no setup but
                        # loses a client that starts a fresh message; this
                        # survives that but needs the host to route plus
                        # addresses, which is a provider feature rather than
                        # a standard. Their weaknesses do not overlap, which
                        # is the only reason to carry both.
                        "options": {"replyTo": "={{ 'replies+t' + String($json.idempotencyKey || '').replace(':', '-') + '@onlinemarketinghelp.co.uk' }}"}},
         "id": "w_email", "name": "Email Them",
         "type": "n8n-nodes-base.emailSend", "typeVersion": 2.1,
         "position": [-120, 60], "credentials": SMTP_CRED,
         "onError": "continueRegularOutput"},

        # The only route steps that reach this branch are B and E, both of
        # which are a response to the person's own enquiry. There is no
        # marketing route with a call step, so this cannot become a cold dial.
        {"parameters": {"method": "POST",
                        "url": "https://api.retellai.com/v2/create-phone-call",
                        **hdr("Authorization", f"Bearer {RETELL_KEY}"),
                        "sendBody": True, "specifyBody": "json",
                        "jsonBody": (
                            # Our number from the dashboard's Outbound agent
                            # screen (Convex only claims a call when there is
                            # one), the booking agent, and an idempotency key
                            # so a worker that dies after dialling and is
                            # re-claimed cannot ring the same person twice.
                            "={{ JSON.stringify({ from_number: $json.fromNumber, "
                            "to_number: $json.to, "
                            # Left out until the booking agent exists, so a
                            # placeholder id can never fail every call.
                            + ("override_agent_id: '" + OUTBOUND_AGENT_ID + "', "
                               if OUTBOUND_AGENT_ID != "OUTBOUND_AGENT_PENDING" else "")
                            + "idempotency_key: $json.idempotencyKey, "
                            "metadata: { leadId: $json.leadId, sessionId: $json.sessionId, "
                            "route: $json.route, step: $json.step }, "
                            "retell_llm_dynamic_variables: { session_id: String($json.sessionId || ''), "
                            "caller_name: String($json.name || ''), "
                            "about: String($json.body || ''), "
                            "opening_line: String($json.opening || ''), "
                            "call_goal: String($json.goal || '') }, "
                            # Retell's own do-not-call list, as a second belt
                            # beside our suppression check.
                            "honor_internal_dnc: true }) }}"),
                        "options": {}},
         "id": "w_call", "name": "Ring Them",
         "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2,
         "position": [-120, 260], "onError": "continueRegularOutput"},

        {"parameters": {
            # ONE ITEM AT A TIME. This node used to run once for all items and
            # read $input.first(), which meant a batch of twenty-five steps
            # reported one and left twenty-four leased. Those leases expire
            # after two minutes, the rows get claimed again, and the texts go
            # out a second time. Per-item mode is what makes $json and the
            # paired $('One Per Step').item resolve to the right step.
            "mode": "runOnceForEachItem",
            "jsCode": (
            "// Did it go out? Normalise the three providers into one answer so\n"
            "// there is a single place that decides sent from failed.\n"
            "const r = $json;\n"
            "const claim = $('One Per Step').item.json;\n"
            "const failed = Boolean(r.error) || r.success === false;\n"
            "// A confirmation has no sequence row, so there is nothing to\n"
            "// report a lease against. It is marked instead.\n"
            "return { json: {\n"
            "  ...claim,\n"
            "  outcome: failed ? 'failed' : 'sent',\n"
            "  providerId: r.sid || r.call_id || r.messageId || undefined,\n"
            "  error: failed ? String(r.error || 'send failed').slice(0, 300) : undefined,\n"
            "} };"
        )},
         "id": "w_outcome", "name": "Sent Or Not",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [100, 60]},

        convex_http("w_touch", "Record The Touch", "/touch/record",
                    "={{ JSON.stringify({ leadId: $json.leadId, sessionId: $json.sessionId, "
                    "direction: 'out', channel: $json.channel, route: $json.route, "
                    "step: $json.step, status: $json.outcome, providerId: $json.providerId, "
                    "body: $json.body, error: $json.error, "
                    "idempotencyKey: $json.idempotencyKey }) }}",
                    320, 60),

        {"parameters": {"rules": {"values": [
            {"conditions": {"options": {"caseSensitive": True, "version": 2},
                            "conditions": [{"leftValue": "={{ $json.kind }}",
                                            "rightValue": "confirmation",
                                            "operator": {"type": "string", "operation": "equals"}}],
                            "combinator": "and"},
             "outputKey": "confirmation"},
        ]}, "options": {"fallbackOutput": "extra"}},
         "id": "w_kind", "name": "Step Or Confirmation",
         "type": "n8n-nodes-base.switch", "typeVersion": 3.2, "position": [540, 60]},

        convex_http("w_confdone", "Mark Confirmed", "/confirmations/mark",
                    "={{ JSON.stringify({ bookingId: $json.bookingId }) }}", 760, -60),

        # The lease token goes back exactly as it came. Convex refuses a stale
        # one, which is what stops two overlapping runs advancing the same row.
        convex_http("w_done", "Report Back", "/sequence/completeStep",
                    "={{ JSON.stringify({ sequenceId: $json.sequenceId, "
                    "leaseToken: $json.leaseToken, "
                    "outcome: $json.outcome, "
                    "reason: $json.error }) }}",
                    760, 160),
    ]
    conns = {
        "Every Minute": {"main": [[
            {"node": "Claim What Is Due", "type": "main", "index": 0},
            {"node": "Confirmations Owed", "type": "main", "index": 0},
        ]]},
        "Run Now": {"main": [[
            {"node": "Claim What Is Due", "type": "main", "index": 0},
            {"node": "Confirmations Owed", "type": "main", "index": 0},
        ]]},
        "Claim What Is Due": {"main": [[{"node": "One Per Step", "type": "main", "index": 0}]]},
        "Confirmations Owed": {"main": [[{"node": "One Per Step", "type": "main", "index": 0}]]},
        "One Per Step": {"main": [[{"node": "Which Channel", "type": "main", "index": 0}]]},
        "Which Channel": {"main": [
            [{"node": "Text Them", "type": "main", "index": 0}],
            [{"node": "Email Them", "type": "main", "index": 0}],
            [{"node": "Ring Them", "type": "main", "index": 0}],
            [{"node": "Sent Or Not", "type": "main", "index": 0}],
        ]},
        "Text Them": {"main": [[{"node": "Sent Or Not", "type": "main", "index": 0}]]},
        "Email Them": {"main": [[{"node": "Sent Or Not", "type": "main", "index": 0}]]},
        "Ring Them": {"main": [[{"node": "Sent Or Not", "type": "main", "index": 0}]]},
        "Sent Or Not": {"main": [[{"node": "Record The Touch", "type": "main", "index": 0}]]},
        "Record The Touch": {"main": [[{"node": "Report Back", "type": "main", "index": 0}]]},
    }
    return {"name": "OHM Assistant — Sequence Worker",
            "nodes": nodes, "connections": conns,
            "settings": wf_settings()}


def build_inbound():
    """Replies and call outcomes, in one workflow with two doors.

    Both arrive from Twilio and both mean the same thing operationally: this
    person did something, so stop chasing them.
    """
    nodes = [
        # ---- SMS in -------------------------------------------------------
        {"parameters": {"httpMethod": "POST", "path": SMS_IN_PATH,
                        "responseMode": "responseNode", "options": {}},
         "id": "i_wh", "name": "SMS Webhook",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-1100, -200],
         # Twilio retries a webhook that does not answer, and a retried
         # inbound is a duplicate reply to the customer.
         "onError": "continueRegularOutput"},

        {"parameters": {"jsCode": (
            "// Twilio posts form fields, so read both shapes.\n"
            "const b = $input.first().json.body || $input.first().json;\n"
            "const from = String(b.From || b.from || '').trim();\n"
            "const text = String(b.Body || b.body || '').trim();\n"
            "const sid  = String(b.MessageSid || b.sid || '').trim();\n"
            "\n"
            "// The opt-out words, as the regulator and the carriers expect them.\n"
            "// Matched on the WHOLE message, not a substring: 'please stop\n"
            "// sending these' is an opt-out, but 'what time do you stop today'\n"
            "// is a question, and treating the second as an opt-out loses a\n"
            "// customer silently.\n"
            "const words = text.toUpperCase().replace(/[^A-Z ]/g, ' ').trim().split(/\\s+/);\n"
            "const OPT_OUT = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'OPTOUT'];\n"
            "const optedOut = words.length <= 3 && words.some(w => OPT_OUT.includes(w));\n"
            "\n"
            "return [{ json: { from, text, sid, optedOut } }];"
        )},
         "id": "i_read", "name": "Read The Text",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-880, -200]},

        convex_http("i_find", "Whose Number Is It", "/lead/find",
                    "={{ JSON.stringify({ phone: $json.from }) }}", -660, -200),

        {"parameters": {"conditions": {"options": {"caseSensitive": True, "version": 2},
                                       "conditions": [{"leftValue": "={{ $('Read The Text').item.json.optedOut }}",
                                                       "rightValue": True,
                                                       "operator": {"type": "boolean", "operation": "true", "singleValue": True}}],
                                       "combinator": "and"},
                        "options": {}},
         "id": "i_if", "name": "Did They Opt Out",
         "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [-440, -200]},

        # Opted out: list them AND stop what is in flight. Doing only the
        # first would let the next queued step go out, which is precisely what
        # they just asked us not to do.
        convex_http("i_suppress", "Do Not Contact", "/suppress/add",
                    "={{ JSON.stringify({ key: $('Read The Text').item.json.from, "
                    "kind: 'phone', reason: 'stop_reply', "
                    "note: $('Read The Text').item.json.text }) }}",
                    -220, -320),

        convex_http("i_optout_touch", "Log The Opt Out", "/touch/record",
                    "={{ JSON.stringify({ leadId: $('Whose Number Is It').item.json.leadId, "
                    "direction: 'in', channel: 'sms', status: 'received', "
                    "providerId: $('Read The Text').item.json.sid, "
                    "body: $('Read The Text').item.json.text, "
                    "idempotencyKey: 'in:' + $('Read The Text').item.json.sid }) }}",
                    0, -320),

        # A reply, not an opt-out. Record it against the person: a touch with
        # no leadId is a row the follow-up logic will never look at, so the
        # sequence would carry on texting somebody who has answered.
        convex_http("i_touch", "Log Their Reply", "/touch/record",
                    "={{ JSON.stringify({ leadId: $('Whose Number Is It').item.json.leadId, "
                    "sessionId: $('Whose Number Is It').item.json.sessionId, "
                    "direction: 'in', channel: 'sms', status: 'received', "
                    "providerId: $('Read The Text').item.json.sid, "
                    "body: $('Read The Text').item.json.text, "
                    "idempotencyKey: 'in:' + $('Read The Text').item.json.sid }) }}",
                    -220, -80),

        convex_http("i_stop", "Stop Chasing Them", "/sequence/stop",
                    "={{ JSON.stringify({ leadId: $('Whose Number Is It').item.json.leadId, "
                    "reason: 'replied' }) }}", 0, -80),

        # THE BRAIN. Who answers this reply is the owner's choice, per
        # channel, on the dashboard's Brain screen. Convex decides (gates/
        # brain.js); this only does what it says. Asked AFTER the reply is
        # logged and the chase stopped, so whatever the answer, nobody is
        # still being followed up who has written back.
        convex_http("i_brain", "Ask The Brain", "/brain/decide",
                    "={{ JSON.stringify({ leadId: $('Whose Number Is It').item.json.leadId, "
                    "text: $('Read The Text').item.json.text }) }}", 220, -80),

        {"parameters": {"conditions": {"options": {"caseSensitive": True, "version": 2},
                                       "conditions": [{"leftValue": "={{ $json.answer }}",
                                                       "rightValue": True,
                                                       "operator": {"type": "boolean", "operation": "true", "singleValue": True}}],
                                       "combinator": "and"},
                        "options": {}},
         "id": "i_brain_if", "name": "Does The Assistant Answer",
         "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [440, -80]},

        # Not the assistant: a person. The same queue a chat hand-over lands
        # in, so Needs a person shows texts and chats side by side.
        convex_http("i_handover", "Hand It To A Person", "/handover/request",
                    "={{ JSON.stringify({ sessionId: $('Ask The Brain').item.json.sessionId "
                    "|| ('sms-' + $('Read The Text').item.json.from), "
                    "reason: $('Ask The Brain').item.json.reason, "
                    "question: $('Read The Text').item.json.text, channel: 'sms' }) }}",
                    660, 40),

        # Their reply still needs answering. It goes to the same assistant the
        # website widget uses, so there is one brain and one knowledge base,
        # carrying the Brain's sales brief: answer, explain, book.
        {"parameters": {"method": "POST",
                        "url": f"{env.get('N8N_BASE_URL', 'http://localhost:5678').rstrip('/')}/webhook/ohm-chat",
                        "sendBody": True, "specifyBody": "json",
                        "jsonBody": ("={{ JSON.stringify({ "
                                     "session_id: $('Whose Number Is It').item.json.sessionId "
                                     "|| ('sms-' + $('Read The Text').item.json.from), "
                                     "message: $('Read The Text').item.json.text, "
                                     "page_url: 'sms', "
                                     "brief: $('Ask The Brain').item.json.brief || '', "
                                     "brief_token: '" + TOOL_TOKEN + "' }) }}"),
                        "options": {}},
         "id": "i_ask", "name": "Ask The Assistant",
         "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2,
         "position": [660, -200], "onError": "continueRegularOutput"},

        twilio_sms("i_reply", "Answer Them",
                   "={{ $('Read The Text').item.json.from }}",
                   "={{ $json.reply }}", 880, -200),

        {"parameters": {"respondWith": "text", "responseBody": "", "options": {}},
         "id": "i_ok", "name": "Twilio OK",
         "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": [660, -200]},

        # ---- call status in ----------------------------------------------
        {"parameters": {"httpMethod": "POST", "path": CALL_STATUS_PATH,
                        "responseMode": "lastNode", "options": {}},
         "id": "c_wh", "name": "Call Status Webhook",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-1100, 240]},

        {"parameters": {"jsCode": (
            "// Twilio's call status callback. Two different things arrive here:\n"
            "// how one of OUR calls ended, and somebody ringing US and not\n"
            "// getting through.\n"
            "const b = $input.first().json.body || $input.first().json;\n"
            "const status = String(b.CallStatus || b.status || '').toLowerCase();\n"
            "const dir = String(b.Direction || b.direction || '').toLowerCase();\n"
            "const sid = String(b.CallSid || b.sid || '').trim();\n"
            "const from = String(b.From || b.from || '').trim();\n"
            "const to = String(b.To || b.to || '').trim();\n"
            "\n"
            "const inbound = dir.startsWith('inbound');\n"
            "// A missed inbound call is a lead, and the routing paper is blunt\n"
            "// about it: a missed call with no text is a lost job.\n"
            "const missed = ['no-answer', 'busy', 'failed', 'canceled', 'cancelled'].includes(status);\n"
            "\n"
            "const MAP = { completed: 'answered', 'no-answer': 'no_answer', busy: 'no_answer',\n"
            "              failed: 'failed', canceled: 'no_answer', cancelled: 'no_answer' };\n"
            "\n"
            "return [{ json: {\n"
            "  sid, from, to, status, inbound,\n"
            "  touchStatus: MAP[status] || status,\n"
            "  startRouteE: inbound && missed,\n"
            "} }];"
        )},
         "id": "c_read", "name": "Read The Call",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-880, 240]},

        # How one of our own calls ended. Keyed on the provider's id, so the
        # touch written when we dialled is updated rather than duplicated.
        convex_http("c_status", "Update The Call", "/touch/status",
                    "={{ JSON.stringify({ providerId: $json.sid, status: $json.touchStatus }) }}",
                    -660, 240),

        {"parameters": {"conditions": {"options": {"caseSensitive": True, "version": 2},
                                       "conditions": [{"leftValue": "={{ $('Read The Call').item.json.startRouteE }}",
                                                       "rightValue": True,
                                                       "operator": {"type": "boolean", "operation": "true", "singleValue": True}}],
                                       "combinator": "and"},
                        "options": {}},
         "id": "c_if", "name": "Did We Miss Them",
         "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [-440, 240]},

        # Straight back through the front door, so a missed call is routed by
        # exactly the same code path as a form. Route E's first text is sent
        # inline from there, inside sixty seconds.
        {"parameters": {"method": "POST",
                        "url": f"{env.get('N8N_BASE_URL', 'http://localhost:5678').rstrip('/')}/webhook/{ROUTER_PATH}",
                        "sendBody": True, "specifyBody": "json",
                        "jsonBody": ("={{ JSON.stringify({ "
                                     "sourceChannel: 'phone_missed', "
                                     "phone: $('Read The Call').item.json.from, "
                                     "name: 'Missed caller', "
                                     "sessionId: 'call-' + $('Read The Call').item.json.sid, "
                                     "message: 'Rang and did not get through.' }) }}"),
                        "options": {}},
         "id": "c_route", "name": "Start Route E",
         "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2,
         "position": [-220, 160], "onError": "continueRegularOutput"},
    ]
    conns = {
        "SMS Webhook": {"main": [[{"node": "Read The Text", "type": "main", "index": 0}]]},
        "Read The Text": {"main": [[{"node": "Whose Number Is It", "type": "main", "index": 0}]]},
        "Whose Number Is It": {"main": [[{"node": "Did They Opt Out", "type": "main", "index": 0}]]},
        "Did They Opt Out": {"main": [
            [{"node": "Do Not Contact", "type": "main", "index": 0}],
            [{"node": "Log Their Reply", "type": "main", "index": 0}],
        ]},
        "Do Not Contact": {"main": [[{"node": "Log The Opt Out", "type": "main", "index": 0}]]},
        "Log The Opt Out": {"main": [[{"node": "Twilio OK", "type": "main", "index": 0}]]},
        "Log Their Reply": {"main": [[{"node": "Stop Chasing Them", "type": "main", "index": 0}]]},
        "Stop Chasing Them": {"main": [[{"node": "Ask The Brain", "type": "main", "index": 0}]]},
        "Ask The Brain": {"main": [[{"node": "Does The Assistant Answer", "type": "main", "index": 0}]]},
        "Does The Assistant Answer": {"main": [
            [{"node": "Ask The Assistant", "type": "main", "index": 0}],
            [{"node": "Hand It To A Person", "type": "main", "index": 0}],
        ]},
        "Hand It To A Person": {"main": [[{"node": "Twilio OK", "type": "main", "index": 0}]]},
        "Ask The Assistant": {"main": [[{"node": "Answer Them", "type": "main", "index": 0}]]},
        "Answer Them": {"main": [[{"node": "Twilio OK", "type": "main", "index": 0}]]},

        "Call Status Webhook": {"main": [[{"node": "Read The Call", "type": "main", "index": 0}]]},
        "Read The Call": {"main": [[{"node": "Update The Call", "type": "main", "index": 0}]]},
        "Update The Call": {"main": [[{"node": "Did We Miss Them", "type": "main", "index": 0}]]},
        "Did We Miss Them": {"main": [
            [{"node": "Start Route E", "type": "main", "index": 0}],
            [],
        ]},
    }
    return {"name": "OHM Assistant — Twilio Inbound",
            "nodes": nodes, "connections": conns,
            "settings": wf_settings()}



REACTIVATION_PATH = "ohm-reactivation"

# ------------------------------------------------------------------- Meta
# One URL carries Facebook lead ads, Messenger DMs and Instagram DMs, and
# Meta insists the verification GET and the event POST arrive at the same
# address, so the node listens on both methods rather than there being two.
META_PATH = "ohm-meta"
# Our own string, echoed back during the subscription handshake. It proves to
# Meta that the URL is ours; it is not a secret in the signing sense.
META_VERIFY_TOKEN = env.get("META_VERIFY_TOKEN", "META_VERIFY_PENDING")
# The app secret, which signs every POST. This one IS the lock.
META_APP_SECRET = env.get("META_APP_SECRET", "META_APP_SECRET_PENDING")
# The Page access token used to send a reply back into the thread.
META_PAGE_TOKEN = env.get("META_PAGE_TOKEN", "META_PAGE_TOKEN_PENDING")
META_GRAPH = "https://graph.facebook.com/v21.0"


def build_email_inbound():
    """Read the mailbox OMH already sends from, and count the replies.

    No new provider. The website and the sequence engine both send through
    the same SMTP account on OMH's own domain, so the replies are already
    arriving somewhere IMAP can read. Postmark or Resend would mean a new
    account, a new bill, DNS changes and a webhook to secure, to collect
    mail that is already in a mailbox.

    **This workflow cannot be activated until an IMAP credential exists on
    this instance.** There is none today, and the mailbox password lives on
    the production server rather than anywhere this builder can reach.
    """
    nodes = [
        {"parameters": {"postProcessAction": "read",
                        "options": {"customEmailConfig": '["UNSEEN"]'}},
         "id": "mail_in", "name": "New Mail",
         "type": "n8n-nodes-base.emailReadImap", "typeVersion": 2,
         # Every other node that needs a credential carries one. This was the
         # only one that did not, found by the 2026-11-15 audit: the IMAP
         # password could arrive, a credential be created, and pushing this
         # workflow would still produce a node bound to nothing. Somebody
         # would then bind it in the n8n UI, and the next push.py run would
         # silently revert it, which is precisely what the "never touch the
         # UI" rule exists to prevent.
         "credentials": IMAP_CRED,
         "position": [-720, 0]},

        {"parameters": {"jsCode": (
            gate_inline("email-reply.js") + "\n"
            "// Shape whatever the IMAP node produced into the one thing the\n"
            "// gate reads. Different servers name these differently, so each\n"
            "// is looked for rather than assumed.\n"
            "const m = $input.first().json || {};\n"
            "const h = m.headers || {};\n"
            "const msg = {\n"
            "  subject: m.subject || h.subject || '',\n"
            "  from: (m.from && (m.from.text || m.from.value?.[0]?.address)) || h.from || '',\n"
            "  to: (m.to && (m.to.text || m.to.value?.[0]?.address)) || h.to || '',\n"
            "  text: m.text || m.textPlain || m.html || '',\n"
            "  contentType: h['content-type'] || '',\n"
            "  messageId: m.messageId || h['message-id'] || '',\n"
            "  uid: m.uid || m.attributes?.uid || m.messageId || h['message-id'] || '',\n"
            "  headers: h,\n"
            "};\n"
            "// Decided here as well as in Convex, so the reason is in the\n"
            "// execution log even when nothing is written.\n"
            "const seen = readReply(msg, () => null);\n"
            "return [{ json: { message: msg, looksAuto: isAutoReply(msg), why: seen.why } }];"
        )},
         "id": "mail_shape", "name": "Read The Message",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-480, 0]},

        # Convex decides for real: only it can look up a Message-ID or an
        # idempotency key, and only it can stop a sequence.
        convex_http("mail_post", "Tell Convex", "/email/inbound",
                    "={{ JSON.stringify({ message: $json.message }) }}",
                    -240, 0),

        {"parameters": {"jsCode": (
            "// One line per message, so an outage or a misconfigured\n"
            "// Reply-To shows up as a number in the executions rather than\n"
            "// as silence. Unmatched mail is counted, never guessed at.\n"
            "const r = $input.first().json || {};\n"
            "return [{ json: {\n"
            "  counted: r.reply === true,\n"
            "  why: r.why || '',\n"
            "  leadId: r.leadId || null,\n"
            "  duplicate: r.duplicate === true,\n"
            "} }];"
        )},
         "id": "mail_log", "name": "What It Was",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [0, 0]},
    ]

    conns = {
        "New Mail": {"main": [[{"node": "Read The Message", "type": "main", "index": 0}]]},
        "Read The Message": {"main": [[{"node": "Tell Convex", "type": "main", "index": 0}]]},
        "Tell Convex": {"main": [[{"node": "What It Was", "type": "main", "index": 0}]]},
    }
    return {"name": "OHM Assistant — Email Inbound", "nodes": nodes,
            "connections": conns, "settings": wf_settings()}


def build_meta():
    """Facebook lead ads, Messenger DMs and Instagram DMs, into routes C and D.

    One webhook carries all three, because Meta insists the verification GET
    and the event POST arrive at the same URL. The node therefore listens on
    both methods rather than there being two nodes fighting over one path.

    **This workflow cannot be activated until three values exist in
    .env.local**: META_VERIFY_TOKEN (our own string, echoed during the
    handshake), META_APP_SECRET (signs every POST, and is the only lock on a
    public URL), and META_PAGE_TOKEN (sends the reply back into the thread).
    Until then the gate refuses every request rather than accepting them,
    which is the failure direction that does not fill a client's lead table
    with invented people.

    The DM is answered by the website's own assistant, reached through the
    ohm-chat webhook, so there is one brain and one knowledge base rather
    than a second agent to keep in step.
    """
    chat_url = f"{env.get('N8N_BASE_URL', 'http://localhost:5678').rstrip('/')}/webhook/ohm-chat"

    nodes = [
        {"parameters": {"multipleMethods": True,
                        "httpMethod": ["GET", "POST"],
                        "path": META_PATH,
                        "responseMode": "responseNode",
                        # The signature is computed over the bytes Meta sent.
                        # Re-serialising the parsed JSON changes key order and
                        # whitespace, and the digest stops matching for reasons
                        # that look like a Meta bug rather than our own.
                        "options": {"rawBody": True}},
         "id": "mt_wh", "name": "Meta Webhook",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-1060, 0],
         # Meta retries anything that did not answer, and a retried lead ad is
         # a second text to a real person.
         "onError": "continueRegularOutput"},

        {"parameters": {"jsCode": (
            gate_inline("meta.js") + "\n"
            "// Bundled from widget/gates/meta.js, the same file the tests\n"
            "// import: do not edit here.\n"
            "//\n"
            "// THIS IS A PUBLIC URL. The signature is the only thing between\n"
            "// the internet and rows in the client's lead table, so it is\n"
            "// checked before the body is read, and a missing app secret\n"
            "// refuses everything rather than accepting everything.\n"
            "const crypto = require('crypto');\n"
            "const hmacHex = (raw, secret) =>\n"
            "  crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');\n"
            "\n"
            f"const VERIFY = {json.dumps(META_VERIFY_TOKEN)};\n"
            f"const SECRET = {json.dumps(META_APP_SECRET)};\n"
            "\n"
            "const item = $input.first().json || {};\n"
            "const method = String(item.method || '').toUpperCase();\n"
            "\n"
            "// ---- the subscription handshake --------------------------\n"
            "if (method === 'GET') {\n"
            "  const v = verifyChallenge(item.query || {}, VERIFY);\n"
            "  // Answer with the challenge and ONLY the challenge. Anything\n"
            "  // else and the subscription silently never activates, which\n"
            "  // looks exactly like 'Meta is not sending us anything'.\n"
            "  return [{ json: { kind: v.ok ? 'verify' : 'refused',\n"
            "                    body: v.ok ? v.challenge : '',\n"
            "                    why: v.why || '' } }];\n"
            "}\n"
            "\n"
            "// ---- a real event ----------------------------------------\n"
            "// rawBody arrives as a Buffer on this node. Falling back to a\n"
            "// re-serialised body can only produce a FALSE NEGATIVE, never a\n"
            "// false accept, because the digest still has to match.\n"
            "let raw = item.rawBody;\n"
            "if (raw && raw.type === 'Buffer' && Array.isArray(raw.data)) {\n"
            "  raw = Buffer.from(raw.data).toString('utf8');\n"
            "} else if (Buffer.isBuffer(raw)) {\n"
            "  raw = raw.toString('utf8');\n"
            "} else if (typeof raw !== 'string') {\n"
            "  raw = JSON.stringify(item.body || {});\n"
            "}\n"
            "\n"
            "const headers = item.headers || {};\n"
            "const sig = headers['x-hub-signature-256'] || headers['X-Hub-Signature-256'] || '';\n"
            "const s = signatureOk(raw, sig, SECRET, hmacHex);\n"
            "if (!s.ok) return [{ json: { kind: 'refused', body: '', why: s.why } }];\n"
            "\n"
            "let body;\n"
            "try { body = typeof raw === 'string' ? JSON.parse(raw) : (item.body || {}); }\n"
            "catch (e) { return [{ json: { kind: 'refused', body: '', why: 'bad_json' } }]; }\n"
            "\n"
            "const read = readMetaEvent(body);\n"
            "if (!read.ok) {\n"
            "  // Still a 200. A non-200 makes Meta retry for days and\n"
            "  // eventually disable the subscription, and a read receipt is\n"
            "  // not something worth losing the subscription over.\n"
            "  return [{ json: { kind: 'ignored', body: '', why: read.why,\n"
            "                    skipped: read.skipped || [] } }];\n"
            "}\n"
            "\n"
            "// One item per event: Meta batches, and returning only the first\n"
            "// drops messages exactly when the client is busiest.\n"
            "return read.events.map(e => ({ json: Object.assign({ kind: e.kind }, e) }));"
        )},
         "id": "mt_gate", "name": "Verify And Read",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-820, 0]},

        {"parameters": {"rules": {"values": [
            {"conditions": {"options": {"caseSensitive": True, "version": 2},
                            "conditions": [{"leftValue": "={{ $json.kind }}",
                                            "rightValue": "leadgen",
                                            "operator": {"type": "string", "operation": "equals"}}],
                            "combinator": "and"},
             "outputKey": "Lead Form"},
            {"conditions": {"options": {"caseSensitive": True, "version": 2},
                            "conditions": [{"leftValue": "={{ $json.kind }}",
                                            "rightValue": "message",
                                            "operator": {"type": "string", "operation": "equals"}}],
                            "combinator": "and"},
             "outputKey": "A Message"},
        ]}, "options": {"fallbackOutput": "extra", "renameFallbackOutput": "Nothing To Do"}},
         "id": "mt_sw", "name": "What Came In",
         "type": "n8n-nodes-base.switch", "typeVersion": 3.2, "position": [-560, 0]},

        # ---- lead ad form ------------------------------------------------
        # THE WEBHOOK DOES NOT CONTAIN THE PERSON. It carries a leadgen_id and
        # no name, phone or email, so they are fetched here. Skipping this
        # creates a lead that is on time, correctly attributed and completely
        # empty, which then enters a sequence with nobody to text.
        {"parameters": {"method": "GET",
                        "url": "={{ '" + META_GRAPH + "/' + $json.leadgenId + "
                               "'?fields=field_data,created_time,ad_id,form_id' }}",
                        **hdr("Authorization", f"Bearer {META_PAGE_TOKEN}"),
                        "options": {}},
         "id": "mt_fetch", "name": "Fetch The Lead",
         "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2,
         "position": [-300, -200], "onError": "continueRegularOutput"},

        # The webhook carries ad_id and adgroup_id but NOT campaign_id, so the
        # campaign and ad set names need a second Graph call. Without it the
        # channel report can only show an id, which nobody can act on.
        {"parameters": {"method": "GET",
                        "url": "={{ '" + META_GRAPH + "/' + "
                               "($('Verify And Read').item.json.adId || '0') + "
                               "'?fields=name,campaign{id,name},adset{id,name}' }}",
                        **hdr("Authorization", f"Bearer {META_PAGE_TOKEN}"),
                        "options": {}},
         "id": "mt_ad", "name": "Name The Advert",
         "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2,
         "position": [-60, -200],
         # A lead must still be saved when the Graph call fails. An unnamed
         # advert is a reporting gap; a lost lead is a lost customer.
         "onError": "continueRegularOutput"},

        {"parameters": {"jsCode": (
            gate_inline("meta.js") + "\n"
            "// Meta's field_data pairs into the shape the router already\n"
            "// takes. Bundled from widget/gates/meta.js: do not edit here.\n"
            "const ev = $('Verify And Read').item.json;\n"
            "const lead = $('Fetch The Lead').item.json || {};\n"
            "const ad = $input.first().json || {};\n"
            "const f = leadFields(lead.field_data);\n"
            "return [{ json: {\n"
            "  sessionId: 'meta:' + ev.leadgenId,\n"
            "  name: f.name || '', phone: f.phone || '', email: f.email || '',\n"
            "  company: f.company || '', message: f.message || '',\n"
            "  sourceChannel: ev.sourceChannel,\n"
            "  idempotencyKey: ev.idem,\n"
            "  attribution: {\n"
            "    adId: ev.adId || null,\n"
            "    adGroup: (ad.adset && ad.adset.name) || ev.adgroupId || null,\n"
            "    campaign: (ad.campaign && ad.campaign.name) || null,\n"
            "    campaignId: (ad.campaign && ad.campaign.id) || null,\n"
            "    formId: ev.formId || null,\n"
            "    firstTouchAt: ev.createdAt || null,\n"
            "  },\n"
            "} }];"
        )},
         "id": "mt_shapelead", "name": "Shape The Lead",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [180, -200]},

        # Through the SAME router every other channel uses, rather than a
        # Convex route of its own. The router already saves the lead,
        # classifies it to route C, applies the consent gate and sends the
        # immediate touch. A second path here would be a second copy of all
        # of that, drifting quietly out of step with the tested one.
        {"parameters": {"method": "POST",
                        "url": f"{env.get('N8N_BASE_URL', 'http://localhost:5678').rstrip('/')}/webhook/{ROUTER_PATH}",
                        "sendBody": True, "specifyBody": "json",
                        "jsonBody": "={{ JSON.stringify($json) }}",
                        "options": {}},
         "id": "mt_lead", "name": "Send To The Router",
         "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2,
         "position": [420, -200], "onError": "continueRegularOutput"},

        # ---- a message ---------------------------------------------------
        # The same assistant the website widget uses. One brain, one knowledge
        # base, one set of tools. The session is keyed on the PSID so the
        # thread has a memory across days.
        {"parameters": {"method": "POST", "url": chat_url,
                        "sendBody": True, "specifyBody": "json",
                        "jsonBody": ("={{ JSON.stringify({ "
                                     "session_id: 'meta:' + $json.psid, "
                                     "message: $json.text, "
                                     "page_url: $json.surface }) }}"),
                        "options": {}},
         "id": "mt_ask", "name": "Ask The Assistant",
         "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2,
         "position": [-300, 160], "onError": "continueRegularOutput"},

        {"parameters": {"jsCode": (
            gate_inline("meta.js") + "\n"
            "// Whether we may still answer for free, and what to send.\n"
            "//\n"
            "// The window is measured from THEIR last message, which is the\n"
            "// event we are answering right now, so it is open by definition\n"
            "// here. The check stays because this node is the one place that\n"
            "// decides to send, and a silent send outside the window is an\n"
            "// error from Meta rather than a dropped message.\n"
            "const ev = $('Verify And Read').item.json;\n"
            "const reply = String(($input.first().json || {}).reply || '').trim();\n"
            "if (!reply) return [{ json: { send: false, why: 'no_reply' } }];\n"
            "const w = windowOpen(ev.at || Date.now(), Date.now());\n"
            "if (!w.open) return [{ json: { send: false, why: w.why } }];\n"
            "const body = sendBody(ev.psid, reply, ev.surface);\n"
            "return [{ json: { send: true, surface: body._surface, body: body } }];"
        )},
         "id": "mt_shape", "name": "Can We Answer",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-60, 160]},

        {"parameters": {"method": "POST",
                        "url": "={{ '" + META_GRAPH + "/' + "
                               "$('Verify And Read').item.json.pageId + '/messages' }}",
                        **hdr("Authorization", f"Bearer {META_PAGE_TOKEN}"),
                        "sendBody": True, "specifyBody": "json",
                        "jsonBody": "={{ JSON.stringify($json.body) }}",
                        "options": {}},
         "id": "mt_send", "name": "Answer In The Thread",
         "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2,
         "position": [180, 160], "onError": "continueRegularOutput"},

        convex_http("mt_touch", "Record The Touch", "/touch/record",
                    "={{ JSON.stringify({ "
                    "sessionId: 'meta:' + $('Verify And Read').item.json.psid, "
                    "direction: 'in', "
                    "channel: $('Verify And Read').item.json.surface, "
                    "body: $('Verify And Read').item.json.text, "
                    "idempotencyKey: $('Verify And Read').item.json.idem }) }}",
                    420, 160),

        # ---- the response ------------------------------------------------
        # Meta gets a 200 whatever happened. A non-200 makes it retry for days
        # and eventually disable the subscription, and "we ignored a read
        # receipt" is not worth losing the subscription over. The challenge is
        # returned as plain text because Meta compares it byte for byte and a
        # JSON-quoted string fails the handshake.
        {"parameters": {"respondWith": "text",
                        "responseBody": "={{ $json.kind === 'verify' ? $json.body : 'EVENT_RECEIVED' }}",
                        "options": {}},
         "id": "mt_resp", "name": "Meta OK",
         "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1,
         "position": [-680, 0]},
    ]

    conns = {
        "Meta Webhook": {"main": [[{"node": "Verify And Read", "type": "main", "index": 0}]]},
        # Answer Meta FIRST, then do the work, in a straight line rather than
        # fanning out.
        #
        # Two reasons, both found by validating this before pushing it. A
        # fan-out puts the respond node beside the processing branch, and
        # "Verify And Read" emits ONE ITEM PER EVENT: Meta batches, so three
        # DMs in one POST would call the respond node three times for a
        # response that can only be sent once. Chaining it means it responds
        # once, with the first item, and passes everything through.
        #
        # It is also the faster shape. Meta has its 200 before the Graph call
        # and the assistant have taken their time, which is what keeps the
        # subscription healthy.
        "Verify And Read": {"main": [[{"node": "Meta OK", "type": "main", "index": 0}]]},
        "Meta OK": {"main": [[{"node": "What Came In", "type": "main", "index": 0}]]},
        "What Came In": {"main": [
            [{"node": "Fetch The Lead", "type": "main", "index": 0}],
            [{"node": "Ask The Assistant", "type": "main", "index": 0}],
            [],
        ]},
        "Fetch The Lead": {"main": [[{"node": "Name The Advert", "type": "main", "index": 0}]]},
        "Name The Advert": {"main": [[{"node": "Shape The Lead", "type": "main", "index": 0}]]},
        "Shape The Lead": {"main": [[{"node": "Send To The Router", "type": "main", "index": 0}]]},
        "Ask The Assistant": {"main": [[{"node": "Can We Answer", "type": "main", "index": 0}]]},
        "Can We Answer": {"main": [[{"node": "Answer In The Thread", "type": "main", "index": 0}]]},
        "Answer In The Thread": {"main": [[{"node": "Record The Touch", "type": "main", "index": 0}]]},
    }
    return {"name": "OHM Assistant — Meta", "nodes": nodes,
            "connections": conns, "settings": wf_settings()}


def build_reactivation():
    """A list of past customers, screened and put on route F.

    Nothing is sent here, and that is the design rather than an omission.
    Route F's `immediate` is empty: its first message is queued like every
    other step so that quiet hours apply to it. A batch started at eleven at
    night goes out at eight the next morning, not at eleven at night. The
    sequence worker picks them up on its next minute.

    The one piece of real thinking is the consent gate, and it is not written
    here. It is bundled from widget/gates/consent-gate.js, the same file
    widget/tests/reactivation.test.ts imports, so the rule the tests assert is
    the rule this node runs.

    It answers the caller as soon as the campaign exists rather than after the
    last person is enrolled. A four hundred row import would otherwise hold
    the request open for minutes, and the counts the caller wants (how many
    may be contacted, how many may not and why) are known before any of the
    enrolling starts.
    """
    nodes = [
        {"parameters": {"httpMethod": "POST", "path": REACTIVATION_PATH,
                        "responseMode": "responseNode", "options": {}},
         "id": "rx_wh", "name": "Reactivation Webhook",
         "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [-1060, 0],
         # An unanswered caller retries, and a retried import is a second
         # campaign enrolling the same people again.
         "onError": "continueRegularOutput"},

        {"parameters": {"jsCode": (
            "// The consent gate. Bundled from widget/gates/consent-gate.js:\n"
            "// do not edit here, edit the file and rebuild, or the tests stop\n"
            "// describing what actually runs.\n"
            + gate_inline("consent-gate.js") +
            "\n"
            "const b = $input.first().json.body || $input.first().json;\n"
            "const screened = screenRows(b.rows || b.people || []);\n"
            "\n"
            "return [{ json: {\n"
            "  name: String(b.name || 'Reactivation').slice(0, 120),\n"
            "  audience: b.audience ? String(b.audience).slice(0, 400) : undefined,\n"
            "  consentBasis: b.consentBasis ? String(b.consentBasis) : 'soft_optin',\n"
            "  note: b.note ? String(b.note).slice(0, 400) : undefined,\n"
            "  by: b.by ? String(b.by) : undefined,\n"
            "  ...screened,\n"
            "} }];"
        )},
         "id": "rx_screen", "name": "Screen The List",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-840, 0],
         # A throw here would leave the caller with no response at all, and a
         # caller with no response retries. A retried import is the same list
         # enrolled twice, which is every one of those people texted twice.
         # Failing forward reaches the respond node instead: the campaign
         # create gets nothing, the guard below stops the enrolling, and the
         # caller is told rather than left hanging.
         "onError": "continueRegularOutput"},

        convex_http("rx_make", "Create The Campaign", "/campaign/create",
                    "={{ JSON.stringify({ name: $json.name, kind: 'reactivation', "
                    "route: 'F', audience: $json.audience, "
                    "consentBasis: $json.consentBasis, note: $json.note, "
                    # `intended` is the WHOLE list, not what survived the gate.
                    # The gap between them is the consent rate, and it is the
                    # most useful figure the run produces.
                    "intended: $json.intended, by: $json.by }) }}",
                    -620, 0),

        {"parameters": {"respondWith": "json",
                        "responseBody": "={{ JSON.stringify({ ok: true, "
                                        "campaignId: $json.campaignId, "
                                        "intended: $('Screen The List').item.json.intended, "
                                        "accepted: $('Screen The List').item.json.accepted.length, "
                                        "refused: $('Screen The List').item.json.refused }) }}",
                        "options": {}},
         "id": "rx_ok", "name": "Answer The Caller",
         "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": [-400, 0]},

        {"parameters": {"jsCode": (
            "// One item per person who may be contacted. The refused ones went\n"
            "// back in the response and go no further.\n"
            "const s = $('Screen The List').first().json;\n"
            "const campaignId = $('Create The Campaign').first().json.campaignId;\n"
            "// No campaign, no enrolling. The create call is allowed to fail\n"
            "// softly so the caller still gets an answer, and without this the\n"
            "// run would carry on and put everybody on a campaign that does\n"
            "// not exist, under a session id reading 'rx-undefined-0'.\n"
            "if (!campaignId) return [];\n"
            "return s.accepted.map((p, i) => ({ json: {\n"
            "  ...p, campaignId,\n"
            "  // Every row needs a session of its own: it is what ties the\n"
            "  // lead, its touches and its sequence together everywhere else.\n"
            "  sessionId: 'rx-' + campaignId + '-' + i,\n"
            "} }));"
        )},
         "id": "rx_each", "name": "One Person Per Item",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [-180, 0]},

        convex_http("rx_save", "Save Each Person", "/saveLead",
                    "={{ JSON.stringify({ sessionId: $json.sessionId, "
                    "name: $json.name, phone: $json.phone, email: $json.email, "
                    "company: $json.company, service: $json.service, "
                    "channel: 'sms', sourceChannel: 'reactivation', hot: false }) }}",
                    40, 0),

        convex_http("rx_consent", "Log The Consent", "/consent/log",
                    # Append-only evidence, written BEFORE anybody is enrolled.
                    # A consent record created after the send would be a record
                    # of our intention, not of their permission.
                    "={{ JSON.stringify({ leadId: $json.leadId, "
                    "kind: 'sms_marketing', action: 'granted', "
                    "basis: $('One Person Per Item').item.json.consentBasis, "
                    "evidence: $('One Person Per Item').item.json.consentEvidence, "
                    "source: 'reactivation import', "
                    "by: $('Screen The List').first().json.by }) }}",
                    260, 0),

        {"parameters": {"jsCode": (
            "// Pages of a hundred, because campaign/enrol refuses more: it is\n"
            "// one transaction holding read locks on suppressions and settings,\n"
            "// which every live send also reads.\n"
            "const ids = $('Save Each Person').all()\n"
            "  .map(i => i.json.leadId).filter(Boolean);\n"
            "const campaignId = $('Create The Campaign').first().json.campaignId;\n"
            "const pages = [];\n"
            "for (let i = 0; i < ids.length; i += 100) pages.push(ids.slice(i, i + 100));\n"
            "return pages.map(leadIds => ({ json: { campaignId, leadIds } }));"
        )},
         "id": "rx_pages", "name": "Into Pages Of A Hundred",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [480, 0]},

        convex_http("rx_enrol", "Enrol The Page", "/campaign/enrol",
                    "={{ JSON.stringify({ campaignId: $json.campaignId, "
                    "leadIds: $json.leadIds }) }}",
                    700, 0),

        {"parameters": {"jsCode": (
            "// What actually happened, in the execution log. Refusals here are\n"
            "// a different set from the gate's: these are people the ENGINE\n"
            "// turned away, already suppressed or already on a sequence, and\n"
            "// that is worth seeing separately from a list that arrived\n"
            "// without evidence.\n"
            "let enrolled = 0; const refused = [];\n"
            "for (const i of $input.all()) {\n"
            "  enrolled += Number(i.json.enrolled || 0);\n"
            "  for (const r of (i.json.refused || [])) refused.push(r);\n"
            "}\n"
            "return [{ json: { enrolled, refusedByEngine: refused.length, refused } }];"
        )},
         "id": "rx_done", "name": "What Enrolled",
         "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [920, 0]},
    ]
    conns = {
        "Reactivation Webhook": {"main": [[{"node": "Screen The List", "type": "main", "index": 0}]]},
        "Screen The List": {"main": [[{"node": "Create The Campaign", "type": "main", "index": 0}]]},
        "Create The Campaign": {"main": [[{"node": "Answer The Caller", "type": "main", "index": 0}]]},
        "Answer The Caller": {"main": [[{"node": "One Person Per Item", "type": "main", "index": 0}]]},
        "One Person Per Item": {"main": [[{"node": "Save Each Person", "type": "main", "index": 0}]]},
        "Save Each Person": {"main": [[{"node": "Log The Consent", "type": "main", "index": 0}]]},
        "Log The Consent": {"main": [[{"node": "Into Pages Of A Hundred", "type": "main", "index": 0}]]},
        "Into Pages Of A Hundred": {"main": [[{"node": "Enrol The Page", "type": "main", "index": 0}]]},
        "Enrol The Page": {"main": [[{"node": "What Enrolled", "type": "main", "index": 0}]]},
    }
    return {"name": "OHM Assistant — Reactivation",
            "nodes": nodes, "connections": conns,
            "settings": wf_settings()}


OUT = {
    # First, so push.py creates it before the twelve that name it.
    "00-error.json": build_error(),
    "01-chat.json": build_chat(),
    "02-voice.json": build_voice(),
    "03-events.json": build_events(),
    "04-calendar.json": build_calendar(),
    "05-notify.json": build_notify(),
    "06-roi-leads.json": build_roi(),
    "07-router.json": build_router(),
    "08-sequence-worker.json": build_worker(),
    "09-twilio-inbound.json": build_inbound(),
    "10-meta.json": build_meta(),
    "11-reactivation.json": build_reactivation(),
    "12-email-inbound.json": build_email_inbound(),
}

for fname, wf in OUT.items():
    (HERE / fname).write_text(json.dumps(wf, ensure_ascii=False, indent=1))
    print(f"  {fname:18} {wf['name'][:48]:50} {len(wf['nodes'])} nodes")
print("\nWritten to n8n/. Nothing has been pushed to the instance yet.")
