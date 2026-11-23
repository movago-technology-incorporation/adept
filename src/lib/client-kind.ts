import type { Client } from "@/lib/types";

/** Sole proprietors and corporations get the business workspace (monthly checklist, bookkeeping uploads). */
export const isBusiness = (type?: Client["type"] | string) => type === "Sole proprietor" || type === "Corporation";

/** Corporations file a T2, so the personal (T1) tax questionnaire doesn't apply to them. */
export const usesPersonalReturn = (type?: Client["type"] | string) => type !== "Corporation";

export const BUSINESS_DOC_CATEGORIES = [
  "Bank statements",
  "Credit card statements",
  "Sales invoices",
  "Bills and expense receipts",
  "Payroll records",
  "GST/HST",
  "Loans and leases",
  "Other",
];

export const PERSONAL_DOC_CATEGORIES = ["Tax slips (T4, T5 and others)", "Receipts", "Bank statements", "CRA letters", "Other"];
