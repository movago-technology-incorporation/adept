import { getFirm } from "@/lib/data";
import { SITE, siteOrigin } from "@/lib/seo";

// schema.org structured data (JSON-LD) — powers Google rich results and the local business panel.

export function JsonLd({ data }: { data: unknown }) {
  // Escape "<" so content can never close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

const DAYS: Record<string, string[]> = {
  "m-f": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  sat: ["Saturday"],
  sun: ["Sunday"],
};

/** Parses hours like "M-F: 9am-6pm, Sat: 10am-4pm, Sun: Closed" into OpeningHoursSpecification. */
function openingHours(hours: string) {
  const to24 = (t: string) => {
    const m = t.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
    if (!m) return null;
    let h = Number(m[1]) % 12;
    if (m[3] === "pm") h += 12;
    return `${String(h).padStart(2, "0")}:${m[2] ?? "00"}`;
  };
  const specs = [];
  for (const part of hours.split(",")) {
    const [label, range] = part.split(":").map((x) => x?.trim());
    const days = DAYS[label?.toLowerCase().replace(/\s/g, "") ?? ""];
    if (!days || !range || /closed/i.test(range)) continue;
    const [open, close] = range.split("-").map(to24);
    if (open && close) specs.push({ "@type": "OpeningHoursSpecification", dayOfWeek: days, opens: open, closes: close });
  }
  return specs;
}

const SERVICES = [
  ["Small business bookkeeping", "/bookkeeping"],
  ["Personal income tax returns (T1)", "/tax/individual"],
  ["Sole proprietor tax returns", "/tax/sole-proprietor"],
  ["Corporate tax returns (T2)", "/tax/corporation"],
  ["Tax planning", "/tax/planning"],
  ["Payroll services", "/payroll"],
  ["GST/HST filing", "/services"],
  ["Bookkeeping clean-up and catch-up", "/services"],
  ["QuickBooks Online setup and training", "/services"],
];

/** Organization + local business + website graph, on every public page. */
export async function SiteSchema() {
  const origin = siteOrigin();
  let firm = null;
  try {
    firm = await getFirm();
  } catch {}
  const phone = firm?.phone ?? SITE.phone;
  const email = firm?.email ?? SITE.email;
  const hours = openingHours(firm?.hours ?? "");
  const id = `${origin}/#business`;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": ["AccountingService", "LocalBusiness", "ProfessionalService"],
            "@id": id,
            name: SITE.name,
            alternateName: "Adept Bookkeeping Services",
            description: SITE.description,
            url: `${origin}/`,
            logo: { "@type": "ImageObject", url: `${origin}/adept-logo.png`, width: 1364, height: 608 },
            image: [`${origin}/opengraph-image`, `${origin}/adept-logo.png`],
            telephone: phone,
            email,
            address: { "@type": "PostalAddress", addressLocality: SITE.city, addressRegion: SITE.regionCode, addressCountry: SITE.country },
            areaServed: [
              { "@type": "City", name: "Calgary" },
              { "@type": "State", name: "Alberta" },
              { "@type": "Country", name: "Canada" },
            ],
            ...(hours.length ? { openingHoursSpecification: hours } : {}),
            contactPoint: [
              {
                "@type": "ContactPoint",
                contactType: "customer service",
                telephone: phone,
                email,
                areaServed: "CA",
                availableLanguage: ["English"],
              },
            ],
            knowsAbout: ["Bookkeeping", "Income tax preparation", "Corporate tax", "GST/HST", "Payroll", "Tax planning", "CRA compliance", "QuickBooks Online"],
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Bookkeeping and tax services",
              itemListElement: SERVICES.map(([name, path]) => ({
                "@type": "Offer",
                itemOffered: { "@type": "Service", name, url: `${origin}${path}`, provider: { "@id": id }, areaServed: "CA" },
              })),
            },
            potentialAction: {
              "@type": "ReserveAction",
              name: "Book a free consultation",
              target: { "@type": "EntryPoint", urlTemplate: `${origin}/book`, actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"] },
            },
          },
          {
            "@type": "WebSite",
            "@id": `${origin}/#website`,
            url: `${origin}/`,
            name: SITE.name,
            inLanguage: "en-CA",
            publisher: { "@id": id },
          },
        ],
      }}
    />
  );
}

/** Per-page WebPage + BreadcrumbList (+ Service for service pages). */
export function PageSchema({
  path,
  title,
  description,
  crumbs = [],
  service,
}: {
  path: string;
  title: string;
  description: string;
  crumbs?: { name: string; path: string }[];
  service?: string;
}) {
  const origin = siteOrigin();
  const url = `${origin}${path === "/" ? "/" : path}`;
  const trail = [{ name: "Home", path: "/" }, ...crumbs, ...(path === "/" ? [] : [{ name: title, path }])];
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebPage",
            "@id": `${url}#webpage`,
            url,
            name: title,
            description,
            inLanguage: "en-CA",
            isPartOf: { "@id": `${origin}/#website` },
            about: { "@id": `${origin}/#business` },
            breadcrumb: { "@id": `${url}#breadcrumb` },
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${url}#breadcrumb`,
            itemListElement: trail.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${origin}${c.path === "/" ? "/" : c.path}` })),
          },
          ...(service
            ? [
                {
                  "@type": "Service",
                  "@id": `${url}#service`,
                  name: service,
                  serviceType: service,
                  description,
                  url,
                  provider: { "@id": `${origin}/#business` },
                  areaServed: [
                    { "@type": "City", name: "Calgary" },
                    { "@type": "State", name: "Alberta" },
                    { "@type": "Country", name: "Canada" },
                  ],
                },
              ]
            : []),
        ],
      }}
    />
  );
}
