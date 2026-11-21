import { ConsultCard, PageHero } from "@/components/site/PageHero";
import { Container, Eyebrow } from "@/components/ui/kit";

export const metadata = { title: "About us" };

const reasons = [
  ["Expertise", "We stay current with Canadian tax law and regulations, so your filings are accurate and compliant."],
  ["Personalized service", "Every client is different. We tailor our work to your business and your goals."],
  ["Reliable support", "We’re here all year — not just in tax season."],
  ["Affordable solutions", "Transparent pricing with no hidden fees, for businesses and individuals alike."],
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        image="team"
        imageAlt="The Adept team working through client files together"
        kicker="About Adept"
        title="Empowering Canadian businesses to stay ahead of the numbers."
        lead="We simplify bookkeeping and tax for small businesses and individuals, with expert work that keeps you compliant, organized and on track."
      />

      <Container className="grid gap-12 py-20 lg:grid-cols-[1fr_320px] lg:gap-16">
        <div className="space-y-6 text-[17px] leading-relaxed text-muted">
          <p className="serif text-3xl leading-snug font-semibold text-navy">
            Our mission is to provide expert financial solutions that help clients stay compliant, organized and ahead of
            their goals.
          </p>
          <p>
            With years of experience in the industry, our team understands the needs of Canadian entrepreneurs and
            individuals. We take pride in personalized, reliable and affordable bookkeeping — so you can focus on growing
            your business while we handle the numbers.
          </p>
        </div>
        <ConsultCard />
      </Container>

      <section className="bg-white">
        <Container className="py-20">
          <Eyebrow>Why clients choose us</Eyebrow>
          <h2 className="serif mt-3 text-4xl font-semibold text-navy sm:text-5xl">What you can count on</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {reasons.map(([title, body]) => (
              <div key={title} className="rounded-3xl bg-paper p-8">
                <h3 className="text-lg font-semibold text-navy">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-navy text-white">
        <Container className="grid gap-12 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow text-gold-soft">The numbers don’t lie</p>
            <h2 className="serif mt-3 text-4xl font-semibold sm:text-5xl">Transparency and accuracy, every month.</h2>
            <p className="mt-5 max-w-lg leading-relaxed text-white/65">
              Our bookkeeping and tax work makes sure every dollar is accounted for and your financial health is always
              clear. With Adept, the numbers always tell the full story.
            </p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            {[
              ["98%", "On-time filings"],
              ["120+", "Canadian clients served"],
              ["4.9", "Average review score"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-3xl bg-white/6 p-6">
                <dd className="serif text-5xl font-semibold text-gold-soft">{n}</dd>
                <dt className="mt-2 text-sm text-white/60">{l}</dt>
              </div>
            ))}
          </dl>
        </Container>
      </section>
    </>
  );
}
