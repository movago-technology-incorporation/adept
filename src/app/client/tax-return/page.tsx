import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, Clock3, FileText } from "lucide-react";
import { PageHeader } from "@/components/portal/Shell";
import { Badge, buttonClass, cx } from "@/components/ui/kit";
import { requirePageRole } from "@/lib/auth/viewer";
import { STEPS } from "@/lib/tax-return";
import { filingYears, listClientReturns, type TaxReturnStatus } from "@/lib/tax-return-server";

export const metadata = { title: "Tax return" };

const STATUS: Record<TaxReturnStatus, { label: string; tone: "warn" | "gold" | "success" | "neutral"; icon: typeof Clock3 }> = {
  draft: { label: "In progress", tone: "warn", icon: CircleDashed },
  submitted: { label: "Received by Adept", tone: "gold", icon: Clock3 },
  in_progress: { label: "Being prepared", tone: "gold", icon: Clock3 },
  done: { label: "Completed", tone: "success", icon: CheckCircle2 },
};

export default async function TaxReturnsPage() {
  const viewer = await requirePageRole("client");
  const returns = await listClientReturns(viewer.clientId);
  const byYear = new Map(returns.map((r) => [r.taxYear, r]));

  return (
    <>
      <PageHeader
        eyebrow="Work"
        title="Personal tax return"
        description="Complete your tax questionnaire online and upload your slips — everything is saved as you go and stored securely."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {filingYears().map((year, i) => {
          const r = byYear.get(year);
          const s = r ? STATUS[r.status] : null;
          const pct = r?.status === "draft" ? Math.min(95, Math.round((Math.min(r.currentStep, STEPS.length - 1) / (STEPS.length - 1)) * 100)) : null;
          return (
            <Link
              key={year}
              href={`/client/tax-return/${year}`}
              className={cx("group flex flex-col rounded-3xl p-6 transition-colors sm:p-7", i === 0 && !r ? "bg-navy text-white hover:bg-navy-3" : "bg-white hover:bg-sand")}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={cx("grid h-12 w-12 place-items-center rounded-2xl", i === 0 && !r ? "bg-gold text-navy" : "bg-sand text-navy")}>
                  <FileText className="h-5 w-5" />
                </span>
                {s ? <Badge tone={s.tone}>{s.label}</Badge> : i === 0 ? <Badge tone="gold">Most recent year</Badge> : null}
              </div>
              <p className={cx("serif mt-5 text-3xl font-semibold", i === 0 && !r ? "text-white" : "text-navy")}>{year} tax return</p>
              <p className={cx("mt-1 text-sm", i === 0 && !r ? "text-white/70" : "text-muted")}>
                {!r
                  ? `For income earned January 1 – December 31, ${year}.`
                  : r.status === "draft"
                    ? `Last saved ${r.updatedAt}.`
                    : `Submitted ${r.submittedAt}.`}
              </p>
              {pct !== null ? (
                <div className="mt-4 h-2 rounded-full bg-sand">
                  <div className="h-2 rounded-full bg-gold" style={{ width: `${Math.max(5, pct)}%` }} />
                </div>
              ) : null}
              <span
                className={cx(
                  "mt-6 inline-flex items-center gap-1.5 text-sm font-medium",
                  i === 0 && !r ? "text-gold-soft group-hover:text-white" : "text-gold-deep group-hover:text-navy",
                )}
              >
                {!r ? "Start" : r.status === "draft" ? "Continue" : "View submission"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted">
        Filing for an earlier year, or something else? <Link href="/client/messages" className={buttonClass("ghost", "sm", "px-1 text-gold-deep")}>Message us</Link>
      </p>
    </>
  );
}
