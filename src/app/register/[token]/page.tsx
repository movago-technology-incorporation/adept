import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Clock, ShieldCheck } from "lucide-react";
import { PRIVATE_METADATA } from "@/lib/seo";
import { findInvite } from "@/lib/invites";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ButtonLink } from "@/components/ui/kit";

export const metadata = { title: "Create your account", ...PRIVATE_METADATA };

export default function RegisterPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" aria-label="Back to Adept home" className="mb-8 inline-flex rounded-xl bg-white px-3 py-2">
          <Image src="/adept-logo.png" alt="Adept Bookkeeping Services" width={1364} height={608} className="h-9 w-auto" unoptimized />
        </Link>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white" aria-busy="true" />}>
          <Invite params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function Invite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await findInvite(token);

  if (!invite) {
    return (
      <div className="rounded-3xl bg-white p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sand text-navy">
          <Clock className="h-5 w-5" />
        </span>
        <h1 className="serif mt-6 text-4xl font-semibold text-navy">This link has expired</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Invite links work once and only for a limited time. Ask Adept to send you a new one, or sign in if you’ve already set up your account.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/login">Sign in</ButtonLink>
          <ButtonLink href="/contact" variant="soft">
            Contact Adept
          </ButtonLink>
        </div>
      </div>
    );
  }

  const expires = new Date(invite.expiresAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Edmonton" });
  return (
    <div className="rounded-3xl bg-white p-8">
      <p className="flex items-center gap-2 text-sm font-medium text-gold-deep">
        <ShieldCheck className="h-4 w-4" /> Invitation from Adept
      </p>
      <h1 className="serif mt-3 text-4xl font-semibold text-navy">Create your account</h1>
      <p className="mt-2 text-muted">Set a password to open your secure client portal. This link works until {expires}.</p>
      <div className="mt-8">
        <RegisterForm token={token} email={invite.email} name={invite.name} />
      </div>
    </div>
  );
}
