"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, Copy, ExternalLink, KeyRound, ShieldCheck, X } from "lucide-react";
import { cx } from "@/components/ui/kit";
import type { YesNo } from "@/lib/tax-return";

export const CRA_REP_ID = "TJ2D6CP";
const CRA_MY_ACCOUNT = "https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-individuals/account-individuals.html";

const STEPS = [
  "Sign in to CRA My Account.",
  "Open Profile, then Authorized representatives, and choose Add a representative.",
  `Enter our RepID ${CRA_REP_ID}.`,
  "Choose Level 2 authorization, then submit.",
];

/** Asks a client to add Adept as their CRA representative (RepID + Level 2), then whether they've done it. */
export function CraRepModal({
  open,
  value,
  onChange,
  onClose,
}: {
  open: boolean;
  value: YesNo;
  onChange: (v: YesNo) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CRA_REP_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="cra-rep-title">
      <button type="button" className="absolute inset-0 bg-navy/65" aria-label="Close" onClick={onClose} />
      <div className="rise relative z-10 max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-paper sm:max-w-xl sm:rounded-3xl">
        {/* Header */}
        <div className="relative bg-navy px-6 pt-7 pb-8 text-white sm:px-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-5 right-5 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold text-navy">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <p className="mt-5 text-xs font-semibold tracking-[0.18em] text-gold-soft uppercase">One more step</p>
          <h2 id="cra-rep-title" className="serif mt-2 text-3xl leading-tight font-semibold sm:text-4xl">
            Please add us as your representative with the CRA
          </h2>
          <p className="mt-3 leading-relaxed text-white/70">
            Since Adept didn’t file your last return, we need access to your CRA account to see your slips, carry-forwards and past
            assessments.
          </p>
        </div>

        <div className="grid gap-5 p-6 sm:p-8">
          {/* RepID */}
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5">
            <div className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sand text-navy">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Our RepID</p>
                <p className="font-mono text-2xl font-semibold tracking-[0.2em] text-navy sm:text-3xl">{CRA_REP_ID}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={copy}
              className={cx(
                "inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                copied ? "bg-navy text-white" : "bg-sand text-navy hover:bg-sand-2",
              )}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-gold/15 px-5 py-4 text-navy">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold font-semibold text-navy">2</span>
            <p className="text-[15px] leading-snug">
              Choose <strong>Level 2</strong> authorization. It lets us view your account and act on your behalf for this filing.
            </p>
          </div>

          {/* Steps */}
          <ol className="grid gap-3">
            {STEPS.map((s, i) => (
              <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sand text-xs font-semibold text-navy">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <a
            href={CRA_MY_ACCOUNT}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-navy underline decoration-gold underline-offset-4 hover:decoration-navy"
          >
            Open CRA My Account <ExternalLink className="h-4 w-4" />
          </a>

          {/* Confirmation */}
          <div className="rounded-2xl bg-white p-5">
            <p className="font-semibold text-navy">Have you added Adept as your representative?</p>
            <div role="radiogroup" aria-label="Have you added Adept as your representative?" className="mt-4 grid grid-cols-2 gap-2">
              {(["yes", "no"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={value === v}
                  onClick={() => onChange(v)}
                  className={cx(
                    "inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors",
                    value === v ? "bg-navy text-white" : "bg-sand text-navy hover:bg-sand-2",
                  )}
                >
                  {value === v ? <Check className="h-4 w-4" /> : null}
                  {v === "yes" ? "Yes, I’ve added it" : "Not yet"}
                </button>
              ))}
            </div>
            {value === "no" ? (
              <p className="mt-4 flex gap-2 text-sm leading-relaxed text-muted">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                No problem. You can keep going, but please add it soon. We can’t file your return until we have access.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={!value}
            className="inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-gold px-6 font-semibold text-navy transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {value ? "Continue" : "Choose an answer to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
