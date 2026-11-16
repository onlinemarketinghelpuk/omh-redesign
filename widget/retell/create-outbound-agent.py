#!/usr/bin/env python3
"""
Creates (or updates) the Retell OUTBOUND agent: the one the sequence
worker dials with, to ring people back about their own enquiry and book
the free consultation.

Same tools, same knowledge base, same tool webhook as the site's voice agent
(create-agent.py), so there is one brain and one place to revoke. The prompt
is the core and the voice prompts plus prompt-outbound.md.

NOT RUN AUTOMATICALLY. It creates an agent in the Retell account, which is
Rafiul's to approve. After it runs, rebuild the workflows
(n8n/build-workflows.py reads outbound-agent.json) and push.

The agent never talks to Convex directly. Every tool call goes to the n8n tool
webhook, which checks the token and then calls Convex, so there is one place
where the knowledge base can be reached and one place to revoke.

Usage:
  python3 retell/create-outbound-agent.py            create
  python3 retell/create-outbound-agent.py --update   update the ids in outbound-agent.json
"""
import json, pathlib, sys, urllib.request, urllib.error

HERE = pathlib.Path(__file__).parent


# retell/ lives in the repo and is symlinked into the working copy, the same
# way convex/ and n8n/ are. Python resolves __file__ through the symlink to
# the real path, so HERE.parent lands in the repo, where there is no
# .env.local. Look for the file that actually matters rather than assuming a
# layout. Same helper as n8n/build-workflows.py, for the same reason.
def _root():
    for c in (HERE.parent, HERE.parent.parent.parent / "widget",
              pathlib.Path.cwd().parent, pathlib.Path.cwd()):
        if (c / ".env.local").exists():
            return c
    raise SystemExit(
        "Cannot find .env.local. Run this from the working copy "
        "(OHM/widget/retell), not from the repo path."
    )


ROOT = _root()

env = {}
for line in (ROOT / ".env.local").read_text().splitlines():
    t = line.strip()
    if not t or t.startswith("#") or "=" not in t:
        continue
    k, _, v = t.partition("=")
    env[k] = v.strip().strip('"')

RETELL = "https://api.retellai.com"
KEY = env["RETELL_API_KEY"]
N8N = env["N8N_BASE_URL"].rstrip("/")
TOOL_URL = f"{N8N}/webhook/ohm-retell-tool?token={env['OHM_RETELL_TOOL_TOKEN']}"

AGENT_NAME = "OMH Outbound (Melissa, calling back)"
VOICE_ID = "11labs-Anthony"      # British. Swap here to change the voice.

core = (HERE / "prompt-core.md").read_text()
voice_extra = (HERE / "prompt-voice.md").read_text()
outbound_extra = (HERE / "prompt-outbound.md").read_text()
PROMPT = (core.replace("{{NOW}}", "{{now_uk}}")
          + "\n\n---\n\n" + voice_extra
          + "\n\n---\n\n" + outbound_extra
          + "\n\n## SESSION\nThe website session id for this call is {{session_id}}. "
            "Pass it as session_id in every tool call so the chat and the call "
            "are the same conversation.\n")


def post(path, body):
    req = urllib.request.Request(
        RETELL + path, method="POST",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:600]


def patch(path, body):
    req = urllib.request.Request(
        RETELL + path, method="PATCH",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:600]


def tool(name, description, props, required):
    return {
        "type": "custom",
        "name": name,
        "description": description,
        "url": TOOL_URL,
        "speak_during_execution": True,
        "execution_message_description":
            "Say one short natural filler such as 'let me check that for you' "
            "while this runs. Never say the word tool, function or database.",
        "speak_after_execution": True,
        "parameters": {
            "type": "object",
            "properties": props,
            "required": required,
        },
    }


