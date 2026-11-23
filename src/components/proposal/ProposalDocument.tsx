import { Check } from "lucide-react";
import {
  ENGAGEMENT_STEPS,
  FIRM_LEGAL_NAME,
  FIRM_TAGLINE,
  INCLUDED,
  NEXT_STEPS,
  PACKAGES,
  PROPOSAL_INTRO,
  engagementOpening,
  engagementSections,
  longDate,
  money,
  pkg,
  qboText,
  type ProposalDetails,
  type Section,
} from "@/lib/proposal-template";

// Web rendering of the proposal + engagement letter (pure: used by the client page and Studio preview).

function Blocks({ section }: { section: Section }) {
  return (
    <div>
      <h3 className="font-semibold text-navy">{section.heading}</h3>
      {section.blocks.map((b, i) =>
        b.kind === "list" ? (
          <ul key={i} className="mt-2 grid gap-1.5">
            {b.items.map((it) => (
              <li key={it} className="flex gap-2.5 text-[15px] leading-relaxed text-ink/85">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {it}
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="mt-2 text-[15px] leading-relaxed text-ink/85">
            {b.text}
          </p>
        ),
      )}
    </div>
  );
}

function DocHeader({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <div className="bg-navy px-6 py-8 text-white sm:px-10">
      <p className="text-xs font-semibold tracking-[0.2em] text-gold-soft uppercase">{FIRM_LEGAL_NAME}</p>
      <p className="mt-1 text-sm text-white/60 italic">{FIRM_TAGLINE}</p>
      {kicker ? <p className="mt-6 text-sm text-white/70">{kicker}</p> : null}
      <h2 className="serif mt-2 text-4xl leading-tight font-semibold sm:text-5xl">{title}</h2>
    </div>
  );
}

export function ProposalDocument({
  d,
  date,
  signed,
}: {
  d: ProposalDetails;
  /** Proposal date (YYYY-MM-DD). */
  date: string;
  /** `label` is the signing time, already formatted on the server. */
  signed?: { name: string; label: string } | null;
}) {
  const chosen = pkg(d.package);
  const fee = money(d.monthlyFee);
  const onboarding = money(d.onboardingFee);

  return (
    <div className="grid gap-8">
      {/* ── Proposal ─────────────────────────────── */}
      <article className="overflow-hidden rounded-3xl bg-white">
        <DocHeader title="Business Bookkeeping Proposal" />
        <div className="grid gap-x-8 gap-y-2 bg-sand/60 px-6 py-5 text-sm sm:grid-cols-3 sm:px-10">
          <p>
            <span className="block text-xs tracking-wide text-muted uppercase">Prepared for</span>
            <span className="font-semibold text-navy">{d.businessName || d.clientName || "—"}</span>
            {d.businessName && d.clientName ? <span className="block text-muted">{d.clientName}</span> : null}
          </p>
          <p>
            <span className="block text-xs tracking-wide text-muted uppercase">Date</span>
            <span className="font-semibold text-navy">{longDate(date)}</span>
          </p>
          <p>
            <span className="block text-xs tracking-wide text-muted uppercase">Prepared by</span>
            <span className="font-semibold text-navy">{d.preparedBy || "Adept"}</span>
            <span className="block text-muted">{FIRM_LEGAL_NAME}</span>
          </p>
        </div>

        <div className="grid gap-10 px-6 py-10 sm:px-10">
          <section>
            <h3 className="serif text-3xl leading-tight font-semibold text-navy">{PROPOSAL_INTRO.headline}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/85">{PROPOSAL_INTRO.body}</p>
            {d.note.trim() ? (
              <p className="mt-5 rounded-2xl bg-gold/15 px-5 py-4 text-[15px] leading-relaxed whitespace-pre-line text-navy">{d.note.trim()}</p>
            ) : null}
          </section>

          <section>
            <p className="eyebrow">Recommended service</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PACKAGES.map((p) => {
                const on = p.id === d.package;
                return (
                  <div key={p.id} className={on ? "rounded-2xl bg-navy p-5 text-white" : "rounded-2xl bg-paper p-5"}>
                    <p className={on ? "flex items-center gap-1.5 text-xs font-semibold tracking-wide text-gold-soft uppercase" : "text-xs font-semibold tracking-wide text-muted uppercase"}>
                      {on ? <Check className="h-3.5 w-3.5" /> : null}
                      {on ? "Recommended for you" : "Package"}
                    </p>
                    <p className={on ? "serif mt-2 text-3xl font-semibold" : "serif mt-2 text-3xl font-semibold text-navy"}>{p.name}</p>
                    <p className={on ? "mt-1 font-semibold text-gold-soft" : "mt-1 font-semibold text-navy"}>{on && fee ? `${fee} / month` : p.price}</p>
                    <p className={on ? "mt-2 text-sm text-white/70" : "mt-2 text-sm text-muted"}>{p.bestFit}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-muted">{PROPOSAL_INTRO.pricingNote}</p>
          </section>

          <section>
            <p className="eyebrow">Included in your ongoing service</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {INCLUDED.map((it) => (
                <li key={it} className="flex gap-2.5 rounded-2xl bg-paper px-4 py-3 text-[15px] leading-snug text-ink/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {it}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-sand/60 p-6">
            <p className="eyebrow">QuickBooks Online</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/85">{qboText(d)}</p>
            {d.qboPlan !== "Not applicable" ? (
              <p className="mt-3 text-sm text-navy">
                <span className="font-semibold">QBO plan:</span> {d.qboPlan} · <span className="font-semibold">Subscription:</span>{" "}
                {d.qboPaidBy === "adept" ? "Included in the monthly fee" : "Client-paid"}
              </p>
            ) : null}
          </section>

          <section>
            <p className="eyebrow">How the engagement works</p>
            <p className="mt-2 text-[15px] text-muted">A simple workflow designed to keep your side of bookkeeping easy and our side of the work predictable.</p>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {ENGAGEMENT_STEPS.map((s) => (
                <Blocks key={s.heading} section={s} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-navy p-6 text-white sm:p-8">
            <p className="eyebrow text-gold-soft">Investment & payment</p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-white/60">Monthly professional fee</dt>
                <dd className="serif mt-1 text-3xl font-semibold">{fee || "—"}</dd>
                <dd className="text-sm text-white/60">+ applicable taxes · {chosen.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-white/60">Payment terms</dt>
                <dd className="mt-1 font-semibold">{d.paymentTerms || "As agreed"}</dd>
              </div>
              <div>
                <dt className="text-sm text-white/60">One-time onboarding / clean-up</dt>
                <dd className="mt-1 font-semibold">{onboarding ? `${onboarding} + taxes` : "None"}</dd>
              </div>
            </dl>
          </section>

          <section>
            <p className="eyebrow">Next step: make it official</p>
            <ol className="mt-4 grid gap-2">
              {NEXT_STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-[15px] text-ink/85">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sand text-xs font-semibold text-navy">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </article>

      {/* ── Engagement letter ────────────────────── */}
      <article id="engagement-letter" className="overflow-hidden rounded-3xl bg-white">
        <DocHeader title="Bookkeeping Engagement Letter" kicker={longDate(d.effectiveDate)} />
        <div className="grid gap-6 px-6 py-10 sm:px-10">
          <div className="text-[15px] leading-relaxed text-ink/85">
            <p className="font-semibold text-navy">{d.clientName}</p>
            {d.businessName ? <p>{d.businessName}</p> : null}
            {d.clientContact ? <p className="text-muted">{d.clientContact}</p> : null}
            <p className="mt-5">Dear {d.clientName || "Client"},</p>
            <p className="mt-3">{engagementOpening()}</p>
          </div>
          {engagementSections(d).map((s) => (
            <Blocks key={s.heading} section={s} />
          ))}

          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-paper p-5">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Client / authorized signatory</p>
              {signed ? (
                <>
                  <p className="mt-3 text-3xl text-navy" style={{ fontFamily: "var(--font-serif), cursive", fontStyle: "italic" }}>
                    {signed.name}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Signed electronically by {signed.name} on {signed.label}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">Awaiting signature</p>
              )}
            </div>
            <div className="rounded-2xl bg-paper p-5">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">{FIRM_LEGAL_NAME}</p>
              <p className="mt-3 text-3xl text-navy" style={{ fontFamily: "var(--font-serif), cursive", fontStyle: "italic" }}>
                {d.preparedBy || "Adept"}
              </p>
              <p className="mt-2 text-sm text-muted">Name: {d.preparedBy || "Adept"}</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
