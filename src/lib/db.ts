import { neon, neonConfig } from "@neondatabase/serverless";

// Pooled connection for app traffic. Schema changes live in db/schema.sql
// and are applied with `npm run db:migrate` (direct connection), never at request time.
const databaseUrl = process.env.DATABASE_URL;

// Retry brief network failures (Wi-Fi drops, laptop wake, DNS hiccups).
// Only errors raised while *connecting* are retried — the request never reached
// Neon, so a retry can't apply a write twice.
const RETRYABLE = new Set(["ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH", "UND_ERR_CONNECT_TIMEOUT"]);
const DELAYS_MS = [200, 600, 1500];

function connectErrorCode(err: unknown): string | undefined {
  const cause = (err as { cause?: { code?: string; errors?: { code?: string }[] } })?.cause;
  return cause?.code ?? cause?.errors?.find((e) => e.code)?.code;
}

neonConfig.fetchFunction = async (input: RequestInfo | URL, init?: RequestInit) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (err) {
      const code = connectErrorCode(err);
      if (attempt >= DELAYS_MS.length || !code || !RETRYABLE.has(code)) throw err;
      console.warn(`Neon connection ${code}; retrying (${attempt + 1}/${DELAYS_MS.length})`);
      await new Promise((r) => setTimeout(r, DELAYS_MS[attempt]));
    }
  }
};

export const sql = databaseUrl ? neon(databaseUrl) : null;

export function db() {
  if (!sql) throw new Error("DATABASE_URL is not configured");
  return sql;
}
