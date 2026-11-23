import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/auth/viewer";
import { getProposal } from "@/lib/proposals-server";
import { ProposalBuilder } from "@/components/proposal/ProposalBuilder";

export const metadata = { title: "Proposal" };

export default function StudioProposalPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-3xl bg-white" aria-busy="true" />}>
      <Proposal params={params} />
    </Suspense>
  );
}

async function Proposal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePageRole("staff");
  const p = await getProposal(id);
  if (!p) notFound();
  return <ProposalBuilder proposal={p} />;
}
