"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Forward, RotateCw } from "lucide-react";
import { PageHeader, Stat } from "@/components/portal/Shell";
import { composeHref } from "@/lib/email-recipients";
import { useRouter } from "next/navigation";
import { AddButton, Modal } from "@/components/studio/Modal";
import { DataTable, columnsFor, facetFilter } from "@/components/table/DataTable";
import { Badge, IconButton } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";
import type { EmailRecipient } from "@/lib/email-recipients";
import type { StaffEmail } from "@/lib/types";

const h = columnsFor<StaffEmail & { kind: string }>();
const when = (s: string) =>
  new Date(s.replace(" ", "T")).toLocaleString("en-CA", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function StudioEmailPage() {
  const { staffEmails } = useApp();
  const router = useRouter();
  const [viewing, setViewing] = useState<StaffEmail | null>(null);

  const rows = useMemo(() => staffEmails.map((e) => ({ ...e, kind: e.clientId ? "Client" : "Lead" })), [staffEmails]);
  const recipientOf = (e: StaffEmail): EmailRecipient[] =>
    e.clientId ? [{ kind: "client", id: e.clientId }] : e.leadId ? [{ kind: "lead", id: e.leadId }] : [];

  const columns = useMemo(
    () =>
      h.columns([
        h.accessor("subject", {
          header: "Subject",
          meta: { label: "Subject" },
          cell: ({ row }) => (
            <span className="block max-w-md min-w-56">
              <span className="block truncate font-medium text-navy">{row.original.subject}</span>
              {row.original.error ? <span className="block truncate text-xs text-danger">{row.original.error}</span> : null}
            </span>
          ),
        }),
        h.accessor("toName", {
          header: "To",
          meta: { label: "To" },
          cell: ({ row }) => {
            const e = row.original;
            const href = e.clientId ? `/studio/clients/${e.clientId}` : e.leadId ? `/studio/leads/${e.leadId}` : null;
            return (
              <span className="block">
                {href ? (
                  <Link href={href} className="text-navy hover:text-gold-deep">
                    {e.toName}
                  </Link>
                ) : (
                  <span className="text-navy">{e.toName}</span>
                )}
                <span className="block text-xs text-muted">{e.toEmail}</span>
              </span>
            );
          },
        }),
        h.accessor("kind", { header: "Type", meta: { label: "Type" }, filterFn: facetFilter, cell: (c) => <Badge>{c.getValue()}</Badge> }),
        h.accessor("status", {
          header: "Status",
          meta: { label: "Status" },
          filterFn: facetFilter,
          cell: (c) => <Badge tone={c.getValue() === "sent" ? "success" : "danger"}>{c.getValue()}</Badge>,
        }),
        h.accessor("sentBy", { header: "Sent by", meta: { label: "Sent by" }, filterFn: facetFilter, cell: (c) => <span className="text-muted">{c.getValue()}</span> }),
        h.accessor("createdAt", { header: "Sent", meta: { label: "Sent", className: "whitespace-nowrap" }, cell: (c) => <span className="text-muted">{when(c.getValue())}</span> }),
        h.display({
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          meta: { className: "w-px whitespace-nowrap", align: "end" },
          cell: ({ row }) => (
            <span className="flex justify-end gap-0.5">
              <IconButton label="View email" onClick={() => setViewing(row.original)}>
                <Eye className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={row.original.status === "failed" ? "Try again" : "Email again"}
                onClick={() => router.push(composeHref(recipientOf(row.original)))}
              >
                {row.original.status === "failed" ? <RotateCw className="h-4 w-4" /> : <Forward className="h-4 w-4" />}
              </IconButton>
            </span>
          ),
        }),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const month = new Date().toISOString().slice(0, 7);
  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Email"
        description="Write to clients and leads in the Adept email design. Replies come straight to your inbox."
        actions={<AddButton onClick={() => router.push(composeHref())}>New email</AddButton>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Sent this month" value={staffEmails.filter((e) => e.status === "sent" && e.createdAt.startsWith(month)).length} />
        <Stat label="All time" value={staffEmails.filter((e) => e.status === "sent").length} />
        <Stat label="People emailed" value={new Set(staffEmails.map((e) => e.toEmail.toLowerCase())).size} />
        <Stat label="Failed" value={staffEmails.filter((e) => e.status === "failed").length} />
      </div>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(e) => e.id}
        searchPlaceholder="Search subject or recipient…"
        facets={[
          { column: "status", label: "Status" },
          { column: "kind", label: "Type" },
          { column: "sentBy", label: "Sent by" },
        ]}
        initialSorting={[{ id: "createdAt", desc: true }]}
        onRowClick={(e) => setViewing(e)}
        exportFileName="emails"
        emptyTitle="No emails sent yet"
        emptyBody="Write your first email to a client or lead."
        emptyAction={<AddButton onClick={() => router.push(composeHref())}>New email</AddButton>}
      />

      <Modal open={viewing !== null} title={viewing?.subject ?? ""} description={viewing ? `To ${viewing.toName} <${viewing.toEmail}> · ${when(viewing.createdAt)} · by ${viewing.sentBy}` : undefined} onClose={() => setViewing(null)} size="lg">
        {viewing ? (
          <>
            {viewing.error ? <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{viewing.error}</p> : null}
            {/* Stored HTML was sanitized server-side before sending. */}
            <div className="rte rounded-2xl bg-paper p-6 text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: viewing.html }} />
          </>
        ) : null}
      </Modal>
    </>
  );
}
