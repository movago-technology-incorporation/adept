import "server-only";
import { db } from "./db";
import { decryptJson, encryptJson } from "./crypto";
import { normalizeReturn, type TaxReturnData } from "./tax-return";

export type TaxReturnStatus = "draft" | "submitted" | "in_progress" | "done";
export type TaxReturnRow = {
  id: string;
  clientId: string;
  taxYear: number;
  status: TaxReturnStatus;
  currentStep: number;
  submittedAt?: string;
  updatedAt: string;
};

export const returnId = (clientId: string, year: number) => `tr_${clientId}_${year}`;

/** Years a client can file for: the last four completed tax years. */
// Filing years and submit dates come from the Tax season settings.
export { filingYears } from "./tax-season";

const META = (sql: ReturnType<typeof db>) => sql;

export async function listClientReturns(clientId: string): Promise<TaxReturnRow[]> {
  const rows = await META(db())`
    SELECT id, client_id AS "clientId", tax_year AS "taxYear", status, current_step AS "currentStep",
           to_char(submitted_at AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD HH24:MI') AS "submittedAt",
           to_char(updated_at AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD HH24:MI') AS "updatedAt"
    FROM tax_returns WHERE client_id = ${clientId} ORDER BY tax_year DESC`;
  return rows as TaxReturnRow[];
}

export async function getClientReturn(clientId: string, year: number) {
  const [row] = await db()`
    SELECT id, status, current_step AS "currentStep", data,
           to_char(submitted_at AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD HH24:MI') AS "submittedAt"
    FROM tax_returns WHERE client_id = ${clientId} AND tax_year = ${year}`;
  if (!row) return null;
  return {
    id: row.id as string,
    status: row.status as TaxReturnStatus,
    currentStep: Number(row.currentStep),
    submittedAt: row.submittedAt as string | undefined,
    data: normalizeReturn(decryptJson<TaxReturnData>(row.data)),
  };
}

export async function saveReturn(clientId: string, year: number, data: TaxReturnData, step: number, status: TaxReturnStatus) {
  const id = returnId(clientId, year);
  const blob = encryptJson(data);
  await db()`
    INSERT INTO tax_returns (id, client_id, tax_year, status, current_step, data, submitted_at)
    VALUES (${id}, ${clientId}, ${year}, ${status}, ${step}, ${blob}, ${status === "submitted" ? new Date().toISOString() : null})
    ON CONFLICT (client_id, tax_year) DO UPDATE SET
      status = EXCLUDED.status, current_step = EXCLUDED.current_step, data = EXCLUDED.data,
      submitted_at = COALESCE(EXCLUDED.submitted_at, tax_returns.submitted_at), updated_at = now()`;
  return id;
}

export async function currentStatus(clientId: string, year: number): Promise<TaxReturnStatus | null> {
  const [row] = await db()`SELECT status FROM tax_returns WHERE client_id = ${clientId} AND tax_year = ${year}`;
  return (row?.status as TaxReturnStatus) ?? null;
}

// ── Studio ────────────────────────────────────────────────────────────

export type StudioReturnRow = TaxReturnRow & { clientName: string; company: string; email: string };

export async function listAllReturns(): Promise<StudioReturnRow[]> {
  const rows = await db()`
    SELECT t.id, t.client_id AS "clientId", t.tax_year AS "taxYear", t.status, t.current_step AS "currentStep",
           to_char(t.submitted_at AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD HH24:MI') AS "submittedAt",
           to_char(t.updated_at AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD HH24:MI') AS "updatedAt",
           c.name AS "clientName", c.company, c.email
    FROM tax_returns t JOIN clients c ON c.id = t.client_id
    ORDER BY (t.status = 'draft'), t.submitted_at DESC NULLS LAST, t.updated_at DESC`;
  return rows.map((r) => ({ ...r, submittedAt: r.submittedAt ?? undefined })) as StudioReturnRow[];
}

export async function getReturnById(id: string) {
  const [row] = await db()`
    SELECT t.id, t.client_id AS "clientId", t.tax_year AS "taxYear", t.status, t.current_step AS "currentStep", t.data,
           to_char(t.submitted_at AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD HH24:MI') AS "submittedAt",
           to_char(t.updated_at AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD HH24:MI') AS "updatedAt",
           c.name AS "clientName", c.company, c.email
    FROM tax_returns t JOIN clients c ON c.id = t.client_id WHERE t.id = ${id}`;
  if (!row) return null;
  return { ...(row as StudioReturnRow), submittedAt: row.submittedAt ?? undefined, data: normalizeReturn(decryptJson<TaxReturnData>(row.data)) };
}
