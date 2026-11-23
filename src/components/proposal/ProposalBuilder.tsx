"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, BadgeCheck, Check, Copy, Download, Eye, Link2, MessageSquareText, Save, Send } from "lucide-react";
import { emailProposal, retrySignedPdf, saveProposalDetails } from "@/app/proposal-actions";
import { openStoredFile } from "@/components/portal/Uploader";
import { ProposalDocument } from "@/components/proposal/ProposalDocument";
import { Alert, Badge, Button, Input, Label, Textarea, cx, statusTone } from "@/components/ui/kit";
import { PACKAGES, QBO_PLANS, type ProposalDetails } from "@/lib/proposal-template";
import type { ProposalView } from "@/lib/proposals-server";

const selectClass = "h-11 w-full cursor-pointer rounded-xl bg-sand px-3 text-sm text-navy outline-none focus:bg-sand-2";

/** Studio: fill in the proposal template, preview it live, and send it to the client. */
export function ProposalBuilder({ proposal }: { proposal: ProposalView }) {
  const router = useRouter();
  const [d, setD] = useState<ProposalDetails>(proposal.details);
  const [busy, setBusy] = useState<"" | "save" | "send" | "retry">("");
  const [notice, setNotice] = useState<{ tone: "success" | "danger" | "info"; text: string } | null>(null);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const locked = !!proposal.signedAt;
  const set = <K extends keyof ProposalDetails>(k: K, v: ProposalDetails[K]) => setD((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setBusy("save");
    setNotice(null);
    const res = await saveProposalDetails(proposal.id, d).catch(() => ({ ok: false as const, error: "Couldn’t save." }));
    setBusy("");
    setNotice(res.ok ? { tone: "success", text: "Draft saved." } : { tone: "danger", text: res.error });
  };

  const send = async () => {
    setBusy("send");
    setNotice(null);
    setConfirmSend(false);
    const res = await emailProposal(proposal.id, d).catch(() => ({ ok: false as const, error: "Couldn’t send. Please try again." }));
    setBusy("");
    if (!res.ok) return setNotice({ tone: "danger", text: res.error });
    setLink(res.url);
    setNotice(
      res.emailed
        ? { tone: "success", text: `Sent to ${proposal.email}. They can accept, request changes or sign from the link.` }
        : { tone: "info", text: `The link is ready but the email didn’t send (${res.emailError ?? "email is off"}). Copy the link and send it yourself.` },
    );
    router.refresh();
  };

  const download = () => {
    if (proposal.documentKey) openStoredFile(proposal.documentKey);
    else setNotice({ tone: "danger", text: "The signed PDF isn’t available." });
  };

  const field = (label: string, k: keyof ProposalDetails, props: Partial<React.ComponentProps<typeof Input>> = {}) => (
    <Label label={label}>
      <Input value={String(d[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} disabled={locked} {...props} />
    </Label>
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/studio/proposals" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy">
            <ArrowLeft className="h-4 w-4" /> Proposals
          </Link>
          <h1 className="serif mt-2 text-4xl font-semibold text-navy">{d.businessName || d.clientName || "Proposal"}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Badge tone={statusTone(proposal.status)}>{proposal.status}</Badge>
            {proposal.email}
            {proposal.sentAt ? <span>· Sent {proposal.sentAt.slice(0, 10)}</span> : null}
            {proposal.viewedAt ? <span>· Opened {proposal.viewedAt.slice(0, 10)}</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {locked && !proposal.documentKey ? (
            <Button
              variant="gold"
              loading={busy === "retry"}
              onClick={async () => {
                setBusy("retry");
                const res = await retrySignedPdf(proposal.id).catch(() => ({ ok: false as const, error: "Couldn’t reach the server." }));
                setBusy("");
                setNotice(res.ok ? { tone: "success", text: "Signed PDF created, saved to the client’s Agreements and emailed." } : { tone: "danger", text: res.error });
                if (res.ok) router.refresh();
              }}
            >
              <Download className="h-4 w-4" /> Create signed PDF & send
            </Button>
          ) : locked ? (
            <Button onClick={download}>
              <Download className="h-4 w-4" /> Signed PDF
            </Button>
          ) : (
            <>
              <Button variant="soft" onClick={save} loading={busy === "save"}>
                <Save className="h-4 w-4" /> Save draft
              </Button>
              {confirmSend ? (
                <Button variant="gold" onClick={send} loading={busy === "send"}>
                  <Check className="h-4 w-4" /> Confirm: email {proposal.email || "client"}
                </Button>
              ) : (
                <Button onClick={() => setConfirmSend(true)} disabled={!proposal.email || !d.clientName.trim() || !d.monthlyFee.trim()}>
                  <Send className="h-4 w-4" /> {proposal.sentAt ? "Send updated proposal" : "Send to client"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {locked ? (
        <Alert tone="success">
          <span className="flex items-start gap-2">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Signed by {proposal.signedName} on {proposal.signedLabel} (IP {proposal.signedIp}). The client folder, onboarding
            tasks, monthly checklist and portal invite were set up automatically.
          </span>
        </Alert>
      ) : null}
      {proposal.status === "changes requested" || proposal.status === "declined" ? (
        <div className="flex items-start gap-3 rounded-2xl bg-warn-soft p-5 text-navy">
          <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">{proposal.status === "declined" ? "The client isn’t proceeding" : "The client asked for changes"}</p>
            {proposal.decisionNote ? <p className="mt-1 whitespace-pre-line">{proposal.decisionNote}</p> : null}
            {proposal.status === "changes requested" ? <p className="mt-2 text-sm text-muted">Update the details below, then send the updated proposal.</p> : null}
          </div>
        </div>
      ) : null}
      {notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}
      {link ? (
        <div className="flex items-center gap-2 rounded-2xl bg-white p-2 pl-4">
          <Link2 className="h-4 w-4 shrink-0 text-gold-deep" />
          <span className="min-w-0 flex-1 truncate text-sm text-navy">{link}</span>
          <Button
            size="sm"
            variant={copied ? "primary" : "soft"}
            onClick={async () => {
              await navigator.clipboard.writeText(link).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      ) : null}

      <div className="flex gap-1 rounded-full bg-sand p-1 xl:hidden">
        {(["edit", "preview"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cx("flex-1 cursor-pointer rounded-full py-2 text-sm font-medium", tab === t ? "bg-navy text-white" : "text-navy")}>
            {t === "edit" ? "Details" : (
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> Preview
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[400px_1fr]">
        <div className={cx("grid gap-5 rounded-3xl bg-white p-6 xl:sticky xl:top-6", tab === "preview" && "hidden xl:grid")}>
          <p className="font-semibold text-navy">Client</p>
          {field("Client name", "clientName")}
          {field("Business name", "businessName")}
          {field("Address or email (engagement letter)", "clientContact")}
          <Label label="Business type">
            <select className={selectClass} value={d.businessType} disabled={locked} onChange={(e) => set("businessType", e.target.value as ProposalDetails["businessType"])}>
              <option>Corporation</option>
              <option>Sole proprietor</option>
            </select>
          </Label>

          <p className="mt-2 font-semibold text-navy">Package & fees</p>
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-sand p-1">
            {PACKAGES.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={locked}
                onClick={() => setD((prev) => ({ ...prev, package: p.id, monthlyFee: p.fee }))}
                className={cx("cursor-pointer rounded-xl px-2 py-2 text-sm font-medium transition-colors", d.package === p.id ? "bg-navy text-white" : "text-navy hover:bg-sand-2")}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Monthly fee ($)", "monthlyFee", { inputMode: "decimal" })}
            {field("Onboarding fee ($)", "onboardingFee", { inputMode: "decimal", placeholder: "None" })}
          </div>
          {field("Payment terms", "paymentTerms")}

          <p className="mt-2 font-semibold text-navy">QuickBooks Online</p>
          <div className="grid grid-cols-2 gap-3">
            <Label label="Plan">
              <select className={selectClass} value={d.qboPlan} disabled={locked} onChange={(e) => set("qboPlan", e.target.value as ProposalDetails["qboPlan"])}>
                {QBO_PLANS.map((q) => (
                  <option key={q}>{q}</option>
                ))}
              </select>
            </Label>
            <Label label="Subscription paid by">
              <select className={selectClass} value={d.qboPaidBy} disabled={locked || d.qboPlan === "Not applicable"} onChange={(e) => set("qboPaidBy", e.target.value as ProposalDetails["qboPaidBy"])}>
                <option value="client">Client</option>
                <option value="adept">Adept (in fee)</option>
              </select>
            </Label>
          </div>

          <p className="mt-2 font-semibold text-navy">Engagement letter</p>
          <div className="grid grid-cols-2 gap-3">
            {field("Effective date", "effectiveDate", { type: "date" })}
            <Label label="Notice period (days)">
              <Input type="number" min={1} max={180} value={d.noticeDays} disabled={locked} onChange={(e) => set("noticeDays", Number(e.target.value) || 30)} />
            </Label>
          </div>
          {field("Prepared and signed by", "preparedBy")}
          <Label label="Personal note (optional)">
            <Textarea rows={3} value={d.note} disabled={locked} onChange={(e) => set("note", e.target.value)} placeholder="Shown near the top of the proposal" />
          </Label>
        </div>

        <div className={cx(tab === "edit" && "hidden xl:block")}>
          <div className="rounded-3xl bg-sand/60 p-3 sm:p-5">
            <ProposalDocument d={d} date={proposal.date} signed={locked ? { name: proposal.signedName!, label: proposal.signedLabel! } : null} />
          </div>
        </div>
      </div>
    </div>
  );
}
