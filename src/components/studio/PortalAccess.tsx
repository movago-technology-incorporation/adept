"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Clock, KeyRound, Send } from "lucide-react";
import { getPortalStatus } from "@/app/portal-actions";
import { InviteModal } from "@/components/studio/InviteModal";
import { Button } from "@/components/ui/kit";
import type { Client } from "@/lib/types";

type Status = Awaited<ReturnType<typeof getPortalStatus>>;
const when = (iso: string) => new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Edmonton" });

/** Studio: whether a client can sign in, plus sending or re-sending their invite link. */
export function PortalAccess({ client }: { client: Client }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [open, setOpen] = useState(false);
  const load = useCallback(() => getPortalStatus(client.id).then(setStatus).catch(() => {}), [client.id]);
  useEffect(() => {
    void load();
  }, [load]);

  if (!status) return <div className="h-16 animate-pulse rounded-2xl bg-sand/60" />;

  const live = status.invite && !status.invite.usedAt && !status.invite.revoked && new Date(status.invite.expiresAt) > new Date();
  const [Icon, title, body] = status.active
    ? [BadgeCheck, "Portal active", "This client has a login and can use their portal."]
    : live
      ? [Clock, "Invite sent", `Sent ${when(status.invite!.sentAt)} · expires ${when(status.invite!.expiresAt)}`]
      : status.invite
        ? [Clock, "Invite expired", `The last link expired ${when(status.invite.expiresAt)}.`]
        : [KeyRound, "Not invited yet", "Send a dedicated link so they can create their login."];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${status.active ? "bg-success-soft text-success" : "bg-sand text-navy"}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <span className="block font-semibold text-navy">{title}</span>
          <span className="block text-sm text-muted">{body}</span>
        </span>
      </div>
      {!status.active ? (
        <Button size="sm" variant={live ? "soft" : "primary"} onClick={() => setOpen(true)}>
          <Send className="h-4 w-4" /> {status.invite ? "Send new invite" : "Send invite"}
        </Button>
      ) : null}
      <InviteModal
        open={open}
        onClose={() => {
          setOpen(false);
          void load();
        }}
        name={client.name}
        email={client.email}
        clientId={client.id}
      />
    </div>
  );
}
