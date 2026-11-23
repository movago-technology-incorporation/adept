"use client";

import { FormEvent, useRef, useState } from "react";
import { Scheduler, describePick, type Pick } from "@/components/booking/Scheduler";
import { Dropdown } from "@/components/ui/Dropdown";
import { Alert, Button, ButtonLink, Input, Label, Surface, Textarea, cx } from "@/components/ui/kit";
import type { EventType } from "@/lib/cal";
import type { Appointment } from "@/lib/types";
import { useApp } from "@/store/app-store";

export const TOPICS = ["Bookkeeping consultation", "Catch-up / clean-up", "GST/HST", "Payroll", "Tax filing", "Tax planning"];

const EXPECT = [
  "A private video link by email, straight away",
  "A review of where your books and filings stand",
  "Clear next steps — no obligation",
];

/** Public booking in two steps: 1) pick a live Cal.com time, 2) add details and confirm. */
export function BookingFlow({ eventTypes }: { eventTypes?: EventType[] }) {
  const { bookMeeting, recordClick } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [pick, setPick] = useState<Pick | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Appointment | null>(null);
  const top = useRef<HTMLDivElement>(null);

  function go(next: 1 | 2) {
    setStep(next);
    setError(null);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pick) return go(1);
    const data = new FormData(e.currentTarget);
    setSaving(true);
    setError(null);
    const result = await bookMeeting({
      eventTypeId: pick.eventTypeId,
      start: pick.start,
      timeZone: pick.timeZone,
      topic: String(data.get("topic")),
      notes: String(data.get("notes") || ""),
      guest: {
        name: String(data.get("name")),
        email: String(data.get("email")),
        phone: String(data.get("phone") || ""),
        company: String(data.get("company") || ""),
      },
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      if (/taken/i.test(result.error)) {
        setPick(null);
        go(1);
        setError(result.error);
      }
      return;
    }
    void recordClick("/book", "Confirm consultation");
    setDone(result.appointment);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (done) {
    return (
      <div ref={top} className="scroll-mt-28">
        <Surface className="mx-auto max-w-2xl p-8 text-center sm:p-14">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-soft text-success">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden>
              <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h2 className="serif mt-6 text-4xl font-semibold text-navy sm:text-5xl">You’re booked in</h2>
          <p className="mt-3 text-lg text-navy">{pick ? describePick(pick) : done.date}</p>
          <p className="text-muted">{done.topic}</p>
          <p className="mx-auto mt-6 max-w-md leading-relaxed text-muted">
            A confirmation with your private video link is on its way to <strong className="text-navy">{done.email}</strong>. Need
            a different time? Use the reschedule link in that email.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href={done.meetingUrl} target="_blank" rel="noreferrer">
              Open meeting link
            </ButtonLink>
            <ButtonLink href="/" variant="soft">
              Back to home
            </ButtonLink>
          </div>
        </Surface>
      </div>
    );
  }

  return (
    <div ref={top} className="scroll-mt-28">
      <Steps step={step} canGoBack={step === 2} onBack={() => go(1)} />

      {step === 1 ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Surface className="min-w-0 p-5 sm:p-10">
            <h2 className="serif text-3xl font-semibold text-navy sm:text-4xl">Choose a time</h2>
            <p className="mt-1 mb-8 text-muted">Live availability from Adept’s calendar, shown in your time zone.</p>
            <Scheduler eventTypes={eventTypes} value={pick} onChange={setPick} />
          </Surface>

          <aside className="grid min-w-0 gap-4 lg:sticky lg:top-28 lg:self-start">
            <SessionCard pick={pick}>
              <Button variant="gold" size="lg" className="mt-6 w-full" disabled={!pick} onClick={() => go(2)}>
                Continue
              </Button>
              {!pick ? <p className="mt-3 text-center text-xs text-white/50">Select a time to continue</p> : null}
            </SessionCard>
            <Expect />
          </aside>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Surface className="min-w-0 p-5 sm:p-10">
            <h2 className="serif text-3xl font-semibold text-navy sm:text-4xl">Your details</h2>
            <p className="mt-1 mb-8 text-muted">We’ll send the invite and video link to your email.</p>

            <form onSubmit={onSubmit} className="grid gap-6">
              <fieldset className="grid gap-5 sm:grid-cols-2">
                <legend className="sr-only">Contact details</legend>
                <Label label="Full name">
                  <Input required name="name" autoComplete="name" autoFocus />
                </Label>
                <Label label="Email">
                  <Input required name="email" type="email" autoComplete="email" />
                </Label>
                <Label label="Phone" hint="Optional — in case we need to reach you.">
                  <Input name="phone" type="tel" autoComplete="tel" />
                </Label>
                <Label label="Business name" hint="Optional.">
                  <Input name="company" autoComplete="organization" />
                </Label>
              </fieldset>

              <Label label="What would you like to discuss?">
                <Dropdown name="topic" defaultValue={TOPICS[0]} options={TOPICS.map((value) => ({ value, label: value }))} />
              </Label>

              <Label label="Anything we should know?" hint="Optional — business type, monthly transactions, deadlines, software you use.">
                <Textarea name="notes" rows={5} />
              </Label>

              {error ? <Alert>{error}</Alert> : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="ghost" onClick={() => go(1)}>
                  ← Change time
                </Button>
                <Button type="submit" size="lg" loading={saving} className="sm:min-w-56">
                  {saving ? "Booking…" : "Confirm booking"}
                </Button>
              </div>
            </form>
          </Surface>

          <aside className="grid min-w-0 gap-4 lg:sticky lg:top-28 lg:self-start">
            <SessionCard pick={pick}>
              <button type="button" onClick={() => go(1)} className="mt-5 text-sm text-gold-soft hover:text-white">
                Change time
              </button>
            </SessionCard>
            <Expect />
          </aside>
        </div>
      )}

      {step === 1 && error ? (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
    </div>
  );
}

function Steps({ step, canGoBack, onBack }: { step: 1 | 2; canGoBack: boolean; onBack: () => void }) {
  const items = ["Choose a time", "Your details"];
  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-3">
      {items.map((label, i) => {
        const n = (i + 1) as 1 | 2;
        const active = step === n;
        const complete = step > n;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              disabled={!(complete && canGoBack)}
              onClick={onBack}
              aria-current={active ? "step" : undefined}
              className={cx(
                "flex items-center gap-3 rounded-full py-2 pr-5 pl-2 text-sm font-medium transition-colors",
                active ? "bg-navy text-white" : complete ? "bg-gold-soft text-navy hover:bg-gold" : "bg-sand text-muted",
              )}
            >
              <span
                className={cx(
                  "grid h-7 w-7 place-items-center rounded-full text-xs",
                  active ? "bg-gold text-navy" : complete ? "bg-white text-navy" : "bg-white/70 text-muted",
                )}
              >
                {complete ? "✓" : n}
              </span>
              {label}
            </button>
            {i < items.length - 1 ? <span className="h-0.5 w-6 rounded-full bg-sand-2 sm:w-10" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function SessionCard({ pick, children }: { pick: Pick | null; children?: React.ReactNode }) {
  const d = pick ? new Date(pick.start) : null;
  return (
    <div className="rounded-3xl bg-navy p-7 text-white">
      <p className="eyebrow text-gold-soft">Your session</p>
      {d && pick ? (
        <>
          <p className="serif mt-4 text-3xl leading-tight font-semibold">
            {d.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <p className="mt-2 text-lg text-white/80">
            {d.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })} · {pick.length} min
          </p>
          <p className="mt-1 text-sm text-white/50">{pick.timeZone.replace(/_/g, " ")} · Video call</p>
        </>
      ) : (
        <p className="serif mt-4 text-3xl leading-tight font-semibold text-white/60">No time selected</p>
      )}
      {children}
    </div>
  );
}

function Expect() {
  return (
    <div className="rounded-3xl bg-sand p-7">
      <p className="font-semibold text-navy">What to expect</p>
      <ul className="mt-4 grid gap-3 text-sm text-muted">
        {EXPECT.map((t) => (
          <li key={t} className="flex gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
