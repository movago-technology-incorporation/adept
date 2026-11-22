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
  { href: "/bookkeeping", label: "Bookkeeping" },
  { href: "/tax/individual", label: "Individual Tax Returns" },
  { href: "/tax/sole-proprietor", label: "Sole proprietor returns" },
  { href: "/tax/corporation", label: "Corporation Tax Returns" },
  { href: "/tax/planning", label: "Tax Planning" },
  { href: "/payroll", label: "Payroll" },
];
