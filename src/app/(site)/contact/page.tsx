"use client";

import { FormEvent, useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { ClockIcon, MailIcon, PhoneIcon } from "@/components/site/Icons";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button, ButtonLink, Container, Input, Label, Surface, Textarea } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";

export default function ContactPage() {
  const { firm, addLead, recordClick, syncError } = useApp();
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const data = new FormData(e.currentTarget);
    await addLead({
      id: `lead_${Date.now()}`,
      name: String(data.get("name")),
      email: String(data.get("email")),
      phone: String(data.get("phone") || ""),
      company: String(data.get("company") || ""),
      source: "Contact form",
      interest: String(data.get("interest")),
      status: "new",
      lastClick: new Date().toISOString().slice(0, 16).replace("T", " "),
      page: "/contact",
      utm: "form",
      notes: String(data.get("message")),
      createdAt: new Date().toISOString().slice(0, 10),
    });
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
              {syncError ? (
                <Button className="mt-6" onClick={() => setDone(false)}>
                  Try again
                </Button>
              ) : null}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-5">
              <h2 className="serif text-3xl font-semibold text-navy">Send a message</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Label label="Name">
                  <Input required name="name" autoComplete="name" />
                </Label>
                <Label label="Email">
                  <Input required name="email" type="email" autoComplete="email" />
                </Label>
                <Label label="Phone (optional)">
                  <Input name="phone" type="tel" autoComplete="tel" />
                </Label>
                <Label label="Business (optional)">
                  <Input name="company" autoComplete="organization" />
                </Label>
              </div>
              <Label label="I’m interested in">
                <Dropdown
                  name="interest"
                  defaultValue="Bookkeeping"
                  options={["Bookkeeping", "Tax", "Payroll", "Consultation", "Something else"].map((value) => ({ value, label: value }))}
                />
              </Label>
              <Label label="How can we help?">
                <Textarea required name="message" rows={5} placeholder="Tell us about your business, transaction volume, or what’s on your mind." />
              </Label>
              <Button type="submit" size="lg" loading={saving} className="sm:justify-self-start">
                {saving ? "Sending…" : "Send message"}
              </Button>
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
