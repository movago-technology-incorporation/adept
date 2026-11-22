import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { TAGS } from "@/lib/data";

// Cached public content that can be refreshed on demand after editing it directly in Neon.
const ALLOWED: Record<string, string> = { ...TAGS, calEventTypes: "cal-event-types" };

/**
 * Expire cached content immediately.
 *   GET /api/revalidate?tag=firm          (or omit ?tag to refresh everything)
 *   Authorization: Bearer $CRON_SECRET
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requested = new URL(request.url).searchParams.get("tag");
  const tags = requested ? [ALLOWED[requested] ?? (Object.values(ALLOWED).includes(requested) ? requested : "")] : Object.values(ALLOWED);
  if (!tags[0]) return NextResponse.json({ error: `Unknown tag. Use one of: ${Object.keys(ALLOWED).join(", ")}` }, { status: 400 });
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ ok: true, revalidated: tags });
}
