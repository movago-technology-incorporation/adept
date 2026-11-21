"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader, Stat } from "@/components/portal/Shell";
import { ClientModal } from "@/components/studio/ClientModal";
import { AddButton } from "@/components/studio/Modal";
import { DataTable, columnsFor, facetFilter } from "@/components/table/DataTable";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import {Badge, formatDate, IconButton } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";
import type { Client } from "@/lib/types";

type Row = Client & { files: number; activeJobs: number; outstanding: number; display: string };
const h = columnsFor<Row>();

export default function ClientsPage() {
  const router = useRouter();
  const { clients, documents, jobs, forms, deleteClient } = useApp();
  const [modal, setModal] = useState<{ item?: Client } | null>(null);

  const rows = useMemo<Row[]>(
    () =>
      clients.map((c) => ({
        ...c,
        display: c.company || c.name,
        files: documents.filter((d) => d.clientId === c.id).length,
        activeJobs: jobs.filter((j) => j.clientId === c.id && j.status !== "completed").length,
        outstanding: forms.filter((f) => f.clientId === c.id && f.status !== "completed").length,
      })),
    [clients, documents, jobs, forms],
  );

  const columns = useMemo(
    () =>
      h.columns([
        h.accessor("display", {
          header: "Client",
          meta: { label: "Client" },
          cell: ({ row }) => (
            <span className="flex min-w-52 items-center gap-3">
              <span className="serif grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy text-base font-semibold text-gold-soft">
                {row.original.display.slice(0, 1)}
              </span>
              <span className="min-w-0">
                <Link href={`/studio/clients/${row.original.id}`} className="block truncate font-medium text-navy hover:text-gold-deep">
                  {row.original.display}
                </Link>
                <span className="block truncate text-xs text-muted">{row.original.company ? row.original.name : row.original.email}</span>
              </span>
            </span>
          ),
        }),
        h.accessor("email", { header: "Email", meta: { label: "Email" }, cell: (c) => <span className="text-muted">{c.getValue()}</span> }),
        h.accessor("phone", {
          header: "Phone",
          meta: { label: "Phone", className: "whitespace-nowrap" },
          enableSorting: false,
          cell: (c) => <span className="text-muted">{c.getValue() || "—"}</span>,
        }),
        h.accessor("type", { header: "Type", meta: { label: "Type" }, filterFn: facetFilter, cell: (c) => <Badge>{c.getValue()}</Badge> }),
        h.accessor("files", { header: "Files", meta: { label: "Files", align: "end" } }),
        h.accessor("activeJobs", {
          header: "Active jobs",
          meta: { label: "Active jobs", align: "end" },
          cell: (c) => (c.getValue() ? <Badge tone="gold">{c.getValue()}</Badge> : <span className="text-muted">0</span>),
        }),
        h.accessor("outstanding", {
          header: "Outstanding",
          meta: { label: "Outstanding", align: "end" },
          cell: (c) => (c.getValue() ? <Badge tone="warn">{c.getValue()}</Badge> : <span className="text-muted">0</span>),
        }),
        h.accessor("since", {
          header: "Client since",
          meta: { label: "Client since", className: "whitespace-nowrap" },
          cell: (c) => <span className="text-muted">{formatDate(c.getValue())}</span>,
        }),
        h.display({
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          meta: { className: "w-px whitespace-nowrap", align: "end" },
          cell: ({ row }) => (
            <span className="flex justify-end gap-1">
              <IconButton label="Edit" onClick={() => setModal({ item: row.original })}>
<Pencil className="h-4 w-4" />
</IconButton>
              <ConfirmButton onConfirm={() => deleteClient(row.original.id)} confirmLabel="Delete client + login" label="Delete" />
            </span>
          ),
        }),
      ]),
    [deleteClient],
  );

  return (
    <>
      <PageHeader
        eyebrow="Delivery"
        title="Clients"
        description="Every client folder. New portal sign-ups appear here automatically."
        actions={<AddButton onClick={() => setModal({})}>Add client</AddButton>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Clients" value={clients.length} />
        <Stat label="Corporations" value={clients.filter((c) => c.type === "Corporation").length} />
        <Stat label="With active jobs" value={rows.filter((r) => r.activeJobs).length} />
        <Stat label="Waiting on client" value={rows.filter((r) => r.outstanding).length} />
      </div>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        searchPlaceholder="Search clients…"
        facets={[{ column: "type", label: "Type" }]}
        initialSorting={[{ id: "display", desc: false }]}
        initialHidden={{ phone: false }}
        onRowClick={(r) => router.push(`/studio/clients/${r.id}`)}
        exportFileName="clients"
        emptyTitle="No clients yet"
        emptyAction={<AddButton onClick={() => setModal({})}>Add client</AddButton>}
        bulkActions={(selected, clear) => (
          <ConfirmButton
            tone="light" size="sm"
            confirmLabel={`Delete ${selected.length} clients, files and logins`}
            onConfirm={() => {
              selected.forEach((c) => deleteClient(c.id));
              clear();
            }} label="Delete" />
        )}
      />
      <ClientModal open={modal !== null} onClose={() => setModal(null)} item={modal?.item} />
    </>
  );
}
