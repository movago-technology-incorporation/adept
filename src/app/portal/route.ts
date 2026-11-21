import { NextResponse } from "next/server";
import { getViewer, homeFor } from "@/lib/auth/viewer";

/** Post-sign-in landing: send each person to the workspace for their role. */
export async function GET(request: Request) {
  const viewer = await getViewer();
  const target = viewer ? homeFor(viewer) : "/login";
  return NextResponse.redirect(new URL(target, request.url));
}
