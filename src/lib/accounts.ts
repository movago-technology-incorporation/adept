import "server-only";
import { db } from "./db";
import { cancelBooking } from "./cal";
import { deleteObjectsByPrefix } from "./storage";

/**
 * Deletes a Neon Auth login and everything hanging off it.
 * neon_auth has no foreign keys, so sessions, linked accounts, memberships and
 * pending verifications are removed explicitly in one transaction.
 * Staff (role = admin) logins are never removed here.
 */
export async function deleteAuthUser({ userId, email }: { userId?: string | null; email: string }) {
  const sql = db();
  const users = await sql`
    SELECT id, role FROM neon_auth."user"
    WHERE (${userId ?? null}::text IS NOT NULL AND id::text = ${userId ?? null}) OR lower(email) = lower(${email})`;
  const ids = users.filter((u) => u.role !== "admin").map((u) => String(u.id));
  if (!ids.length) return { removed: 0, skippedStaff: users.length > 0 };

  await sql.transaction([
    sql`DELETE FROM neon_auth.session WHERE "userId"::text = ANY(${ids})`,
    sql`DELETE FROM neon_auth.account WHERE "userId"::text = ANY(${ids})`,
    sql`DELETE FROM neon_auth.member WHERE "userId"::text = ANY(${ids})`,
    sql`DELETE FROM neon_auth.invitation WHERE lower(email) = lower(${email})`,
    sql`DELETE FROM neon_auth.verification WHERE lower(identifier) LIKE '%' || lower(${email}) || '%'`,
    sql`DELETE FROM neon_auth."user" WHERE id::text = ANY(${ids})`,
  ]);
  return { removed: ids.length, skippedStaff: users.length > ids.length };
}

/**
 * Permanently removes a client: upcoming Cal.com bookings are cancelled, their
 * files are deleted from the bucket, their folder records are deleted, and their
 * portal login is removed. Pipeline history (leads, enquiries) is kept.
 */
export async function purgeClient(clientId: string, reason: string) {
  const sql = db();
  const [client] = await sql`SELECT id, email, portal_user_id FROM clients WHERE id = ${clientId}`;
  if (!client) return { ok: false as const, error: "Client not found" };

  // 1. Cancel upcoming bookings so nobody turns up to a dead meeting.
  const upcoming = await sql`
    SELECT cal_uid FROM appointments
    WHERE client_id = ${clientId} AND status = 'scheduled' AND cal_uid IS NOT NULL AND (start_at IS NULL OR start_at > now())`;
  for (const a of upcoming) {
    try {
      await cancelBooking(a.cal_uid, reason);
    } catch (err) {
      console.error("Cal.com cancel failed during client purge:", err);
    }
  }

  // 2. Files in object storage.
  let files = 0;
  try {
    files = await deleteObjectsByPrefix(`clients/${clientId}/`);
  } catch (err) {
    console.error("Storage cleanup failed during client purge:", err);
  }

  // 3. Database records. documents/forms/messages/jobs cascade from clients.
  await sql.transaction([
    sql`DELETE FROM appointments WHERE client_id = ${clientId}`,
    sql`DELETE FROM proposals WHERE client_id = ${clientId} AND lead_id IS NULL`,
    sql`UPDATE proposals SET client_id = NULL WHERE client_id = ${clientId}`,
    sql`DELETE FROM clients WHERE id = ${clientId}`,
  ]);

  // 4. Portal login.
  const auth = await deleteAuthUser({ userId: client.portal_user_id, email: client.email });
  return { ok: true as const, files, loginRemoved: auth.removed > 0, email: String(client.email) };
}
