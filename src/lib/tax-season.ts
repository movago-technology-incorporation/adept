import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";

// Tax season rules, set by Adept in Studio → Settings (site_settings key "tax_season").

export type TaxSeason = {
  /** "auto": years follow the calendar and `openFrom`. "manual": Adept picks the newest year (`latestYear`). */
  mode: "auto" | "manual";
  /** Manual mode: the newest tax year clients can work on (e.g. 2027). */
  latestYear: number;
  /** "MM-DD": from this day each year, clients can start that year's return early (auto mode). */
  openFrom: string;
  /** "MM-DD" in the following year when a return can be submitted; "" = any time. */
  submitFrom: string;
  /** How many years before the newest one clients can file. */
  pastYears: number;
};

export const TAX_SEASON_TAG = "tax-season";
const thisYear = () => Number(new Date().toLocaleDateString("en-CA", { timeZone: "America/Edmonton" }).slice(0, 4));
export const DEFAULT_TAX_SEASON: Omit<TaxSeason, "latestYear"> = { mode: "auto", openFrom: "11-01", submitFrom: "01-01", pastYears: 4 };

const MD = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function normalizeSeason(raw: unknown): TaxSeason {
  const v = (raw && typeof raw === "object" ? raw : {}) as Partial<TaxSeason>;
  const latest = Math.round(Number(v.latestYear));
  return {
    mode: v.mode === "manual" ? "manual" : "auto",
    latestYear: latest >= 2000 && latest <= 2100 ? latest : thisYear() - 1,
    openFrom: typeof v.openFrom === "string" && MD.test(v.openFrom) ? v.openFrom : DEFAULT_TAX_SEASON.openFrom,
    submitFrom: v.submitFrom === "" ? "" : typeof v.submitFrom === "string" && MD.test(v.submitFrom) ? v.submitFrom : DEFAULT_TAX_SEASON.submitFrom,
    pastYears: Math.min(10, Math.max(1, Math.round(Number(v.pastYears) || DEFAULT_TAX_SEASON.pastYears))),
  };
}

export async function getTaxSeason(): Promise<TaxSeason> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAX_SEASON_TAG);
  const rows = await db()`SELECT value FROM site_settings WHERE key = 'tax_season'`;
  return normalizeSeason(rows[0]?.value);
}

/** Today in Calgary as { year, md: "MM-DD" }. */
function today() {
  const iso = new Date().toLocaleDateString("en-CA", { timeZone: "America/Edmonton" });
  return { year: Number(iso.slice(0, 4)), md: iso.slice(5, 10) };
}

const label = (year: number, md: string) =>
  new Date(`${year}-${md}T12:00:00Z`).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

/**
 * Years a client can work on. Auto: the current year (once it opens) plus finished years.
 * Manual: the newest year Adept chose plus the years before it.
 */
export async function filingYears() {
  const s = await getTaxSeason();
  if (s.mode === "manual") return Array.from({ length: s.pastYears + 1 }, (_, i) => s.latestYear - i);
  const { year, md } = today();
  const past = Array.from({ length: s.pastYears }, (_, i) => year - 1 - i);
  return md >= s.openFrom ? [year, ...past] : past;
}

export async function currentTaxYear() {
  return today().year;
}

/** When a year's return can be submitted, as a readable date — or null if it can be submitted now. */
export async function submitOpensOn(taxYear: number) {
  const s = await getTaxSeason();
  if (!s.submitFrom) return null;
  const { year, md } = today();
  const opensYear = taxYear + 1;
  const open = year > opensYear || (year === opensYear && md >= s.submitFrom);
  return open ? null : label(opensYear, s.submitFrom);
}
