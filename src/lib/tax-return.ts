// Personal Income Tax Return questionnaire — shared by the client wizard (validation as you go)
// and the server (re-validation on submit). Mirrors Adept's 11-page PDF form.

export type YesNo = "yes" | "no" | "";
export type DocRef = { id: string; name: string; key: string };

export type Address = { unit: string; street: string; city: string; province: string; postal: string };

export type PersonBase = {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  sin: string;
  dob: string;
};

export type Dependent = PersonBase & {
  immigrated: YesNo;
  immigrationDate: string;
  hasIncomeOrChildcare: YesNo;
  incomeOrChildcareAmount: string;
  fileReturn: YesNo;
};

export type ChecklistItem = { selected: boolean; details: string; amount: string; docs: DocRef[] };

export type TaxReturnData = {
  personal: PersonBase & {
    email: string;
    phone: string;
    address: Address;
    maritalStatus: string;
    maritalChangeDate: string;
    immigrated: YesNo;
    immigrationDate: string;
    firstTimeFiler: YesNo;
    foreignIncome: string;
  };
  spouse: PersonBase & {
    email: string;
    phone: string;
    sameAddress: boolean;
    address: Address;
    immigrated: YesNo;
    immigrationDate: string;
    firstTimeFiler: YesNo;
    foreignIncome: string;
  };
  hasDependents: YesNo;
  dependents: Dependent[];
  custodyDocs: DocRef[];
  cra: {
    citizen: YesNo;
    spouseCitizen: YesNo;
    electionsShare: YesNo;
    spouseElectionsShare: YesNo;
    foreignProperty: YesNo;
    firstFhsa: YesNo;
    fhsaDetails: string;
    electronicMail: YesNo;
  };
  income: Record<string, ChecklistItem>;
  incomeOutsideCanada: YesNo;
  foreignIncomeParticulars: string;
  deductions: Record<string, ChecklistItem>;
  childcareProvider: { name: string; sin: string };
  credits: Record<string, ChecklistItem>;
  supporting: { preparedByAdept: YesNo; priorT1: DocRef[]; noa: DocRef[]; nora: DocRef[] };
  agreement: { agreed: boolean; firstName: string; lastName: string; date: string };
};

// ── Options ───────────────────────────────────────────────────────────

export const GENDERS = ["Male", "Female", "Another gender", "Prefer not to say"];
export const MARITAL = ["Married", "Single", "Common-law", "Separated", "Divorced", "Widowed"];
export const PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
  "Outside Canada",
];
export const MAX_DEPENDENTS = 3;

export type ItemDef = {
  key: string;
  label: string;
  hint: string;
  /** What we ask for when ticked. */
  needs: "docs" | "details" | "docs+details" | "amount+docs";
  detailsLabel?: string;
};

export const INCOME_ITEMS: ItemDef[] = [
  { key: "t4", label: "Employment income (T4)", hint: "Upload every T4 slip from each employer.", needs: "docs" },
  { key: "ei", label: "Employment Insurance & other benefits (T4A, T4E)", hint: "Include scholarships, bursaries, pensions and EI slips.", needs: "docs" },
  { key: "socialAssistance", label: "Social assistance payments (T5007)", hint: "Upload your T5007 slip.", needs: "docs" },
  { key: "workersComp", label: "Workers’ compensation benefits (T5007)", hint: "Upload your T5007 slip.", needs: "docs" },
  {
    key: "business",
    label: "Business or professional income",
    hint: "Self-employment, commissions, tips and gratuities. Summarize income and expenses, and upload statements if you have them.",
    needs: "docs+details",
    detailsLabel: "Business income and expenses summary",
  },
  { key: "investment", label: "Investment income (T3, T5, T5008, T5013)", hint: "Interest, dividends, mutual funds and limited partnerships.", needs: "docs" },
  {
    key: "rental",
    label: "Rental income",
    hint: "List rent received and expenses (mortgage interest, property tax, insurance, repairs, utilities).",
    needs: "docs+details",
    detailsLabel: "Rental income and expenses",
  },
  { key: "other", label: "Other sources of income", hint: "Anything not listed above.", needs: "details", detailsLabel: "Describe the income" },
];

