import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/auth/viewer";

/** Staff-only Excel export of clients (and website leads) for email marketing. */
export async function GET() {
  const viewer = await getViewer();
  if (viewer?.role !== "staff") return new Response("Staff only", { status: 403 });

  const [clients, leads] = await Promise.all([
    db()`
      SELECT c.name, c.company, c.email, c.phone, c.type, c.since,
             CASE WHEN c.portal_user_id IS NOT NULL THEN 'Active'
                  WHEN EXISTS (SELECT 1 FROM portal_invites i WHERE i.client_id = c.id AND i.used_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > now()) THEN 'Invited'
                  ELSE 'Not invited' END AS portal
      FROM clients c ORDER BY lower(c.name)`,
    db()`SELECT name, company, email, phone, interest, source, status, created_at AS "createdAt" FROM leads ORDER BY created_at DESC`,
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Adept Bookkeeping and Tax Services";
  const sheet = (name: string, columns: { header: string; key: string; width: number }[], rows: Record<string, unknown>[]) => {
    const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = columns;
    ws.addRows(rows);
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B1A2E" } };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  };
  const split = (full: string) => {
    const [first, ...rest] = String(full ?? "").trim().split(/\s+/);
    return { first: first ?? "", last: rest.join(" ") };
  };
  const day = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : "");

  sheet(
    "Clients",
    [
      { header: "First name", key: "first", width: 16 },
      { header: "Last name", key: "last", width: 18 },
      { header: "Email", key: "email", width: 34 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Business", key: "company", width: 28 },
      { header: "Type", key: "type", width: 16 },
      { header: "Client since", key: "since", width: 14 },
      { header: "Portal", key: "portal", width: 12 },
    ],
    clients.map((c) => ({ ...split(c.name), email: c.email, phone: c.phone, company: c.company, type: c.type, since: day(c.since), portal: c.portal })),
  );
  sheet(
    "Website leads",
    [
      { header: "First name", key: "first", width: 16 },
      { header: "Last name", key: "last", width: 18 },
      { header: "Email", key: "email", width: 34 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Business", key: "company", width: 28 },
      { header: "Interested in", key: "interest", width: 26 },
      { header: "Source", key: "source", width: 16 },
      { header: "Status", key: "status", width: 16 },
      { header: "Received", key: "createdAt", width: 14 },
    ],
    leads.map((l) => ({ ...split(l.name), email: l.email, phone: l.phone, company: l.company, interest: l.interest, source: l.source, status: l.status, createdAt: day(l.createdAt) })),
  );

  const buf = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="adept-clients-${stamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
