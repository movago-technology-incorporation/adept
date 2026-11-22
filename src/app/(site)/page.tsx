import { PageSchema } from "@/components/seo/JsonLd";
import { pageMeta } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CalendarCheck,
  FileCheck2,
  FolderLock,
  HandCoins,
  Receipt,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { photos } from "@/assets/photos";
import { getTaxDeadlines } from "@/lib/data";
import { DeadlinesSection } from "@/components/site/DeadlinesSection";
import { TestimonialList } from "@/components/site/TestimonialList";
import { Reveal } from "@/components/ui/Reveal";
import { TrackedLink } from "@/components/site/TrackedLink";
import { Container, Eyebrow, buttonClass } from "@/components/ui/kit";

export const metadata = pageMeta({
  title: "Bookkeeping, Tax & Payroll in Calgary, Alberta",
  description: "Calgary bookkeeping and tax services for small businesses and families: monthly books, T1 and T2 returns, GST/HST and payroll. On time and CRA-ready.",
  path: "/",
  image: "/opengraph-image",
  keywords: ["Calgary bookkeeping services", "Alberta tax accountant", "small business accountant Calgary"],
});

const services = [
  {
    href: "/bookkeeping",
    title: "General bookkeeping",
    body: "Stay compliant with Canadian regulations, avoid costly errors, and keep a clear picture of your financial health.",
    photo: photos.accountant,
  },
  {
    href: "/services",
    title: "Clean-up & catch-up",
    body: "Behind on your books? We correct past records and bring every transaction up to date — without pausing your business.",
    photo: photos.reports,
  },
  {
    href: "/tax",
    title: "Tax preparation & filing",
    body: "Personal, self-employed and corporate returns, plus GST/HST filings — prepared carefully and filed on time with the CRA.",
    photo: photos.documents,
  },
  {
    href: "/payroll",
    title: "Payroll",
    body: "Pay runs, source deductions, CRA remittances, T4s and WCB statements, handled every cycle.",
    photo: photos.calculator,
  },
];

const audiences = [
  { href: "/tax/corporation", icon: Building2, title: "Corporations", body: "Monthly books, T2 filings, shareholder loans and a clean audit trail." },
  { href: "/tax/sole-proprietor", icon: HandCoins, title: "Sole proprietors", body: "Income tracking, GST registration and advice on when to incorporate." },
  { href: "/tax/individual", icon: UserRound, title: "Individuals & families", body: "T1 returns, credits and benefits — even if you’ve moved or had no income." },
];

const steps = [
  { icon: CalendarCheck, title: "Book a free working session", body: "Pick a time online. We’ll review where your books and filings stand." },
  { icon: FolderLock, title: "Share documents securely", body: "Upload statements and receipts to your private client portal — no email attachments." },
  { icon: FileCheck2, title: "We file and keep you on track", body: "Monthly books, returns and reminders handled, with a clear view of what’s next." },
];

