"use client";

import { FormEvent, useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { ClockIcon, MailIcon, PhoneIcon } from "@/components/site/Icons";
import { Dropdown } from "@/components/ui/Dropdown";
import { Alert, Button, ButtonLink, Container, Input, Label, Surface, Textarea } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";
import { CreateAccountPrompt } from "@/components/auth/CreateAccountPrompt";

export function ContactPageClient() {
  const { firm, addLead, recordClick, syncError } = useApp();
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ name: string; email: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const startingPoint = String(data.get("startingPoint") || "");
    const revenue = String(data.get("revenue") || "");
    const challenge = String(data.get("challenge") || "").trim();
    // The dropdowns are custom controls, so the browser can't enforce "required" on them.
    const missing = [!startingPoint && "where you’re starting from", !revenue && "your annual revenue range"].filter(Boolean);
    if (missing.length) {
      setError(`Please choose ${missing.join(" and ")}.`);
      return;
    }
    setError(null);
    setSaving(true);
    await addLead({
      id: `lead_${Date.now()}`,
      name: String(data.get("name")),
      email: String(data.get("email")),
      phone: String(data.get("phone") || ""),
      company: String(data.get("company") || ""),
      source: "Contact form",
      interest: startingPoint || "Not specified",
      status: "new",
      lastClick: new Date().toISOString().slice(0, 16).replace("T", " "),
      page: "/contact",
      utm: "form",
      notes: [
        revenue ? `Annual revenue: ${revenue}` : "",
        challenge ? `Biggest financial challenge: ${challenge}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setSubmitted({ name: String(data.get("name")), email: String(data.get("email")) });
    void recordClick("/contact", "Send message");
    setSaving(false);
    setDone(true);
  }

  return (
    <>
      <PageHero
        image="consult"
        imageAlt="Meeting with an Adept advisor"
        kicker="Contact"
        title="Let’s talk about your books."
        lead="Questions about bookkeeping, tax or payroll? Send a note and we’ll reply within one business day."
      />
      <Container className="grid gap-6 py-16 sm:py-20 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid gap-4 lg:self-start">
          <Surface tone="navy" className="p-8">
            <p className="eyebrow text-gold-soft">Reach us directly</p>
            <ul className="mt-6 grid gap-5">
              <ContactRow icon={<MailIcon className="h-5 w-5" />} label="Email">
                <a href={`mailto:${firm?.email}`} className="break-all hover:text-gold-soft">
                  {firm?.email}
                </a>
              </ContactRow>
              <ContactRow icon={<PhoneIcon className="h-5 w-5" />} label="Phone">
                <a href={`tel:${firm?.phone.replace(/[^\d+]/g, "")}`} className="hover:text-gold-soft">
                  {firm?.phone}
                </a>
              </ContactRow>
              <ContactRow icon={<ClockIcon className="h-5 w-5" />} label="Hours">
                {firm?.hours}
              </ContactRow>
            </ul>
            <p className="mt-6 text-sm text-white/55">{firm?.city}</p>
          </Surface>
          <Surface tone="sand" className="p-8">
            <p className="serif text-2xl font-semibold text-navy">Prefer to talk it through?</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">Book a free working session straight into our calendar.</p>
            <ButtonLink href="/book" className="mt-5">
              Book a consultation
            </ButtonLink>
          </Surface>
        </div>

        <Surface className="p-6 sm:p-10">
          {done ? (
            <div className="py-10 text-center">
              <h2 className="serif text-4xl font-semibold text-navy">{syncError ? "Something went wrong" : "Message received"}</h2>
              <p className="mx-auto mt-3 max-w-md text-muted">
                {syncError ?? "Thanks for reaching out. We’ll be in touch within one business day."}
              </p>
              {!syncError ? (
                <div className="mt-10">
                  <CreateAccountPrompt name={submitted?.name} email={submitted?.email} />
                </div>
              ) : null}
              {syncError ? (
                <Button className="mt-6" onClick={() => setDone(false)}>
                  Try again
                </Button>
              ) : null}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-5">
              <div>
                <h2 className="serif text-3xl font-semibold text-navy">Send a request</h2>
                <p className="mt-1 text-sm text-muted">
                  Tell us a little about your business and we’ll email you a calendar link within one business day.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Label label="Your Name *">
                  <Input required name="name" autoComplete="name" />
                </Label>
                <Label label="Business Name *">
                  <Input required name="company" autoComplete="organization" />
                </Label>
                <Label label="Email Address *">
                  <Input required name="email" type="email" autoComplete="email" />
                </Label>
                <Label label="Phone Number *">
                  <Input required name="phone" type="tel" autoComplete="tel" />
                </Label>
                <Label label="Where are you starting from? *">
                  <Dropdown
                    name="startingPoint"
                    defaultValue=""
                    options={[
                      { value: "", label: "Select one..." },
                      ...[
                        "My books are behind",
                        "We’ve outgrown our setup",
                        "My accountant sent me",
                        "We want to outsource finance entirely",
                        "Something else",
                      ].map((value) => ({ value, label: value })),
                    ]}
                  />
                </Label>
                <Label label="Annual Revenue Range *">
                  <Dropdown
                    name="revenue"
                    defaultValue=""
                    options={[
                      { value: "", label: "Select a range..." },
                      ...["Under $1M", "$1M–$5M", "$5M–$20M", "$20M–$50M", "Over $50M"].map((value) => ({ value, label: value })),
                    ]}
                  />
                </Label>
              </div>
              <Label label="What’s Your Biggest Financial Challenge? *">
                <Textarea required name="challenge" rows={5} />
              </Label>
              {error ? <Alert>{error}</Alert> : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" size="lg" loading={saving}>
                  {saving ? "Sending…" : "Send my request"}
                </Button>
                <p className="text-xs text-muted">We only use these details to arrange your consultation.</p>
              </div>
            </form>
          )}
        </Surface>
      </Container>
    </>
  );
}

function ContactRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/8 text-gold-soft">{icon}</span>
      <span>
        <span className="block text-xs text-white/45">{label}</span>
        <span className="block">{children}</span>
      </span>
    </li>
  );
}
