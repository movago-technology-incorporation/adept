// Plain (server + client safe) helpers for the Studio email composer's ?to= parameter.

export type EmailRecipient = { kind: "client" | "lead"; id: string };

/** Link to the full-page composer, optionally with recipients pre-filled. */
export function composeHref(to: EmailRecipient[] = []) {
  return to.length ? `/studio/email/new?to=${encodeURIComponent(to.map((r) => `${r.kind}:${r.id}`).join(","))}` : "/studio/email/new";
}

/** Parses `client:ID,lead:ID` into recipients, ignoring anything malformed. */
export function parseRecipients(param?: string | null): EmailRecipient[] {
  return (param ?? "")
    .split(",")
    .map((part) => part.trim().split(":"))
    .filter(([kind, id]) => (kind === "client" || kind === "lead") && Boolean(id))
    .map(([kind, id]) => ({ kind: kind as EmailRecipient["kind"], id }));
}
