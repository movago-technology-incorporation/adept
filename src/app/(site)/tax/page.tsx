import { PageHero } from "@/components/site/PageHero";
import { TrackedLink } from "@/components/site/TrackedLink";
import { Container } from "@/components/ui/kit";

export const metadata = { title: "Tax Services" };

const items = [
  ["/tax/individual", "Individual tax returns", "Year-round T1 preparation, credits and CRA-ready files."],
  ["/tax/sole-proprietor", "Sole proprietor returns", "GST registration, income tracking and incorporation advice."],
  ["/tax/corporation", "Corporation tax returns", "T2 filings, shareholder loans and clean audit trails."],
  ["/tax/planning", "Tax planning", "Credits, RRSPs, income splitting and Alberta-aware strategy."],
];

export default function TaxIndexPage() {
  return (
    <>
      <PageHero
        image="documents"
        imageAlt="Reviewing and signing tax documents"
        kicker="Tax services"
        title="Tax preparation, planning and filing."
        lead="Personal, self-employed and corporate returns — prepared carefully, filed on time, and backed by an audit trail."
      />
      <Container className="py-20">
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(([href, title, copy]) => (
            <TrackedLink key={href} href={href} cta={title} className="group rounded-3xl bg-white p-8 transition-colors hover:bg-sand">
              <h2 className="serif text-3xl font-semibold text-navy">{title}</h2>
              <p className="mt-3 leading-relaxed text-muted">{copy}</p>
              <span className="mt-6 inline-flex text-sm font-medium text-gold-deep group-hover:text-navy">Learn more →</span>
            </TrackedLink>
          ))}
        </div>
        <TrackedLink
          href="/tax/filing-request"
          cta="Tax index · Filing request"
          className="mt-4 flex flex-col gap-4 rounded-3xl bg-navy p-8 text-white transition-colors hover:bg-navy-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="eyebrow text-gold-soft">Ready to file?</p>
            <p className="serif mt-2 text-3xl font-semibold">Start a confidential tax filing request</p>
            <p className="mt-2 text-white/65">We process by due date, then first come, first served.</p>
          </div>
          <span className="inline-flex h-11 items-center rounded-full bg-gold px-5 font-medium text-navy">Start request →</span>
        </TrackedLink>
      </Container>
    </>
  );
}
