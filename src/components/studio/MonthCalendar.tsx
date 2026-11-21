"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cx } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";
import type { Appointment } from "@/lib/types";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ymd(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function MonthCalendar({
  onAdd,
  items,
  eventHref,
}: {
  onAdd?: (date: string) => void;
  items?: Appointment[];
  eventHref?: (id: string) => string;
}) {
  const { appointments } = useApp();
  const source = (items ?? appointments).filter((a) => a.status !== "cancelled");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = useMemo(() => {
    const n = new Date();
    return ymd(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const out: Array<{ date?: string; day?: number }> = Array.from({ length: first }, () => ({}));
    for (let d = 1; d <= days; d += 1) out.push({ date: ymd(year, month, d), day: d });
    while (out.length % 7) out.push({});
    return out;
  }, [year, month]);

  const label = cursor.toLocaleString("en-CA", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="serif text-3xl font-semibold text-navy">{label}</p>
        <div className="flex gap-1">
          <NavButton label="Previous month" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            ‹
          </NavButton>
          <button
            type="button"
            className="h-9 rounded-full bg-sand px-3 text-sm text-navy hover:bg-sand-2"
            onClick={() => {
              const n = new Date();
              setCursor(new Date(n.getFullYear(), n.getMonth(), 1));
            }}
          >
            Today
          </button>
          <NavButton label="Next month" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            ›
          </NavButton>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted">
        {weekdays.map((d) => (
          <div key={d} className="py-1.5">
            <span className="sm:hidden">{d[0]}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={`blank-${i}`} className="min-h-16 sm:min-h-24" />;
          const dayMeetings = source.filter((a) => a.date === cell.date).sort((a, b) => a.time.localeCompare(b.time));
          const isToday = cell.date === today;
          const past = cell.date < today;
          return (
            <div
              key={cell.date}
              role={onAdd && !past ? "button" : undefined}
              tabIndex={onAdd && !past ? 0 : undefined}
              onClick={() => onAdd && !past && onAdd(cell.date!)}
              onKeyDown={(e) => e.key === "Enter" && onAdd && !past && onAdd(cell.date!)}
              className={cx(
                "min-h-16 rounded-2xl p-1.5 text-left transition-colors sm:min-h-24 sm:p-2",
                past ? "bg-paper/60" : "bg-paper",
                onAdd && !past && "cursor-pointer hover:bg-gold-soft/40",
              )}
            >
              <span
                className={cx(
                  "inline-grid h-6 w-6 place-items-center rounded-full text-xs",
                  isToday ? "bg-navy font-semibold text-white" : past ? "text-muted/60" : "text-muted",
                )}
              >
                {cell.day}
              </span>
              <div className="mt-1 grid gap-1">
                {dayMeetings.slice(0, 3).map((apt) => (
                  <Link
                    key={apt.id}
                    href={eventHref ? eventHref(apt.id) : `/studio/meetings/${apt.id}`}
                    onClick={(e) => e.stopPropagation()}
                    title={`${apt.time} · ${apt.topic} · ${apt.name}`}
                    className={cx(
                      "block truncate rounded-lg px-1.5 py-1 text-[11px] leading-tight",
                      apt.status === "completed" ? "bg-sand-2 text-navy" : "bg-navy text-white",
                    )}
                  >
                    <span className="hidden sm:inline">{apt.time} </span>
                    {apt.topic}
                  </Link>
                ))}
                {dayMeetings.length > 3 ? <span className="px-1 text-[11px] text-muted">+{dayMeetings.length - 3} more</span> : null}
              </div>
            </div>
          );
        })}
      </div>
      {onAdd ? <p className="mt-3 text-xs text-muted">Select a day to book a meeting. Select a meeting to open it.</p> : null}
    </div>
  );
}

function NavButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full bg-sand text-lg text-navy hover:bg-sand-2"
    >
      {children}
    </button>
  );
}
