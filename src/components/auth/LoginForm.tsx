"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Alert, Button, Input, Label } from "@/components/ui/kit";

type Mode = "signin" | "forgot" | "reset";

function friendly(message?: string | null) {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid email or password") || m.includes("invalid password") || m.includes("credential"))
    return "That email and password don’t match. Try again or reset your password.";
  if (m.includes("already") && m.includes("exist")) return "An account with this email already exists. Sign in instead.";
  if (m.includes("password") && (m.includes("short") || m.includes("least"))) return "Use a password of at least 8 characters.";
  if (m.includes("otp") || m.includes("code")) return "That code isn’t right or has expired. Request a new one.";
  if (m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  return message || "Something went wrong. Please try again.";
}

export function LoginForm() {
  // Accounts are created from Adept’s invite links (/register/…), so this form only signs in.
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchTo(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  // Full navigation so the server reads the new session cookie and routes by role.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  const enterPortal = () => window.location.assign("/portal");

  async function run(fn: () => Promise<void>) {
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(friendly((err as Error).message));
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") || "");

    if (mode === "signin") {
      await run(async () => {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message);
        enterPortal();
      });

    } else if (mode === "forgot") {
      await run(async () => {
        const res = await authClient.emailOtp.sendVerificationOtp({ email, type: "forget-password" });
        if (res.error) throw new Error(res.error.message);
        setMode("reset");
        setNotice(`We sent a 6-digit code to ${email}. It expires in a few minutes.`);
      });
    } else {
      await run(async () => {
        if (password.length < 8) throw new Error("Password must be at least 8 characters");
        const res = await authClient.emailOtp.resetPassword({ email, otp: String(data.get("otp") || "").trim(), password });
        if (res.error) throw new Error(res.error.message);
        const signIn = await authClient.signIn.email({ email, password });
        if (signIn.error) {
          switchTo("signin");
          setNotice("Password updated. Please sign in.");
          return;
        }
        enterPortal();
      });
    }
  }

  const titles: Record<Mode, [string, string]> = {
    signin: ["Welcome back", "Sign in to your Adept workspace."],
    forgot: ["Reset your password", "We’ll email you a one-time code."],
    reset: ["Choose a new password", "Enter the code from your email."],
  };

  return (
    <div>
      <h1 className="serif text-4xl font-semibold text-navy">{titles[mode][0]}</h1>
      <p className="mt-2 text-muted">{titles[mode][1]}</p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-4" noValidate={false}>
        <Label label="Email">
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            readOnly={mode === "reset"}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Label>

        {mode === "reset" ? (
          <Label label="6-digit code">
            <Input name="otp" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} className="tracking-[0.4em]" />
          </Label>
        ) : null}

        {mode !== "forgot" ? (
          <Label
            label={mode === "reset" ? "New password" : "Password"}
            hint={mode === "reset" ? "At least 8 characters." : undefined}
          >
            <Input
              name="password"
              type="password"
              required
              minLength={mode === "signin" ? undefined : 8}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </Label>
        ) : null}

        {mode === "signin" ? (
          <button type="button" onClick={() => switchTo("forgot")} className="justify-self-start text-sm text-gold-deep hover:text-navy">
            Forgot your password?
          </button>
        ) : null}

        {notice ? <Alert tone="success">{notice}</Alert> : null}
        {error ? <Alert>{error}</Alert> : null}

        <Button type="submit" size="lg" loading={loading} className="mt-2">
          {mode === "signin" ? "Sign in"  : mode === "forgot" ? "Send code" : "Update password"}
        </Button>

        {mode === "forgot" || mode === "reset" ? (
          <button type="button" onClick={() => switchTo("signin")} className="text-sm text-muted hover:text-navy">
            ← Back to sign in
          </button>
        ) : null}
      </form>

      {mode === "signin" ? (
        <p className="mt-6 text-xs leading-relaxed text-muted">
          New to Adept? Portal accounts are set up by invitation. Check your email for an invite link, or{" "}
          <a href="/contact" className="font-medium text-navy underline underline-offset-4">
            contact us
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}
