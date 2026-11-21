"use client";

import { FormEvent, useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Dropdown } from "@/components/ui/Dropdown";
import { Alert, Button, ButtonLink, Container, Input, Label, Surface, Textarea } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";

const facts = [
  ["Processing order", "By due date (April 30 personal, June 15 self-employed), then first come, first served."],
  ["Turnaround", "Most personal-only returns within 5 business days once we have everything."],
  ["Confidential", "Your information is used solely for filing and held in confidence."],
  ["Payment", "Personal invoices are paid in full before the return is filed."],
];

export default function FilingRequestPage() {
  const { addLead, recordClick, syncError } = useApp();
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
      phone: String(data.get("phone")),
      company: String(data.get("type")),
      source: "Tax filing request",
      interest: String(data.get("type")),
      status: "new",
      lastClick: new Date().toISOString().slice(0, 16).replace("T", " "),
      page: "/tax/filing-request",
      utm: "form",
      notes: String(data.get("notes") || ""),
      createdAt: new Date().toISOString().slice(0, 10),
    });
    void recordClick("/tax/filing-request", "Submit filing request");
    setSaving(false);
    setDone(true);
  }

  return (
    <>
      <PageHero
        image="documents"
        imageAlt="Preparing tax documents for filing"
        kicker="Tax services"
        title="Tax filing request."
        lead="Share a few details and we’ll take it from there — including a secure link for your slips and signing documents."
        crumbs={[{ href: "/tax", label: "Tax services" }]}
      />
      <Container className="grid gap-6 py-16 sm:py-20 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid gap-3 lg:self-start">
          {facts.map(([title, body]) => (
            <div key={title} className="rounded-3xl bg-white p-6">
              <p className="font-semibold text-navy">{title}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>

        <Surface className="p-6 sm:p-10">
          {done && !syncError ? (
            <div className="py-10 text-center">
              <h2 className="serif text-4xl font-semibold text-navy">Request received</h2>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
                A coordinator will email you with next steps and how to send your documents securely.
              </p>
              <ButtonLink href="/login" variant="soft" className="mt-8">
                Create your client portal account
              </ButtonLink>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-5">
              <h2 className="serif text-3xl font-semibold text-navy">Your details</h2>
              <Label label="Full legal name">
                <Input required name="name" autoComplete="name" />
              </Label>
              <div className="grid gap-5 sm:grid-cols-2">
                <Label label="Email">
                  <Input required name="email" type="email" autoComplete="email" />
                </Label>
                <Label label="Phone">
                  <Input required name="phone" type="tel" autoComplete="tel" />
                </Label>
              </div>
              <Label label="Return type">
                <Dropdown
                  name="type"
                  defaultValue="Personal T1"
                  options={["Personal T1", "Self-employed T1", "Deceased taxpayer"].map((value) => ({ value, label: value }))}
                />
              </Label>
              <Label label="Notes for the preparer (optional)">
                <Textarea name="notes" rows={4} placeholder="Dependants, rental income, moves, anything unusual this year…" />
              </Label>
              {syncError ? <Alert>{syncError}</Alert> : null}
              <Button type="submit" size="lg" loading={saving} className="sm:justify-self-start">
                {saving ? "Submitting…" : "Submit request"}
              </Button>
            </form>
          )}
        </Surface>
      </Container>
    </>
  );
}
