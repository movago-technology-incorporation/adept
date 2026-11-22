"use client";

import { useRef, useState, type ReactNode } from "react";
import { Check, Eye, EyeOff, FileText, LoaderCircle, Upload, X } from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";
import { cx, inputClass } from "@/components/ui/kit";
import { formatSin, type DocRef, type YesNo } from "@/lib/tax-return";
import { useApp } from "@/store/app-store";

// Each field registers its error key via data-field so the wizard can scroll to the first problem.

export function FieldShell({
  label,
  error,
  hint,
  required,
  field,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  field: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("grid content-start gap-2", className)} data-field={field}>
      <span className="text-sm font-medium text-navy">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span role="alert" className="text-xs font-medium text-danger">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
    </div>
  );
}

const errorRing = (error?: string) => (error ? "bg-danger-soft/60" : "");

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  field,
  type = "text",
  placeholder,
  autoComplete,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  field: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} field={field} className={className}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className={cx(inputClass, errorRing(error))}
      />
    </FieldShell>
  );
}

export function DateField(props: { label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; field: string; max?: string; className?: string }) {
  return (
    <FieldShell label={props.label} error={props.error} required={props.required} field={props.field} className={props.className}>
      <input
        type="date"
        value={props.value}
        max={props.max}
        onChange={(e) => props.onChange(e.target.value)}
        aria-invalid={Boolean(props.error)}
        className={cx(inputClass, errorRing(props.error))}
      />
    </FieldShell>
  );
}

export function MoneyField(props: { label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; required?: boolean; field: string; className?: string }) {
  return (
    <FieldShell label={props.label} error={props.error} hint={props.hint} required={props.required} field={props.field} className={props.className}>
      <span className="relative block">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted">$</span>
        <input
          inputMode="decimal"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value.replace(/[^\d.,]/g, ""))}
          placeholder="0.00"
          aria-invalid={Boolean(props.error)}
          className={cx(inputClass, "pl-8", errorRing(props.error))}
        />
      </span>
    </FieldShell>
  );
}

