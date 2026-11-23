import Link from "next/link";
import { Suspense } from "react";
import { FileSignature } from "lucide-react";
import { ClientHome } from "@/components/client/ClientHome";
import { requirePageRole } from "@/lib/auth/viewer";
import { listClientProposals } from "@/lib/proposals-server";
import { money, pkg } from "@/lib/proposal-template";

export default function ClientOverviewPage() {
  return (
    <div className="grid gap-6">
      <Suspense fallback={null}>
        <WaitingProposals />
      </Suspense>
      <ClientHome />
    </div>
  );
}

/** A proposal awaiting the client's answer, front and centre on their dashboard. */
async function WaitingProposals() {
  const viewer = await requirePageRole("client");
  const waiting = (await listClientProposals(viewer.clientId)).filter((p) => !p.signedAt && (p.status === "sent" || p.status === "viewed"));
  return waiting.map((p) => (
    <Link
      key={p.id}
      href={`/client/proposals/${p.id}`}
      className="group flex flex-col gap-4 rounded-3xl bg-navy p-6 text-white transition-colors hover:bg-navy-2 sm:flex-row sm:items-center sm:justify-between sm:p-8"
    >
      <div className="flex gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold text-navy">
          <FileSignature className="h-5 w-5" />
        </span>
        <div>
          <p className="eyebrow text-gold-soft">Proposal waiting for you</p>
          <p className="serif mt-1 text-3xl font-semibold">
            {pkg(p.details.package).name} bookkeeping · {money(p.details.monthlyFee)} / month
          </p>
          <p className="mt-1 text-white/70">Review your proposal and engagement letter, then accept and sign online.</p>
        </div>
      </div>
      <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-gold px-5 font-semibold text-navy">Review & sign →</span>
    </Link>
  ));
}
