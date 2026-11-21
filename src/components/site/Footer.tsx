import Image from "next/image";
import Link from "next/link";
import { nav, serviceLinks } from "@/data/content";
import { cacheLife } from "next/cache";
import { getFirm } from "@/lib/data";
import { ButtonLink, Container } from "@/components/ui/kit";
import { ClockIcon, FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, XIcon } from "@/components/site/Icons";

export async function Footer() {
  const [firm, year] = await Promise.all([getFirm(), currentYear()]);

  return (
    <footer className="mt-auto">
      <section className="bg-navy text-white">
        <Container className="grid gap-12 py-20 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-gold-soft">Get started</p>
            <h2 className="serif mt-4 max-w-xl text-4xl leading-[1.1] font-semibold sm:text-5xl">
              Let’s get your books in order — this month, not at year-end.
            </h2>
            <p className="mt-5 max-w-lg text-white/65">
              Book a free working session with Adept. We’ll review where your bookkeeping and tax filings stand and map out
              the next steps.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink href="/book" variant="gold" size="lg">
              Book a consultation
            </ButtonLink>
            <ButtonLink href="/contact" variant="light" size="lg">
              Send a message
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="bg-navy-2 text-white/70">
        <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Image src="/logo.png" alt="Adept Bookkeeping Services" width={150} height={50} className="h-9 w-auto brightness-0 invert" unoptimized />
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              Bookkeeping, tax and payroll for small businesses and individuals across Canada. Based in {firm.city}.
            </p>
            <div className="mt-6 flex gap-2">
              <Social href="https://www.facebook.com/" label="Facebook">
                <FacebookIcon className="h-4 w-4" />
              </Social>
              <Social href="https://x.com/" label="X">
                <XIcon className="h-4 w-4" />
              </Social>
              <Social href="https://www.instagram.com/" label="Instagram">
                <InstagramIcon className="h-4 w-4" />
              </Social>
            </div>
          </div>

          <FooterList title="Services" links={serviceLinks} />
          <FooterList
            title="Company"
            links={[
              ...nav.filter((n) => !n.children && n.href !== "/bookkeeping" && n.href !== "/payroll"),
              { href: "/services", label: "Other services" },
              { href: "/testimonials", label: "Testimonials" },
              { href: "/login", label: "Client portal" },
            ]}
          />

          <div>
            <p className="eyebrow text-white/40">Contact</p>
            <ul className="mt-5 grid gap-4 text-sm">
              <li className="flex gap-3">
                <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-soft" />
                <a href={`mailto:${firm.email}`} className="break-all hover:text-white">
                  {firm.email}
                </a>
              </li>
              <li className="flex gap-3">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-soft" />
                <a href={`tel:${firm.phone.replace(/[^\d+]/g, "")}`} className="hover:text-white">
                  {firm.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-soft" />
                <span>{firm.hours}</span>
              </li>
            </ul>
          </div>
        </Container>
        <div className="bg-navy">
          <Container className="flex flex-col gap-2 py-6 text-xs text-white/45 sm:flex-row sm:justify-between">
            <p>
              © {year} {firm.name}. All rights reserved.
            </p>
            <p>
              {firm.city}, {firm.country}
            </p>
          </Container>
        </div>
      </section>
    </footer>
  );
}

function FooterList({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="eyebrow text-white/40">{title}</p>
      <ul className="mt-5 grid gap-3 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-white/80 transition-colors hover:bg-gold hover:text-navy"
    >
      {children}
    </a>
  );
}

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