export function SinField(props: { label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; required?: boolean; field: string; className?: string }) {
  const [show, setShow] = useState(false);
  return (
    <FieldShell label={props.label} error={props.error} hint={props.hint ?? "9 digits. Stored encrypted."} required={props.required} field={props.field} className={props.className}>
      <span className="relative block">
        <input
          inputMode="numeric"
          autoComplete="off"
          type={show ? "text" : "password"}
          value={formatSin(props.value)}
          onChange={(e) => props.onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
          placeholder="123 456 789"
          aria-invalid={Boolean(props.error)}
          className={cx(inputClass, "pr-12 tracking-wider", errorRing(props.error))}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide SIN" : "Show SIN"}
          className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-white hover:text-navy"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </FieldShell>
  );
}

export function SelectField(props: { label: string; value: string; onChange: (v: string) => void; options: string[]; error?: string; required?: boolean; field: string; className?: string }) {
  return (
    <FieldShell label={props.label} error={props.error} required={props.required} field={props.field} className={props.className}>
      <Dropdown
        value={props.value}
        onChange={props.onChange}
        className={errorRing(props.error)}
        options={[{ value: "", label: "Select…" }, ...props.options.map((o) => ({ value: o, label: o }))]}
      />
    </FieldShell>
  );
}

export function TextAreaField(props: { label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; required?: boolean; field: string; rows?: number; className?: string }) {
  return (
    <FieldShell label={props.label} error={props.error} hint={props.hint} required={props.required} field={props.field} className={props.className}>
      <textarea
        rows={props.rows ?? 4}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        aria-invalid={Boolean(props.error)}
        className={cx(inputClass, "resize-y leading-relaxed", errorRing(props.error))}
      />
    </FieldShell>
  );
}

export function YesNoField(props: { label: string; value: YesNo; onChange: (v: YesNo) => void; error?: string; hint?: string; required?: boolean; field: string; className?: string }) {
  return (
    <FieldShell label={props.label} error={props.error} hint={props.hint} required={props.required} field={props.field} className={props.className}>
      <div role="radiogroup" aria-label={props.label} className="flex gap-2">
        {(["yes", "no"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={props.value === v}
            onClick={() => props.onChange(v)}
            className={cx(
              "h-11 min-w-24 rounded-full px-5 text-sm font-medium transition-colors",
              props.value === v ? "bg-navy text-white" : cx("bg-sand text-navy hover:bg-sand-2", props.error && "bg-danger-soft/60"),
            )}
          >
            {v === "yes" ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </FieldShell>
  );
}

/** A tickable checklist card that reveals its follow-up fields when selected. */
export function CheckCard({
  label,
  hint,
  selected,
  onToggle,
  children,
  field,
}: {
  label: string;
  hint: string;
  selected: boolean;
  onToggle: (v: boolean) => void;
  children?: ReactNode;
  field: string;
}) {
  return (
    <div className={cx("rounded-2xl transition-colors", selected ? "bg-paper" : "bg-sand/60 hover:bg-sand")} data-field={field}>
      <button type="button" onClick={() => onToggle(!selected)} aria-pressed={selected} className="flex w-full items-start gap-4 p-4 text-left">
        <span className={cx("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg", selected ? "bg-navy text-white" : "bg-white text-transparent")}>
          <Check className="h-4 w-4" />
        </span>
        <span>
          <span className="block font-medium text-navy">{label}</span>
          <span className="block text-sm text-muted">{hint}</span>
        </span>
      </button>
      {selected && children ? <div className="grid gap-4 px-4 pb-4 sm:pl-14">{children}</div> : null}
    </div>
  );
}

/** Uploads into the client's own folder (Neon storage) and records each file as a document. */
export function DocUpload({
  docs,
  onChange,
  category,
  error,
  field,
  label = "Upload documents",
}: {
  docs: DocRef[];
  onChange: (docs: DocRef[]) => void;
  category: string;
  error?: string;
  field: string;
  label?: string;
}) {
  const { addDocument, deleteDocument, clientId } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [failure, setFailure] = useState<string | null>(null);

  async function upload(files: File[]) {
    if (!clientId || !files.length) return;
    setFailure(null);
    setBusy(files.length);
    const added: DocRef[] = [];
    for (const [i, file] of files.entries()) {
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("category", category);
        const res = await fetch("/api/storage", { method: "POST", body });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Upload failed");
        const id = `doc_${Date.now()}_${i}`;
        await addDocument({
          id,
          clientId,
          name: file.name,
          kind: "upload",
          category,
          size: file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`,
          uploadedAt: new Date().toISOString().slice(0, 10),
          storageKey: json.key,
        });
        added.push({ id, name: file.name, key: json.key });
      } catch (err) {
        setFailure(`${file.name}: ${(err as Error).message}`);
      }
      setBusy((n) => n - 1);
    }
    if (added.length) onChange([...docs, ...added]);
  }

  return (
    <div className="grid gap-2" data-field={field}>
      {docs.length ? (
        <ul className="grid gap-1.5">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-gold-deep" />
              <span className="min-w-0 flex-1 truncate text-navy">{d.name}</span>
              <button
                type="button"
                aria-label={`Remove ${d.name}`}
                onClick={() => {
                  onChange(docs.filter((x) => x.id !== d.id));
                  void deleteDocument(d.id);
                }}
                className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-sand hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy > 0}
        className={cx(
          "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors disabled:opacity-60",
          error ? "bg-danger-soft text-danger" : "bg-white text-navy hover:bg-gold-soft/60",
        )}
      >
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {busy ? `Uploading ${busy}…` : docs.length ? "Add more files" : label}
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.heic,.webp,.xls,.xlsx,.csv,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.currentTarget.value = "";
          void upload(files);
        }}
      />
      {error ? (
        <span role="alert" className="text-xs font-medium text-danger">
          {error}
        </span>
      ) : null}
      {failure ? <span className="text-xs text-danger">{failure}</span> : null}
    </div>
  );
}
