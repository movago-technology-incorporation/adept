"use client";
import { Mail } from "lucide-react";
import { composeHref } from "@/lib/email-recipients";

import { Pencil, UserPlus } from "lucide-react";
import { InviteModal } from "@/components/studio/InviteModal";
import { use, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { LeadModal } from "@/components/studio/LeadModal";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Card, PageHeader, Row, Status } from "@/components/portal/Shell";
import { AddButton } from "@/components/studio/Modal";
import { FollowUpModal } from "@/components/studio/FollowUpModal";
import { MeetingModal } from "@/components/studio/MeetingModal";
import { ProposalModal } from "@/components/studio/ProposalModal";
import { Button, EmptyState, Textarea, formatDate, formatWhen, IconButton } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { leads, clicks, appointments, proposals, followUps, updateLead, deleteLead } = useApp();
  const router = useRouter();
  const lead = leads.find((row) => row.id === id);
  const [note, setNote] = useState("");
  const [modal, setModal] = useState<null | "meeting" | "proposal" | "follow" | "edit" | "invite">(null);
  if (!lead) notFound();

  const meetings = appointments.filter((a) => a.leadId === lead.id);
  const leadProposals = proposals.filter((p) => p.leadId === lead.id);
  const trail = clicks.filter((c) => c.leadId === lead.id);
  const queued = followUps.filter((f) => f.leadId === lead.id);

  return (
    <div className="grid gap-6">
      <PageHeader
        back={{ href: "/studio/leads", label: "All leads" }}
        title={lead.name}
        description={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Status value={lead.status} />
            {lead.company ? <span>{lead.company}</span> : null}
            <a href={`mailto:${lead.email}`} className="hover:text-navy">
              {lead.email}
            </a>
            {lead.phone ? (
              <a href={`tel:${lead.phone}`} className="hover:text-navy">
                {lead.phone}
              </a>
            ) : null}
          </div>
        }
        actions={
          <>
            <AddButton variant="gold" onClick={() => router.push(composeHref([{ kind: "lead", id: lead.id }]))}>
              <Mail className="h-4 w-4" />
              Email
            </AddButton>
            <AddButton onClick={() => setModal("invite")}>
              <UserPlus className="h-4 w-4" />
              Invite to portal
            </AddButton>
            <AddButton variant="soft" onClick={() => setModal("meeting")}>Schedule meeting</AddButton>
            <AddButton variant="soft" onClick={() => setModal("proposal")}>
              Proposal
            </AddButton>
            <AddButton variant="soft" onClick={() => setModal("follow")}>
              Follow-up
            </AddButton>
            <IconButton label="Edit" onClick={() => setModal("edit")}>
<Pencil className="h-4 w-4" />
</IconButton>
            <ConfirmButton
              onConfirm={() => {
                deleteLead(lead.id);
                router.push("/studio/leads");
              }} label="Delete" />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Details" className="lg:col-span-1">
          <dl className="grid gap-4 text-sm">
            {[
              ["Interest", lead.interest],
              ["Source", lead.source],
              ["First page", lead.page],
              ["Campaign", lead.utm],
              ["Added", formatDate(lead.createdAt)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="mt-0.5 break-words text-navy">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="grid gap-6 lg:col-span-2">
          <Card title="Notes">
            {lead.notes ? <p className="mb-4 rounded-2xl bg-paper p-4 text-sm leading-relaxed whitespace-pre-line text-ink/85">{lead.notes}</p> : null}
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add an internal note…" />
            <Button
              className="mt-3"
              size="sm"
              disabled={!note.trim()}
              onClick={() => {
                const stamp = new Date().toLocaleDateString("en-CA", { month: "short", day: "numeric" });
                updateLead(lead.id, { notes: [lead.notes, `${stamp}: ${note.trim()}`].filter(Boolean).join("\n") });
                setNote("");
              }}
            >
              Save note
            </Button>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Meetings">
              {meetings.length === 0 ? (
                <EmptyState title="No meetings yet" />
              ) : (
                <ul className="grid gap-2">
                  {meetings.map((a) => (
                    <li key={a.id}>
                      <Link href={`/studio/meetings/${a.id}`} className="block rounded-2xl bg-paper px-4 py-3 hover:bg-sand">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium text-navy">{a.topic}</span>
                          <Status value={a.status} />
                        </span>
                        <span className="text-sm text-muted">{formatWhen(a.date, a.time)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Proposals">
              {leadProposals.length === 0 ? (
                <EmptyState title="No proposals yet" />
              ) : (
                <ul className="grid gap-2">
                  {leadProposals.map((p) => (
                    <Row key={p.id}>
                      <span>
                        <span className="block font-medium text-navy">{p.title}</span>
                        <span className="text-sm text-muted">{p.amount}</span>
                      </span>
                      <Status value={p.status} />
                    </Row>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card title="Activity">
            {trail.length + queued.length === 0 ? (
              <EmptyState title="No tracked activity" />
            ) : (
              <ul className="grid gap-2 text-sm">
                {queued.map((f) => (
                  <Row key={f.id}>
                    <span className="text-navy">Follow-up · {f.subject}</span>
                    <span className="text-muted">{f.scheduledFor}</span>
                  </Row>
                ))}
                {trail.map((c) => (
                  <Row key={c.id}>
                    <span className="text-navy">
                      {c.cta} <span className="text-muted">on {c.page}</span>
                    </span>
                    <span className="text-muted">{c.at}</span>
                  </Row>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <MeetingModal open={modal === "meeting"} onClose={() => setModal(null)} leadId={lead.id} />
      <ProposalModal open={modal === "proposal"} onClose={() => setModal(null)} leadId={lead.id} />
      <FollowUpModal open={modal === "follow"} onClose={() => setModal(null)} leadId={lead.id} />
      <LeadModal open={modal === "edit"} onClose={() => setModal(null)} item={lead} />
      <InviteModal
        open={modal === "invite"}
        onClose={() => {
          setModal(null);
          router.refresh();
        }}
        name={lead.name}
        email={lead.email}
        leadId={lead.id}
        defaultType={lead.company ? "Corporation" : "Individual"}
      />
    </div>
  );
}
