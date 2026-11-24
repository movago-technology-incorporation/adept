import Image from "next/image";
import Link from "next/link";
import { photos, type PhotoKey } from "@/assets/photos";
import type { ReactNode } from "react";
import { ButtonLink, Container, cx } from "@/components/ui/kit";

export function PageHero({
  title,
  kicker,
  lead,
  crumbs,
  image,
  imageAlt = "",
}: {
  title: string;
  kicker?: string;
  lead?: string;
  crumbs?: { href: string; label: string }[];
  image?: PhotoKey;
  imageAlt?: string;
}) {
  return (
    <section className={cx("relative isolate overflow-hidden bg-navy text-white", image ? "flex min-h-[460px] items-end sm:min-h-[540px]" : "hero-surface")}>
      {image ? (
        <>
          <Image src={photos[image]} alt={imageAlt} fill priority placeholder="blur" sizes="100vw" className="settle -z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/80 to-navy/25" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-navy/90 to-transparent" aria-hidden />
        </>
      ) : null}
      <Container className="w-full py-20 sm:py-24">
        {crumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/60">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            {crumbs.map((c) => (
              <span key={c.href} className="flex items-center gap-2">
                <span aria-hidden>/</span>
                <Link href={c.href} className="hover:text-white">
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
        ) : null}
        {kicker ? <p className="rise eyebrow text-gold-soft">{kicker}</p> : null}
        <h1 className="rise d1 serif mt-4 max-w-3xl text-4xl leading-[1.05] font-semibold sm:text-6xl">{title}</h1>
        {lead ? <p className="rise d2 mt-6 max-w-2xl text-lg leading-relaxed text-white/80">{lead}</p> : null}
      </Container>
    </section>
  );
}

/** Long-form service page: prose on the left, a sticky booking card on the right. */
/** `askFrom`: the page path, so the default card links to the short question form for that topic. */
export function ContentPage({ children, aside, askFrom }: { children: ReactNode; aside?: ReactNode; askFrom?: string }) {
  return (
    <Container className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
      <article className="prose-adept max-w-3xl">{children}</article>
      <aside className="lg:sticky lg:top-28 lg:self-start">{aside ?? <ConsultCard askFrom={askFrom} />}</aside>
    </Container>
  );
}

/**
 * Sidebar call-to-action. With `askFrom` (tax pages) it shows only "Ask a question",
 * which opens the short question form for that page's topic instead of the main contact form.
 */
export function ConsultCard({
  title = "Talk it through with Adept",
  body = "A free working session to review your books, filings and deadlines — and what we’d do next.",
  askFrom,
}: {
  title?: string;
  body?: string;
  askFrom?: string;
}) {
  if (askFrom) {
    return (
      <div className="rounded-3xl bg-navy p-7 text-white">
        <p className="eyebrow text-gold-soft">Questions?</p>
        <p className="serif mt-3 text-3xl leading-tight font-semibold">Ask us anything</p>
        <p className="mt-3 text-sm leading-relaxed text-white/65">Send a quick question and we’ll get back to you within one business day.</p>
        <div className="mt-6 grid gap-2">
          <ButtonLink href={`/ask?from=${encodeURIComponent(askFrom)}`} variant="gold">
            Ask a question
          </ButtonLink>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-3xl bg-navy p-7 text-white">
      <p className="eyebrow text-gold-soft">Free consultation</p>
      <p className="serif mt-3 text-3xl leading-tight font-semibold">{title}</p>
      <p className="mt-3 text-sm leading-relaxed text-white/65">{body}</p>
      <div className="mt-6 grid gap-2">
        <ButtonLink href="/book" variant="gold">
          Book a time
        </ButtonLink>
        <ButtonLink href="/contact" variant="light">
          Ask a question
        </ButtonLink>
      </div>
    </div>
  );
}

/** Grid of short highlight tiles used on service pages. */
export function Highlights({ items }: { items: { title: string; body?: string }[] }) {
  return (
    <div className="not-prose grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.title} className="rounded-2xl bg-white p-5">
          <p className="font-semibold text-navy">{item.title}</p>
          {item.body ? <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{item.body}</p> : null}
        </div>
      ))}
    </div>
  );
}
