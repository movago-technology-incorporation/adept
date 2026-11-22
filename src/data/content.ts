// Site navigation lives in code (it mirrors the route tree).
// Firm details and tax deadlines are stored in Neon (site_settings, tax_deadlines).

export const nav = [
  { href: "/about", label: "About" },
  { href: "/bookkeeping", label: "Bookkeeping" },
  {
    href: "/tax",
    label: "Tax Services",
    children: [
      { href: "/tax/individual", label: "Individual Tax Returns" },
      { href: "/tax/sole-proprietor", label: "Sole Proprietor Tax Returns" },
      { href: "/tax/corporation", label: "Corporation Tax Returns" },
      { href: "/tax/planning", label: "Tax Planning" },
      { href: "/tax/filing-request", label: "Tax Filing Request" },
    ],
  },
  { href: "/payroll", label: "Payroll" },
  { href: "/contact", label: "Contact" },
];

export const moreLinks = [
  { href: "/services", label: "Other services" },
  { href: "/testimonials", label: "Testimonials" },
];

export const serviceLinks = [
  { href: "/bookkeeping", label: "Small business bookkeeping" },
  { href: "/services", label: "Clean-up, catch-up & GST/HST" },
  { href: "/tax", label: "Tax preparation & filing" },
  { href: "/tax/individual", label: "Personal tax returns (T1)" },
  { href: "/tax/sole-proprietor", label: "Sole proprietor tax returns" },
  { href: "/tax/corporation", label: "Corporate tax returns (T2)" },
  { href: "/tax/planning", label: "Tax planning" },
  { href: "/tax/filing-request", label: "Start your tax filing online" },
  { href: "/payroll", label: "Payroll services" },
];
