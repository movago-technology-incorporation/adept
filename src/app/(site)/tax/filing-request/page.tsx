import { PageSchema } from "@/components/seo/JsonLd";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { CalendarClock, FileCheck2, FolderLock, LogIn, ShieldCheck, UserPlus, Users } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Container, buttonClass } from "@/components/ui/kit";

export const metadata = pageMeta({
  title: "Start Your Tax Filing Online",
  description: "Start your personal tax return online: complete a secure questionnaire, upload your slips and receipts, and track your return in your Adept client portal.",
  path: "/tax/filing-request",
  keywords: ["file taxes online Calgary", "tax filing request", "online tax questionnaire Canada"],
});

const facts = [
  { icon: CalendarClock, title: "Processing order", body: "By due date (April 30 personal, June 15 self-employed), then first come, first served." },
  { icon: FileCheck2, title: "Turnaround", body: "Most personal-only returns within 5 business days once we have everything." },
  { icon: ShieldCheck, title: "Secure and confidential", body: "Your answers are encrypted and used solely to prepare your return." },
  { icon: Users, title: "Family returns", body: "Add your spouse and up to three dependents — we can file their returns too." },
];

const ready = [
  "Social Insurance Numbers for you, your spouse and any dependents",
  "T4, T4A, T5 and other income slips",
  "RRSP, childcare, medical and donation receipts",
  "Last year’s Notice of Assessment (and T1 if Adept didn’t prepare it)",
];

export default function FilingRequestPage() {
  return (
    <>
      <PageSchema path="/tax/filing-request" title="Start Your Tax Filing Online" description="Start your personal tax return online: complete a secure questionnaire, upload your slips and receipts, and track your return in your Adept client portal." crumbs={[{"name": "Tax services", "path": "/tax"}]} />
      <PageHero
        image="documents"
        imageAlt="Preparing tax documents for filing"
        kicker="Tax services"
        title="Tax filing request."
        lead="Complete your personal tax questionnaire in your secure client portal — upload slips as you go, save and come back anytime."
        crumbs={[{ href: "/tax", label: "Tax services" }]}
      />
      <Container className="grid gap-6 py-16 sm:py-20 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl bg-navy p-8 text-white sm:p-10">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold text-navy">
            <FolderLock className="h-5 w-5" />
          </span>
          <h2 className="serif mt-6 text-4xl leading-tight font-semibold">Start your return in the client portal</h2>
          <p className="mt-3 leading-relaxed text-white/70">
            The questionnaire collects sensitive details like Social Insurance Numbers, so it’s only available to invited, signed-in clients. It
            takes about 15 minutes, and your progress saves automatically.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className={buttonClass("gold", "lg")}>
              <UserPlus className="h-5 w-5" /> Request portal access
            </Link>
            <Link href="/client/tax-return" className={buttonClass("light", "lg")}>
              <LogIn className="h-5 w-5" /> Sign in and continue
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/55">After signing in, choose “Tax return” in your portal menu.</p>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl bg-white p-7">
            <p className="font-semibold text-navy">Have these ready</p>
            <ul className="mt-4 grid gap-3 text-sm text-muted">
              {ready.map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          {facts.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 rounded-3xl bg-white p-6">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sand text-navy">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-navy">{title}</span>
                <span className="mt-1 block text-[15px] leading-relaxed text-muted">{body}</span>
              </span>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
