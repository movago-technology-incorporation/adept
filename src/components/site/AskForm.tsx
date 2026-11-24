"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, MessageCircleQuestion } from "lucide-react";
import { Alert, Button, Input, Label, Textarea } from "@/components/ui/kit";
import { askTopic, ASK_TOPICS } from "@/lib/ask-topics";
import { useApp } from "@/store/app-store";

/** Short question form; the topic comes from the page the visitor came from (?from=/tax/individual). */
export function AskForm() {
  const params = useSearchParams();
  const raw = params.get("from");
  const from = raw && ASK_TOPICS[raw] ? raw : null;
  const t = askTopic(from);
  const { addLead } = useApp();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSaving(true);
    setError(null);
    try {
      await addLead({
        id: `lead_${Date.now()}`,
        name: String(data.get("name")).trim(),
        email: String(data.get("email")).trim(),
        phone: String(data.get("phone") || "").trim(),
        company: "",
        source: "Question form",
        interest: t.topic,
        status: "new",
        lastClick: new Date().toISOString().slice(0, 16).replace("T", " "),
        page: "/ask",
        utm: from ?? "",
        notes: String(data.get("question")).trim(),
        createdAt: new Date().toISOString().slice(0, 10),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      {from ? (
        <Link href={from} className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy">
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Link>
      ) : null}
      <div className="rounded-3xl bg-white p-7 sm:p-10">
        {done ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <h1 className="serif mt-4 text-4xl font-semibold text-navy">Question sent</h1>
            <p className="mt-3 text-muted">Thanks! We’ll reply by email within one business day.</p>
            {from ? (
              <Link href={from} className="mt-6 inline-block text-sm font-medium text-navy underline underline-offset-4">
                Back to {t.back}
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sand text-navy">
              <MessageCircleQuestion className="h-5 w-5" />
            </span>
            <p className="eyebrow mt-6 text-gold-deep">{t.topic}</p>
            <h1 className="serif mt-2 text-4xl leading-tight font-semibold text-navy">{t.title}</h1>
            <p className="mt-2 text-muted">We’ll reply by email within one business day.</p>
            <form onSubmit={onSubmit} className="mt-8 grid gap-4">
              <Label label="Your name">
                <Input name="name" required autoComplete="name" />
              </Label>
              <Label label="Email">
                <Input name="email" type="email" required autoComplete="email" />
              </Label>
              <Label label="Phone (optional)">
                <Input name="phone" type="tel" autoComplete="tel" />
              </Label>
              <Label label="Your question">
                <Textarea name="question" required rows={5} placeholder="Ask us anything" />
              </Label>
              {error ? <Alert>{error}</Alert> : null}
              <Button type="submit" size="lg" loading={saving}>
                Send question
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
