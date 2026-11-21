"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, PageHeader, Status } from "@/components/portal/Shell";
import { AddButton } from "@/components/studio/Modal";
import { MeetingModal } from "@/components/studio/MeetingModal";
import { MonthCalendar } from "@/components/studio/MonthCalendar";
import { todayIso } from "@/components/ui/Dropdown";
import { EmptyState, cx, formatWhen } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";

export default function CalendarPage() {
  const { appointments } = useApp();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const today = todayIso();

  const list = appointments
    .filter((a) => (tab === "upcoming" ? a.date >= today && a.status === "scheduled" : a.date < today || a.status !== "scheduled"))
    .sort((a, b) => (tab === "upcoming" ? 1 : -1) * `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Delivery"
        title="Calendar"
        description="Synced with Cal.com — bookings made on the website or directly on cal.com show up here."
        actions={<AddButton onClick={() => setOpen(true)}>Schedule meeting</AddButton>}
      />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <MonthCalendar onAdd={() => setOpen(true)} />
        </Card>
        <Card
          title="Meetings"
          action={
            <div className="flex gap-1 rounded-full bg-paper p-1 text-sm">
              {(["upcoming", "past"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cx("rounded-full px-3 py-1 capitalize", tab === t ? "bg-navy text-white" : "text-navy")}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        >
          {list.length === 0 ? (
            <EmptyState title={tab === "upcoming" ? "Nothing scheduled" : "No past meetings"} />
          ) : (
            <ul className="grid gap-2">
              {list.map((apt) => (
                <li key={apt.id}>
                  <Link href={`/studio/meetings/${apt.id}`} className="block rounded-2xl bg-paper px-4 py-3.5 transition-colors hover:bg-sand">
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-medium text-navy">{apt.topic}</span>
                      <Status value={apt.status} />
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {apt.name} · {formatWhen(apt.date, apt.time)}
                      {apt.duration ? ` · ${apt.duration} min` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <MeetingModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
