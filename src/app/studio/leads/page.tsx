"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader, Stat } from "@/components/portal/Shell";
import { AddButton } from "@/components/studio/Modal";
import { LeadModal } from "@/components/studio/LeadModal";
import { MeetingModal } from "@/components/studio/MeetingModal";
import { DataTable, columnsFor, facetFilter } from "@/components/table/DataTable";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Dropdown } from "@/components/ui/Dropdown";
import {formatDate, IconButton } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUSES: LeadStatus[] = ["new", "engaged", "consult booked", "proposal sent", "won", "lost"];
const h = columnsFor<Lead>();

export default function LeadsPage() {
  const router = useRouter();
  const { leads, updateLead, deleteLead } = useApp();
  const [modal, setModal] = useState<null | { item?: Lead } | "meeting">(null);

  const columns = useMemo(
    () =>
      h.columns([
        h.accessor("name", {
          header: "Name",
          meta: { label: "Name" },
          cell: ({ row }) => (
            <span className="block min-w-44">
              <Link href={`/studio/leads/${row.original.id}`} className="font-medium text-navy hover:text-gold-deep">
                {row.original.name}
              </Link>
              <span className="block truncate text-xs text-muted">{row.original.company || row.original.email}</span>
            </span>
          ),
        }),
        h.accessor("email", { header: "Email", meta: { label: "Email" }, cell: (c) => <span className="text-muted">{c.getValue()}</span> }),
        h.accessor("phone", { header: "Phone", meta: { label: "Phone" }, enableSorting: false, cell: (c) => <span className="whitespace-nowrap text-muted">{c.getValue() || "—"}</span> }),
        h.accessor("interest", { header: "Interest", meta: { label: "Interest" }, filterFn: facetFilter }),
        h.accessor("source", { header: "Source", meta: { label: "Source" }, filterFn: facetFilter, cell: (c) => <span className="text-muted">{c.getValue()}</span> }),
        h.accessor("createdAt", {
          header: "Added",
          meta: { label: "Added", className: "whitespace-nowrap" },
          sortFn: "datetime",
          cell: (c) => <span className="text-muted">{formatDate(c.getValue())}</span>,
        }),
        h.accessor("status", {
          header: "Status",
          meta: { label: "Status", className: "w-48" },
          filterFn: facetFilter,
          cell: ({ row }) => (
            <Dropdown
              value={row.original.status}
              ariaLabel={`Status for ${row.original.name}`}
              className="bg-white py-1.5 text-sm"
              onChange={(status) => updateLead(row.original.id, { status: status as LeadStatus })}
              options={STATUSES.map((value) => ({ value, label: value }))}
            />
          ),
        }),
        h.display({
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          meta: { className: "w-px whitespace-nowrap", align: "end" },
          cell: ({ row }) => (
            <span className="flex justify-end gap-1 opacity-70 group-hover:opacity-100">
              <IconButton label="Edit" onClick={() => setModal({ item: row.original })}>
<Pencil className="h-4 w-4" />
</IconButton>
              <ConfirmButton onConfirm={() => deleteLead(row.original.id)} confirmLabel="Delete" label="Delete" />
            </span>
          ),
        }),
      ]),
    [updateLead, deleteLead],
  );

  const open = leads.filter((l) => l.status !== "won" && l.status !== "lost");
  const [week] = useState(() => new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10));

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Leads"
        description="Every enquiry from the website, scheduler and referrals."
        actions={
          <>
            <AddButton onClick={() => setModal({})}>Add lead</AddButton>
            <AddButton variant="soft" onClick={() => setModal("meeting")}>
              Book consult
            </AddButton>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Open leads" value={open.length} />
        <Stat label="New this week" value={leads.filter((l) => l.createdAt >= week).length} />
        <Stat label="Consults booked" value={leads.filter((l) => l.status === "consult booked").length} />
        <Stat label="Won" value={leads.filter((l) => l.status === "won").length} />
      </div>

      <DataTable
        data={leads}
        columns={columns}
        getRowId={(l) => l.id}
        searchPlaceholder="Search name, email, company…"
        facets={[
          { column: "status", label: "Status" },
          { column: "source", label: "Source" },
          { column: "interest", label: "Interest" },
        ]}
        initialSorting={[{ id: "createdAt", desc: true }]}
        initialHidden={{ email: false, phone: false }}
        onRowClick={(l) => router.push(`/studio/leads/${l.id}`)}
        exportFileName="leads"
        emptyTitle="No leads yet"
        emptyBody="Website enquiries, bookings and filing requests appear here automatically."
        bulkActions={(rows, clear) => (
          <>
            <span className="w-44">
              <Dropdown
                ariaLabel="Set status for selected"
                defaultValue=""
                className="h-8 bg-white/10 py-1 text-sm text-white"
                options={[{ value: "", label: "Set status…" }, ...STATUSES.map((v) => ({ value: v, label: v }))]}
                onChange={(status) => {
                  if (!status) return;
                  rows.forEach((r) => updateLead(r.id, { status: status as LeadStatus }));
                  clear();
                }}
              />
            </span>
            <ConfirmButton
              tone="light" size="sm"
              confirmLabel={`Delete ${rows.length}`}
              onConfirm={() => {
                rows.forEach((r) => deleteLead(r.id));
                clear();
              }} label="Delete" />
          </>
        )}
      />

      <LeadModal open={modal !== null && modal !== "meeting"} onClose={() => setModal(null)} item={modal && modal !== "meeting" ? modal.item : undefined} />
      <MeetingModal open={modal === "meeting"} onClose={() => setModal(null)} />
    </>
  );
}
