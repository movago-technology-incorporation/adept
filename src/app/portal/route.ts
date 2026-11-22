import { NextResponse } from "next/server";
import { getViewer, homeFor } from "@/lib/auth/viewer";
import { ensureVerificationCode } from "@/lib/verification";

/** Post-sign-in landing: send each person to the workspace for their role. */
export async function GET(request: Request) {
  const viewer = await getViewer();
  if (viewer?.role === "pending") {
    // New or unconfirmed account: make sure a code is in their inbox before showing /verify.
    try {
      await ensureVerificationCode({ id: viewer.userId, email: viewer.email, name: viewer.name });
    } catch (err) {
      console.error("Verification email failed:", err);
    }
  }
  const target = viewer ? homeFor(viewer) : "/login";
  return NextResponse.redirect(new URL(target, request.url));
}
