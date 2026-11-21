"use client";

import { BadgeCheck, BellRing } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Card, PageHeader, Stat } from "@/components/portal/Shell";
import { DataTable, columnsFor, facetFilter } from "@/components/table/DataTable";
import { Badge, Button, formatDate, statusTone, IconButton } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";
import type { Job } from "@/lib/types";

type Row = Job & { client: string };
const h = columnsFor<Row>();
const reviewUrl = "https://g.page/r/adept-bookkeeping-review";

export default function ReputationPage() {
  const { clients, jobs, completeJob, remindReview } = useApp();

  const rows = useMemo<Row[]>(
    () =>
      jobs.map((j) => {
        const c = clients.find((c) => c.id === j.clientId);
        return { ...j, client: c?.company || c?.name || "—" };
      }),
    [jobs, clients],
  );

  const columns = useMemo(
    () =>
      h.columns([
        h.accessor("title", { header: "Job", meta: { label: "Job" }, cell: (c) => <span className="block min-w-48 font-medium text-navy">{c.getValue()}</span> }),
        h.accessor("client", {
          header: "Client",
          meta: { label: "Client" },
          cell: ({ row }) => (
            <Link href={`/studio/clients/${row.original.clientId}`} className="text-navy hover:text-gold-deep">
              {row.original.client}
            </Link>
          ),
        }),
        h.accessor("status", { header: "Job status", meta: { label: "Job status" }, filterFn: facetFilter, cell: (c) => <Badge tone={statusTone(c.getValue())}>{c.getValue()}</Badge> }),
        h.accessor("completedAt", {
          header: "Completed",
          meta: { label: "Completed", className: "whitespace-nowrap" },
          cell: (c) => <span className="text-muted">{formatDate(c.getValue()) || "—"}</span>,
        }),
        h.accessor("reviewStatus", {
          header: "Review",
          meta: { label: "Review" },
          filterFn: facetFilter,
          cell: (c) => <Badge tone={c.getValue() === "idle" ? "neutral" : statusTone(c.getValue())}>{c.getValue() === "idle" ? "not asked" : c.getValue()}</Badge>,
        }),
        h.accessor("reminders", { header: "Messages", meta: { label: "Messages sent", align: "end" } }),
        h.display({
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          meta: { className: "w-px whitespace-nowrap", align: "end" },
          cell: ({ row }) =>
            row.original.status !== "completed" ? (
              <IconButton tone="primary" label="Complete job and send thank-you" onClick={() => completeJob(row.original.id)}>
                <BadgeCheck className="h-4 w-4" />
              </IconButton>
            ) : row.original.reviewStatus !== "left review" ? (
              <IconButton label="Send review reminder" onClick={() => remindReview(row.original.id)}>
                <BellRing className="h-4 w-4" />
              </IconButton>
            ) : (
              <span className="text-xs text-success">Review received</span>
            ),
        }),
      ]),
    [completeJob, remindReview],
  );

  const completed = jobs.filter((j) => j.status === "completed");

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Reputation"
        title="Reviews"
        description="Completing a job sends a thank-you with the Google review link. Send a reminder or two until the review lands."
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Review asks sent" value={completed.length} />
        <Stat label="Reviews received" value={jobs.filter((j) => j.reviewStatus === "left review").length} />
        <Stat label="Reminders sent" value={jobs.reduce((n, j) => n + j.reminders, 0)} />
        <Stat label="Jobs to complete" value={jobs.length - completed.length} />
      </div>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        searchPlaceholder="Search jobs or clients…"
        facets={[
          { column: "status", label: "Job status" },
          { column: "reviewStatus", label: "Review" },
        ]}
        initialSorting={[{ id: "completedAt", desc: true }]}
        exportFileName="reviews"
        emptyTitle="No jobs yet"
        emptyBody="Add jobs from a client folder; completing one sends the review request."
        bulkActions={(selected, clear) => (
          <>
            <Button
              size="sm"
              variant="gold"
              onClick={() => {
                selected.filter((j) => j.status !== "completed").forEach((j) => completeJob(j.id));
                clear();
              }}
            >
              Complete and thank
            </Button>
            <Button
              size="sm"
              variant="light"
              onClick={() => {
                selected.filter((j) => j.status === "completed" && j.reviewStatus !== "left review").forEach((j) => remindReview(j.id));
                clear();
              }}
            >
              Send reminders
            </Button>
          </>
        )}
      />
      <Card title="Message clients receive">
        <p className="rounded-2xl bg-sand p-4 text-sm leading-relaxed text-ink/85">
          “Thank you for trusting Adept. If we made tax season lighter, a quick Google review helps other Saskatchewan businesses
          find us.”
        </p>
        <p className="mt-3 text-xs break-all text-muted">{reviewUrl}</p>
      </Card>
    </div>
  );
}