export default async function HomePage() {
  const deadlines = await getTaxDeadlines();
  const next = deadlines[0];

  return (
    <>
      <PageSchema path="/" title="Bookkeeping, Tax & Payroll in Calgary, Alberta" description="Calgary bookkeeping and tax services for small businesses and families: monthly books, T1 and T2 returns, GST/HST and payroll. On time and CRA-ready." />
      {/* ── Hero: full-bleed photo ──────────────────────────── */}
      <section className="relative isolate flex min-h-[calc(100svh-5rem)] sm:min-h-[calc(100svh-6rem)] items-center overflow-hidden bg-navy text-white">
        <Image
          src={photos.hero}
          alt="An Adept advisor reviewing a client’s finances together"
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="settle -z-20 object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/85 to-navy/20" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-navy/80 to-transparent" aria-hidden />

        <Container className="py-24">
          <div className="max-w-2xl">
            <h1>
              {/* The keyword line is part of the H1 so the heading matches the page title. */}
              <span className="rise flex items-center gap-2 text-sm font-medium tracking-wide text-gold-soft">
                <ShieldCheck className="h-4 w-4" />
                Bookkeeping, Tax & Payroll in Calgary, Alberta
              </span>
              <span className="sr-only"> — </span>
              <span className="rise d1 serif mt-6 block text-5xl leading-[1.02] font-semibold sm:text-7xl lg:text-8xl">
                Books kept clean.
                <span className="block text-gold-soft"> Taxes filed right.</span>
              </span>
            </h1>
            <p className="rise d2 mt-7 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
              Adept handles{" "}
              <Link href="/bookkeeping" className="text-white underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
                bookkeeping
              </Link>
              ,{" "}
              <Link href="/tax" className="text-white underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
                tax returns
              </Link>{" "}
              and{" "}
              <Link href="/payroll" className="text-white underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
                payroll
              </Link>{" "}
              for small businesses and individuals across Canada — accurate, on time and CRA-ready.
            </p>
            <div className="rise d3 mt-10 flex flex-wrap gap-3">
              <TrackedLink href="/book" cta="Hero · Book a consultation" className={buttonClass("gold", "lg")}>
                <CalendarCheck className="h-5 w-5" />
                Book a free consultation
              </TrackedLink>
              <TrackedLink href="/tax/filing-request" cta="Hero · Filing request" className={buttonClass("light", "lg")}>
                <Receipt className="h-5 w-5" />
                Start a tax filing
              </TrackedLink>
            </div>
            <dl className="rise d4 mt-14 flex flex-wrap gap-x-12 gap-y-6">
              {[
                ["98%", "On-time filings"],
                ["1000+", "Canadian clients"],
                ["4.9★", "Average review"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="serif text-4xl font-semibold text-gold-soft sm:text-5xl">{n}</dd>
                  <dd className="mt-1 text-sm text-white/65">{l}</dd>
                </div>
              ))}
            </dl>
            {next ? (
              <p className="rise d5 mt-10 flex items-center gap-2 text-sm text-white/70">
                <CalendarClock className="h-4 w-4 text-gold-soft" />
                Next deadline — <span className="font-medium text-white">{next.title}:</span> {next.lines[0]}
              </p>
            ) : null}
          </div>
        </Container>
      </section>

      {/* ── Who we help ──────────────────────────────────────── */}
      <Container className="py-20">
        <Reveal className="max-w-2xl">
          <Eyebrow>Who we help</Eyebrow>
          <h2 className="serif mt-3 text-4xl font-semibold text-navy sm:text-5xl">Bookkeeping and Tax services for every stage</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {audiences.map(({ href, icon: Icon, title, body }, i) => (
            <Reveal key={href} delay={i * 110}>
              <TrackedLink href={href} cta={`Home · ${title}`} className="group block h-full rounded-3xl bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:bg-sand">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy text-gold-soft">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-navy">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{body}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gold-deep group-hover:text-navy">
                  Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </TrackedLink>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* ── About: full-width split — photo left, copy right ─── */}
      <section className="grid bg-white lg:grid-cols-2">
        <div className="relative min-h-[380px] sm:min-h-[480px] lg:min-h-[680px]">
          <Image
            src={photos.accountant}
            alt="An Adept bookkeeper working through a client’s reports"
            fill
            placeholder="blur"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex items-center px-5 py-16 sm:px-12 lg:px-16 lg:py-24 xl:px-24">
          <Reveal className="w-full max-w-xl">
            <Eyebrow>Why Adept</Eyebrow>
            <h2 className="serif mt-3 text-4xl leading-tight font-semibold text-navy sm:text-5xl">
              Organized, compliant and financially sound — all year.
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-muted">
              We understand the challenges small business owners and individuals face managing their finances. Whether you need{" "}
              <Link href="/services" className="font-medium text-navy underline decoration-gold underline-offset-4">
                catch-up bookkeeping
              </Link>
              , a{" "}
              <Link href="/tax/corporation" className="font-medium text-navy underline decoration-gold underline-offset-4">
                corporate T2 return
              </Link>{" "}
              or year-round{" "}
              <Link href="/tax/planning" className="font-medium text-navy underline decoration-gold underline-offset-4">
                tax planning
              </Link>
              , your records stay accurate, your obligations are met, and your financial health is always in view.
            </p>
            <ul className="mt-8 grid gap-4">
              {[
                ["Compliance and accuracy", "Books kept to Canadian accounting standards, with an audit trail the CRA can follow."],
                ["Personalized service", "One dedicated team that knows your business — not a ticket queue."],
                ["Streamlined finances", "A secure client portal for documents, messages and bookings."],
              ].map(([t, b]) => (
                <li key={t} className="flex gap-4">
                  <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
                  <span>
                    <span className="block font-semibold text-navy">{t}</span>
                    <span className="block text-muted">{b}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/about" className={buttonClass("soft", "md", "mt-8")}>
              More about Adept <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Services with photos ─────────────────────────────── */}
      <Container className="py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <Eyebrow>What we do</Eyebrow>
            <h2 className="serif mt-3 text-4xl font-semibold text-navy sm:text-5xl">Services built around your books</h2>
          </Reveal>
          <TrackedLink href="/services" cta="Home · All services" className={buttonClass("soft")}>
            All services <ArrowRight className="h-4 w-4" />
          </TrackedLink>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={(i % 2) * 120}>
              <TrackedLink href={s.href} cta={`Home · ${s.title}`} className="group block h-full overflow-hidden rounded-3xl bg-white transition-colors hover:bg-sand">
                <div className="relative aspect-[16/8] overflow-hidden">
                  <Image
                    src={s.photo}
                    alt=""
                    fill
                    placeholder="blur"
                    sizes="(min-width: 768px) 560px, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-7 sm:p-8">
                  <h3 className="serif text-3xl font-semibold text-navy">{s.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{s.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold-deep group-hover:text-navy">
                    Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </TrackedLink>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* ── Small business banner: full-bleed photo ────────── */}
      <section className="relative isolate flex min-h-[560px] items-center overflow-hidden bg-navy text-white sm:min-h-[640px]">
        <Image
          src={photos.smallBusiness}
          alt="A small business owner serving a customer at the counter"
          fill
          placeholder="blur"
          sizes="100vw"
          className="-z-20 object-cover object-[30%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/85 to-navy/15" aria-hidden />
        <Container className="py-24">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-gold-soft">For small business owners</p>
            <h2 className="serif mt-4 text-5xl leading-[1.05] font-semibold sm:text-6xl lg:text-7xl">
              You run the business.
              <span className="block text-gold-soft">We’ll run the numbers.</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              Monthly bookkeeping, GST/HST and payroll in one place — with a portal where receipts go in and clean reports come out.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <TrackedLink href="/book" cta="Banner · Book" className={buttonClass("gold", "lg")}>
                <CalendarCheck className="h-5 w-5" />
                Talk to Adept
              </TrackedLink>
              <TrackedLink href="/bookkeeping" cta="Banner · Bookkeeping" className={buttonClass("light", "lg")}>
                How bookkeeping works
              </TrackedLink>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="bg-sand">
        <Container className="grid items-center gap-12 py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="serif mt-3 text-4xl font-semibold text-navy sm:text-5xl">Three steps to calmer books</h2>
            <ol className="mt-10 grid gap-4">
              {steps.map(({ icon: Icon, title, body }, i) => (
                <Reveal as="li" key={title} delay={i * 120} className="flex gap-5 rounded-3xl bg-paper p-6">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-navy text-gold-soft">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="text-xs font-semibold tracking-wider text-gold-deep uppercase">Step {i + 1}</span>
                    <span className="mt-1 block text-lg font-semibold text-navy">{title}</span>
                    <span className="mt-1 block leading-relaxed text-muted">{body}</span>
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] sm:aspect-[4/3] lg:aspect-[4/5]">
            <Image src={photos.consult} alt="A client and an Adept advisor shaking hands after a consultation" fill placeholder="blur" sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            <div className="absolute right-5 bottom-5 left-5 flex items-center gap-4 rounded-3xl bg-white/95 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold text-navy">
                <Users className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-navy">Free consultation</span>
                <span className="block text-sm text-muted">Video call · book online in a minute</span>
              </span>
              <TrackedLink href="/book" cta="How it works · Book" className={buttonClass("primary", "sm")}>
                Book
              </TrackedLink>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Deadlines ────────────────────────────────────────── */}
      <DeadlinesSection deadlines={deadlines} />

      {/* ── Testimonials ─────────────────────────────────────── */}
      <Container className="py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <Eyebrow>Client voices</Eyebrow>
            <h2 className="serif mt-3 text-4xl font-semibold text-navy sm:text-5xl">Trusted by clients across Canada</h2>
          </Reveal>
          <TrackedLink href="/testimonials" cta="Home · All testimonials" className={buttonClass("soft")}>
            Read all reviews <ArrowRight className="h-4 w-4" />
          </TrackedLink>
        </div>
        <TestimonialList featuredOnly />
      </Container>
    </>
  );
}