export const DEDUCTION_ITEMS: ItemDef[] = [
  { key: "rrsp", label: "RRSP contributions", hint: "Upload all RRSP contribution receipts.", needs: "docs" },
  { key: "hbp", label: "Home Buyers’ Plan / FHSA withdrawals", hint: "Upload withdrawal details or statements.", needs: "docs" },
  { key: "carryingCosts", label: "Carrying costs for investment income", hint: "Interest and fees paid to earn investment income.", needs: "docs+details", detailsLabel: "Describe the costs" },
  { key: "dues", label: "Union and professional dues", hint: "Upload receipts (often shown on your T4).", needs: "docs" },
  { key: "employment", label: "Employment expenses", hint: "Requires a signed T2200 from your employer.", needs: "docs+details", detailsLabel: "Expense summary" },
  { key: "homeOffice", label: "Home office expenses", hint: "Requires a signed T2200 from your employer.", needs: "docs+details", detailsLabel: "Workspace size and expenses" },
  { key: "childcare", label: "Childcare expenses", hint: "Upload receipts. If paid to an individual, we need their name and SIN.", needs: "docs" },
  { key: "moving", label: "Moving expenses", hint: "Upload receipts and a letter from your employer confirming the move wasn’t reimbursed.", needs: "docs" },
  { key: "homeBusiness", label: "Home-based business expenses", hint: "Summarize the expenses for your home-based business.", needs: "docs+details", detailsLabel: "Expense summary" },
];

export const CREDIT_ITEMS: ItemDef[] = [
  { key: "medical", label: "Medical expenses", hint: "Net of any insurance reimbursement. Upload receipts.", needs: "amount+docs" },
  { key: "healthPremiums", label: "Private health insurance premiums", hint: "Amount you paid personally (not your employer).", needs: "amount+docs" },
  { key: "prescriptions", label: "Prescription drug expenses", hint: "Upload your pharmacy’s annual statement.", needs: "amount+docs" },
  { key: "charitable", label: "Charitable donations", hint: "Official donation receipts only.", needs: "amount+docs" },
  { key: "political", label: "Political donations", hint: "Official receipts only.", needs: "amount+docs" },
  { key: "tuition", label: "Tuition and education (T2202 / TL11A)", hint: "Upload your tuition slips.", needs: "docs" },
  { key: "studentLoan", label: "Student loan interest", hint: "Upload the annual interest statement.", needs: "amount+docs" },
  { key: "firstHome", label: "First-time home buyers’ tax credit", hint: "Upload the statement of adjustments from your lawyer.", needs: "docs" },
  { key: "schoolSupply", label: "Eligible educator school supply credit", hint: "Upload receipts and a letter from your school.", needs: "amount+docs" },
];

export const STEPS = [
  { id: "personal", title: "Personal information", short: "You" },
  { id: "spouse", title: "Spouse or partner", short: "Spouse" },
  { id: "dependents", title: "Dependents", short: "Dependents" },
  { id: "cra", title: "CRA questions", short: "CRA" },
  { id: "income", title: "Income", short: "Income" },
  { id: "deductions", title: "Deductions", short: "Deductions" },
  { id: "credits", title: "Tax credits", short: "Credits" },
  { id: "supporting", title: "Supporting documents", short: "Documents" },
  { id: "review", title: "Review & declaration", short: "Review" },
] as const;
export type StepId = (typeof STEPS)[number]["id"];

// ── Factories ─────────────────────────────────────────────────────────

const person = (): PersonBase => ({ firstName: "", middleName: "", lastName: "", gender: "", sin: "", dob: "" });
const address = (): Address => ({ unit: "", street: "", city: "", province: "", postal: "" });
const item = (): ChecklistItem => ({ selected: false, details: "", amount: "", docs: [] });
const items = (defs: ItemDef[]) => Object.fromEntries(defs.map((d) => [d.key, item()]));

export function emptyDependent(): Dependent {
  return { ...person(), immigrated: "", immigrationDate: "", hasIncomeOrChildcare: "", incomeOrChildcareAmount: "", fileReturn: "" };
}

