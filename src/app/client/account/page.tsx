"use client";

import { useState } from "react";
import { deleteMyAccount } from "@/app/actions";
import { Card, PageHeader } from "@/components/portal/Shell";
import { authClient } from "@/lib/auth/client";
import { Alert, Button, ButtonLink, Input, Label, formatDate } from "@/components/ui/kit";
import { useClientWorkspace } from "@/store/app-store";

export default function AccountPage() {
  const { client, clientDocuments, messages, clientAppointments } = useClientWorkspace();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onDelete() {
    setDeleting(true);
    setError(null);
    const result = await deleteMyAccount(confirm).catch(() => ({ ok: false as const, error: "Something went wrong. Please try again." }));
    if (!result.ok) {
      setDeleting(false);
      setError(result.error);
      return;
    }
    await authClient.signOut().catch(() => undefined);
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center">
        <h1 className="serif text-4xl font-semibold text-navy">Your account has been deleted</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Your portal login, documents, messages and upcoming appointments have been removed. A confirmation is on its way to your email.
        </p>
        <ButtonLink href="/" className="mt-8">
          Back to the website
        </ButtonLink>
      </div>
    );
  }

  const upcoming = clientAppointments.filter((a) => a.status === "scheduled").length;

  return (
    <>
      <PageHeader eyebrow="Settings" title="Account" description="Your details on file with Adept, and account controls." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Your details" description="To change these, message your bookkeeper.">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {[
              ["Name", client?.name],
              ["Email", client?.email],
              ["Business", client?.company || "—"],
              ["Phone", client?.phone || "—"],
              ["Client type", client?.type],
              ["Client since", formatDate(client?.since)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="mt-0.5 break-words text-navy">{v}</dd>
              </div>
            ))}
          </dl>
          <ButtonLink href="/client/messages" variant="soft" size="sm" className="mt-6">
            Message Adept
          </ButtonLink>
        </Card>

        <Card title="Delete account" description="Permanently close your client portal account.">
          <div className="rounded-2xl bg-danger-soft p-4 text-sm leading-relaxed text-danger">
            This can’t be undone. We’ll permanently delete:
            <ul className="mt-2 list-disc pl-5">
              <li>your portal login</li>
              <li>{clientDocuments.length} uploaded documents and receipts</li>
              <li>{messages.length} messages</li>
              <li>{upcoming} upcoming appointments (they’ll be cancelled)</li>
            </ul>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Adept may keep records it’s legally required to retain, such as filed tax returns.
          </p>
          <div className="mt-5 grid gap-3">
            <Label label='Type "DELETE" to confirm'>
              <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" placeholder="DELETE" />
            </Label>
            {error ? <Alert>{error}</Alert> : null}
            <Button variant="danger" loading={deleting} disabled={confirm.trim().toUpperCase() !== "DELETE"} onClick={onDelete}>
              Permanently delete my account
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
