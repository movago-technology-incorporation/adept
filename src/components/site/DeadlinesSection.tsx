"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { CalendarCheck, CalendarClock, Hourglass, Receipt } from "lucide-react";
import { photos } from "@/assets/photos";
import { CountUp, Reveal } from "@/components/ui/Reveal";
import { Container, buttonClass, cx } from "@/components/ui/kit";
import type { TaxDeadline } from "@/lib/types";

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** Next calendar occurrence of a deadline described in plain text, or null if it varies. */
function nextDate(lines: string[], today: Date): Date | null {
  const text = lines.join(" ").toLowerCase();
  const year = today.getFullYear();
  const startOfToday = new Date(year, today.getMonth(), today.getDate());
  const atOrAfter = (m: number, day: (y: number) => number) => {
    const d = new Date(year, m, day(year));
    return d >= startOfToday ? d : new Date(year + 1, m, day(year + 1));
  };
  const last = text.match(/last working day of (\w+)/);
  if (last && MONTHS.includes(last[1])) {
    const m = MONTHS.indexOf(last[1]);
    return atOrAfter(m, (y) => {
      const d = new Date(y, m + 1, 0);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
      return d.getDate();
    });
  }
  const dated = text.match(new RegExp(`(${MONTHS.join("|")}) (\\d{1,2})`));
  if (dated) return atOrAfter(MONTHS.indexOf(dated[1]), () => Number(dated[2]));
  return null;
}

// Today's date is read in the browser only, so server and client never disagree.
const noop = () => () => {};
const todayKey = () => new Date().toDateString();

export function DeadlinesSection({ deadlines }: { deadlines: TaxDeadline[] }) {
  const key = useSyncExternalStore(noop, todayKey, () => null);

  const items = useMemo(() => {
    const today = key ? new Date(key) : null;
    return deadlines
      .map((d) => {
        const date = today ? nextDate(d.lines, today) : null;
        const days = date && today ? Math.round((date.getTime() - new Date(today.toDateString()).getTime()) / 86_400_000) : null;
        return { ...d, date, days };
      })
      .sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity));
  }, [deadlines, key]);

  const next = items.find((i) => i.days !== null);

  return (
    <section id="deadlines" className="relative isolate scroll-mt-24 overflow-hidden bg-navy text-white">
      <Image src={photos.documents} alt="" fill sizes="100vw" className="-z-20 object-cover opacity-15" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy/95 via-navy/90 to-navy" aria-hidden />

      <Container className="py-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-gold-soft">Plan ahead</p>
          <h2 className="serif mt-4 text-5xl leading-[1.05] font-semibold sm:text-6xl">Notable tax filing deadlines</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70">
            Miss a CRA deadline and penalties and interest start adding up. Here’s what’s coming — we’ll make sure you’re ready.
          </p>
          {next?.days !== null && next ? (
            <p className="mt-8 inline-flex flex-wrap items-baseline justify-center gap-x-3 text-white/80">
              <CountUp value={next.days ?? 0} className="serif text-6xl font-semibold text-gold-soft sm:text-7xl" />
              <span className="text-lg">
                {next.days === 1 ? "day" : "days"} until the <span className="font-semibold text-white">{next.title}</span> deadline
              </span>
            </p>
          ) : null}
        </Reveal>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item, i) => {
            const isNext = next?.title === item.title;
            return (
              <Reveal as="li" key={item.title} delay={i * 90} className="min-w-0">
                <article
                  className={cx(
                    "flex h-full flex-col overflow-hidden rounded-3xl transition-transform duration-300 hover:-translate-y-1",
                    isNext ? "bg-gold text-navy" : "bg-white text-navy",
                  )}
                >
                  {/* Calendar page */}
                  <div className={cx("px-5 py-2.5 text-center text-xs font-bold tracking-[0.2em] uppercase", isNext ? "bg-navy text-gold-soft" : "bg-sand-2 text-gold-deep")}>
                    {item.date ? item.date.toLocaleDateString("en-CA", { month: "long" }) : "Date varies"}
                  </div>
                  <div className="grid place-items-center px-5 pt-5 pb-3">
                    {item.date ? (
                      <span className="serif text-7xl leading-none font-semibold">{item.date.getDate()}</span>
                    ) : (
                      <Hourglass className="h-14 w-14 text-gold-deep" strokeWidth={1.4} />
                    )}
                    {item.date ? <span className={cx("mt-1 text-xs", isNext ? "text-navy/60" : "text-muted")}>{item.date.getFullYear()}</span> : null}
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-5">
                    <h3 className="text-center text-lg font-semibold">{item.title}</h3>
                    <ul className={cx("mt-2 flex-1 space-y-1 text-center text-sm leading-relaxed", isNext ? "text-navy/80" : "text-muted")}>
                      {item.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                    <span
                      className={cx(
                        "mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                        isNext ? "bg-navy text-white" : "bg-paper text-navy",
                      )}
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      {item.days === null ? "Depends on your situation" : item.days === 0 ? "Due today" : isNext ? `Next up · ${item.days} days` : `In ${item.days} days`}
                    </span>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ul>

        <Reveal delay={200} className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/tax/filing-request" className={buttonClass("gold", "lg")}>
            <Receipt className="h-5 w-5" />
            Start your filing
          </Link>
          <Link href="/book" className={buttonClass("light", "lg")}>
            <CalendarCheck className="h-5 w-5" />
            Book a planning call
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