export function emptyReturn(prefill?: { firstName?: string; lastName?: string; email?: string; phone?: string }): TaxReturnData {
  return {
    personal: {
      ...person(),
      firstName: prefill?.firstName ?? "",
      lastName: prefill?.lastName ?? "",
      email: prefill?.email ?? "",
      phone: prefill?.phone ?? "",
      address: address(),
      maritalStatus: "",
      maritalChangeDate: "",
      immigrated: "",
      immigrationDate: "",
      firstTimeFiler: "",
      foreignIncome: "",
    },
    spouse: { ...person(), email: "", phone: "", sameAddress: true, address: address(), immigrated: "", immigrationDate: "", firstTimeFiler: "", foreignIncome: "" },
    hasDependents: "",
    dependents: [],
    custodyDocs: [],
    cra: { citizen: "", spouseCitizen: "", electionsShare: "", spouseElectionsShare: "", foreignProperty: "", firstFhsa: "", fhsaDetails: "", electronicMail: "" },
    income: items(INCOME_ITEMS),
    incomeOutsideCanada: "",
    foreignIncomeParticulars: "",
    deductions: items(DEDUCTION_ITEMS),
    childcareProvider: { name: "", sin: "" },
    credits: items(CREDIT_ITEMS),
    supporting: { preparedByAdept: "", priorT1: [], noa: [], nora: [] },
    agreement: { agreed: false, firstName: "", lastName: "", date: "" },
  };
}

/** Fills any keys missing from an older saved draft. */
export function normalizeReturn(data: Partial<TaxReturnData> | null | undefined): TaxReturnData {
  const base = emptyReturn();
  if (!data) return base;
  const merged = { ...base, ...data } as TaxReturnData;
  merged.personal = { ...base.personal, ...data.personal, address: { ...base.personal.address, ...data.personal?.address } };
  merged.spouse = { ...base.spouse, ...data.spouse, address: { ...base.spouse.address, ...data.spouse?.address } };
  merged.cra = { ...base.cra, ...data.cra };
  merged.supporting = { ...base.supporting, ...data.supporting };
  merged.agreement = { ...base.agreement, ...data.agreement };
  merged.childcareProvider = { ...base.childcareProvider, ...data.childcareProvider };
  merged.income = { ...base.income, ...data.income };
  merged.deductions = { ...base.deductions, ...data.deductions };
  merged.credits = { ...base.credits, ...data.credits };
  merged.dependents = (data.dependents ?? []).slice(0, MAX_DEPENDENTS).map((d) => ({ ...emptyDependent(), ...d }));
  return merged;
}

// ── Rules ─────────────────────────────────────────────────────────────

export const hasSpouse = (d: TaxReturnData) => d.personal.maritalStatus === "Married" || d.personal.maritalStatus === "Common-law";
export const maritalChanged = (d: TaxReturnData) => ["Married", "Common-law", "Separated", "Divorced", "Widowed"].includes(d.personal.maritalStatus);
export const needsCustody = (d: TaxReturnData) =>
  (d.personal.maritalStatus === "Separated" || d.personal.maritalStatus === "Divorced") && d.hasDependents === "yes";

/** Steps that apply to this return (spouse step only for married / common-law). */
export function activeSteps(d: TaxReturnData) {
  return STEPS.filter((s) => s.id !== "spouse" || hasSpouse(d));
}

