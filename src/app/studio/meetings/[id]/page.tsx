"use client";

import { use, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { Card, PageHeader, Status } from "@/components/portal/Shell";
import { Button, ButtonLink, Textarea, formatWhen } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";

export default function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { appointments, completeMeeting, cancelMeeting } = useApp();
  const apt = appointments.find((row) => row.id === id);
  const [summary, setSummary] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const draft = useMemo(
    () =>
      apt
        ? `Hi ${apt.name.split(" ")[0]},\n\nThank you for meeting with Adept on ${formatWhen(apt.date)} about ${apt.topic.toLowerCase()}.\n\n${
            apt.summary || summary || "[Summary of what we discussed and agreed next steps]"
          }\n\nYou can find next steps and upload any documents in your client portal.\n\nBest regards,\nAdept Bookkeeping Services`
        : "",
    [apt, summary],
  );
  if (!apt) notFound();

  const live = apt.status === "scheduled";

  return (
    <div className="grid gap-6">
      <PageHeader
        back={{ href: "/studio/calendar", label: "Calendar" }}
        title={apt.topic}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Status value={apt.status} />
            <span>{apt.name}</span>
            <span>{formatWhen(apt.date, apt.time)}</span>
            {apt.duration ? <span>{apt.duration} min</span> : null}
          </span>
        }
        actions={
          live ? (
            <>
              <ButtonLink href={apt.meetingUrl} target="_blank" rel="noreferrer" size="sm">
                Join video call
              </ButtonLink>
              {confirmCancel ? (
                <Button size="sm" variant="danger" onClick={() => cancelMeeting(apt.id)}>
                  Confirm cancel
                </Button>
              ) : (
                <Button size="sm" variant="soft" onClick={() => setConfirmCancel(true)}>
                  Cancel meeting
                </Button>
              )}
            </>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card title="Meeting details">
          <dl className="grid gap-4 text-sm">
            {[
              ["With", `${apt.name} · ${apt.email}`],
              ["When", `${formatWhen(apt.date, apt.time)} (Calgary time)`],
              ["Video link", apt.meetingUrl],
              ["Booked via", apt.calUid ? "Cal.com" : "Adept"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="mt-0.5 break-all text-navy">{v}</dd>
              </div>
            ))}
          </dl>
          {apt.calUid && live ? (
            <p className="mt-5 rounded-2xl bg-paper px-4 py-3 text-xs leading-relaxed text-muted">
              Cancelling here also cancels the Cal.com booking and notifies {apt.name.split(" ")[0]}.
            </p>
          ) : null}
        </Card>

        <Card title="Notes and recap" description="Capture the outcome, then copy the recap into an email.">
          {apt.summary ? (
            <p className="rounded-2xl bg-paper p-4 leading-relaxed text-ink/85">{apt.summary}</p>
          ) : apt.status === "cancelled" ? (
            <p className="text-sm text-muted">This meeting was cancelled.</p>
          ) : (
            <>
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} placeholder="What was discussed, decisions, and next steps…" />
              <Button className="mt-3" size="sm" disabled={!summary.trim()} onClick={() => completeMeeting(apt.id, summary.trim())}>
                Save notes and mark complete
              </Button>
            </>
          )}
          <pre className="mt-6 rounded-2xl bg-sand p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-ink/85">{draft}</pre>
          <Button
            size="sm"
            variant="soft"
            className="mt-3"
            onClick={() => {
              void navigator.clipboard.writeText(draft);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied" : "Copy recap email"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
