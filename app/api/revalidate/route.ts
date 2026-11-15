import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { POSTS_TAG } from "@/lib/sanity/client";
import { SITE } from "@/lib/schema";

// IndexNow (Bing, Yandex, Seznam, Naver; Google does not take part): tells them a post was published, edited or
// deleted the moment it happens. The key is public by design: engines check it against public/<key>.txt.
const INDEXNOW_KEY = "d6b9d3f4df7d48bfe0324b22be991a1e";

async function pingIndexNow(urls: string[]) {
  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
      signal: AbortSignal.timeout(5000),
    });
    return response.status; // 200/202 = accepted
  } catch (error) {
    console.error("IndexNow ping failed", error);
    return null;
  }
}

// Sanity calls this when a post is published, updated or deleted. It clears the
// blog cache tag so the next request rebuilds those pages, which is why the
// pages themselves can be cached indefinitely and served with no Sanity call.
//
// Set SANITY_REVALIDATE_SECRET here and in the webhook's Secret field; requests
// that fail the signature check are rejected.
export async function POST(request: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<{ _type?: string; slug?: { current?: string } }>(
      request,
      process.env.SANITY_REVALIDATE_SECRET,
    );

    if (!isValidSignature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    if (!body?._type) {
      return NextResponse.json({ message: "Bad request" }, { status: 400 });
    }

    // expire: 0 = the next visit fetches fresh content, so a publish shows on
    // the first reload ('max' would serve the stale page once more first).
    revalidateTag(POSTS_TAG, { expire: 0 });

    // Posts only (a category or author slug is not a page URL). The post plus the hub that lists it. A failed ping
    // never fails the webhook: the cache is already cleared.
    const slug = body.slug?.current;
    const indexNow = body._type === "post" && slug ? await pingIndexNow([`${SITE}/${slug}`, `${SITE}/insights`]) : null;

    return NextResponse.json({
      revalidated: true,
      tag: POSTS_TAG,
      type: body._type,
      slug,
      indexNow,
    });
  } catch (error) {
    console.error("Revalidation failed", error);
    return NextResponse.json({ message: "Revalidation failed" }, { status: 500 });
  }
}
