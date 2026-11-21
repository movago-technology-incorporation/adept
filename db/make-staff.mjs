// Grants Studio (staff) access to an existing Neon Auth user.
// Usage: npm run auth:make-staff -- someone@example.com   (add --revoke to remove)
//
// Every new sign-up starts as a client and gets a client folder automatically.
// When granting staff access, that folder is removed if it is still empty
// (no documents, forms, messages, meetings, jobs or proposals).
import { neon } from "@neondatabase/serverless";

const email = process.argv[2];
const revoke = process.argv.includes("--revoke");
if (!email || email.startsWith("--")) {
  console.error("Usage: npm run auth:make-staff -- <email> [--revoke]");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

const rows = await sql`
  UPDATE neon_auth."user" SET role = ${revoke ? "user" : "admin"}, "updatedAt" = now()
  WHERE lower(email) = lower(${email}) RETURNING id, email, role`;
if (!rows.length) {
  console.error(`No account for ${email}. Create one at /login first.`);
  process.exit(1);
}
const user = rows[0];
console.log(`✓ ${user.email} is now ${user.role === "admin" ? "staff (Studio access)" : "a regular user"}`);

if (!revoke) {
  const autoId = `cli_${String(user.id).replace(/[^a-zA-Z0-9]/g, "").slice(0, 24)}`;
  const removed = await sql`
    DELETE FROM clients c
    WHERE c.id = ${autoId}
      AND NOT EXISTS (SELECT 1 FROM documents WHERE client_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM forms WHERE client_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM messages WHERE client_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM appointments WHERE client_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM jobs WHERE client_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM proposals WHERE client_id = c.id)
    RETURNING c.id`;
  if (removed.length) console.log("✓ Removed the empty client folder created at sign-up");
}
