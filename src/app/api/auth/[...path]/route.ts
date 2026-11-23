import { auth } from "@/lib/auth/server";
import { consumeInvite, findInvite } from "@/lib/invites";

const handler = auth.handler();
export const { GET, PUT, DELETE, PATCH } = handler;

type Ctx = Parameters<typeof handler.POST>[1];

/** Sign-up is invite-only: it needs a live invite token whose email matches the new account. */
export async function POST(request: Request, ctx: Ctx) {
  if (!new URL(request.url).pathname.endsWith("/sign-up/email")) return handler.POST(request, ctx);

  const body = (await request.clone().json().catch(() => ({}))) as { email?: string };
  const invite = await findInvite(request.headers.get("x-invite-token") ?? "");
  if (!invite || invite.email.toLowerCase() !== String(body.email ?? "").trim().toLowerCase()) {
    return Response.json(
      { code: "INVITE_REQUIRED", message: "Registration is by invitation only. Please ask Adept for a new invite link." },
      { status: 403 },
    );
  }
  const res = await handler.POST(request, ctx);
  if (res.ok) await consumeInvite(invite);
  return res;
}
