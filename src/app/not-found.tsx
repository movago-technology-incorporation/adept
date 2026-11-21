import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CalendarCheck, Landmark, Mail } from "lucide-react";
import { buttonClass } from "@/components/ui/kit";

export const metadata = { title: "Page not found" };

const links = [
  { href: "/bookkeeping", label: "Bookkeeping", body: "Monthly books, reconciliations and reporting", icon: BookOpen },
  { href: "/tax", label: "Tax services", body: "Personal, self-employed and corporate returns", icon: Landmark },
  { href: "/book", label: "Book a consultation", body: "Pick a time on our calendar", icon: CalendarCheck },
  { href: "/contact", label: "Contact us", body: "We reply within one business day", icon: Mail },
];

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-paper">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center px-5 sm:px-8">
        <Link href="/" aria-label="Adept Bookkeeping Services home">
          <Image src="/logo.png" alt="Adept Bookkeeping Services" width={160} height={54} className="h-10 w-auto" unoptimized />
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 pb-20 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow text-gold-deep">Error 404</p>
          <h1 className="serif mt-4 text-6xl leading-[1] font-semibold text-navy sm:text-8xl">This page doesn’t add up.</h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            The page you’re looking for has moved or no longer exists. Let’s get you back to the numbers that matter.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/" className={buttonClass("primary", "lg")}>
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <Link href="/login" className={buttonClass("soft", "lg")}>
              Client portal
            </Link>
          </div>
        </div>

        <nav aria-label="Popular pages" className="grid gap-3">
          {links.map(({ href, label, body, icon: Icon }) => (
            <Link key={href} href={href} className="group flex items-center gap-4 rounded-3xl bg-white p-5 transition-colors hover:bg-sand">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-navy text-gold-soft">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-navy">{label}</span>
                <span className="block text-sm text-muted">{body}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-navy" />
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
