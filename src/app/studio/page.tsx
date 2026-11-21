"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/portal/Shell";
import { ClientModal } from "@/components/studio/ClientModal";
import { FollowUpModal } from "@/components/studio/FollowUpModal";
import { LeadModal } from "@/components/studio/LeadModal";
import { MeetingModal } from "@/components/studio/MeetingModal";
import { ProposalModal } from "@/components/studio/ProposalModal";
import { todayIso } from "@/components/ui/Dropdown";
import { Badge, EmptyState, buttonClass, cx, formatDate } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";
import type { LeadStatus } from "@/lib/types";

type Modal = null | "meeting" | "lead" | "follow" | "proposal" | "client";

const STAGES: { key: LeadStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "engaged", label: "Engaged" },
  { key: "consult booked", label: "Consult booked" },
  { key: "proposal sent", label: "Proposal sent" },
  { key: "won", label: "Won" },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function StudioHome() {
  const { viewer, leads, clients, proposals, appointments, followUps, forms, messages } = useApp();
  const [modal, setModal] = useState<Modal>(null);
  const close = () => setModal(null);
  const today = todayIso();
  const firstName = viewer?.name.split(" ")[0] ?? "";

  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "scheduled" && a.date >= today)
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [appointments, today],
  );
  const todays = upcoming.filter((a) => a.date === today);

  const attention = useMemo(() => {
    const items: { id: string; tone: "gold" | "warn" | "danger" | "navy"; tag: string; title: string; detail: string; href: string }[] = [];
    for (const l of leads.filter((l) => l.status === "new"))
      items.push({ id: `l-${l.id}`, tone: "gold", tag: "New lead", title: l.name, detail: `${l.interest || l.source} · ${formatDate(l.createdAt)}`, href: `/studio/leads/${l.id}` });
    for (const f of followUps.filter((f) => f.status === "failed"))
      items.push({ id: `f-${f.id}`, tone: "danger", tag: "Email failed", title: f.subject, detail: leads.find((l) => l.id === f.leadId)?.name ?? "", href: "/studio/follow-up" });
    for (const f of followUps.filter((f) => f.status === "queued" && f.channel === "email" && !f.body?.trim()))
      items.push({ id: `fm-${f.id}`, tone: "warn", tag: "Needs message", title: f.subject, detail: leads.find((l) => l.id === f.leadId)?.name ?? "", href: "/studio/follow-up" });
    for (const p of proposals.filter((p) => p.status === "sent" || p.status === "viewed"))
      items.push({
        id: `p-${p.id}`,
        tone: "navy",
        tag: "Awaiting answer",
        title: p.title,
        detail: `${p.amount}${p.sentAt ? ` · sent ${formatDate(p.sentAt)}` : ""}`,
        href: "/studio/proposals",
      });
    const byClient = new Map<string, (typeof messages)[number]>();
    for (const m of messages) if (m.clientId) byClient.set(m.clientId, m);
    for (const [clientId, m] of byClient)
      if (m.author === "client") {
        const c = clients.find((c) => c.id === clientId);
        items.push({ id: `m-${clientId}`, tone: "gold", tag: "Client message", title: c?.company || c?.name || "Client", detail: m.body.slice(0, 80), href: `/studio/clients/${clientId}` });
      }
    for (const f of forms.filter((f) => f.status !== "completed" && f.due < today)) {
      const c = clients.find((c) => c.id === f.clientId);
      items.push({ id: `o-${f.id}`, tone: "danger", tag: "Overdue from client", title: f.title, detail: c?.company || c?.name || "", href: `/studio/clients/${f.clientId}` });
    }
    return items;
  }, [leads, followUps, proposals, messages, clients, forms, today]);

  const funnel = STAGES.map((s) => ({ ...s, count: leads.filter((l) => l.status === s.key).length }));
  const funnelMax = Math.max(1, ...funnel.map((s) => s.count));
  const newThisWeek = leads.filter((l) => l.createdAt >= daysAgo(7)).length;
  const won = leads.filter((l) => l.status === "won").length;
  const closed = won + leads.filter((l) => l.status === "lost").length;
  const awaiting = proposals.filter((p) => p.status === "sent" || p.status === "viewed").length;
  const queued = followUps.filter((f) => f.status === "queued").length;

  return (
    <div className="grid gap-6">
      {/* Greeting + quick actions */}
      <section className="hero-surface bg-navy overflow-hidden rounded-3xl p-6 text-white sm:p-10">
        <p className="eyebrow text-gold-soft" suppressHydrationWarning>
          {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="serif mt-3 text-4xl leading-tight font-semibold sm:text-5xl" suppressHydrationWarning>
          {greeting()}
          {firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="mt-3 max-w-2xl text-white/70">
          {todays.length ? `${todays.length} meeting${todays.length > 1 ? "s" : ""} today` : "No meetings today"}
          {" · "}
          {attention.length ? `${attention.length} item${attention.length > 1 ? "s" : ""} need${attention.length === 1 ? "s" : ""} attention` : "nothing waiting on you"}
          {" · "}
          {queued} follow-up{queued === 1 ? "" : "s"} scheduled
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          {(
            [
              ["lead", "New lead"],
              ["meeting", "Schedule meeting"],
              ["follow", "Follow-up email"],
              ["proposal", "Proposal"],
              ["client", "Add client"],
            ] as const
          ).map(([key, label], i) => (
            <button key={key} type="button" onClick={() => setModal(key)} className={buttonClass(i === 0 ? "gold" : "light", "sm")}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="New leads this week" value={newThisWeek} href="/studio/leads" />
        <Kpi label="Proposals awaiting answer" value={awaiting} href="/studio/proposals" />
        <Kpi label="Upcoming meetings" value={upcoming.length} href="/studio/calendar" />
        <Kpi label="Win rate" value={closed ? `${Math.round((won / closed) * 100)}%` : "—"} hint={`${won} won · ${clients.length} clients`} href="/studio/clients" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        {/* Attention inbox */}
        <Card title="Needs attention" description="New leads, replies, overdue items and anything that failed.">
          {attention.length === 0 ? (
            <EmptyState title="All caught up" body="New enquiries and client replies will appear here." />
          ) : (
            <ul className="grid gap-2">
              {attention.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="flex items-center gap-4 rounded-2xl bg-paper px-4 py-3.5 transition-colors hover:bg-sand">
                    <span
                      className={cx(
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        item.tone === "danger" ? "bg-danger" : item.tone === "warn" ? "bg-warn" : item.tone === "navy" ? "bg-navy" : "bg-gold",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-navy">{item.title}</span>
                      <span className="block truncate text-sm text-muted">{item.detail}</span>
                    </span>
                    <span className="hidden shrink-0 sm:block">
                      <Badge tone={item.tone === "navy" ? "neutral" : item.tone === "gold" ? "gold" : item.tone}>{item.tag}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
              {attention.length > 8 ? <li className="px-2 pt-1 text-sm text-muted">+{attention.length - 8} more</li> : null}
            </ul>
          )}
        </Card>

        {/* Agenda */}
        <Card title="Agenda" action={<Link href="/studio/calendar" className="text-sm text-gold-deep hover:text-navy">Calendar →</Link>}>
          {upcoming.length === 0 ? (
            <EmptyState title="Nothing booked" body="Website and cal.com bookings land here automatically." />
          ) : (
            <ol className="grid gap-5">
              {groupByDay(upcoming.slice(0, 6)).map(([date, items]) => (
                <li key={date}>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                    {date === today ? "Today" : formatDate(date).replace(/, \d{4}$/, "")}
                  </p>
                  <ul className="grid gap-2">
                    {items.map((a) => (
                      <li key={a.id}>
                        <Link href={`/studio/meetings/${a.id}`} className="flex items-center gap-4 rounded-2xl bg-paper px-4 py-3 transition-colors hover:bg-sand">
                          <span className="serif w-16 shrink-0 text-xl font-semibold text-navy">{a.time}</span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-navy">{a.topic}</span>
                            <span className="block truncate text-sm text-muted">{a.name}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        {/* Funnel */}
        <Card title="Pipeline" action={<Link href="/studio/leads" className="text-sm text-gold-deep hover:text-navy">Leads →</Link>}>
          <ul className="grid gap-4">
            {funnel.map((s) => (
              <li key={s.key}>
                <div className="flex justify-between text-sm">
                  <span className="text-navy">{s.label}</span>
                  <span className="font-semibold text-navy">{s.count}</span>
                </div>
                <div className="mt-1.5 h-2.5 rounded-full bg-paper">
                  <div
                    className={cx("h-2.5 rounded-full", s.key === "won" ? "bg-success" : "bg-gold")}
                    style={{ width: `${s.count ? Math.max(6, (s.count / funnelMax) * 100) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Recent leads */}
        <Card title="Latest enquiries" action={<Link href="/studio/leads" className="text-sm text-gold-deep hover:text-navy">All →</Link>}>
          {leads.length === 0 ? (
            <EmptyState title="No leads yet" />
          ) : (
            <ul className="grid gap-2">
              {leads.slice(0, 5).map((l) => (
                <li key={l.id}>
                  <Link href={`/studio/leads/${l.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3 transition-colors hover:bg-sand">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="serif grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy text-sm font-semibold text-gold-soft">
                        {l.name.slice(0, 1)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-navy">{l.name}</span>
                        <span className="block truncate text-sm text-muted">
                          {l.source} · {formatDate(l.createdAt)}
                        </span>
                      </span>
                    </span>
                    <Badge tone={l.status === "won" ? "success" : l.status === "lost" ? "danger" : "gold"}>{l.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <MeetingModal open={modal === "meeting"} onClose={close} />
      <LeadModal open={modal === "lead"} onClose={close} />
      <FollowUpModal open={modal === "follow"} onClose={close} />
      <ProposalModal open={modal === "proposal"} onClose={close} />
      <ClientModal open={modal === "client"} onClose={close} />
    </div>
  );
}

function Kpi({ label, value, hint, href }: { label: string; value: string | number; hint?: string; href: string }) {
  return (
    <Link href={href} className="rounded-3xl bg-white p-6 transition-colors hover:bg-sand">
      <p className="text-sm text-muted">{label}</p>
      <p className="serif mt-2 text-5xl font-semibold text-navy">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Link>
  );
}

function groupByDay<T extends { date: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  for (const r of rows) map.set(r.date, [...(map.get(r.date) ?? []), r]);
  return [...map.entries()];
}
