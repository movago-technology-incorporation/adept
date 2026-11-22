"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Eye } from "lucide-react";
import { DataTable, columnsFor, facetFilter } from "@/components/table/DataTable";
import { Badge, IconButton } from "@/components/ui/kit";
import type { StudioReturnRow } from "@/lib/tax-return-server";

export const RETURN_STATUS = {
  draft: { label: "Client drafting", tone: "neutral" },
  submitted: { label: "Todo", tone: "warn" },
  in_progress: { label: "In progress", tone: "gold" },
  done: { label: "Done", tone: "success" },
} as const;

type Row = StudioReturnRow & { statusLabel: string; client: string; year: string };
const h = columnsFor<Row>();

export function TaxReturnsTable({ rows }: { rows: StudioReturnRow[] }) {
  const router = useRouter();
  const data = useMemo<Row[]>(
    () => rows.map((r) => ({ ...r, statusLabel: RETURN_STATUS[r.status].label, client: r.company || r.clientName, year: String(r.taxYear) })),
    [rows],
  );
  const columns = useMemo(
    () =>
      h.columns([
        h.accessor("client", {
          header: "Client",
          meta: { label: "Client" },
          cell: ({ row }) => (
            <span className="block min-w-48">
              <Link href={`/studio/tax-returns/${row.original.id}`} className="font-medium text-navy hover:text-gold-deep">
                {row.original.clientName}
              </Link>
              <span className="block text-xs text-muted">{row.original.company || row.original.email}</span>
            </span>
          ),
        }),
        h.accessor("year", { header: "Tax year", meta: { label: "Tax year" }, filterFn: facetFilter }),
        h.accessor("statusLabel", {
          header: "Status",
          meta: { label: "Status" },
          filterFn: facetFilter,
          cell: ({ row }) => <Badge tone={RETURN_STATUS[row.original.status].tone}>{row.original.statusLabel}</Badge>,
        }),
        h.accessor("submittedAt", { header: "Submitted", meta: { label: "Submitted", className: "whitespace-nowrap" }, cell: (c) => <span className="text-muted">{c.getValue() ?? "—"}</span> }),
        h.accessor("updatedAt", { header: "Last updated", meta: { label: "Last updated", className: "whitespace-nowrap" }, cell: (c) => <span className="text-muted">{c.getValue()}</span> }),
        h.display({
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          meta: { className: "w-px", align: "end" },
          cell: ({ row }) => (
            <IconButton label="Open return" onClick={() => router.push(`/studio/tax-returns/${row.original.id}`)}>
              <Eye className="h-4 w-4" />
            </IconButton>
          ),
        }),
      ]),
    [router],
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      searchPlaceholder="Search clients…"
      facets={[
        { column: "statusLabel", label: "Status" },
        { column: "year", label: "Tax year" },
      ]}
      onRowClick={(r) => router.push(`/studio/tax-returns/${r.id}`)}
      exportFileName="tax-returns"
      emptyTitle="No tax returns yet"
      emptyBody="Returns appear here as clients start and submit their questionnaire in the portal."
    />
  );
}
