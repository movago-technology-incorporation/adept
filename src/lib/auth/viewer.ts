import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { after, connection } from "next/server";
import { auth } from "./server";
import { db } from "../db";
import { notifyClientRegistered, siteUrl } from "../notify";

export type Viewer =
  | { role: "staff"; userId: string; email: string; name: string }
  | { role: "client"; userId: string; email: string; name: string; clientId: string }
  /** Registered but hasn't confirmed their email yet — can only reach /verify. */
  | { role: "pending"; userId: string; email: string; name: string };

/**
 * Who is signing in, resolved once per request.
 * - Staff: Neon Auth users with role "admin" (grant with `npm run auth:make-staff -- <email>`).
 * - Clients: matched to a `clients` row by email. Staff create that row and send an invite;
 *   logins without one get no access.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  await connection(); // per-request: reads session cookies
  const { data: session } = await auth.getSession();
  const user = session?.user as { id: string; email: string; name?: string; role?: string | null } | undefined;
  if (!user?.email) return null;

  const name = user.name?.trim() || user.email.split("@")[0];
  const base = { userId: user.id, email: user.email, name };

  // Session cookies are cached briefly; make sure the login still exists.
  const [live] = await db()`SELECT role, "emailVerified" AS verified FROM neon_auth."user" WHERE id::text = ${user.id}`;
  if (!live) return null;
  if (live.role === "admin") return { role: "staff", ...base };
  // Accounts stay inactive until the emailed code is confirmed (see /verify).
  if (!live.verified) return { role: "pending", ...base };

  // First portal sign-in for a client Adept already has on file: link the account and welcome them.
  const linked = await db()`
    UPDATE clients SET portal_user_id = ${user.id}
    WHERE lower(email) = lower(${user.email}) AND portal_user_id IS NULL
    RETURNING id, name`;
  if (linked[0]) {
    const site = await siteUrl();
    after(() => notifyClientRegistered({ name: linked[0].name || name, email: user.email }, site));
    return { role: "client", ...base, clientId: linked[0].id as string };
  }
  const existing = await db()`SELECT id FROM clients WHERE lower(email) = lower(${user.email}) LIMIT 1`;
  if (existing[0]) return { role: "client", ...base, clientId: existing[0].id as string };

  // Registration is invite-only, so a login with no client record on file gets no portal access.
  return null;
});

export const homeFor = (viewer: Viewer) => (viewer.role === "staff" ? "/studio" : viewer.role === "pending" ? "/verify" : "/client");

/** For layouts/pages: redirect anyone who shouldn't be here. */
export async function requirePageRole<R extends Viewer["role"]>(role: R) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== role) redirect(homeFor(viewer));
  return viewer as Extract<Viewer, { role: R }>;
}

export class AuthError extends Error {}

/** For server actions / route handlers: throw instead of redirecting. */
export async function requireStaff() {
  const viewer = await getViewer();
  if (viewer?.role !== "staff") throw new AuthError("Staff access required");
  return viewer;
}

/** Signed in AND activated (pending accounts are rejected). */
export async function requireSignedIn() {
  const viewer = await getViewer();
  if (!viewer) throw new AuthError("Please sign in");
  if (viewer.role === "pending") throw new AuthError("Please confirm your email first");
  return viewer;
}
