// Applies db/*.sql files to Neon over the direct (unpooled) connection.
// Usage: node --env-file=.env.local db/run.mjs schema.sql [seed.sql ...]
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Pool } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set");
  process.exit(1);
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Pass at least one .sql file from db/");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
try {
  for (const file of files) {
    const text = await readFile(fileURLToPath(new URL(file, import.meta.url)), "utf8");
    await pool.query(text); // no params → simple protocol, multi-statement OK
    console.log(`✓ applied db/${file}`);
  }
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