/** Canadian SIN: 9 digits passing the Luhn checksum. */
export function validSin(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{9}$/.test(digits) || digits.startsWith("0") || digits.startsWith("8")) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    let n = Number(digits[i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export const formatSin = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean).join(" ");
};
export const maskSin = (v: string) => {
  const d = v.replace(/\D/g, "");
  return d.length === 9 ? `••• ••• ${d.slice(6)}` : "";
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isPhone = (v: string) => v.replace(/\D/g, "").length >= 10;
const isCaPostal = (v: string) => /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(v.trim());
const isMoney = (v: string) => /^\d+(\.\d{1,2})?$/.test(v.replace(/[$,\s]/g, ""));
const today = () => new Date().toISOString().slice(0, 10);

export type Errors = Record<string, string>;

function requirePerson(e: Errors, p: PersonBase, prefix: string, opts: { sin: boolean; gender: boolean }) {
  if (!p.firstName.trim()) e[`${prefix}.firstName`] = "Enter a first name.";
  if (!p.lastName.trim()) e[`${prefix}.lastName`] = "Enter a last name.";
  if (opts.gender && !p.gender) e[`${prefix}.gender`] = "Choose an option.";
  if (opts.sin) {
    if (!p.sin.trim()) e[`${prefix}.sin`] = "Enter the Social Insurance Number.";
    else if (!validSin(p.sin)) e[`${prefix}.sin`] = "That SIN isn’t valid — check the 9 digits.";
  } else if (p.sin.trim() && !validSin(p.sin)) e[`${prefix}.sin`] = "That SIN isn’t valid — check the 9 digits.";
  if (!p.dob) e[`${prefix}.dob`] = "Enter the date of birth.";
  else if (p.dob > today()) e[`${prefix}.dob`] = "Date of birth can’t be in the future.";
}

function requireAddress(e: Errors, a: Address, prefix: string) {
  if (!a.unit.trim()) e[`${prefix}.unit`] = "Enter the apartment or house number.";
  if (!a.street.trim()) e[`${prefix}.street`] = "Enter the street name.";
  if (!a.city.trim()) e[`${prefix}.city`] = "Enter the city.";
  if (!a.province) e[`${prefix}.province`] = "Choose a province or territory.";
  if (!a.postal.trim()) e[`${prefix}.postal`] = "Enter the postal code.";
  else if (a.province && a.province !== "Outside Canada" && !isCaPostal(a.postal)) e[`${prefix}.postal`] = "Use a Canadian postal code, e.g. T2P 1J9.";
}

const yn = (e: Errors, v: YesNo, path: string, msg = "Choose Yes or No.") => {
  if (v !== "yes" && v !== "no") e[path] = msg;
};

function checklist(e: Errors, defs: ItemDef[], values: Record<string, ChecklistItem>, prefix: string) {
  for (const def of defs) {
    const it = values[def.key];
    if (!it?.selected) continue;
    if (def.needs.includes("docs") && !it.docs.length && !(def.needs === "docs+details" && it.details.trim())) {
      e[`${prefix}.${def.key}.docs`] = def.needs === "docs+details" ? "Upload a document or add a summary." : "Upload at least one document.";
    }
    if (def.needs === "details" && !it.details.trim()) e[`${prefix}.${def.key}.details`] = "Add the details.";
    if (def.needs === "amount+docs") {
      if (!it.amount.trim()) e[`${prefix}.${def.key}.amount`] = "Enter the total amount.";
      else if (!isMoney(it.amount)) e[`${prefix}.${def.key}.amount`] = "Enter an amount, e.g. 1250.00";
    }
  }
}

/** Errors for one step (empty object = step complete). */
export function validateStep(step: StepId, d: TaxReturnData): Errors {
  const e: Errors = {};
  const p = d.personal;
  switch (step) {
    case "personal": {
      requirePerson(e, p, "personal", { sin: true, gender: true });
      if (!isEmail(p.email)) e["personal.email"] = "Enter a valid email address.";
      if (!isPhone(p.phone)) e["personal.phone"] = "Enter a phone number with area code.";
      requireAddress(e, p.address, "personal.address");
      if (!p.maritalStatus) e["personal.maritalStatus"] = "Choose your marital status.";
      yn(e, p.immigrated, "personal.immigrated");
      if (p.immigrated === "yes" && !p.immigrationDate) e["personal.immigrationDate"] = "Enter the date you arrived in or left Canada.";
      yn(e, p.firstTimeFiler, "personal.firstTimeFiler");
      if (p.foreignIncome.trim() && !isMoney(p.foreignIncome)) e["personal.foreignIncome"] = "Enter an amount, e.g. 12000";
      break;
    }
    case "spouse": {
      if (!hasSpouse(d)) break;
      const s = d.spouse;
      requirePerson(e, s, "spouse", { sin: true, gender: true });
      if (s.email.trim() && !isEmail(s.email)) e["spouse.email"] = "Enter a valid email address.";
      if (!s.sameAddress) requireAddress(e, s.address, "spouse.address");
      yn(e, s.immigrated, "spouse.immigrated");
      if (s.immigrated === "yes" && !s.immigrationDate) e["spouse.immigrationDate"] = "Enter the date your spouse arrived in or left Canada.";
      yn(e, s.firstTimeFiler, "spouse.firstTimeFiler");
      if (s.foreignIncome.trim() && !isMoney(s.foreignIncome)) e["spouse.foreignIncome"] = "Enter an amount, e.g. 12000";
      break;
    }
    case "dependents": {
      yn(e, d.hasDependents, "hasDependents");
      if (d.hasDependents === "yes") {
        if (!d.dependents.length) e.hasDependents = "Add at least one dependent.";
        d.dependents.forEach((dep, i) => {
          const k = `dependents.${i}`;
          requirePerson(e, dep, k, { sin: false, gender: true });
          yn(e, dep.immigrated, `${k}.immigrated`);
          if (dep.immigrated === "yes" && !dep.immigrationDate) e[`${k}.immigrationDate`] = "Enter the date.";
          yn(e, dep.hasIncomeOrChildcare, `${k}.hasIncomeOrChildcare`);
          if (dep.hasIncomeOrChildcare === "yes") {
            if (!dep.incomeOrChildcareAmount.trim()) e[`${k}.incomeOrChildcareAmount`] = "Enter the amount.";
            else if (!isMoney(dep.incomeOrChildcareAmount)) e[`${k}.incomeOrChildcareAmount`] = "Enter an amount, e.g. 4500";
          }
          yn(e, dep.fileReturn, `${k}.fileReturn`);
          if (dep.fileReturn === "yes" && !dep.sin.trim()) e[`${k}.sin`] = "We need their SIN to file their return.";
        });
        if (needsCustody(d) && !d.custodyDocs.length) e.custodyDocs = "Upload your custody agreement.";
      }
      break;
    }
    case "cra": {
      const c = d.cra;
      yn(e, c.citizen, "cra.citizen");
      yn(e, c.electionsShare, "cra.electionsShare");
      if (hasSpouse(d)) {
        yn(e, c.spouseCitizen, "cra.spouseCitizen");
        yn(e, c.spouseElectionsShare, "cra.spouseElectionsShare");
      }
      yn(e, c.foreignProperty, "cra.foreignProperty");
      yn(e, c.firstFhsa, "cra.firstFhsa");
      if (c.firstFhsa === "yes" && !c.fhsaDetails.trim()) e["cra.fhsaDetails"] = "Add the FHSA details (institution, date opened, contributions).";
      break;
    }
    case "income": {
      checklist(e, INCOME_ITEMS, d.income, "income");
      yn(e, d.incomeOutsideCanada, "incomeOutsideCanada");
      if (d.incomeOutsideCanada === "yes" && !d.foreignIncomeParticulars.trim())
        e.foreignIncomeParticulars = "Describe the foreign income (country, type, amount in CAD).";
      break;
    }
    case "deductions": {
      checklist(e, DEDUCTION_ITEMS, d.deductions, "deductions");
      const cp = d.childcareProvider;
      if (d.deductions.childcare?.selected && cp.sin.trim() && !validSin(cp.sin)) e["childcareProvider.sin"] = "That SIN isn’t valid.";
      break;
    }
    case "credits":
      checklist(e, CREDIT_ITEMS, d.credits, "credits");
      break;
    case "supporting": {
      yn(e, d.supporting.preparedByAdept, "supporting.preparedByAdept");
      if (d.supporting.preparedByAdept === "no" && !d.supporting.priorT1.length)
        e["supporting.priorT1"] = "Upload last year’s return, since Adept didn’t prepare it.";
      break;
    }
    case "review": {
      const a = d.agreement;
      if (!a.agreed) e["agreement.agreed"] = "Please read and accept the declaration.";
      if (!a.firstName.trim()) e["agreement.firstName"] = "Type your first name.";
      if (!a.lastName.trim()) e["agreement.lastName"] = "Type your last name.";
      const norm = (s: string) => s.trim().toLowerCase();
      if (a.firstName.trim() && a.lastName.trim() && (norm(a.firstName) !== norm(p.firstName) || norm(a.lastName) !== norm(p.lastName)))
        e["agreement.lastName"] = "The name must match the taxpayer’s name on step 1.";
      break;
    }
  }
  return e;
}

/** Full validation across every applicable step (used on submit). */
export function validateAll(d: TaxReturnData) {
  for (const s of activeSteps(d)) {
    const errors = validateStep(s.id, d);
    if (Object.keys(errors).length) return { step: s.id, errors };
  }
  return null;
}
