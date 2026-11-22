import { PageSchema } from "@/components/seo/JsonLd";
import { pageMeta } from "@/lib/seo";
import { ContentPage, Highlights, PageHero } from "@/components/site/PageHero";

export const metadata = pageMeta({
  title: "Payroll Services in Calgary",
  description: "Fully managed payroll for Alberta employers: pay runs, source deductions, CRA remittances, T4s, ROEs and WCB statements — every pay cycle, on time.",
  path: "/payroll",
  keywords: ["payroll services Calgary", "Alberta payroll provider", "T4 preparation", "CRA payroll remittances"],
});

export default function PayrollPage() {
  return (
    <>
      <PageSchema path="/payroll" title="Payroll Services in Calgary" description="Fully managed payroll for Alberta employers: pay runs, source deductions, CRA remittances, T4s, ROEs and WCB statements — every pay cycle, on time." service="Payroll services" />
      <PageHero
        image="calculator"
        imageAlt="Calculating payroll deductions at a desk"
        kicker="Payroll"
        title="Payroll your team can rely on."
        lead="Wages, benefits and required deductions — weekly, biweekly, monthly or daily. Based in Calgary, we stay current on Alberta employment standards and run payroll alongside the rest of your books."
      />
      <ContentPage>
        <h2>Fully managed payroll</h2>
        <p>
          Calculations, payments, payslips, payroll tax and records all run through reliable software. Each month we
          determine your CRA remittances, plus employer EI and CPP.
        </p>
        <Highlights
          items={[
            { title: "Every pay schedule", body: "Weekly, biweekly, semi-monthly or monthly." },
            { title: "CRA remittances", body: "Source deductions calculated and remitted on time." },
            { title: "Year-end slips", body: "T4s and T4 summaries prepared and filed." },
            { title: "WCB statements", body: "Workers’ Compensation employer statements handled." },
          ]}
        />
        <h2>What payroll calculations need</h2>
        <ul>
          {[
            "Legal name, address, phone and date of birth",
            "Social Insurance Number",
            "Department or job codes",
            "Bank details for direct deposit",
            "Salary, wages, commissions or bonuses",
            "Hours worked, if hourly",
            "Vacation accrual and carryover",
            "RRSP or pension deductions",
          ].map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </ContentPage>
    </>
  );
}
