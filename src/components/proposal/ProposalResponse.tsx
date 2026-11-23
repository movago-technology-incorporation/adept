"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageSquareText, PenLine, XCircle } from "lucide-react";
import { acceptAndSign, respondToMyProposal, respondToProposal, signMyProposal } from "@/app/proposal-actions";
import { Alert, Button, Input, Textarea, cx } from "@/components/ui/kit";

type Step = "choose" | "sign" | "changes" | "decline";

/** The "Client decision" box: accept + e-sign, request changes, or not proceeding. */
/** Pass `token` for the emailed link, or `proposalId` inside the signed-in client portal. */
export function ProposalResponse({ token, proposalId, clientName, status }: { token?: string; proposalId?: string; clientName: string; status: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [name, setName] = useState(clientName);
  const [agreed, setAgreed] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | "changes" | "declined">(null);

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, after: () => void) => {
    setBusy(true);
    setError("");
    try {
      const res = await fn();
      if (!res.ok) throw new Error(res.error);
      after();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done || status === "changes requested" || status === "declined") {
    const changes = (done ?? status) === "changes" || status === "changes requested";
    return (
      <div className="rounded-3xl bg-white p-6 sm:p-8">
        <p className="serif text-3xl font-semibold text-navy">{changes ? "Thanks, we’ll be in touch" : "Thanks for letting us know"}</p>
        <p className="mt-2 text-muted">
          {changes ? "Adept has your notes and will send you an updated proposal." : "We’ve let Adept know. If anything changes, just reply to the proposal email."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-navy p-6 text-white sm:p-8" id="decision">
      <p className="eyebrow text-gold-soft">Client decision</p>
      {step === "choose" ? (
        <>
          <p className="serif mt-2 text-3xl leading-tight font-semibold sm:text-4xl">Ready to make it official?</p>
          <p className="mt-2 text-white/70">Accept the recommended package and sign the engagement letter online. It takes about a minute.</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <button type="button" onClick={() => setStep("sign")} className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 font-semibold text-navy hover:bg-gold-soft">
              <CheckCircle2 className="h-5 w-5" /> Accept & sign
            </button>
            <button type="button" onClick={() => setStep("changes")} className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-3 font-medium hover:bg-white/20">
              <MessageSquareText className="h-5 w-5" /> Request changes
            </button>
            <button type="button" onClick={() => setStep("decline")} className="flex cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-3 font-medium text-white/70 hover:bg-white/10 hover:text-white">
              <XCircle className="h-5 w-5" /> Not proceeding
            </button>
          </div>
        </>
      ) : step === "sign" ? (
        <form
          className="mt-3 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              () => (proposalId ? signMyProposal(proposalId, name, agreed) : acceptAndSign(token!, name, agreed)),
              () => router.refresh(),
            );
          }}
        >
          <p className="serif text-3xl font-semibold">Sign the engagement letter</p>
          <label className="grid gap-1.5 text-sm text-white/75">
            Type your full legal name
            <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="bg-white text-navy" />
          </label>
          {name.trim().length > 1 ? (
            <p className="rounded-2xl bg-white/10 px-5 py-4 text-3xl text-gold-soft" style={{ fontFamily: "var(--font-serif), cursive", fontStyle: "italic" }}>
              {name}
            </p>
          ) : null}
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/80">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 cursor-pointer accent-[#b8914a]" />
            I have read the proposal and engagement letter above, agree to the scope and fees, and authorize Adept to begin on the effective date. I agree that typing my name is my electronic signature.
          </label>
          {error ? <Alert>{error}</Alert> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="gold" size="lg" loading={busy} disabled={!agreed || name.trim().length < 2}>
              <PenLine className="h-5 w-5" /> Sign and accept
            </Button>
            <Button variant="light" size="lg" onClick={() => setStep("choose")} disabled={busy}>
              Back
            </Button>
          </div>
        </form>
      ) : (
        <form
          className="mt-3 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const decision = step === "changes" ? "changes" : "declined";
            void run(
              () => (proposalId ? respondToMyProposal(proposalId, decision, note) : respondToProposal(token!, decision, note)),
              () => setDone(decision),
            );
          }}
        >
          <p className="serif text-3xl font-semibold">{step === "changes" ? "What would you like changed?" : "Not proceeding"}</p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            required={step === "changes"}
            placeholder={step === "changes" ? "e.g. a different package, start date or payment terms" : "Optional: anything you’d like us to know"}
            className="bg-white text-navy"
          />
          {error ? <Alert>{error}</Alert> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant={step === "changes" ? "gold" : "light"} size="lg" loading={busy}>
              {step === "changes" ? "Send to Adept" : "Confirm"}
            </Button>
            <Button variant="ghost" size="lg" className={cx("text-white hover:bg-white/10")} onClick={() => setStep("choose")} disabled={busy}>
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
