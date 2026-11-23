"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Alert, Button, Input, Label } from "@/components/ui/kit";

/** Invite-only sign-up: the email comes from the invite and the token unlocks registration. */
export function RegisterForm({ token, email, name }: { token: string; email: string; name: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") || "");
    if (password.length < 8) return setError("Use a password of at least 8 characters.");
    if (password !== String(data.get("confirm") || "")) return setError("The passwords don’t match.");
    setLoading(true);
    setError(null);
    const res = await authClient.signUp.email({
      email,
      password,
      name: String(data.get("name") || "").trim() || name,
      fetchOptions: { headers: { "x-invite-token": token } },
    });
    if (res.error) {
      setLoading(false);
      const m = (res.error.message || "").toLowerCase();
      setError(m.includes("exist") ? "An account with this email already exists. Sign in instead." : res.error.message || "Something went wrong. Please try again.");
      return;
    }
    // Full navigation so the server reads the new session and routes to the portal.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/portal");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Label label="Full name">
        <Input name="name" required autoComplete="name" defaultValue={name} />
      </Label>
      <Label label="Email">
        <Input name="email" type="email" value={email} readOnly className="text-muted" />
      </Label>
      <Label label="Password">
        <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
      </Label>
      <Label label="Confirm password">
        <Input name="confirm" type="password" required minLength={8} autoComplete="new-password" />
      </Label>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" size="lg" loading={loading} className="mt-2">
        Create account
      </Button>
    </form>
  );
}
