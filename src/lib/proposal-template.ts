// Adept's Business Bookkeeping Proposal + Engagement Letter (from the client's Word template).
// One source of truth for the web page, the Studio preview and the signed PDF.

export const FIRM_LEGAL_NAME = "Adept Bookkeeping, Tax and Services";
export const FIRM_TAGLINE = "Making Money, Business & Taxes Make Sense";

export type PackageId = "essential" | "growth" | "complete";
export const PACKAGES: { id: PackageId; name: string; price: string; fee: string; bestFit: string }[] = [
  { id: "essential", name: "Essential", price: "$400 / month", fee: "400", bestFit: "Straightforward, smaller business" },
  { id: "growth", name: "Growth", price: "$550 / month", fee: "550", bestFit: "Growing business needing stronger visibility" },
  { id: "complete", name: "Complete", price: "$850+ / month", fee: "850", bestFit: "More active or complex operations" },
];

export const QBO_PLANS = ["EasyStart", "Essentials", "Plus", "Advanced", "Not applicable"] as const;
export type QboPlan = (typeof QBO_PLANS)[number];

export type ProposalDetails = {
  clientName: string;
  businessName: string;
  clientContact: string; // address or email shown on the engagement letter
  businessType: "Sole proprietor" | "Corporation";
  package: PackageId;
  monthlyFee: string; // dollars, no symbol
  paymentTerms: string;
  onboardingFee: string; // dollars, blank when none
  qboPlan: QboPlan;
  qboPaidBy: "client" | "adept";
  effectiveDate: string; // YYYY-MM-DD
  noticeDays: number;
  preparedBy: string;
  note: string;
};

export function defaultDetails(p: { name?: string; company?: string; email?: string } = {}): ProposalDetails {
  return {
    clientName: p.name ?? "",
    businessName: p.company ?? "",
    clientContact: p.email ?? "",
    businessType: "Corporation",
    package: "growth",
    monthlyFee: "550",
    paymentTerms: "Due on the 1st of each month",
    onboardingFee: "",
    qboPlan: "Essentials",
    qboPaidBy: "client",
    effectiveDate: new Date().toISOString().slice(0, 10),
    noticeDays: 30,
    preparedBy: "Yemisi",
    note: "",
  };
}

/** Fills any missing fields so older or partial records always render. */
export function normalizeDetails(raw: unknown, fallback?: Parameters<typeof defaultDetails>[0]): ProposalDetails {
  const base = defaultDetails(fallback);
  const d = (raw && typeof raw === "object" ? raw : {}) as Partial<ProposalDetails>;
  const merged = { ...base, ...Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined && v !== null)) } as ProposalDetails;
  if (!PACKAGES.some((p) => p.id === merged.package)) merged.package = base.package;
  if (!QBO_PLANS.includes(merged.qboPlan)) merged.qboPlan = base.qboPlan;
  if (merged.qboPaidBy !== "adept") merged.qboPaidBy = "client";
  if (merged.businessType !== "Sole proprietor") merged.businessType = "Corporation";
  merged.noticeDays = Math.min(180, Math.max(1, Math.round(Number(merged.noticeDays) || 30)));
  return merged;
}

export const pkg = (id: PackageId) => PACKAGES.find((p) => p.id === id)!;
export const money = (v: string) => {
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && String(v).trim() ? `$${n.toLocaleString("en-CA", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}` : "";
};
export const longDate = (iso: string) =>
  iso ? new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) : "";

// ── Document content ───────────────────────────────────────────────────

export type Block = { kind: "p"; text: string } | { kind: "list"; items: string[] } | { kind: "label"; text: string };
export type Section = { heading: string; blocks: Block[] };

export const PROPOSAL_INTRO = {
  headline: "Your business needs a financial system—not just bookkeeping.",
  body: "Based on our discovery conversation, the priority is to keep your books organized, give you reliable visibility into your numbers, and make tax and year-end preparation easier. Adept provides practical, consistent bookkeeping designed around how your business actually operates.",
  pricingNote:
    "Final pricing is confirmed based on transaction volume, number of accounts, payroll, GST/HST, complexity and any clean-up/catch-up work.",
};

