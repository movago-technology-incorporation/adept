"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader, Stat } from "@/components/portal/Shell";
import { AddButton } from "@/components/studio/Modal";
import { ProposalModal } from "@/components/studio/ProposalModal";
import { DataTable, columnsFor, facetFilter } from "@/components/table/DataTable";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Dropdown } from "@/components/ui/Dropdown";
import {formatDate, IconButton } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";
import type { Proposal, ProposalStatus } from "@/lib/types";

type Row = Proposal & { who: string; whoHref: string; kind: "Lead" | "Client" };
const h = columnsFor<Row>();
const STATUSES: ProposalStatus[] = ["draft", "sent", "viewed", "accepted", "declined"];

export default function ProposalsPage() {
  const { proposals, leads, clients, updateLead, updateProposal, deleteProposal } = useApp();
  const [modal, setModal] = useState<{ item?: Proposal } | null>(null);

  const rows = useMemo<Row[]>(
    () =>
      proposals.map((p) => {
        const lead = p.leadId ? leads.find((l) => l.id === p.leadId) : undefined;
        const client = p.clientId ? clients.find((c) => c.id === p.clientId) : undefined;
        return {
          ...p,
          kind: client ? "Client" : "Lead",
          who: client ? client.company || client.name : (lead?.name ?? "—"),
          whoHref: client ? `/studio/clients/${client.id}` : lead ? `/studio/leads/${lead.id}` : "#",
        };
      }),
    [proposals, leads, clients],
  );

  const columns = useMemo(() => {
    const setStatus = (p: Row, status: ProposalStatus) => {
      const today = new Date().toISOString().slice(0, 10);
      updateProposal(p.id, {
        status,
        ...(status === "sent" && !p.sentAt ? { sentAt: today } : {}),
        ...(status === "accepted" && !p.acceptedAt ? { acceptedAt: today } : {}),
      });
      if (p.leadId && status === "sent") updateLead(p.leadId, { status: "proposal sent" });
      if (p.leadId && status === "accepted") updateLead(p.leadId, { status: "won" });
    };
    return h.columns([
      h.accessor("title", {
        header: "Proposal",
        meta: { label: "Title" },
        cell: (c) => <span className="block min-w-52 font-medium text-navy">{c.getValue()}</span>,
      }),
      h.accessor("who", {
        header: "For",
        meta: { label: "For" },
        cell: ({ row }) => (
          <Link href={row.original.whoHref} className="text-navy hover:text-gold-deep">
            {row.original.who}
          </Link>
        ),
      }),
      h.accessor("kind", { header: "Type", meta: { label: "Type" }, filterFn: facetFilter, cell: (c) => <span className="text-muted">{c.getValue()}</span> }),
      h.accessor("amount", { header: "Fee", meta: { label: "Fee", className: "whitespace-nowrap" } }),
      h.accessor("sentAt", { header: "Sent", meta: { label: "Sent", className: "whitespace-nowrap" }, cell: (c) => <span className="text-muted">{formatDate(c.getValue()) || "—"}</span> }),
      h.accessor("acceptedAt", {
        header: "Accepted",
        meta: { label: "Accepted", className: "whitespace-nowrap" },
        cell: (c) => <span className="text-muted">{formatDate(c.getValue()) || "—"}</span>,
      }),
      h.accessor("status", {
        header: "Status",
        meta: { label: "Status", className: "w-44" },
        filterFn: facetFilter,
        cell: ({ row }) => (
          <Dropdown
            value={row.original.status}
            ariaLabel={`Status for ${row.original.title}`}
            className="bg-white py-1.5 text-sm"
            onChange={(s) => setStatus(row.original, s as ProposalStatus)}
            options={STATUSES.map((v) => ({ value: v, label: v }))}
          />
        ),
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
            <ConfirmButton onConfirm={() => deleteProposal(row.original.id)} confirmLabel="Delete" label="Delete" />
          </span>
        ),
      }),
    ]);
  }, [updateProposal, updateLead, deleteProposal]);

  const count = (...s: ProposalStatus[]) => proposals.filter((p) => s.includes(p.status)).length;
  const decided = count("accepted", "declined");

  return (
    <>
      <PageHeader
        eyebrow="Delivery"
        title="Proposals"
        description="Draft, send and close engagement proposals."
        actions={<AddButton onClick={() => setModal({})}>New proposal</AddButton>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Drafts" value={count("draft")} />
        <Stat label="Awaiting answer" value={count("sent", "viewed")} />
        <Stat label="Accepted" value={count("accepted")} />
        <Stat label="Acceptance rate" value={decided ? `${Math.round((count("accepted") / decided) * 100)}%` : "—"} />
      </div>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        searchPlaceholder="Search proposals…"
        facets={[
          { column: "status", label: "Status" },
          { column: "kind", label: "Type" },
        ]}
        initialSorting={[{ id: "sentAt", desc: true }]}
        onRowClick={(r) => setModal({ item: r })}
        exportFileName="proposals"
        emptyTitle="No proposals yet"
        emptyAction={<AddButton onClick={() => setModal({})}>New proposal</AddButton>}
        bulkActions={(selected, clear) => (
          <>
            <span className="w-44">
              <Dropdown
                ariaLabel="Set status for selected"
                defaultValue=""
                className="h-8 bg-white/10 py-1 text-sm text-white"
                options={[{ value: "", label: "Set status…" }, ...STATUSES.map((v) => ({ value: v, label: v }))]}
                onChange={(s) => {
                  if (!s) return;
                  selected.forEach((p) => updateProposal(p.id, { status: s as ProposalStatus }));
                  clear();
                }}
              />
            </span>
            <ConfirmButton
              tone="light" size="sm"
              confirmLabel={`Delete ${selected.length}`}
              onConfirm={() => {
                selected.forEach((p) => deleteProposal(p.id));
                clear();
              }} label="Delete" />
          </>
        )}
      />
      <ProposalModal open={modal !== null} onClose={() => setModal(null)} item={modal?.item} />
    </>
  );
}
