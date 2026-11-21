import { NextResponse } from "next/server";
import { processDueFollowUps } from "@/lib/notify";

/**
 * Sends queued follow-ups that are due. Call every few minutes from a scheduler
 * (Vercel Cron, a Neon Function cron trigger, or any uptime pinger):
 *   GET /api/cron/follow-ups   Authorization: Bearer $CRON_SECRET
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await processDueFollowUps();
  return NextResponse.json({ ok: true, processed: result.processed, sent: result.sent });
}
