"use client";

import { useState } from "react";
import { Check, Copy, Link2, Mail } from "lucide-react";
import { inviteClient, inviteLead, type InviteResult } from "@/app/portal-actions";
import { Modal } from "@/components/studio/Modal";
import { Alert, Button, Input, cx } from "@/components/ui/kit";
import type { Client } from "@/lib/types";

const PRESETS = [
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
  { label: "14 days", hours: 336 },
  { label: "30 days", hours: 720 },
];
const TYPES: Client["type"][] = ["Individual", "Sole proprietor", "Corporation"];

/** Sends a dedicated, expiring registration link. For a lead, it also creates their client folder. */
export function InviteModal({
  open,
  onClose,
  onSent,
  name,
  email,
  clientId,
  leadId,
  defaultType = "Individual",
}: {
  open: boolean;
  onClose: () => void;
  onSent?: (res: Extract<InviteResult, { ok: true }> & { clientId?: string }) => void;
  name: string;
  email: string;
  clientId?: string;
  leadId?: string;
  defaultType?: Client["type"];
}) {
  const [hours, setHours] = useState(168);
  const [custom, setCustom] = useState("");
  const [type, setType] = useState<Client["type"]>(defaultType);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Extract<InviteResult, { ok: true }> | null>(null);
  const [copied, setCopied] = useState(false);

  const effectiveHours = custom ? Number(custom) * 24 : hours;

  const close = () => {
    if (busy) return;
    setResult(null);
    setError("");
    setCustom("");
    onClose();
  };

  const send = async () => {
    setBusy(true);
    setError("");
    try {
      const res = leadId ? await inviteLead(leadId, type, effectiveHours) : await inviteClient(clientId!, effectiveHours);
      if (!res.ok) throw new Error(res.error);
      setResult(res);
      onSent?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t create the invite.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Modal open={open} onClose={close} title={result ? "Invite sent" : "Invite to the portal"} description={`${name} · ${email}`}>
      {result ? (
        <div className="grid gap-4">
          <Alert tone={result.emailed ? "success" : "info"}>
            {result.emailed
              ? `We emailed ${email} their registration link.`
              : `The link is ready, but the email didn’t send (${result.emailError ?? "email is off"}). Copy the link below and send it yourself.`}
          </Alert>
          <div className="flex items-center gap-2 rounded-2xl bg-sand p-2 pl-4">
            <Link2 className="h-4 w-4 shrink-0 text-gold-deep" />
            <span className="min-w-0 flex-1 truncate text-sm text-navy">{result.url}</span>
            <Button size="sm" variant={copied ? "primary" : "soft"} onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-sm text-muted">
            Works once, until{" "}
            {new Date(result.expiresAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Edmonton" })}. Sending a new invite cancels this one.
          </p>
          <div className="flex justify-end">
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5">
          {leadId ? (
            <div>
              <p className="mb-2 text-sm font-medium text-navy">Client type</p>
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-sand p-1">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cx("cursor-pointer rounded-xl px-2 py-2 text-sm font-medium transition-colors", type === t ? "bg-navy text-white" : "text-navy hover:bg-sand-2")}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">Sole proprietors and corporations get the business workspace with a monthly checklist.</p>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-medium text-navy">Link expires after</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.hours}
                  type="button"
                  onClick={() => {
                    setHours(p.hours);
                    setCustom("");
                  }}
                  className={cx(
                    "cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    !custom && hours === p.hours ? "bg-navy text-white" : "bg-sand text-navy hover:bg-sand-2",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-muted">
              Or custom:
              <Input type="number" min={1} max={90} value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 2))} className="w-20 py-1.5" aria-label="Custom days" />
              days
            </label>
          </div>

          <p className="flex items-start gap-2 text-sm text-muted">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            We’ll email a single-use link to create their login. Nobody can register without one.
          </p>
          {error ? <Alert>{error}</Alert> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={send} loading={busy} disabled={!effectiveHours || effectiveHours < 1}>
              Send invite
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
