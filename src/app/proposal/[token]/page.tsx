import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BadgeCheck, Clock } from "lucide-react";
import { PRIVATE_METADATA } from "@/lib/seo";
import { getProposalByToken } from "@/lib/proposals-server";
import { ProposalDocument } from "@/components/proposal/ProposalDocument";
import { ProposalResponse } from "@/components/proposal/ProposalResponse";
import { ButtonLink } from "@/components/ui/kit";

export const metadata = { title: "Your proposal", ...PRIVATE_METADATA };

export default function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <main className="min-h-screen bg-paper">
      <div className="bg-navy">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link href="/" className="rounded-xl bg-white px-3 py-2" aria-label="Adept home">
            <Image src="/adept-logo.png" alt="Adept Bookkeeping Services" width={1364} height={608} className="h-8 w-auto" unoptimized />
          </Link>
          <span className="text-sm text-white/60">Private proposal</span>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-5">
        <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-3xl bg-white" aria-busy="true" />}>
          <Proposal params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function Proposal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const p = await getProposalByToken(token);

  if (!p) {
    return (
      <div className="rounded-3xl bg-white p-8">
        <Clock className="h-6 w-6 text-gold" />
        <h1 className="serif mt-4 text-4xl font-semibold text-navy">This link is no longer active</h1>
        <p className="mt-3 text-muted">Adept may have sent you an updated proposal. Check your latest email, or get in touch.</p>
        <ButtonLink href="/contact" className="mt-6">
          Contact Adept
        </ButtonLink>
      </div>
    );
  }

  const signed = p.signedLabel && p.signedName ? { name: p.signedName, label: p.signedLabel } : null;
  return (
    <div className="grid gap-8">
      <h1 className="sr-only">Bookkeeping proposal for {p.details.businessName || p.details.clientName}</h1>
      {signed ? (
        <div className="flex items-start gap-4 rounded-3xl bg-success-soft p-6">
          <BadgeCheck className="h-7 w-7 shrink-0 text-success" />
          <div>
            <p className="serif text-3xl font-semibold text-navy">Signed. Welcome to Adept!</p>
            <p className="mt-1 text-muted">
              A copy of your signed proposal and engagement letter has been emailed to you. Watch for your client portal invitation, where your onboarding checklist is waiting.
            </p>
          </div>
        </div>
      ) : null}
      <ProposalDocument d={p.details} date={p.date} signed={signed} />
      {!signed ? <ProposalResponse token={token} clientName={p.details.clientName} status={p.status} /> : null}
    </div>
  );
}
