"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff, FileText, Pencil } from "lucide-react";
import { openStoredFile } from "@/components/portal/Uploader";
import { cx, formatDate } from "@/components/ui/kit";
import {
  CREDIT_ITEMS,
  DEDUCTION_ITEMS,
  INCOME_ITEMS,
  formatSin,
  hasSpouse,
  maskSin,
  needsCustody,
  type Address,
  type DocRef,
  type ItemDef,
  type StepId,
  type TaxReturnData,
} from "@/lib/tax-return";

const yn = (v: string) => (v === "yes" ? "Yes" : v === "no" ? "No" : "—");
const money = (v: string) => (v?.trim() ? `$${Number(v.replace(/[$,]/g, "")).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—");
const addr = (a: Address) => [a.unit, a.street, a.city, a.province, a.postal].filter(Boolean).join(", ") || "—";
const fullName = (p: { firstName: string; middleName: string; lastName: string }) => [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ") || "—";

/** Read-only view of every answer. `onEdit` adds “Edit” links per section (review step). */
export function TaxReturnSummary({
  data,
  year,
  onEdit,
  revealSin = false,
}: {
  data: TaxReturnData;
  year: number;
  onEdit?: (step: StepId) => void;
  revealSin?: boolean;
}) {
  const [show, setShow] = useState(false);
  const sin = (v: string) => (!v ? "—" : revealSin && show ? formatSin(v) : maskSin(v));
  const p = data.personal;
  const s = data.spouse;

  return (
    <div className="grid gap-4">
      {revealSin ? (
        <button type="button" onClick={() => setShow((v) => !v)} className="inline-flex items-center gap-2 justify-self-start rounded-full bg-sand px-3.5 py-1.5 text-sm text-navy hover:bg-sand-2">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {show ? "Hide SINs" : "Reveal SINs"}
        </button>
      ) : null}

      <Section title="Personal information" step="personal" onEdit={onEdit}>
        <Row k="Name" v={fullName(p)} />
        <Row k="Gender" v={p.gender || "—"} />
        <Row k="SIN" v={sin(p.sin)} />
        <Row k="Date of birth" v={formatDate(p.dob) || "—"} />
        <Row k="Email" v={p.email || "—"} />
        <Row k="Phone" v={p.phone || "—"} />
        <Row k="Address" v={addr(p.address)} wide />
        <Row k="Marital status" v={p.maritalStatus || "—"} />
        {p.maritalChangeDate ? <Row k="Status changed" v={formatDate(p.maritalChangeDate)} /> : null}
        <Row k="Immigrated / left Canada" v={yn(p.immigrated)} />
        {p.immigrated === "yes" ? <Row k="Entry / exit date" v={formatDate(p.immigrationDate)} /> : null}
        <Row k="First-time filer" v={yn(p.firstTimeFiler)} />
        <Row k={`Foreign income in ${year} (CAD)`} v={money(p.foreignIncome)} />
      </Section>

      {hasSpouse(data) ? (
        <Section title="Spouse or partner" step="spouse" onEdit={onEdit}>
          <Row k="Name" v={fullName(s)} />
          <Row k="Gender" v={s.gender || "—"} />
          <Row k="SIN" v={sin(s.sin)} />
          <Row k="Date of birth" v={formatDate(s.dob) || "—"} />
          <Row k="Email" v={s.email || "—"} />
          <Row k="Phone" v={s.phone || "—"} />
          <Row k="Address" v={s.sameAddress ? "Same as taxpayer" : addr(s.address)} wide />
          <Row k="Immigrated / left Canada" v={yn(s.immigrated)} />
          {s.immigrated === "yes" ? <Row k="Entry / exit date" v={formatDate(s.immigrationDate)} /> : null}
          <Row k="First-time filer" v={yn(s.firstTimeFiler)} />
          <Row k={`Foreign income in ${year} (CAD)`} v={money(s.foreignIncome)} />
        </Section>
      ) : null}

      <Section title="Dependents" step="dependents" onEdit={onEdit}>
        {data.hasDependents !== "yes" ? (
          <Row k="Dependents" v="None" wide />
        ) : (
          <>
            {data.dependents.map((d, i) => (
              <div key={i} className="col-span-full rounded-2xl bg-paper p-4">
                <p className="mb-3 font-semibold text-navy">
                  Dependent {i + 1}: {fullName(d)}
                </p>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <Row k="Gender" v={d.gender || "—"} />
                  <Row k="Date of birth" v={formatDate(d.dob) || "—"} />
                  <Row k="SIN" v={sin(d.sin)} />
                  <Row k="Immigrated / left Canada" v={d.immigrated === "yes" ? `Yes · ${formatDate(d.immigrationDate)}` : yn(d.immigrated)} />
                  <Row k="Income or childcare costs" v={d.hasIncomeOrChildcare === "yes" ? money(d.incomeOrChildcareAmount) : yn(d.hasIncomeOrChildcare)} />
                  <Row k="File their return too" v={yn(d.fileReturn)} />
                </dl>
              </div>
            ))}
            {needsCustody(data) ? <Docs k="Custody agreement" docs={data.custodyDocs} /> : null}
          </>
        )}
      </Section>

      <Section title="CRA questions" step="cra" onEdit={onEdit}>
        <Row k="Canadian citizen" v={yn(data.cra.citizen)} />
        {hasSpouse(data) ? <Row k="Spouse is a Canadian citizen" v={yn(data.cra.spouseCitizen)} /> : null}
        <Row k="Share info with Elections Canada" v={yn(data.cra.electionsShare)} />
        {hasSpouse(data) ? <Row k="Share spouse info with Elections Canada" v={yn(data.cra.spouseElectionsShare)} /> : null}
        <Row k="Foreign property over $100,000" v={yn(data.cra.foreignProperty)} />
        <Row k={`Opened first FHSA in ${year}`} v={yn(data.cra.firstFhsa)} />
        {data.cra.firstFhsa === "yes" ? <Row k="FHSA details" v={data.cra.fhsaDetails} wide /> : null}
        <Row k="CRA mail electronically" v={yn(data.cra.electronicMail)} />
      </Section>

      <Section title="Income" step="income" onEdit={onEdit}>
        <Checklist defs={INCOME_ITEMS} values={data.income} />
        <Row k="Income earned outside Canada" v={yn(data.incomeOutsideCanada)} />
        {data.incomeOutsideCanada === "yes" ? <Row k="Foreign income particulars" v={data.foreignIncomeParticulars} wide /> : null}
      </Section>

      <Section title="Deductions" step="deductions" onEdit={onEdit}>
        <Checklist defs={DEDUCTION_ITEMS} values={data.deductions} />
        {data.deductions.childcare?.selected && (data.childcareProvider.name || data.childcareProvider.sin) ? (
          <Row k="Childcare provider" v={`${data.childcareProvider.name || "—"} · SIN ${sin(data.childcareProvider.sin)}`} wide />
        ) : null}
      </Section>

      <Section title="Tax credits" step="credits" onEdit={onEdit}>
        <Checklist defs={CREDIT_ITEMS} values={data.credits} />
      </Section>

      <Section title="Supporting documents" step="supporting" onEdit={onEdit}>
        <Row k="Adept prepared last year’s return" v={yn(data.supporting.preparedByAdept)} />
        <Docs k="Previous year’s T1" docs={data.supporting.priorT1} />
        <Docs k="Notice of Assessment" docs={data.supporting.noa} />
        <Docs k="Notice of Reassessment" docs={data.supporting.nora} />
      </Section>
    </div>
  );
}

function Section({ title, step, onEdit, children }: { title: string; step: StepId; onEdit?: (s: StepId) => void; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 sm:p-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-navy">{title}</h3>
        {onEdit ? (
          <button type="button" onClick={() => onEdit(step)} className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-xs font-medium text-navy hover:bg-sand-2">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        ) : null}
      </header>
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Row({ k, v, wide }: { k: string; v: ReactNode; wide?: boolean }) {
  return (
    <div className={cx("min-w-0", wide && "sm:col-span-2")}>
      <dt className="text-muted">{k}</dt>
      <dd className="mt-0.5 break-words whitespace-pre-line text-navy">{v || "—"}</dd>
    </div>
  );
}

function Docs({ k, docs }: { k: string; docs: DocRef[] }) {
  return (
    <div className="sm:col-span-2">
      <dt className="text-muted">{k}</dt>
      <dd className="mt-1.5 flex flex-wrap gap-1.5">
        {docs.length ? (
          docs.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => openStoredFile(d.key)}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-xs text-navy hover:bg-gold-soft"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{d.name}</span>
            </button>
          ))
        ) : (
          <span className="text-navy">—</span>
        )}
      </dd>
    </div>
  );
}

function Checklist({ defs, values }: { defs: ItemDef[]; values: TaxReturnData["income"] }) {
  const picked = defs.filter((d) => values[d.key]?.selected);
  if (!picked.length) return <Row k="Selected" v="None" wide />;
  return (
    <>
      {picked.map((d) => {
        const it = values[d.key];
        return (
          <div key={d.key} className="rounded-2xl bg-paper p-4 sm:col-span-2">
            <p className="font-medium text-navy">{d.label}</p>
            {it.amount ? <p className="mt-1 text-sm text-muted">Amount: {money(it.amount)}</p> : null}
            {it.details ? <p className="mt-1 text-sm whitespace-pre-line text-ink/80">{it.details}</p> : null}
            {it.docs.length ? (
              <div className="mt-2">
                <Docs k="Documents" docs={it.docs} />
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
