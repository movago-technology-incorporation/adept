"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getMeetingTypes, getOpenTimes } from "@/app/actions";
import { cx, Spinner } from "@/components/ui/kit";
import type { EventType } from "@/lib/cal";

export type Pick = { eventTypeId: number; start: string; length: number; timeZone: string };

const WINDOW_DAYS = 14;

function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Live availability from Cal.com. Shows meeting length, a two-week day strip,
 * and open times in the visitor's own time zone.
 */
export function Scheduler({
  eventTypes: initialTypes,
  value,
  onChange,
  tone = "white",
}: {
  eventTypes?: EventType[];
  value: Pick | null;
  onChange: (pick: Pick | null) => void;
  tone?: "white" | "paper";
}) {
  const [types, setTypes] = useState<EventType[] | null>(initialTypes ?? null);
  const [typeId, setTypeId] = useState<number | null>(initialTypes?.[0]?.id ?? null);
  const [offset, setOffset] = useState(0);
  const [days, setDays] = useState<Record<string, string[]> | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Edmonton", []);
  const chip = tone === "white" ? "bg-sand" : "bg-white";

  useEffect(() => {
    if (types) return;
    getMeetingTypes()
      .then((list) => {
        setTypes(list);
        setTypeId(list[0]?.id ?? null);
      })
      .catch(() => setError("We couldn’t load the calendar. Please refresh or contact us."));
  }, [types]);

  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + offset);
    return isoDay(d);
  }, [offset]);
  const todayKey = useMemo(() => isoDay(new Date()), []);

  useEffect(() => {
    if (!typeId) return;
    startLoading(async () => {
      try {
        setError(null);
        const open = await getOpenTimes(typeId, from, WINDOW_DAYS, timeZone);
        setDays(open);
        const first = Object.keys(open).sort().find((k) => open[k].length);
        setDay((current) => (current && open[current]?.length ? current : (first ?? null)));
      } catch {
        setDays({});
        setError("We couldn’t load open times. Please try again shortly.");
      }
    });
  }, [typeId, from, timeZone]);

  const strip = useMemo(() => {
    const start = new Date(`${from}T12:00:00`);
    return Array.from({ length: WINDOW_DAYS }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return isoDay(d);
    });
  }, [from]);

  const type = types?.find((t) => t.id === typeId);
  const times = (day && days?.[day]) || [];
  const tzLabel = timeZone.replace(/_/g, " ").split("/").pop();

  if (!types) {
    return error ? <p className="text-sm text-danger">{error}</p> : <Loading />;
  }
  if (types.length === 0) {
    return <p className="text-sm text-muted">Online booking is paused. Please contact us to schedule.</p>;
  }

  return (
    <div className="grid w-full min-w-0 gap-7">
      {types.length > 1 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-navy">Meeting length</p>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTypeId(t.id);
                  onChange(null);
                }}
                className={cx(
                  "rounded-full px-4 py-2 text-sm transition-colors",
                  t.id === typeId ? "bg-navy text-white" : cx(chip, "text-navy hover:bg-gold-soft"),
                )}
              >
                {t.length} min
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-navy">
            Choose a day
            <span className="ml-2 font-normal text-muted">
              {new Date(`${strip[0]}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" })} –{" "}
              {new Date(`${strip[strip.length - 1]}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
            </span>
          </p>
          <div className="flex gap-1">
            <StepButton disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - WINDOW_DAYS))} label="Earlier dates">
              ‹
            </StepButton>
            <StepButton disabled={offset >= 56} onClick={() => setOffset((o) => o + WINDOW_DAYS)} label="Later dates">
              ›
            </StepButton>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium tracking-wide text-muted uppercase sm:gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
            <span key={w} className="py-1">
              <span className="sm:hidden">{w[0]}</span>
              <span className="hidden sm:inline">{w}</span>
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-2">
          {strip.map((d) => {
            const count = days?.[d]?.length ?? 0;
            const date = new Date(`${d}T12:00:00`);
            const active = d === day;
            const past = d < todayKey;
            return (
              <button
                key={d}
                type="button"
                disabled={!count}
                aria-label={`${date.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}${count ? `, ${count} times available` : ", unavailable"}`}
                onClick={() => {
                  setDay(d);
                  onChange(null);
                }}
                className={cx(
                  "flex aspect-square min-w-0 flex-col items-center justify-center rounded-xl transition-colors sm:rounded-2xl",
                  active ? "bg-navy text-white" : count ? cx(chip, "text-navy hover:bg-gold-soft") : past ? "text-muted/30" : "text-muted/50",
                )}
              >
                <span className="serif text-lg leading-none font-semibold sm:text-2xl">{date.getDate()}</span>
                <span className={cx("mt-1 h-1 w-1 rounded-full", count && !active ? "bg-gold" : "bg-transparent")} aria-hidden />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-navy">
          {day ? new Date(`${day}T12:00:00`).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" }) : "Open times"}
          <span className="ml-2 font-normal text-muted">· {tzLabel} time</span>
        </p>
        {loading && !days ? (
          <Loading />
        ) : error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : times.length === 0 ? (
          <p className="rounded-2xl bg-paper px-4 py-5 text-sm text-muted">
            {loading ? "Checking the calendar…" : "No open times in these two weeks. Try later dates."}
          </p>
        ) : (
          <div className={cx("grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2", loading && "opacity-50")}>
            {times.map((iso) => {
              const active = value?.start === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onChange({ eventTypeId: typeId!, start: iso, length: type?.length ?? 30, timeZone })}
                  className={cx(
                    "min-w-0 rounded-xl px-2 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                    active ? "bg-gold text-navy" : cx(chip, "text-navy hover:bg-gold-soft"),
                  )}
                >
                  {new Date(iso).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StepButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-full bg-sand text-lg text-navy hover:bg-gold-soft disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Loading() {
  return (
    <p className="flex items-center gap-2 text-sm text-muted">
      <Spinner /> Loading the calendar…
    </p>
  );
}

export function describePick(pick: Pick) {
  const d = new Date(pick.start);
  return `${d.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })} at ${d.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  })} · ${pick.length} min`;
}