export const INCLUDED = [
  "Monthly transaction categorization and bookkeeping.",
  "Bank and credit-card reconciliations for agreed accounts.",
  "Monthly Profit & Loss and Balance Sheet reporting.",
  "Year-end bookkeeping readiness and organized records for your tax preparation.",
  "Email support and questions related to the bookkeeping process.",
  "Practical observations when something in the numbers needs attention.",
];

export function qboText(d: ProposalDetails) {
  if (d.qboPlan === "Not applicable") return "QuickBooks Online is not part of this engagement. Records will be kept in the system agreed during onboarding.";
  return d.qboPaidBy === "adept"
    ? "QuickBooks Online will be the accounting home base. Based on the current stage of the business as discussed, Adept will cover the QuickBooks Online subscription as part of the monthly fee. If a higher plan is needed later, that will be discussed at that point."
    : "QuickBooks Online will be the accounting home base. The client maintains the QuickBooks Online subscription directly with Intuit; the software subscription is separate from Adept’s professional fee.";
}

export const ENGAGEMENT_STEPS: Section[] = [
  {
    heading: "1. Secure document sharing",
    blocks: [
      {
        kind: "list",
        items: [
          "Client documents are uploaded through the Adept client portal.",
          "Typical items include bank/credit-card statements, receipts, invoices, payroll records and GST/HST information as applicable.",
          "Please avoid sending sensitive financial records through ordinary text messages.",
        ],
      },
    ],
  },
  {
    heading: "2. Monthly workflow",
    blocks: [
      {
        kind: "list",
        items: [
          "You provide requested documents and respond to bookkeeping questions.",
          "Adept records transactions, reconciles agreed accounts and reviews the month.",
          "Questions or exceptions are sent to you for clarification.",
          "Once complete, agreed monthly reports are delivered.",
        ],
      },
    ],
  },
  {
    heading: "3. Client responsibilities",
    blocks: [
      {
        kind: "list",
        items: [
          "Provide complete and accurate source information on time.",
          "Review and respond to questions promptly.",
          "Notify Adept about major business, banking, payroll or tax changes.",
          "Maintain appropriate separation between business and personal transactions.",
          "Management remains responsible for the underlying records and business decisions.",
        ],
      },
    ],
  },
  {
    heading: "4. What is outside the monthly fee",
    blocks: [
      {
        kind: "list",
        items: [
          "Historical clean-up or catch-up bookkeeping beyond the agreed starting point.",
          "Complex accounting adjustments or special projects.",
          "Payroll processing unless specifically included.",
          "Corporate or personal tax return preparation unless separately engaged.",
          "Audit, review or assurance services.",
          "QuickBooks Online subscription fees.",
        ],
      },
      {
        kind: "p",
        text: "Out-of-scope work will be discussed and approved before additional fees are incurred, except where immediate action is required to protect deadlines or records.",
      },
    ],
  },
];

export const NEXT_STEPS = [
  "Accept this proposal.",
  "Review and sign the Engagement Letter.",
  "Complete the agreed initial payment/retainer.",
  "Receive your client portal invitation and onboarding checklist.",
  "Connect QuickBooks Online and grant the appropriate accountant access.",
  "Provide opening documents so Adept can begin.",
];

