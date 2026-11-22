"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, Eye, Send, TriangleAlert, UserRound, Users, X } from "lucide-react";
import { previewStaffEmail } from "@/app/actions";
import type { EmailRecipient } from "@/lib/email-recipients";
import { RichTextEditor } from "@/components/studio/RichTextEditor";
import { Alert, Button, Input, Label, Spinner, buttonClass, cx } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";

type Person = EmailRecipient & { name: string; email: string; detail: string };

/** Full-page composer: write on the left, live branded preview on the right. */
export function EmailComposer({ preset = [] }: { preset?: EmailRecipient[] }) {
  const { clients, leads, sendStaffEmail } = useApp();
  const people = useMemo<Person[]>(
    () => [
      ...clients.map((c) => ({ kind: "client" as const, id: c.id, name: c.name, email: c.email, detail: c.company || "Client" })),
      ...leads.map((l) => ({ kind: "lead" as const, id: l.id, name: l.name, email: l.email, detail: `Lead · ${l.status}` })),
    ],
    [clients, leads],
  );
  const key = (r: EmailRecipient) => `${r.kind}:${r.id}`;
  const [chosen, setChosen] = useState<EmailRecipient[]>(preset);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [empty, setEmpty] = useState(true);
  const [postToPortal, setPostToPortal] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ sent: number; failed: { name: string; error?: string }[] } | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const chosenKeys = new Set(chosen.map(key));
  const chosenPeople = chosen.map((r) => people.find((p) => key(p) === key(r))).filter(Boolean) as Person[];
  const needle = q.trim().toLowerCase();
  const matches = needle
    ? people.filter((p) => !chosenKeys.has(key(p)) && `${p.name} ${p.email} ${p.detail}`.toLowerCase().includes(needle)).slice(0, 8)
    : [];
  const hasClient = chosen.some((r) => r.kind === "client");
  const firstName = chosenPeople[0]?.name.split(" ")[0] || "there";

  // Live preview: re-render the branded email shortly after typing stops.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setPreviewing(true);
      const doc = await previewStaffEmail(subject, html, firstName).catch(() => null);
      if (!cancelled) {
        setPreview(doc);
        setPreviewing(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [subject, html, firstName]);

  async function send() {
    setError(null);
    if (!chosen.length) return setError("Choose at least one recipient.");
    if (!subject.trim()) return setError("Add a subject.");
    if (empty) return setError("Write a message.");
    setSending(true);
    const res = await sendStaffEmail({ recipients: chosen, subject, html, postToPortal: postToPortal && hasClient });
    setSending(false);
    if (!res.sent.length) return setError(res.error ?? "Nothing was sent.");
    setResult({
      sent: res.sent.filter((s) => s.status === "sent").length,
      failed: res.sent.filter((s) => s.status === "failed").map((s) => ({ name: s.toName, error: s.error })),
    });
  }

  function reset() {
    setResult(null);
    setChosen([]);
    setSubject("");
    setHtml("");
    setEmpty(true);
    setEditorKey((k) => k + 1);
  }

  if (result) {
    const ok = result.failed.length === 0;
    return (
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center">
        <span className={cx("mx-auto grid h-16 w-16 place-items-center rounded-full", ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
          {ok ? <CheckCircle2 className="h-8 w-8" /> : <TriangleAlert className="h-8 w-8" />}
        </span>
        <h2 className="serif mt-6 text-4xl font-semibold text-navy">{ok ? "Email sent" : "Sent with problems"}</h2>
        <p className="mt-2 text-muted">
          {result.sent} {result.sent === 1 ? "email" : "emails"} delivered to the mail server{result.failed.length ? `, ${result.failed.length} failed` : ""}.
        </p>
        {result.failed.length ? (
          <ul className="mt-5 grid gap-2 text-left text-sm">
            {result.failed.map((f) => (
              <li key={f.name} className="rounded-xl bg-danger-soft px-3 py-2 text-danger">
                <strong>{f.name}</strong> — {f.error ?? "Unknown error"}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href="/studio/email" className={buttonClass("soft")}>
            Back to emails
          </Link>
          <Button onClick={reset}>Write another</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {/* ── Left: compose ─────────────────────────────────────────────── */}
      <section className="grid min-w-0 content-start gap-5 rounded-3xl bg-white p-5 sm:p-7">
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-navy">To</span>
            <button
              type="button"
              onClick={() => setChosen((prev) => [...prev, ...clients.filter((c) => !chosenKeys.has(`client:${c.id}`)).map((c) => ({ kind: "client" as const, id: c.id }))])}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep hover:text-navy"
            >
              <Users className="h-3.5 w-3.5" />
              Add all clients ({clients.length})
            </button>
          </div>
          <div className="relative rounded-2xl bg-sand p-2 focus-within:bg-gold-soft/30">
            <div className="flex flex-wrap gap-1.5">
              {chosenPeople.map((p) => (
                <span key={key(p)} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white py-1 pr-1 pl-2.5 text-sm text-navy">
                  {p.kind === "client" ? <Building2 className="h-3.5 w-3.5 text-gold-deep" /> : <UserRound className="h-3.5 w-3.5 text-muted" />}
                  <span className="truncate">{p.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${p.name}`}
                    onClick={() => setChosen((prev) => prev.filter((r) => key(r) !== key(p)))}
                    className="grid h-5 w-5 place-items-center rounded-full text-muted hover:bg-sand hover:text-navy"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && matches[0]) {
                    e.preventDefault();
                    setChosen((prev) => [...prev, { kind: matches[0].kind, id: matches[0].id }]);
                    setQ("");
                  } else if (e.key === "Backspace" && !q && chosen.length) {
                    setChosen((prev) => prev.slice(0, -1));
                  }
                }}
                placeholder={chosen.length ? "Add another…" : "Search clients and leads…"}
                className="h-8 min-w-40 flex-1 bg-transparent px-2 text-sm text-navy outline-none placeholder:text-muted/70"
                aria-label="Search recipients"
              />
            </div>
            {matches.length ? (
              <ul className="absolute top-full right-0 left-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-2xl bg-navy p-1.5 text-white">
                {matches.map((p) => (
                  <li key={key(p)}>
                    <button
                      type="button"
                      onClick={() => {
                        setChosen((prev) => [...prev, { kind: p.kind, id: p.id }]);
                        setQ("");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/10"
                    >
                      {p.kind === "client" ? <Building2 className="h-4 w-4 shrink-0 text-gold-soft" /> : <UserRound className="h-4 w-4 shrink-0 text-white/50" />}
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{p.name}</span>
                        <span className="block truncate text-xs text-white/50">
                          {p.email} · {p.detail}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <Label label="Subject">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Documents needed for your 2026 T2" maxLength={200} />
        </Label>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-navy">Message</span>
            <span className="text-xs text-muted">
              Type <code className="rounded bg-sand px-1">{"{{first_name}}"}</code> to personalise
            </span>
          </div>
          <RichTextEditor
            key={editorKey}
            onChange={(next, isEmpty) => {
              setHtml(next);
              setEmpty(isEmpty);
            }}
          />
        </div>

        {hasClient ? (
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-paper px-4 py-3 text-sm">
            <input type="checkbox" checked={postToPortal} onChange={(e) => setPostToPortal(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0b1a2e]" />
            <span>
              <span className="block font-medium text-navy">Also post to their portal Messages</span>
              <span className="text-muted">Clients can read and reply in their secure portal (leads only get the email).</span>
            </span>
          </label>
        ) : null}

        {error ? <Alert>{error}</Alert> : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted">
            {chosen.length ? `${chosen.length} recipient${chosen.length === 1 ? "" : "s"} · each gets their own email` : "No recipients yet"}
          </span>
          <div className="flex gap-2">
            <Link href="/studio/email" className={buttonClass("ghost")}>
              Cancel
            </Link>
            <Button onClick={send} loading={sending}>
              <Send className="h-4 w-4" />
              {sending ? "Sending…" : "Send email"}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Right: live preview ───────────────────────────────────────── */}
      <section className="min-w-0 xl:sticky xl:top-20 xl:self-start">
        <div className="overflow-hidden rounded-3xl bg-white">
          <div className="flex items-center justify-between gap-3 bg-sand px-5 py-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-navy">
              <Eye className="h-4 w-4" />
              Live preview
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-muted">
              {previewing ? <Spinner className="h-3.5 w-3.5" /> : null}
              {chosenPeople[0] ? `As ${chosenPeople[0].name} sees it` : "Sample recipient"}
            </span>
          </div>
          {preview ? (
            <iframe title="Email preview" srcDoc={preview} sandbox="" className="h-[calc(100vh-11rem)] min-h-[560px] w-full bg-paper" />
          ) : (
            <div className="flex h-[560px] items-center justify-center gap-2 bg-paper text-sm text-muted">
              <Spinner /> Rendering preview…
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function BackToEmails() {
  return (
    <Link href="/studio/email" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy">
      <ArrowLeft className="h-4 w-4" /> All emails
    </Link>
  );
}
