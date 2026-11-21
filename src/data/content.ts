// Site navigation lives in code (it mirrors the route tree).
// Firm details and tax deadlines are stored in Neon (site_settings, tax_deadlines).

export const nav = [
  { href: "/about", label: "About" },
  { href: "/bookkeeping", label: "Bookkeeping" },
  {
    href: "/tax",
    label: "Tax services",
    children: [
      { href: "/tax/individual", label: "Individual tax returns" },
      { href: "/tax/sole-proprietor", label: "Sole proprietor returns" },
      { href: "/tax/corporation", label: "Corporation tax returns" },
      { href: "/tax/planning", label: "Tax planning" },
      { href: "/tax/filing-request", label: "Tax filing request" },
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
  { href: "/bookkeeping", label: "Bookkeeping" },
  { href: "/tax/individual", label: "Individual tax returns" },
  { href: "/tax/sole-proprietor", label: "Sole proprietor returns" },
  { href: "/tax/corporation", label: "Corporation tax returns" },
  { href: "/tax/planning", label: "Tax planning" },
  { href: "/payroll", label: "Payroll" },
];
