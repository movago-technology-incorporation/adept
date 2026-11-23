"use client";

import { Mail, MessagesSquare, Phone } from "lucide-react";
import { Card, PageHeader } from "@/components/portal/Shell";
import { ButtonLink, formatDate } from "@/components/ui/kit";
import { useClientWorkspace } from "@/store/app-store";

export default function AccountPage() {
  const { client, firm } = useClientWorkspace();

  return (
    <>
      <PageHeader eyebrow="Settings" title="Account" description="Your details on file with Adept." />
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

        <Card title="Closing your account" description="Want to end your engagement or close your portal?">
          <p className="text-sm leading-relaxed text-muted">
            Please get in touch with us. We’ll confirm any outstanding work, make sure you have copies of your records, and close your account for you.
          </p>
          <div className="mt-5 grid gap-2">
            <ButtonLink href="/client/messages" size="sm">
              <MessagesSquare className="h-4 w-4" /> Send us a message
            </ButtonLink>
            {firm?.email ? (
              <a href={`mailto:${firm.email}`} className="inline-flex items-center gap-2 rounded-2xl bg-paper px-4 py-3 text-sm text-navy hover:bg-sand">
                <Mail className="h-4 w-4 text-gold" /> {firm.email}
              </a>
            ) : null}
            {firm?.phone ? (
              <a href={`tel:${firm.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 rounded-2xl bg-paper px-4 py-3 text-sm text-navy hover:bg-sand">
                <Phone className="h-4 w-4 text-gold" /> {firm.phone}
              </a>
            ) : null}
          </div>
        </Card>
      </div>
    </>
  );
}
