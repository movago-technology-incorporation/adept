"use client";

import { FormEvent, useState } from "react";
import { MailCheck } from "lucide-react";
import { resendVerificationCode, verifyMyAccount } from "@/app/actions";
import { authClient } from "@/lib/auth/client";
import { Alert, Button } from "@/components/ui/kit";

export function VerifyForm({ email }: { email: string }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await verifyMyAccount(code).catch(() => ({ ok: false as const, error: "Something went wrong. Please try again." }));
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    // Activated — /portal creates the client folder and routes to the workspace.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/portal");
  }

  async function resend() {
    setError(null);
    setNotice(null);
    const result = await resendVerificationCode().catch(() => ({ ok: false as const, error: "Something went wrong. Please try again." }));
    if (result.ok) setNotice(`A new code is on its way to ${email}.`);
    else setError(result.error);
  }

  return (
    <div className="w-full rounded-3xl bg-white p-8 sm:p-10">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-navy text-gold-soft">
        <MailCheck className="h-6 w-6" />
      </span>
      <h1 className="serif mt-6 text-4xl font-semibold text-navy">Confirm your email</h1>
      <p className="mt-2 leading-relaxed text-muted">
        We sent a 6-character code to <strong className="text-navy">{email}</strong>. Enter it below to activate your account.
      </p>
      <form onSubmit={onSubmit} className="mt-8 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-navy">Verification code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
            inputMode="text"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
            required
            placeholder="ABC123"
            aria-label="6-character verification code"
            className="w-full rounded-2xl bg-sand px-4 py-4 text-center font-mono text-3xl font-bold tracking-[0.4em] text-navy uppercase outline-none placeholder:text-muted/40 focus:bg-gold-soft/50"
          />
        </label>
        {error ? <Alert>{error}</Alert> : null}
        {notice ? <Alert tone="success">{notice}</Alert> : null}
        <Button type="submit" size="lg" loading={busy} disabled={code.length !== 6}>
          Activate account
        </Button>
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <button type="button" onClick={resend} className="text-gold-deep hover:text-navy">
          Send a new code
        </button>
        <button
          type="button"
          onClick={async () => {
            await authClient.signOut().catch(() => undefined);
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.assign("/login");
          }}
          className="text-muted hover:text-navy"
        >
          Use a different account
        </button>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-muted">Can’t find it? Check your spam folder. Codes expire after 30 minutes.</p>
    </div>
  );
}
