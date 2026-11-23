import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, MessagesSquare } from "lucide-react";
import { TaxReturnSummary } from "@/components/tax/TaxReturnSummary";
import { TaxReturnWizard } from "@/components/tax/TaxReturnWizard";
import { buttonClass, cx } from "@/components/ui/kit";
import { requirePageRole } from "@/lib/auth/viewer";
import { db } from "@/lib/db";
import { emptyReturn } from "@/lib/tax-return";
import { filingYears, getClientReturn } from "@/lib/tax-return-server";
import { submitOpensOn } from "@/lib/tax-season";

export const metadata = { title: "Tax return" };

const STAGES = [
  { key: "submitted", label: "Received" },
  { key: "in_progress", label: "Being prepared" },
  { key: "done", label: "Completed" },
];

export default function TaxReturnYearPage({ params }: { params: Promise<{ year: string }> }) {
  return (
    <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-3xl bg-white" aria-busy="true" />}>
      <TaxReturnYearPageContent params={params} />
    </Suspense>
  );
}

async function TaxReturnYearPageContent({ params }: { params: Promise<{ year: string }> }) {
  // Auth first: it reads the session (request-time), so the current-date check below runs per request.
  const viewer = await requirePageRole("client");
  const { year: raw } = await params;
  const year = Number(raw);
  if (!(await filingYears()).includes(year)) notFound();
  const existing = await getClientReturn(viewer.clientId, year);

  if (!existing || existing.status === "draft") {
    // Pre-fill contact details from the client's profile on a fresh return.
    let initial = existing?.data;
    if (!initial) {
      const [c] = await db()`SELECT name, email, phone FROM clients WHERE id = ${viewer.clientId}`;
      const [firstName = "", ...rest] = String(c?.name ?? viewer.name).trim().split(/\s+/);
      initial = emptyReturn({ firstName, lastName: rest.join(" "), email: c?.email ?? viewer.email, phone: c?.phone ?? "" });
    }
    return <TaxReturnWizard year={year} initial={initial} initialStep={existing?.currentStep ?? 0} submitOpensOn={await submitOpensOn(year)} />;
  }

  const stage = STAGES.findIndex((s) => s.key === existing.status);
  return (
    <>
      <Link href="/client/tax-return" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Tax returns
      </Link>
      <div className="mt-4 rounded-3xl bg-navy p-6 text-white sm:p-8">
        <p className="eyebrow text-gold-soft">Personal income tax return</p>
        <h1 className="serif mt-2 text-4xl font-semibold sm:text-5xl">{year} return submitted</h1>
        <p className="mt-2 text-white/70">Submitted {existing.submittedAt}. We’ll message you here if we need anything else.</p>
        <ol className="mt-6 grid gap-2 sm:grid-cols-3">
          {STAGES.map((s, i) => (
            <li key={s.key} className={cx("flex items-center gap-3 rounded-2xl px-4 py-3", i <= stage ? "bg-white/10" : "bg-white/5 text-white/45")}>
              {i < stage || existing.status === "done" ? (
                <CheckCircle2 className="h-5 w-5 text-gold-soft" />
              ) : i === stage ? (
                <Clock3 className="h-5 w-5 text-gold-soft" />
              ) : (
                <span className="h-5 w-5 rounded-full bg-white/10" />
              )}
              <span className="font-medium">{s.label}</span>
            </li>
          ))}
        </ol>
        <Link href="/client/messages" className={buttonClass("light", "md", "mt-6")}>
          <MessagesSquare className="h-4 w-4" /> Need to change something? Message us
        </Link>
      </div>
      <div className="mt-6">
        <TaxReturnSummary data={existing.data} year={year} />
      </div>
    </>
  );
}
