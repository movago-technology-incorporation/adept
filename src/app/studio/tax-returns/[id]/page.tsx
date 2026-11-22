import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { TaxReturnSummary } from "@/components/tax/TaxReturnSummary";
import { TaxReturnStatusControl } from "@/components/studio/TaxReturnStatus";
import { buttonClass } from "@/components/ui/kit";
import { requirePageRole } from "@/lib/auth/viewer";
import { getReturnById } from "@/lib/tax-return-server";

export const metadata = { title: "Tax return" };

export default async function StudioTaxReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePageRole("staff");
  const r = await getReturnById(id);
  if (!r) notFound();

  return (
    <>
      <Link href="/studio/tax-returns" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Tax returns
      </Link>
      <div className="mt-4 rounded-3xl bg-navy p-6 text-white sm:p-8">
        <p className="eyebrow text-gold-soft">{r.taxYear} personal income tax return</p>
        <h1 className="serif mt-2 text-4xl font-semibold sm:text-5xl">{r.clientName}</h1>
        <p className="mt-1 text-white/65">
          {r.company ? `${r.company} · ` : ""}
          {r.email} · {r.submittedAt ? `Submitted ${r.submittedAt}` : `Draft, last saved ${r.updatedAt}`}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <TaxReturnStatusControl id={r.id} status={r.status} clientId={r.clientId} clientName={r.clientName} email={r.email} year={r.taxYear} />
          <Link href={`/studio/clients/${r.clientId}`} className={buttonClass("light", "sm")}>
            <FolderOpen className="h-4 w-4" /> Client folder
          </Link>
        </div>
      </div>
      <div className="mt-6">
        <TaxReturnSummary data={r.data} year={r.taxYear} revealSin />
      </div>
    </>
  );
}
