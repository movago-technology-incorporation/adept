"use client";

import { CheckCheck, LoaderCircle, Pencil, RotateCw, Send } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader, Stat } from "@/components/portal/Shell";
import { AddButton } from "@/components/studio/Modal";
import { FollowUpModal } from "@/components/studio/FollowUpModal";
import { DataTable, columnsFor, facetFilter } from "@/components/table/DataTable";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Alert, Badge, Button, IconButton } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";
import type { FollowUp } from "@/lib/types";

type Row = FollowUp & { leadName: string; leadEmail: string; state: string };
const h = columnsFor<Row>();

function firmNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value;
  return `${g("year")}-${g("month")}-${g("day")} ${g("hour")}:${g("minute")}`;
}

const when = (s?: string) =>
  s ? new Date(s.replace(" ", "T")).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

const STATE_TONE = { "due now": "warn", scheduled: "neutral", sending: "gold", sent: "success", failed: "danger", "needs message": "warn" } as const;

export default function FollowUpPage() {
  const { followUps, leads, sendFollowUp, deleteFollowUp } = useApp();
  const [modal, setModal] = useState<{ item?: FollowUp } | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [now] = useState(firmNow);

  const rows = useMemo<Row[]>(
    () =>
      followUps.map((f) => {
        const lead = leads.find((l) => l.id === f.leadId);
        const state =
          f.status === "sent" || f.status === "failed" || f.status === "sending"
            ? f.status
            : f.channel === "email" && !f.body?.trim()
              ? "needs message"
              : f.scheduledFor <= now
                ? "due now"
                : "scheduled";
        return { ...f, leadName: lead?.name ?? "Unknown lead", leadEmail: lead?.email ?? "", state };
      }),
    [followUps, leads, now],
  );

  async function send(f: Row) {
    setNotice(null);
    const result = await sendFollowUp(f.id);
    setNotice(
      result.ok
        ? { tone: "success", text: f.channel === "sms" ? "Marked as done." : `Email sent to ${f.leadEmail}.` }
        : { tone: "danger", text: result.error },
    );
  }

  const columns = useMemo(
    () =>
      h.columns([
        h.accessor("subject", {
          header: "Follow-up",
          meta: { label: "Subject" },
          cell: ({ row }) => (
            <span className="block max-w-md min-w-56">
              <span className="block truncate font-medium text-navy">{row.original.subject}</span>
              <span className="block truncate text-xs text-muted">{row.original.body || "No message yet"}</span>
              {row.original.error ? <span className="mt-1 block truncate text-xs text-danger">{row.original.error}</span> : null}
            </span>
          ),
        }),
        h.accessor("leadName", {
          header: "Lead",
          meta: { label: "Lead" },
          cell: ({ row }) => (
            <span className="block">
              <Link href={`/studio/leads/${row.original.leadId}`} className="text-navy hover:text-gold-deep">
                {row.original.leadName}
              </Link>
              <span className="block text-xs text-muted">{row.original.leadEmail}</span>
            </span>
          ),
        }),
        h.accessor("channel", { header: "Channel", meta: { label: "Channel" }, filterFn: facetFilter, cell: (c) => <Badge>{c.getValue()}</Badge> }),
        h.accessor("scheduledFor", {
          header: "Send at",
          meta: { label: "Send at", className: "whitespace-nowrap" },
          cell: (c) => <span className="text-muted">{when(c.getValue())}</span>,
        }),
        h.accessor("state", {
          header: "Status",
          meta: { label: "Status" },
          filterFn: facetFilter,
          cell: (c) => <Badge tone={STATE_TONE[c.getValue() as keyof typeof STATE_TONE] ?? "neutral"}>{c.getValue()}</Badge>,
        }),
        h.accessor("sentAt", {
          header: "Sent",
          meta: { label: "Sent", className: "whitespace-nowrap" },
          cell: (c) => <span className="text-muted">{when(c.getValue())}</span>,
        }),
        h.display({
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          meta: { className: "w-px whitespace-nowrap", align: "end" },
          cell: ({ row }) => {
            const f = row.original;
            if (f.status === "sent") {
              return (
                <ConfirmButton onConfirm={() => deleteFollowUp(f.id)} confirmLabel="Remove" label="Remove" />
              );
            }
            return (
              <span className="flex justify-end gap-1">
                <IconButton
                  tone="primary"
                  label={f.state === "needs message" ? "Add a message first" : f.channel === "sms" ? "Mark done" : f.status === "failed" ? "Retry now" : "Send now"}
                  onClick={() => send(f)}
                  disabled={f.state === "needs message" || f.status === "sending"}
                >
                  {f.status === "sending" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : f.channel === "sms" ? <CheckCheck className="h-4 w-4" /> : f.status === "failed" ? <RotateCw className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                </IconButton>
                <IconButton label="Edit" onClick={() => setModal({ item: f })}>
<Pencil className="h-4 w-4" />
</IconButton>
                <ConfirmButton onConfirm={() => deleteFollowUp(f.id)} confirmLabel="Delete" label="Delete" />
              </span>
            );
          },
        }),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteFollowUp, sendFollowUp],
  );

  const count = (s: string) => rows.filter((r) => r.state === s).length;

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Follow-up"
        description="Scheduled emails to leads. They go out automatically at the time you set (Calgary time) from your Adept email address."
        actions={<AddButton onClick={() => setModal({})}>Schedule follow-up</AddButton>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Due now" value={count("due now")} />
        <Stat label="Scheduled" value={count("scheduled")} />
        <Stat label="Failed" value={count("failed")} hint={count("needs message") ? `${count("needs message")} need a message` : undefined} />
        <Stat label="Sent" value={count("sent")} />
      </div>

      {notice ? (
        <div className="mb-6">
          <Alert tone={notice.tone}>{notice.text}</Alert>
        </div>
      ) : null}

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        searchPlaceholder="Search subject, lead, message…"
        facets={[
          { column: "state", label: "Status" },
          { column: "channel", label: "Channel" },
        ]}
        initialSorting={[{ id: "scheduledFor", desc: false }]}
        initialHidden={{ channel: false }}
        onRowClick={(r) => r.status !== "sent" && setModal({ item: r })}
        exportFileName="follow-ups"
        emptyTitle="Nothing scheduled"
        emptyBody="Schedule a follow-up to keep a warm lead moving."
        emptyAction={<AddButton onClick={() => setModal({})}>Schedule follow-up</AddButton>}
        bulkActions={(selected, clear) => (
          <>
            <Button
              size="sm"
              variant="gold"
              onClick={async () => {
                const ready = selected.filter((r) => r.status !== "sent" && r.state !== "needs message");
                const results = await Promise.all(ready.map((r) => sendFollowUp(r.id)));
                const failed = results.filter((r) => !r.ok).length;
                setNotice({
                  tone: failed ? "danger" : "success",
                  text: `${results.length - failed} sent${failed ? `, ${failed} failed` : ""}${selected.length > ready.length ? ` · ${selected.length - ready.length} skipped` : ""}.`,
                });
                clear();
              }}
            >
              Send now
            </Button>
            <ConfirmButton
              tone="light" size="sm"
              confirmLabel={`Delete ${selected.length}`}
              onConfirm={() => {
                selected.forEach((r) => deleteFollowUp(r.id));
                clear();
              }} label="Delete" />
          </>
        )}
      />

      <FollowUpModal open={modal !== null} onClose={() => setModal(null)} item={modal?.item} />
    </>
  );
}
