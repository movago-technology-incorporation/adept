"use client";
import { Mail } from "lucide-react";
import { composeHref } from "@/lib/email-recipients";

import { Pencil } from "lucide-react";
import { use, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ClientModal } from "@/components/studio/ClientModal";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Card, PageHeader, Row, Status } from "@/components/portal/Shell";
import { DocumentList } from "@/components/client/DocumentList";
import { AddButton } from "@/components/studio/Modal";
import { JobModal } from "@/components/studio/JobModal";
import { MeetingModal } from "@/components/studio/MeetingModal";
import { ProposalModal } from "@/components/studio/ProposalModal";
import { Button, EmptyState, Input, formatDate, formatWhen, IconButton } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";

export default function ClientFolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { clients, documents, jobs, proposals, forms, appointments, messages, completeJob, addMessage, deleteClient } = useApp();
  const router = useRouter();
  const [reply, setReply] = useState("");
  const client = clients.find((row) => row.id === id);
  const [modal, setModal] = useState<null | "job" | "meeting" | "proposal" | "edit">(null);
  if (!client) notFound();

  const files = documents.filter((d) => d.clientId === client.id);
  const clientJobs = jobs.filter((j) => j.clientId === client.id);
  const clientProposals = proposals.filter((p) => p.clientId === client.id);
  const outstanding = forms.filter((f) => f.clientId === client.id && f.status !== "completed");
  const meetings = appointments.filter((a) => a.clientId === client.id);
  const thread = messages.filter((m) => m.clientId === client.id).slice(-4).reverse();

  return (
    <div className="grid gap-6">
      <PageHeader
        back={{ href: "/studio/clients", label: "All clients" }}
        title={client.company || client.name}
        description={
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <span>{client.name}</span>
            <a href={`mailto:${client.email}`} className="hover:text-navy">
              {client.email}
            </a>
            {client.phone ? <span>{client.phone}</span> : null}
            <span>
              {client.type} · since {formatDate(client.since)}
            </span>
          </span>
        }
        actions={
          <>
            <AddButton variant="gold" onClick={() => router.push(composeHref([{ kind: "client", id: client.id }]))}>
              <Mail className="h-4 w-4" />
              Email
            </AddButton>
            <AddButton onClick={() => setModal("meeting")}>Schedule meeting</AddButton>
            <AddButton variant="soft" onClick={() => setModal("job")}>
              Job
            </AddButton>
            <AddButton variant="soft" onClick={() => setModal("proposal")}>
              Proposal
            </AddButton>
            <IconButton label="Edit" onClick={() => setModal("edit")}>
<Pencil className="h-4 w-4" />
</IconButton>
            <ConfirmButton
              confirmLabel="Delete client, files and login"
              onConfirm={() => {
                deleteClient(client.id);
                router.push("/studio/clients");
              }} label="Delete" />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Jobs">
          {clientJobs.length === 0 ? (
            <EmptyState title="No jobs yet" />
          ) : (
            <ul className="grid gap-2">
              {clientJobs.map((job) => (
                <Row key={job.id}>
                  <span>
                    <span className="block font-medium text-navy">{job.title}</span>
                    <span className="mt-1 inline-block">
                      <Status value={job.status} />
                    </span>
                  </span>
                  {job.status !== "completed" ? (
                    <Button size="sm" onClick={() => completeJob(job.id)}>
                      Mark complete
                    </Button>
                  ) : (
                    <span className="text-xs text-muted">Thank-you and review ask sent</span>
                  )}
                </Row>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Outstanding from client">
          {outstanding.length === 0 ? (
            <EmptyState title="Nothing outstanding" />
          ) : (
            <ul className="grid gap-2">
              {outstanding.map((f) => (
                <Row key={f.id}>
                  <span className="font-medium text-navy">{f.title}</span>
                  <span className="text-sm text-muted">Due {formatDate(f.due)}</span>
                </Row>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Documents" description={`${files.length} files in this folder`}>
        <DocumentList rows={files} empty="No documents yet" emptyBody="Files the client uploads in their portal land here." />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Meetings">
          {meetings.length === 0 ? (
            <EmptyState title="No meetings" />
          ) : (
            <ul className="grid gap-2">
              {meetings.map((a) => (
                <li key={a.id}>
                  <Link href={`/studio/meetings/${a.id}`} className="block rounded-2xl bg-paper px-4 py-3 hover:bg-sand">
                    <span className="block font-medium text-navy">{a.topic}</span>
                    <span className="text-sm text-muted">{formatWhen(a.date, a.time)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Proposals">
          {clientProposals.length === 0 ? (
            <EmptyState title="No proposals" />
          ) : (
            <ul className="grid gap-2">
              {clientProposals.map((p) => (
                <Row key={p.id}>
                  <span className="font-medium text-navy">{p.title}</span>
                  <Status value={p.status} />
                </Row>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Messages">
          <form
            className="mb-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!reply.trim()) return;
              addMessage(reply.trim(), "adept", client.id);
              setReply("");
            }}
          >
            <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to client…" className="py-2" aria-label="Reply to client" />
            <Button type="submit" size="sm" disabled={!reply.trim()}>
              Send
            </Button>
          </form>
          {thread.length === 0 ? (
            <EmptyState title="No messages" />
          ) : (
            <ul className="grid gap-2 text-sm">
              {thread.map((m) => (
                <li key={m.id} className="rounded-2xl bg-paper px-4 py-3">
                  <p className="text-xs text-muted">
                    {m.author === "client" ? client.name : "Adept"} · {m.at}
                  </p>
                  <p className="mt-1 line-clamp-3 text-ink/85">{m.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <JobModal open={modal === "job"} onClose={() => setModal(null)} clientId={client.id} />
      <MeetingModal open={modal === "meeting"} onClose={() => setModal(null)} clientId={client.id} />
      <ProposalModal open={modal === "proposal"} onClose={() => setModal(null)} clientId={client.id} />
      <ClientModal open={modal === "edit"} onClose={() => setModal(null)} item={client} />
    </div>
  );
}
