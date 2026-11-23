import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { ProposalDocument } from "@/components/proposal/ProposalDocument";
import { ProposalResponse } from "@/components/proposal/ProposalResponse";
import { requirePageRole } from "@/lib/auth/viewer";
import { getClientProposal } from "@/lib/proposals-server";

export const metadata = { title: "Proposal" };

export default function ClientProposalPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-3xl bg-white" aria-busy="true" />}>
      <ClientProposal params={params} />
    </Suspense>
  );
}

async function ClientProposal({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requirePageRole("client");
  const { id } = await params;
  const p = await getClientProposal(viewer.clientId, id);
  if (!p) notFound();
  const signed = p.signedLabel && p.signedName ? { name: p.signedName, label: p.signedLabel } : null;

  return (
    <div className="grid gap-6">
      <Link href="/client/proposals" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Proposals
      </Link>
      <h1 className="sr-only">Your bookkeeping proposal</h1>
      {signed ? (
        <div className="flex items-start gap-4 rounded-3xl bg-success-soft p-6">
          <BadgeCheck className="h-7 w-7 shrink-0 text-success" />
          <div>
            <p className="serif text-3xl font-semibold text-navy">Signed</p>
            <p className="mt-1 text-muted">
              You signed this on {signed.label}. The signed PDF is in{" "}
              <Link href="/client/agreements" className="font-medium text-navy underline underline-offset-4">
                Agreements
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}
      <ProposalDocument d={p.details} date={p.date} signed={signed} />
      {!signed ? <ProposalResponse proposalId={p.id} clientName={p.details.clientName} status={p.status} /> : null}
    </div>
  );
}
