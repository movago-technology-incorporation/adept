import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, FileSignature } from "lucide-react";
import { PageHeader } from "@/components/portal/Shell";
import { Badge, EmptyState, statusTone } from "@/components/ui/kit";
import { requirePageRole } from "@/lib/auth/viewer";
import { listClientProposals } from "@/lib/proposals-server";
import { longDate, money, pkg } from "@/lib/proposal-template";

export const metadata = { title: "Proposals" };

const LABEL: Record<string, string> = {
  sent: "Waiting for you",
  viewed: "Waiting for you",
  "changes requested": "Changes requested",
  accepted: "Signed",
  signed: "Signed",
  declined: "Not proceeding",
};

export default function ClientProposalsPage() {
  return (
    <>
      <PageHeader eyebrow="Work" title="Proposals" description="Proposals and engagement letters from Adept. Review, accept and sign them here." />
      <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-white" aria-busy="true" />}>
        <ProposalList />
      </Suspense>
    </>
  );
}

async function ProposalList() {
  const viewer = await requirePageRole("client");
  const proposals = await listClientProposals(viewer.clientId);
  return (
    <>
      {proposals.length === 0 ? (
        <EmptyState title="No proposals yet" body="When Adept sends you a proposal, it appears here as well as in your email." />
      ) : (
        <ul className="grid gap-3">
          {proposals.map((p) => {
            const label = LABEL[p.status] ?? p.status;
            return (
              <li key={p.id}>
                <Link href={`/client/proposals/${p.id}`} className="flex items-center gap-4 rounded-3xl bg-white p-5 transition-colors hover:bg-sand sm:p-6">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sand text-navy">
                    <FileSignature className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-navy">
                      {pkg(p.details.package).name} bookkeeping · {money(p.details.monthlyFee)} / month
                    </span>
                    <span className="block text-sm text-muted">Sent {longDate(p.date)}</span>
                  </span>
                  <Badge tone={label === "Waiting for you" ? "gold" : statusTone(p.status)}>{label}</Badge>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
