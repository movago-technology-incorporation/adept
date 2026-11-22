"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CloudCheck, CloudOff, LoaderCircle, Lock, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { saveTaxReturnDraft, submitTaxReturn } from "@/app/actions";
import { Alert, Button, buttonClass, cx } from "@/components/ui/kit";
import { TaxReturnSummary } from "@/components/tax/TaxReturnSummary";
import {
  CheckCard,
  DateField,
  DocUpload,
  MoneyField,
  SelectField,
  SinField,
  TextAreaField,
  TextField,
  YesNoField,
} from "@/components/tax/fields";
import {
  CREDIT_ITEMS,
  DEDUCTION_ITEMS,
  GENDERS,
  INCOME_ITEMS,
  MARITAL,
  MAX_DEPENDENTS,
  PROVINCES,
  STEPS,
  activeSteps,
  emptyDependent,
  hasSpouse,
  maritalChanged,
  needsCustody,
  validateStep,
  type Address,
  type ChecklistItem,
  type ItemDef,
  type StepId,
  type TaxReturnData,
} from "@/lib/tax-return";

const today = () => new Date().toISOString().slice(0, 10);

export function TaxReturnWizard({ year, initial, initialStep = 0 }: { year: number; initial: TaxReturnData; initialStep?: number }) {
  const router = useRouter();
  const [data, setData] = useState<TaxReturnData>(initial);
  const steps = activeSteps(data);
  const [stepId, setStepId] = useState<StepId>(() => {
    const wanted = STEPS[initialStep]?.id ?? "personal";
    // Resume where they left off, but never past the first incomplete step.
    const avail = activeSteps(initial);
    let resume: StepId = avail[0].id;
    for (const s of avail) {
      resume = s.id;
      if (s.id === wanted || Object.keys(validateStep(s.id, initial)).length) break;
    }
    return resume;
  });
  const [showErrors, setShowErrors] = useState(false);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  const index = Math.max(0, steps.findIndex((s) => s.id === stepId));
  const current = steps[index] ?? steps[0];
  const errors = useMemo(() => (showErrors ? validateStep(current.id, data) : {}), [showErrors, current.id, data]);
  const err = (k: string) => errors[k];
  const complete = useMemo(() => steps.map((s) => Object.keys(validateStep(s.id, data)).length === 0), [steps, data]);
  const progress = Math.round((complete.slice(0, -1).filter(Boolean).length / Math.max(1, steps.length - 1)) * 100);
  const canVisit = (i: number) => i <= index || complete.slice(0, i).every(Boolean);

  const update = (fn: (d: TaxReturnData) => void) =>
    setData((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  // Autosave the draft shortly after changes.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(async () => {
      setSave("saving");
      const res = await saveTaxReturnDraft(year, data, STEPS.findIndex((s) => s.id === stepId)).catch(() => ({ ok: false as const, error: "" }));
      setSave(res.ok ? "saved" : "error");
    }, 900);
    return () => clearTimeout(t);
  }, [data, stepId, year]);

  function goTo(id: StepId) {
    setStepId(id);
    setShowErrors(false);
    setSubmitError(null);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showFirstError(errs: Record<string, string>) {
    setShowErrors(true);
    const firstKey = Object.keys(errs)[0];
    requestAnimationFrame(() => {
      const el =
        document.querySelector(`[data-field="${CSS.escape(firstKey)}"]`) ??
        document.querySelector(`[data-field^="${CSS.escape(firstKey.split(".").slice(0, -1).join("."))}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function next() {
    const errs = validateStep(current.id, data);
    if (Object.keys(errs).length) return showFirstError(errs);
    const nextStep = steps[index + 1];
    if (nextStep) goTo(nextStep.id);
  }

  async function submit() {
    const errs = validateStep("review", data);
    if (Object.keys(errs).length) return showFirstError(errs);
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitTaxReturn(year, data).catch(() => ({ ok: false as const, error: "We couldn’t reach the server. Please try again." }));
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(res.error);
      if ("step" in res && res.step && res.step !== "review") {
        goTo(res.step as StepId);
        requestAnimationFrame(() => setShowErrors(true));
      }
      return;
    }
    router.refresh();
  }

  // ── Small helpers bound to a path ────────────────────────────────────
  const addressFields = (a: Address, prefix: string, set: (fn: (a: Address) => void) => void) => (
    <div className="grid gap-4 sm:grid-cols-6">
      <TextField className="sm:col-span-2" label="Apartment / house no." required field={`${prefix}.unit`} value={a.unit} error={err(`${prefix}.unit`)} onChange={(v) => set((x) => (x.unit = v))} />
      <TextField className="sm:col-span-4" label="Street name" required field={`${prefix}.street`} value={a.street} error={err(`${prefix}.street`)} onChange={(v) => set((x) => (x.street = v))} autoComplete="address-line1" />
      <TextField className="sm:col-span-2" label="City" required field={`${prefix}.city`} value={a.city} error={err(`${prefix}.city`)} onChange={(v) => set((x) => (x.city = v))} autoComplete="address-level2" />
      <SelectField className="sm:col-span-2" label="Province / territory" required field={`${prefix}.province`} value={a.province} options={PROVINCES} error={err(`${prefix}.province`)} onChange={(v) => set((x) => (x.province = v))} />
      <TextField className="sm:col-span-2" label="Postal code" required field={`${prefix}.postal`} value={a.postal} error={err(`${prefix}.postal`)} onChange={(v) => set((x) => (x.postal = v.toUpperCase()))} autoComplete="postal-code" />
    </div>
  );

  const checklist = (defs: ItemDef[], group: "income" | "deductions" | "credits", extra?: (key: string) => React.ReactNode) =>
    defs.map((def) => {
      const it: ChecklistItem = data[group][def.key];
      const k = `${group}.${def.key}`;
      const set = (fn: (i: ChecklistItem) => void) => update((d) => fn(d[group][def.key]));
      return (
        <CheckCard key={def.key} label={def.label} hint={def.hint} selected={it.selected} onToggle={(v) => set((i) => (i.selected = v))} field={`${k}.docs`}>
          {def.needs === "amount+docs" ? (
            <MoneyField label="Total amount" required field={`${k}.amount`} value={it.amount} error={err(`${k}.amount`)} onChange={(v) => set((i) => (i.amount = v))} className="max-w-xs" />
          ) : null}
          {def.needs === "details" || def.needs === "docs+details" ? (
            <TextAreaField label={def.detailsLabel ?? "Details"} field={`${k}.details`} value={it.details} error={err(`${k}.details`)} onChange={(v) => set((i) => (i.details = v))} rows={3} />
          ) : null}
          {def.needs !== "details" ? (
            <DocUpload category={`${year} tax return`} field={`${k}.docs`} docs={it.docs} error={err(`${k}.docs`)} onChange={(docs) => set((i) => (i.docs = docs))} />
          ) : null}
          {extra?.(def.key)}
        </CheckCard>
      );
    });

  // ── Steps ───────────────────────────────────────────────────────────
  const p = data.personal;
  const s = data.spouse;

  const body: Record<StepId, React.ReactNode> = {
    personal: (
      <>
        <Group title="Name">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="First name" required field="personal.firstName" value={p.firstName} error={err("personal.firstName")} onChange={(v) => update((d) => (d.personal.firstName = v))} autoComplete="given-name" />
            <TextField label="Middle name" field="personal.middleName" value={p.middleName} onChange={(v) => update((d) => (d.personal.middleName = v))} autoComplete="additional-name" />
            <TextField label="Last name" required field="personal.lastName" value={p.lastName} error={err("personal.lastName")} onChange={(v) => update((d) => (d.personal.lastName = v))} autoComplete="family-name" />
          </div>
        </Group>
        <Group title="Identity">
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField label="Gender" required field="personal.gender" value={p.gender} options={GENDERS} error={err("personal.gender")} onChange={(v) => update((d) => (d.personal.gender = v))} />
            <SinField label="Social Insurance Number" required field="personal.sin" value={p.sin} error={err("personal.sin")} onChange={(v) => update((d) => (d.personal.sin = v))} />
            <DateField label="Date of birth" required field="personal.dob" value={p.dob} max={today()} error={err("personal.dob")} onChange={(v) => update((d) => (d.personal.dob = v))} />
          </div>
        </Group>
        <Group title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Email address" type="email" required field="personal.email" value={p.email} error={err("personal.email")} onChange={(v) => update((d) => (d.personal.email = v))} autoComplete="email" />
            <TextField label="Primary phone" type="tel" required field="personal.phone" value={p.phone} error={err("personal.phone")} onChange={(v) => update((d) => (d.personal.phone = v))} autoComplete="tel" />
          </div>
        </Group>
        <Group title="Home address">{addressFields(p.address, "personal.address", (fn) => update((d) => fn(d.personal.address)))}</Group>
        <Group title="Your situation">
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField label="Marital status" required field="personal.maritalStatus" value={p.maritalStatus} options={MARITAL} error={err("personal.maritalStatus")} onChange={(v) => update((d) => (d.personal.maritalStatus = v))} />
            {maritalChanged(data) ? (
              <DateField label={`Date your status changed (if in ${year})`} field="personal.maritalChangeDate" value={p.maritalChangeDate} onChange={(v) => update((d) => (d.personal.maritalChangeDate = v))} />
            ) : (
              <span />
            )}
            <YesNoField label={`Did you immigrate to or leave Canada in ${year}?`} required field="personal.immigrated" value={p.immigrated} error={err("personal.immigrated")} onChange={(v) => update((d) => (d.personal.immigrated = v))} />
            {p.immigrated === "yes" ? (
              <DateField label="Entry or exit date" required field="personal.immigrationDate" value={p.immigrationDate} error={err("personal.immigrationDate")} onChange={(v) => update((d) => (d.personal.immigrationDate = v))} />
            ) : (
              <span />
            )}
            <YesNoField label="Are you a first-time tax filer?" required field="personal.firstTimeFiler" value={p.firstTimeFiler} error={err("personal.firstTimeFiler")} onChange={(v) => update((d) => (d.personal.firstTimeFiler = v))} />
            <MoneyField
              label={`Foreign income in ${year} (CAD)`}
              hint={`Income earned outside Canada between January 1 and December 31, ${year}. Leave blank if none.`}
              field="personal.foreignIncome"
              value={p.foreignIncome}
              error={err("personal.foreignIncome")}
              onChange={(v) => update((d) => (d.personal.foreignIncome = v))}
            />
          </div>
        </Group>
      </>
    ),

    spouse: (
      <>
        <Intro>Because you’re {p.maritalStatus.toLowerCase()}, we also need your spouse or partner’s details.</Intro>
        <Group title="Name">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="First name" required field="spouse.firstName" value={s.firstName} error={err("spouse.firstName")} onChange={(v) => update((d) => (d.spouse.firstName = v))} />
            <TextField label="Middle name" field="spouse.middleName" value={s.middleName} onChange={(v) => update((d) => (d.spouse.middleName = v))} />
            <TextField label="Last name" required field="spouse.lastName" value={s.lastName} error={err("spouse.lastName")} onChange={(v) => update((d) => (d.spouse.lastName = v))} />
          </div>
        </Group>
        <Group title="Identity">
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField label="Gender" required field="spouse.gender" value={s.gender} options={GENDERS} error={err("spouse.gender")} onChange={(v) => update((d) => (d.spouse.gender = v))} />
            <SinField label="Social Insurance Number" required field="spouse.sin" value={s.sin} error={err("spouse.sin")} onChange={(v) => update((d) => (d.spouse.sin = v))} />
            <DateField label="Date of birth" required field="spouse.dob" value={s.dob} max={today()} error={err("spouse.dob")} onChange={(v) => update((d) => (d.spouse.dob = v))} />
          </div>
        </Group>
        <Group title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Email address" type="email" field="spouse.email" value={s.email} error={err("spouse.email")} onChange={(v) => update((d) => (d.spouse.email = v))} />
            <TextField label="Phone number" type="tel" field="spouse.phone" value={s.phone} onChange={(v) => update((d) => (d.spouse.phone = v))} />
          </div>
        </Group>
        <Group title="Address">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-paper px-4 py-3 text-sm text-navy">
            <input type="checkbox" checked={s.sameAddress} onChange={(e) => update((d) => (d.spouse.sameAddress = e.target.checked))} className="h-4 w-4 accent-[#0b1a2e]" />
            Same address as me
          </label>
          {s.sameAddress ? null : addressFields(s.address, "spouse.address", (fn) => update((d) => fn(d.spouse.address)))}
        </Group>
        <Group title="Their situation">
          <div className="grid gap-5 sm:grid-cols-2">
            <YesNoField label={`Did your spouse immigrate to or leave Canada in ${year}?`} required field="spouse.immigrated" value={s.immigrated} error={err("spouse.immigrated")} onChange={(v) => update((d) => (d.spouse.immigrated = v))} />
            {s.immigrated === "yes" ? (
              <DateField label="Entry or exit date" required field="spouse.immigrationDate" value={s.immigrationDate} error={err("spouse.immigrationDate")} onChange={(v) => update((d) => (d.spouse.immigrationDate = v))} />
            ) : (
              <span />
            )}
            <YesNoField label="Is your spouse a first-time tax filer?" required field="spouse.firstTimeFiler" value={s.firstTimeFiler} error={err("spouse.firstTimeFiler")} onChange={(v) => update((d) => (d.spouse.firstTimeFiler = v))} />
            <MoneyField label={`Spouse’s foreign income in ${year} (CAD)`} hint="Leave blank if none." field="spouse.foreignIncome" value={s.foreignIncome} error={err("spouse.foreignIncome")} onChange={(v) => update((d) => (d.spouse.foreignIncome = v))} />
          </div>
        </Group>
      </>
    ),

    dependents: (
      <>
        <YesNoField
          label="Do you have dependents (children or others you support)?"
          required
          field="hasDependents"
          value={data.hasDependents}
          error={err("hasDependents")}
          onChange={(v) =>
            update((d) => {
              d.hasDependents = v;
              if (v === "yes" && !d.dependents.length) d.dependents.push(emptyDependent());
            })
          }
        />
        {data.hasDependents === "yes" ? (
          <div className="grid gap-4">
            {data.dependents.map((dep, i) => {
              const k = `dependents.${i}`;
              const set = (fn: (x: typeof dep) => void) => update((d) => fn(d.dependents[i]));
              return (
                <div key={i} className="rounded-3xl bg-paper p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="font-semibold text-navy">Dependent {i + 1}</p>
                    <button
                      type="button"
                      onClick={() => update((d) => d.dependents.splice(i, 1))}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <TextField label="First name" required field={`${k}.firstName`} value={dep.firstName} error={err(`${k}.firstName`)} onChange={(v) => set((x) => (x.firstName = v))} />
                    <TextField label="Middle name" field={`${k}.middleName`} value={dep.middleName} onChange={(v) => set((x) => (x.middleName = v))} />
                    <TextField label="Last name" required field={`${k}.lastName`} value={dep.lastName} error={err(`${k}.lastName`)} onChange={(v) => set((x) => (x.lastName = v))} />
                    <SelectField label="Gender" required field={`${k}.gender`} value={dep.gender} options={GENDERS} error={err(`${k}.gender`)} onChange={(v) => set((x) => (x.gender = v))} />
                    <DateField label="Date of birth" required field={`${k}.dob`} value={dep.dob} max={today()} error={err(`${k}.dob`)} onChange={(v) => set((x) => (x.dob = v))} />
                    <SinField label="SIN" hint="Required if we’re filing their return." field={`${k}.sin`} value={dep.sin} error={err(`${k}.sin`)} onChange={(v) => set((x) => (x.sin = v))} />
                  </div>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <YesNoField label={`Did they immigrate to or leave Canada in ${year}?`} required field={`${k}.immigrated`} value={dep.immigrated} error={err(`${k}.immigrated`)} onChange={(v) => set((x) => (x.immigrated = v))} />
                    {dep.immigrated === "yes" ? (
                      <DateField label="Entry or exit date" required field={`${k}.immigrationDate`} value={dep.immigrationDate} error={err(`${k}.immigrationDate`)} onChange={(v) => set((x) => (x.immigrationDate = v))} />
                    ) : (
                      <span />
                    )}
                    <YesNoField label="Do they have income, or did you pay childcare for them?" required field={`${k}.hasIncomeOrChildcare`} value={dep.hasIncomeOrChildcare} error={err(`${k}.hasIncomeOrChildcare`)} onChange={(v) => set((x) => (x.hasIncomeOrChildcare = v))} />
                    {dep.hasIncomeOrChildcare === "yes" ? (
                      <MoneyField label="Net income earned or total childcare paid" required field={`${k}.incomeOrChildcareAmount`} value={dep.incomeOrChildcareAmount} error={err(`${k}.incomeOrChildcareAmount`)} onChange={(v) => set((x) => (x.incomeOrChildcareAmount = v))} />
                    ) : (
                      <span />
                    )}
                    <YesNoField label="Should we also prepare their tax return?" required field={`${k}.fileReturn`} value={dep.fileReturn} error={err(`${k}.fileReturn`)} onChange={(v) => set((x) => (x.fileReturn = v))} />
                  </div>
                </div>
              );
            })}
            {data.dependents.length < MAX_DEPENDENTS ? (
              <button type="button" onClick={() => update((d) => d.dependents.push(emptyDependent()))} className={buttonClass("soft", "md", "justify-self-start")}>
                <Plus className="h-4 w-4" /> Add another dependent
              </button>
            ) : (
              <p className="text-sm text-muted">More than {MAX_DEPENDENTS} dependents? Add the others in a message to us after submitting.</p>
            )}
            {needsCustody(data) ? (
              <Group title="Custody agreement">
                <p className="text-sm text-muted">Because you’re {p.maritalStatus.toLowerCase()}, please upload your custody agreement.</p>
                <DocUpload category={`${year} tax return`} field="custodyDocs" docs={data.custodyDocs} error={err("custodyDocs")} onChange={(docs) => update((d) => (d.custodyDocs = docs))} label="Upload custody agreement" />
              </Group>
            ) : null}
          </div>
        ) : null}
      </>
    ),

    cra: (
      <div className="grid gap-6 sm:grid-cols-2">
        <YesNoField label="Are you a Canadian citizen?" required field="cra.citizen" value={data.cra.citizen} error={err("cra.citizen")} onChange={(v) => update((d) => (d.cra.citizen = v))} />
        {hasSpouse(data) ? (
          <YesNoField label="Is your spouse or partner a Canadian citizen?" required field="cra.spouseCitizen" value={data.cra.spouseCitizen} error={err("cra.spouseCitizen")} onChange={(v) => update((d) => (d.cra.spouseCitizen = v))} />
        ) : (
          <span className="hidden sm:block" />
        )}
        <YesNoField
          label="Do you authorize the CRA to share your information with Elections Canada?"
          hint="Used to keep the National Register of Electors up to date."
          required
          field="cra.electionsShare"
          value={data.cra.electionsShare}
          error={err("cra.electionsShare")}
          onChange={(v) => update((d) => (d.cra.electionsShare = v))}
        />
        {hasSpouse(data) ? (
          <YesNoField
            label="Do you authorize the CRA to share your spouse’s information with Elections Canada?"
            required
            field="cra.spouseElectionsShare"
            value={data.cra.spouseElectionsShare}
            error={err("cra.spouseElectionsShare")}
            onChange={(v) => update((d) => (d.cra.spouseElectionsShare = v))}
          />
        ) : (
          <span className="hidden sm:block" />
        )}
        <YesNoField
          label={`At any time in ${year}, did you (or your spouse) own foreign property costing more than CAD $100,000 in total?`}
          hint="Bank accounts, shares, rental property or other assets held outside Canada."
          required
          field="cra.foreignProperty"
          value={data.cra.foreignProperty}
          error={err("cra.foreignProperty")}
          onChange={(v) => update((d) => (d.cra.foreignProperty = v))}
        />
        <YesNoField
          label={`Did you open your first First Home Savings Account (FHSA) in ${year}?`}
          required
          field="cra.firstFhsa"
          value={data.cra.firstFhsa}
          error={err("cra.firstFhsa")}
          onChange={(v) => update((d) => (d.cra.firstFhsa = v))}
        />
        {data.cra.firstFhsa === "yes" ? (
          <TextAreaField
            className="sm:col-span-2"
            label="FHSA details"
            hint="Financial institution, date opened and total contributions."
            required
            field="cra.fhsaDetails"
            value={data.cra.fhsaDetails}
            error={err("cra.fhsaDetails")}
            onChange={(v) => update((d) => (d.cra.fhsaDetails = v))}
            rows={3}
          />
        ) : null}
        <YesNoField
          label="Would you like to receive CRA correspondence electronically?"
          hint="Through CRA My Account instead of paper mail."
          field="cra.electronicMail"
          value={data.cra.electronicMail}
          onChange={(v) => update((d) => (d.cra.electronicMail = v))}
        />
      </div>
    ),

    income: (
      <>
        <Intro>Tick every type of income you received in {year}, then upload the slips. Skip anything that doesn’t apply.</Intro>
        <div className="grid gap-2.5">{checklist(INCOME_ITEMS, "income")}</div>
        <YesNoField label="Did you earn any income outside Canada?" required field="incomeOutsideCanada" value={data.incomeOutsideCanada} error={err("incomeOutsideCanada")} onChange={(v) => update((d) => (d.incomeOutsideCanada = v))} />
        {data.incomeOutsideCanada === "yes" ? (
          <TextAreaField
            label="Foreign income particulars"
            hint="Country, type of income, amount in Canadian dollars, and any foreign tax paid."
            required
            field="foreignIncomeParticulars"
            value={data.foreignIncomeParticulars}
            error={err("foreignIncomeParticulars")}
            onChange={(v) => update((d) => (d.foreignIncomeParticulars = v))}
          />
        ) : null}
      </>
    ),

    deductions: (
      <>
        <Intro>Tick the deductions that apply to you and upload the receipts. Skip anything that doesn’t apply.</Intro>
        <div className="grid gap-2.5">
          {checklist(DEDUCTION_ITEMS, "deductions", (key) =>
            key === "childcare" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Provider’s name (if paid to an individual)" field="childcareProvider.name" value={data.childcareProvider.name} onChange={(v) => update((d) => (d.childcareProvider.name = v))} />
                <SinField label="Provider’s SIN (if paid to an individual)" field="childcareProvider.sin" value={data.childcareProvider.sin} error={err("childcareProvider.sin")} onChange={(v) => update((d) => (d.childcareProvider.sin = v))} />
              </div>
            ) : null,
          )}
        </div>
      </>
    ),

    credits: (
      <>
        <Intro>Tick the credits you can claim, enter totals and upload receipts. Skip anything that doesn’t apply.</Intro>
        <div className="grid gap-2.5">{checklist(CREDIT_ITEMS, "credits")}</div>
      </>
    ),

    supporting: (
      <>
        <YesNoField
          label="Did Adept prepare your tax return last year?"
          required
          field="supporting.preparedByAdept"
          value={data.supporting.preparedByAdept}
          error={err("supporting.preparedByAdept")}
          onChange={(v) => update((d) => (d.supporting.preparedByAdept = v))}
        />
        {data.supporting.preparedByAdept === "no" ? (
          <Group title="Previous year’s personal income tax return (T1)" required>
            <DocUpload category={`${year} tax return`} field="supporting.priorT1" docs={data.supporting.priorT1} error={err("supporting.priorT1")} onChange={(docs) => update((d) => (d.supporting.priorT1 = docs))} label="Upload last year’s T1" />
          </Group>
        ) : null}
        <Group title="Previous year’s Notice of Assessment">
          <DocUpload category={`${year} tax return`} field="supporting.noa" docs={data.supporting.noa} onChange={(docs) => update((d) => (d.supporting.noa = docs))} label="Upload Notice of Assessment" />
        </Group>
        <Group title="Notice of Reassessment (if you received one)">
          <DocUpload category={`${year} tax return`} field="supporting.nora" docs={data.supporting.nora} onChange={(docs) => update((d) => (d.supporting.nora = docs))} label="Upload Notice of Reassessment" />
        </Group>
      </>
    ),

    review: (
      <>
        <Intro>Check everything below. Use Edit to change a section — your answers are kept.</Intro>
        <TaxReturnSummary data={data} year={year} onEdit={(id) => goTo(id)} />
        <div className="rounded-3xl bg-navy p-6 text-white sm:p-8">
          <p className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gold-soft uppercase">
            <ShieldCheck className="h-4 w-4" /> Agreement and declaration
          </p>
          <p className="mt-3 leading-relaxed text-white/80">
            I confirm that the information and documents I have provided are accurate and complete to the best of my knowledge, and that I
            have disclosed all income from all sources. I authorize Adept Bookkeeping and Tax Services to prepare and process my {year}{" "}
            personal income tax return based on this information, and I understand I am responsible for its accuracy.
          </p>
          <label className="mt-5 flex cursor-pointer items-start gap-3" data-field="agreement.agreed">
            <input type="checkbox" checked={data.agreement.agreed} onChange={(e) => update((d) => (d.agreement.agreed = e.target.checked))} className="mt-1 h-4 w-4 accent-[#b8914a]" />
            <span className="font-medium">I have read and agree to the declaration above.</span>
          </label>
          {err("agreement.agreed") ? <p className="mt-2 text-sm text-gold-soft">{err("agreement.agreed")}</p> : null}
          <div className="mt-5 grid gap-4 rounded-2xl bg-white p-4 text-navy sm:grid-cols-3">
            <TextField label="First name" required field="agreement.firstName" value={data.agreement.firstName} error={err("agreement.firstName")} onChange={(v) => update((d) => (d.agreement.firstName = v))} />
            <TextField label="Last name" required field="agreement.lastName" value={data.agreement.lastName} error={err("agreement.lastName")} onChange={(v) => update((d) => (d.agreement.lastName = v))} />
            <div className="grid content-start gap-2">
              <span className="text-sm font-medium text-navy">Date</span>
              <span className="flex h-12 items-center rounded-xl bg-sand px-4 text-[15px] text-navy">
                {new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </>
    ),
  };

  const isLast = index === steps.length - 1;

  return (
    <div ref={top} className="scroll-mt-24">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/client/tax-return" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-navy">
            <ArrowLeft className="h-4 w-4" /> Tax returns
          </Link>
          <p className="eyebrow mt-3 text-gold-deep">Personal income tax return</p>
          <h1 className="serif mt-1 text-4xl font-semibold text-navy sm:text-5xl">{year} tax return</h1>
        </div>
        <div className="flex items-center gap-4">
          <SaveBadge state={save} />
          <div className="w-40">
            <div className="flex justify-between text-xs text-muted">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-sand">
              <div className="h-2 rounded-full bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Step rail */}
        <nav aria-label="Steps" className="lg:sticky lg:top-20 lg:self-start">
          <ol className="flex gap-1.5 overflow-x-auto pb-1 lg:grid lg:gap-1 lg:overflow-visible lg:rounded-3xl lg:bg-white lg:p-3">
            {steps.map((st, i) => {
              const active = st.id === current.id;
              const done = complete[i] && i < index;
              const allowed = canVisit(i);
              return (
                <li key={st.id} className="shrink-0">
                  <button
                    type="button"
                    disabled={!allowed}
                    onClick={() => allowed && goTo(st.id)}
                    aria-current={active ? "step" : undefined}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition-colors",
                      active ? "bg-navy text-white" : allowed ? "bg-white text-navy hover:bg-sand lg:bg-transparent" : "bg-white text-muted/60 lg:bg-transparent",
                    )}
                  >
                    <span
                      className={cx(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                        active ? "bg-gold text-navy" : done ? "bg-success-soft text-success" : allowed ? "bg-sand text-navy" : "bg-sand/60 text-muted/60",
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : !allowed ? <Lock className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className="whitespace-nowrap lg:whitespace-normal">
                      <span className="lg:hidden">{st.short}</span>
                      <span className="hidden lg:inline">{st.title}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step body */}
        <section className="min-w-0 rounded-3xl bg-white p-5 sm:p-8">
          <p className="text-xs font-semibold tracking-wider text-gold-deep uppercase">
            Step {index + 1} of {steps.length}
          </p>
          <h2 className="serif mt-1 text-3xl font-semibold text-navy sm:text-4xl">{current.title}</h2>
          {showErrors && Object.keys(errors).length ? (
            <div className="mt-5">
              <Alert>
                {Object.keys(errors).length === 1 ? "One answer needs" : `${Object.keys(errors).length} answers need`} attention before you can continue.
              </Alert>
            </div>
          ) : null}
          <div className="mt-6 grid gap-8">{body[current.id]}</div>

          {submitError ? (
            <div className="mt-6">
              <Alert>{submitError}</Alert>
            </div>
          ) : null}

          <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {index > 0 ? (
                <Button variant="soft" onClick={() => goTo(steps[index - 1].id)}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : null}
              <Link href="/client/tax-return" className={buttonClass("ghost")}>
                Save & exit
              </Link>
            </div>
            {isLast ? (
              <Button size="lg" variant="gold" onClick={submit} loading={submitting}>
                <ShieldCheck className="h-5 w-5" />
                {submitting ? "Submitting…" : `Submit my ${year} return`}
              </Button>
            ) : (
              <Button size="lg" onClick={next}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Group({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-1 text-xs font-semibold tracking-wider text-muted uppercase">
        {title}
        {required ? <span className="text-danger"> *</span> : null}
      </legend>
      {children}
    </fieldset>
  );
}

function Intro({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-paper px-4 py-3 text-sm leading-relaxed text-muted">{children}</p>;
}

function SaveBadge({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  if (state === "idle") return null;
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-xs", state === "error" ? "text-danger" : "text-muted")} aria-live="polite">
      {state === "saving" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : state === "saved" ? <CloudCheck className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
      {state === "saving" ? "Saving…" : state === "saved" ? "Draft saved" : "Not saved — check your connection"}
    </span>
  );
}
