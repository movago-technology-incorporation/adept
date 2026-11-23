"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, PageHeader, Row, Stat, Status } from "@/components/portal/Shell";
import { ClientMeetingModal } from "@/components/client/ClientMeetingModal";
import { ClientMessageModal } from "@/components/client/ClientMessageModal";
import { ClientUploadModal } from "@/components/client/ClientUploadModal";
import { AddButton } from "@/components/studio/Modal";
import { todayIso } from "@/components/ui/Dropdown";
import { EmptyState, formatDate, formatWhen } from "@/components/ui/kit";
import { useClientWorkspace } from "@/store/app-store";
import { Checklist } from "@/components/portal/Checklist";
import { isBusiness, usesPersonalReturn } from "@/lib/client-kind";

export function ClientHome() {
  const { client, clientDocuments, outstanding, clientAppointments, messages } = useClientWorkspace();
  const [modal, setModal] = useState<null | "meeting" | "message" | "upload" | "receipt">(null);
  const close = () => setModal(null);
  const today = todayIso();
  const upcoming = clientAppointments
    .filter((a) => a.status === "scheduled" && a.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const next = upcoming[0];
  const firstName = client?.name.split(" ")[0] ?? "there";
  const business = isBusiness(client?.type);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={client?.company || "Client portal"}
        title={`Welcome, ${firstName}`}
        description="Everything Adept needs from you — and everything we’ve prepared — in one place."
        actions={
          <>
            <AddButton onClick={() => setModal("upload")}>Upload document</AddButton>
            <AddButton variant="soft" onClick={() => setModal("meeting")}>
              Book appointment
            </AddButton>
            <AddButton variant="soft" onClick={() => setModal("message")}>
              Message us
            </AddButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Outstanding" value={outstanding.length} hint={outstanding.length ? "Needs your attention" : "You’re all caught up"} />
        <Stat label="Files shared" value={clientDocuments.length} />
        <Stat label="Upcoming meetings" value={upcoming.length} />
        <Stat label="Next meeting" value={next ? formatDate(next.date).replace(/, \d{4}$/, "") : "—"} hint={next ? next.time : undefined} />
      </div>

      {business ? (
        <Card title="Monthly checklist" description="What Adept needs from you this month" action={<Link href="/client/checklist" className="text-sm font-medium text-navy hover:text-gold-deep">Open checklist →</Link>}>
          <Checklist />
        </Card>
      ) : null}

      {usesPersonalReturn(client?.type) ? (
      <Link
          href="/client/tax-return"
          className="group flex flex-col gap-4 rounded-3xl bg-gold p-6 text-navy transition-colors hover:bg-gold-soft sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div>
            <p className="eyebrow text-navy/70">Personal tax return</p>
            <p className="serif mt-2 text-3xl font-semibold">Complete your tax questionnaire</p>
            <p className="mt-1 text-navy/75">Answer a few questions and upload your slips — your progress saves automatically.</p>
          </div>
          <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-navy px-5 font-medium text-white">Open tax return →</span>
        </Link>
      ) : null}

      {next ? (
        <div className="flex flex-col gap-4 rounded-3xl bg-navy p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="eyebrow text-gold-soft">Next appointment</p>
            <p className="serif mt-2 text-3xl font-semibold">{next.topic}</p>
            <p className="mt-1 text-white/65">{formatWhen(next.date, next.time)} · Calgary time</p>
          </div>
          <a href={next.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-full bg-gold px-5 font-medium text-navy hover:bg-gold-soft">
            Join video call
          </a>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Needs your attention" action={<Link href="/client/forms" className="text-sm text-gold-deep hover:text-navy">Forms</Link>}>
          {outstanding.length === 0 ? (
            <EmptyState title="Nothing waiting on you" body="We’ll post the next request here." />
          ) : (
            <ul className="grid gap-2">
              {outstanding.map((item) => (
                <Row key={item.id}>
                  <span>
                    <span className="block font-medium text-navy">{item.title}</span>
                    <span className="text-sm text-muted">Due {formatDate(item.due)}</span>
                  </span>
                  <Status value={item.status} />
                </Row>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recent files" action={<Link href="/client/documents" className="text-sm text-gold-deep hover:text-navy">All files</Link>}>
          {clientDocuments.length === 0 ? (
            <EmptyState title="No files yet" body="Upload statements, receipts or slips to get started." />
          ) : (
            <ul className="grid gap-2">
              {clientDocuments.slice(0, 5).map((doc) => (
                <Row key={doc.id}>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-navy">{doc.name}</span>
                    <span className="text-sm text-muted">
                      {doc.category} · {formatDate(doc.uploadedAt)}
                    </span>
                  </span>
                </Row>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Latest messages" action={<Link href="/client/messages" className="text-sm text-gold-deep hover:text-navy">Open conversation</Link>}>
        {messages.length === 0 ? (
          <EmptyState title="No messages yet" action={<AddButton onClick={() => setModal("message")}>Send a message</AddButton>} />
        ) : (
          <ul className="grid gap-2">
            {messages.slice(-3).map((m) => (
              <li key={m.id} className="rounded-2xl bg-paper px-4 py-3.5">
                <p className="text-xs text-muted">
                  {m.author === "client" ? "You" : "Adept"} · {m.at}
                </p>
                <p className="mt-1 leading-relaxed text-ink/85">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ClientMeetingModal open={modal === "meeting"} onClose={close} />
      <ClientMessageModal open={modal === "message"} onClose={close} />
      <ClientUploadModal open={modal === "upload"} onClose={close} kind="upload" category="Client uploads" title="Upload a document" />
      <ClientUploadModal open={modal === "receipt"} onClose={close} kind="receipt" category="Receipts" title="Send a receipt" />
    </div>
  );
}