export function engagementSections(d: ProposalDetails): Section[] {
  const fee = money(d.monthlyFee) || "$____";
  const p = pkg(d.package);
  const legal = d.businessName || d.clientName;
  return [
    {
      heading: "1. Parties and effective date",
      blocks: [
        {
          kind: "p",
          text: `Client: ${legal}. Service provider: ${FIRM_LEGAL_NAME}. Effective date: ${longDate(d.effectiveDate)}. The engagement will continue on a recurring basis until terminated in accordance with this letter.`,
        },
      ],
    },
    {
      heading: "2. Scope of services",
      blocks: [
        {
          kind: "list",
          items: [
            "Monthly bookkeeping for the agreed accounts and transaction volume.",
            "Bank/credit-card reconciliations for agreed accounts.",
            "Monthly financial reports including Profit & Loss and Balance Sheet.",
            "GST/HST bookkeeping support where specifically included in the proposal.",
            "Year-end bookkeeping readiness.",
            "Other services only when specifically added in writing.",
          ],
        },
        { kind: "p", text: `Selected package: ${p.name}. Monthly fee: ${fee} + applicable taxes.` },
      ],
    },
    {
      heading: "3. Client responsibilities",
      blocks: [
        {
          kind: "list",
          items: [
            "The Client is responsible for the completeness and accuracy of source documents and information provided to Adept.",
            "The Client is responsible for business decisions, tax elections and approvals unless a separate written engagement states otherwise.",
            "The Client will provide records and answers in a timely manner so agreed deadlines can be met.",
            "The Client will review reports and notify Adept of known errors or omissions.",
          ],
        },
      ],
    },
    {
      heading: "4. Fees, payment and additional work",
      blocks: [
        {
          kind: "p",
          text: `Recurring fee: ${fee} per month plus applicable taxes. Payment terms: ${d.paymentTerms || "as agreed"}.${
            money(d.onboardingFee) ? ` One-time onboarding / clean-up fee: ${money(d.onboardingFee)} plus applicable taxes.` : ""
          } Clean-up, catch-up, special projects, tax filings or other work outside the agreed scope will be quoted or billed separately. Adept will seek client approval before commencing material out-of-scope work.`,
        },
      ],
    },
    {
      heading: "5. QuickBooks Online and technology",
      blocks: [
        {
          kind: "p",
          text:
            d.qboPaidBy === "adept"
              ? "Where QuickBooks Online is used, Adept will cover the agreed subscription as part of the monthly fee unless otherwise agreed. Adept may receive accountant access necessary to perform the engagement. The Client remains the owner of its business records."
              : "Where QuickBooks Online is used, the Client will maintain the appropriate subscription unless otherwise agreed. Adept may receive accountant access necessary to perform the engagement. The Client remains responsible for maintaining access, billing and ownership of its QuickBooks account.",
        },
      ],
    },
    {
      heading: "6. Document sharing and confidentiality",
      blocks: [
        {
          kind: "p",
          text: "Documents will be exchanged through the Adept client portal or another secure method agreed during onboarding. Adept will treat client information as confidential and will use it only for purposes connected with the engagement, subject to applicable law and professional obligations. The Client agrees not to send sensitive records through ordinary SMS/text messaging.",
        },
      ],
    },
    {
      heading: "7. No assurance / reliance",
      blocks: [
        {
          kind: "p",
          text: "The bookkeeping services are not an audit or review engagement and are not intended to provide assurance on the financial statements. Reports are prepared from information provided by the Client and are intended for the Client’s internal business and tax-preparation purposes unless otherwise agreed in writing.",
        },
      ],
    },
    {
      heading: "8. Termination",
      blocks: [
        {
          kind: "p",
          text: `Either party may terminate the engagement by providing ${d.noticeDays} days' written notice, subject to payment of fees for services performed and any approved work in progress. Adept may suspend or terminate services where invoices remain unpaid, records are not provided, or continuing the engagement would create a professional or legal concern.`,
        },
      ],
    },
    {
      heading: "9. Acceptance",
      blocks: [
        {
          kind: "p",
          text: "By signing below, the Client confirms that they have reviewed and understood the proposal and this Engagement Letter, agree to the scope and fees, and authorize Adept to begin the engagement on the effective date.",
        },
      ],
    },
  ];
}

export const engagementOpening = () =>
  `Thank you for choosing ${FIRM_LEGAL_NAME} (“Adept”). This Engagement Letter confirms the scope, responsibilities, fees and working arrangements for the bookkeeping services described in the accompanying proposal.`;