S = {"type": "string"}
TOOLS = [
    tool("search_knowledge",
         "Search the verified Online Marketing Help knowledge base for anything factual about the agency: services and what each includes, who they suit, solutions, FAQs, case studies, company details, terms. Call this before stating any fact.",
         {"session_id": S, "q": {"type": "string", "description": "A few search keywords, not a sentence"}},
         ["session_id", "q"]),

    tool("get_packages",
         "The structured package and price list with MONTHLY prices, contract lengths and what each package includes. Use for every price question. Prices are monthly with a 50 percent deposit, never a one-off project total.",
         {"session_id": S, "q": {"type": "string", "description": "Service name or keyword, e.g. SEO, WordPress, Google Ads"}},
         ["session_id", "q"]),

    tool("save_lead",
         "Save the caller's contact details. Call as soon as they give a name with a phone or email, or show real buying interest.",
         {"session_id": S, "name": S, "phone": S, "email": S, "company": S,
          "service": S, "budget": S, "message": S,
          "hot": {"type": "boolean", "description": "true if they have a live project, budget or deadline"}},
         ["session_id", "name"]),

    tool("book_consultation",
         "Book the free 30 minute consultation. You must already have their full name, phone number, a real date and a time. Weekdays only, 09:00 to 17:00 UK. Returns a reference to read back.",
         {"session_id": S, "name": S, "phone": S, "email": S, "service": S,
          "preferredDate": {"type": "string", "description": "YYYY-MM-DD"},
          "preferredTime": {"type": "string", "description": "HH:mm, 24 hour UK time"},
          "notes": S},
         ["session_id", "name", "phone", "preferredDate", "preferredTime"]),

    tool("manage_booking",
         "Look up, move or cancel an existing booking by its reference, format OMH-XXXXXX.",
         {"session_id": S, "reference": S,
          "action": {"type": "string", "description": "lookup, move or cancel"},
          "preferredDate": S, "preferredTime": S},
         ["session_id", "reference", "action"]),

    tool("escalate_to_team",
         "Send the question straight to a person at OMH. Use when the tools cannot answer, for existing client accounts, invoices, project status, complaints, legal or contractual questions, or anything you are unsure about, and whenever the caller asks for a human.",
         {"session_id": S, "reason": S, "question": S, "contact": S},
         ["session_id", "reason", "question"]),
]

# The opening line comes from the dashboard per call, as a dynamic variable,
# so the owner can change it without touching Retell.
BEGIN = "{{opening_line}}"

state_file = HERE / "outbound-agent.json"
state = json.loads(state_file.read_text()) if state_file.exists() else {}
update = "--update" in sys.argv and state.get("llm_id") and state.get("agent_id")

llm_body = {
    "general_prompt": PROMPT,
    "general_tools": TOOLS,
    "begin_message": BEGIN,
    "model": "gpt-4o",
    "model_temperature": 0.2,
}

if update:
    st, llm = patch(f"/update-retell-llm/{state['llm_id']}", llm_body)
    print(f"  update-retell-llm -> {st}")
else:
    st, llm = post("/create-retell-llm", llm_body)
    print(f"  create-retell-llm -> {st}")
if st not in (200, 201):
    print("   ", llm)
    sys.exit(1)
llm_id = llm.get("llm_id") or state.get("llm_id")

agent_body = {
    "agent_name": AGENT_NAME,
    "voice_id": VOICE_ID,
    "language": "en-GB",
    "response_engine": {"type": "retell-llm", "llm_id": llm_id},
    # The same events webhook: it logs the transcript and marks the call
    # answered or not, which decides whether "a text saying we tried" goes.
    "webhook_url": f"{N8N}/webhook/ohm-retell-events?token={env['OHM_RETELL_TOOL_TOKEN']}",
    "end_call_after_silence_ms": 15000,
    "max_call_duration_ms": 600000,
    "interruption_sensitivity": 0.9,
    "enable_backchannel": True,
    "backchannel_words": ["mm-hmm", "right", "I see"],
    "enable_voicemail_detection": True,
    "voicemail_message": ("Hi, it's Melissa from Online Marketing Help, returning your enquiry. "
                          "I'll text you a link to book a free call at a time that suits. Thanks."),
}

if update:
    st, agent = patch(f"/update-agent/{state['agent_id']}", agent_body)
    print(f"  update-agent      -> {st}")
else:
    st, agent = post("/create-agent", agent_body)
    print(f"  create-agent      -> {st}")
if st not in (200, 201):
    print("   ", agent)
    sys.exit(1)

agent_id = agent.get("agent_id") or state.get("agent_id")
state_file.write_text(json.dumps({
    "llm_id": llm_id,
    "agent_id": agent_id,
    "agent_name": AGENT_NAME,
    "voice_id": VOICE_ID,
}, indent=1))

print(f"\n  llm_id   {llm_id}")
print(f"  agent_id {agent_id}")
print("\n  Saved to retell/outbound-agent.json.")
print("  Next: python3 n8n/build-workflows.py, then push, so the worker dials with it.")
