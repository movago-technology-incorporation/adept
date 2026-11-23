"use client";

import { useState } from "react";
import { CalendarClock, Check, Lock } from "lucide-react";
import { saveTaxSeason } from "@/app/actions";
import { Alert, Button, cx } from "@/components/ui/kit";
import type { TaxSeason } from "@/lib/tax-season";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const selectClass = "h-11 cursor-pointer rounded-xl bg-sand px-3 text-sm text-navy outline-none focus:bg-sand-2";
const pad = (n: number) => String(n).padStart(2, "0");
const daysIn = (m: number) => new Date(Date.UTC(2025, m, 0)).getUTCDate(); // non-leap year: no Feb 29
const readable = (md: string, year?: number) => `${MONTHS[Number(md.slice(0, 2)) - 1]} ${Number(md.slice(3))}${year ? `, ${year}` : ""}`;

function MonthDay({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const m = Number(value.slice(0, 2));
  const d = Number(value.slice(3));
  return (
    <div className="flex gap-2" role="group" aria-label={label}>
      <select className={cx(selectClass, "flex-1")} value={m} onChange={(e) => onChange(`${pad(Number(e.target.value))}-${pad(Math.min(d, daysIn(Number(e.target.value))))}`)}>
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
      <select className={cx(selectClass, "w-24")} value={d} onChange={(e) => onChange(`${pad(m)}-${pad(Number(e.target.value))}`)}>
        {Array.from({ length: daysIn(m) }, (_, i) => i + 1).map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Studio → Settings → Tax season. */
export function TaxSeasonForm({ initial, today }: { initial: TaxSeason; today: { year: number; md: string } }) {
  const [s, setS] = useState(initial);
  const [lock, setLock] = useState(initial.submitFrom !== "");
  const [submitFrom, setSubmitFrom] = useState(initial.submitFrom || "01-01");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const current: TaxSeason = { ...s, submitFrom: lock ? submitFrom : "" };
  const dirty = JSON.stringify(current) !== JSON.stringify(initial);

  // Live preview of what clients see today with these settings.
  const open = today.md >= current.openFrom;
  const years = [...(open ? [today.year] : []), ...Array.from({ length: current.pastYears }, (_, i) => today.year - 1 - i)];

  const save = async () => {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await saveTaxSeason(current);
      setS(res);
      setSaved(true);
    } catch {
      setError("Couldn’t save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="rounded-3xl bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sand text-navy">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="serif text-3xl font-semibold text-navy">Tax season</h2>
            <p className="text-sm text-muted">When clients can start and submit their personal tax return.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-7">
          <div>
            <p className="font-semibold text-navy">Open next year’s return from</p>
            <p className="mb-3 text-sm text-muted">Each year from this date, clients can start that year’s questionnaire early and upload slips as they arrive.</p>
            <MonthDay label="Open from" value={s.openFrom} onChange={(v) => setS((p) => ({ ...p, openFrom: v }))} />
          </div>

          <div>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} className="mt-1 h-4 w-4 cursor-pointer accent-[#0b1a2e]" />
              <span>
                <span className="block font-semibold text-navy">Lock submitting until</span>
                <span className="block text-sm text-muted">Clients can save their progress, but can only submit a return from this date in the following year.</span>
              </span>
            </label>
            {lock ? (
              <div className="mt-3">
                <MonthDay label="Submit from" value={submitFrom} onChange={setSubmitFrom} />
              </div>
            ) : null}
          </div>

          <div>
            <p className="font-semibold text-navy">Past years clients can file</p>
            <p className="mb-3 text-sm text-muted">For catching up on late returns.</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setS((p) => ({ ...p, pastYears: n }))}
                  className={cx("h-10 w-10 cursor-pointer rounded-full text-sm font-medium transition-colors", s.pastYears === n ? "bg-navy text-white" : "bg-sand text-navy hover:bg-sand-2")}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6">
            <Alert>{error}</Alert>
          </div>
        ) : null}
        <div className="mt-8 flex items-center gap-3">
          <Button onClick={save} loading={busy} disabled={!dirty && !busy}>
            Save settings
          </Button>
          {saved && !dirty ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-success">
              <Check className="h-4 w-4" /> Saved. Clients see the change straight away.
            </span>
          ) : null}
        </div>
      </section>

      <aside className="h-fit rounded-3xl bg-navy p-6 text-white sm:p-8">
        <p className="eyebrow text-gold-soft">What clients see today</p>
        <p className="mt-2 text-sm text-white/60">{readable(today.md, today.year)}</p>
        <ul className="mt-5 grid gap-2">
          {years.map((y) => {
            const lockedNow = lock && (today.year < y + 1 || (today.year === y + 1 && today.md < submitFrom));
            return (
              <li key={y} className="flex items-center justify-between gap-3 rounded-2xl bg-white/8 px-4 py-3">
                <span className="font-semibold">
                  {y} tax return
                  {y === today.year ? <span className="ml-2 text-xs font-normal text-gold-soft">Start early</span> : null}
                </span>
                {lockedNow ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
                    <Lock className="h-3.5 w-3.5" /> Submit from {readable(submitFrom, y + 1)}
                  </span>
                ) : (
                  <span className="text-xs text-white/70">Can submit</span>
                )}
              </li>
            );
          })}
        </ul>
        {!open ? (
          <p className="mt-4 text-sm text-white/60">
            {today.year} opens on {readable(current.openFrom, today.year)}.
          </p>
        ) : null}
      </aside>
    </div>
  );
}
