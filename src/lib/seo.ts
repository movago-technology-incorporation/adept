import type { Metadata } from "next";

// ── Site identity (search engines + social cards) ──────────────────────

/** Canonical origin. Set APP_URL in production (e.g. https://adeptbookkeepingservices.com). */
export function siteOrigin() {
  const raw = process.env.APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "http://localhost:5617";
  const v = raw.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export const SITE = {
  name: "Adept Bookkeeping and Tax Services",
  shortName: "Adept",
  tagline: "Bookkeeping, tax & payroll in Calgary, Alberta",
  description:
    "Bookkeeping, personal and corporate tax returns, GST/HST and payroll for small businesses and families across Calgary and Canada. Accurate and CRA-ready.",
  locale: "en_CA",
  city: "Calgary",
  region: "Alberta",
  regionCode: "AB",
  country: "CA",
  // Used for structured data when the database isn't reachable at build time.
  phone: "+1 (587) 216-1942",
  email: "Hello@adeptbookkeepingservices.com",
  themeColor: "#0b1a2e",
};

export const BASE_KEYWORDS = [
  "bookkeeping Calgary",
  "Calgary bookkeeper",
  "tax preparation Calgary",
  "accountant Calgary",
  "small business bookkeeping Alberta",
  "personal tax return Calgary",
  "corporate tax return T2 Alberta",
  "GST/HST filing",
  "payroll services Calgary",
  "catch-up bookkeeping",
  "CRA tax filing",
  "QuickBooks bookkeeper",
];

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  /** Social image override; otherwise the route's generated opengraph-image is used. */
  image?: string;
  noindex?: boolean;
};

/** Complete, consistent metadata for a public page (canonical, Open Graph, X card, keywords). */
export function pageMeta({ title, description, path, keywords = [], image, noindex }: PageMetaInput): Metadata {
  const url = path === "/" ? "/" : path.replace(/\/+$/, "");
  return {
    title,
    description,
    keywords: [...keywords, ...BASE_KEYWORDS],
    alternates: { canonical: url, languages: { "en-CA": url } },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      siteName: SITE.name,
      url,
      title: `${title} | ${SITE.shortName}`,
      description,
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: `${title} | ${SITE.name}` }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE.shortName}`,
      description,
      ...(image ? { images: [image] } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** Metadata for private areas (portal, Studio, sign-in): never indexed or followed. */
export const PRIVATE_METADATA: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
};

// ── Public routes (sitemap) ────────────────────────────────────────────

export const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/bookkeeping", priority: 0.9, changeFrequency: "monthly" },
  { path: "/tax", priority: 0.9, changeFrequency: "monthly" },
  { path: "/tax/individual", priority: 0.85, changeFrequency: "monthly" },
  { path: "/tax/sole-proprietor", priority: 0.85, changeFrequency: "monthly" },
  { path: "/tax/corporation", priority: 0.85, changeFrequency: "monthly" },
  { path: "/tax/planning", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tax/filing-request", priority: 0.8, changeFrequency: "monthly" },
  { path: "/payroll", priority: 0.85, changeFrequency: "monthly" },
  { path: "/services", priority: 0.8, changeFrequency: "monthly" },
  { path: "/book", priority: 0.9, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.8, changeFrequency: "yearly" },
  { path: "/about", priority: 0.7, changeFrequency: "yearly" },
  { path: "/testimonials", priority: 0.6, changeFrequency: "monthly" },
];
