import "server-only";
import { createHash, randomInt } from "node:crypto";
import { db } from "./db";
import { sendMail } from "./email";
import { renderEmail, templates } from "./email-templates";
import { getFirm } from "./data";

// No 0/O, 1/I/L — easy to read and type.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const TTL_MINUTES = 30;
const MAX_ATTEMPTS = 5;
const RESEND_AFTER_SECONDS = 60;

const hash = (userId: string, code: string) => createHash("sha256").update(`${userId}:${code.toUpperCase()}`).digest("hex");

function newCode() {
  return Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

/**
 * Emails a fresh code unless a recent one is still valid.
 * `force` resends (subject to a 60-second cooldown).
 */
export async function ensureVerificationCode(user: { id: string; email: string; name: string }, force = false) {
  const [existing] = await db()`
    SELECT expires_at > now() AS live, extract(epoch FROM now() - sent_at) AS age
    FROM account_verifications WHERE user_id = ${user.id}`;
  if (existing?.live && !force) return { sent: false as const, reason: "active" as const };
  if (existing && Number(existing.age) < RESEND_AFTER_SECONDS) return { sent: false as const, reason: "cooldown" as const };

  const code = newCode();
  await db()`
    INSERT INTO account_verifications (user_id, email, code_hash, expires_at, attempts, sent_at)
    VALUES (${user.id}, ${user.email}, ${hash(user.id, code)}, now() + make_interval(mins => ${TTL_MINUTES}), 0, now())
    ON CONFLICT (user_id) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at,
      attempts = 0, sent_at = now(), email = EXCLUDED.email`;

  const t = templates.verifyAccount({ name: user.name, code, minutes: TTL_MINUTES });
  let firm = null;
  try {
    firm = await getFirm();
  } catch {}
  const { html, text } = renderEmail(t.content, firm);
  const result = await sendMail({ kind: "verify-account", to: user.email, subject: t.subject, html, text });
  return result.ok ? { sent: true as const } : { sent: false as const, reason: "email" as const };
}

export type VerifyResult = { ok: true } | { ok: false; error: string };

/** Checks a code; on success the Neon Auth account is marked verified (activated). */
export async function checkVerificationCode(userId: string, code: string): Promise<VerifyResult> {
  const clean = code.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(clean)) return { ok: false, error: "Enter the 6-character code from your email." };

  const [row] = await db()`
    SELECT code_hash, expires_at > now() AS live, attempts FROM account_verifications WHERE user_id = ${userId}`;
  if (!row) return { ok: false, error: "No active code. Send a new one." };
  if (!row.live) return { ok: false, error: "That code has expired. Send a new one." };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Too many attempts. Send a new code." };

  if (row.code_hash !== hash(userId, clean)) {
    await db()`UPDATE account_verifications SET attempts = attempts + 1 WHERE user_id = ${userId}`;
    const left = MAX_ATTEMPTS - row.attempts - 1;
    return { ok: false, error: left > 0 ? `That code isn’t right. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many attempts. Send a new code." };
  }

  await db().transaction([
    db()`UPDATE neon_auth."user" SET "emailVerified" = true, "updatedAt" = now() WHERE id::text = ${userId}`,
    db()`DELETE FROM account_verifications WHERE user_id = ${userId}`,
  ]);
  return { ok: true };
}
