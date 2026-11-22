"use client";

import { useState } from "react";
import { Card, PageHeader, Status } from "@/components/portal/Shell";
import { ClientMeetingModal } from "@/components/client/ClientMeetingModal";
import { AddButton } from "@/components/studio/Modal";
import { MonthCalendar } from "@/components/studio/MonthCalendar";
import { todayIso } from "@/components/ui/Dropdown";
import { Button, ButtonLink, EmptyState, formatWhen } from "@/components/ui/kit";
import { useClientWorkspace } from "@/store/app-store";

export default function ClientAppointmentsPage() {
  const { clientAppointments, cancelMeeting } = useClientWorkspace();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const today = todayIso();
  const upcoming = clientAppointments
    .filter((a) => a.status === "scheduled" && a.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const past = clientAppointments.filter((a) => !upcoming.includes(a));

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Work"
        title="Appointments"
        description="Book time with your bookkeeper. Invites and video links are emailed to you."
        actions={<AddButton onClick={() => setOpen(true)}>Book appointment</AddButton>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="grid gap-6 content-start">
          <Card title="Upcoming">
            {upcoming.length === 0 ? (
              <EmptyState title="Nothing booked" action={<AddButton onClick={() => setOpen(true)}>Book a time</AddButton>} />
            ) : (
              <ul className="grid gap-2">
                {upcoming.map((apt) => (
                  <li key={apt.id} className="rounded-2xl bg-paper p-4">
                    <p className="font-medium text-navy">{apt.topic}</p>
                    <p className="text-sm text-muted">{formatWhen(apt.date, apt.time)} · Calgary time</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ButtonLink href={apt.meetingUrl} target="_blank" rel="noreferrer" size="sm">
                        Join call
                      </ButtonLink>
                      {confirm === apt.id ? (
                        <Button size="sm" variant="danger" onClick={() => cancelMeeting(apt.id)}>
                          Confirm cancel
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setConfirm(apt.id)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Past and cancelled">
            {past.length === 0 ? (
              <EmptyState title="No history yet" />
            ) : (
              <ul className="grid gap-2">
                {past.map((apt) => (
                  <li key={apt.id} className="rounded-2xl bg-paper p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-navy">{apt.topic}</p>
                      <Status value={apt.status} />
                    </div>
                    <p className="text-sm text-muted">{formatWhen(apt.date, apt.time)}</p>
                    {apt.summary ? <p className="mt-2 text-sm leading-relaxed text-ink/80">{apt.summary}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Card>
          <MonthCalendar items={clientAppointments} eventHref={() => "/client/appointments"} onAdd={() => setOpen(true)} />
        </Card>
      </div>
      <ClientMeetingModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
