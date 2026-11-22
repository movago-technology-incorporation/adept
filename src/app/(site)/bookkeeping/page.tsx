import { PageSchema } from "@/components/seo/JsonLd";
import { pageMeta } from "@/lib/seo";
import { ContentPage, Highlights, PageHero } from "@/components/site/PageHero";

export const metadata = pageMeta({
  title: "Small Business Bookkeeping in Calgary",
  description: "Monthly bookkeeping for Calgary small businesses: reconciliations, receivables, payables, GST/PST remittances and clear financial reports — with a CRA-ready audit trail.",
  path: "/bookkeeping",
  keywords: ["monthly bookkeeping Calgary", "bookkeeping for small business Alberta", "bank reconciliation services", "QuickBooks Online bookkeeping"],
});

export default function BookkeepingPage() {
  return (
    <>
      <PageSchema path="/bookkeeping" title="Small Business Bookkeeping in Calgary" description="Monthly bookkeeping for Calgary small businesses: reconciliations, receivables, payables, GST/PST remittances and clear financial reports — with a CRA-ready audit trail." service="Small business bookkeeping" />
      <PageHero
        image="accountant"
        imageAlt="An Adept bookkeeper reconciling a client’s accounts"
        kicker="Bookkeeping"
        title="Small business bookkeeping, done properly."
        lead="With the CRA placing more emphasis on documentation and line audits, accurate records matter. We keep detailed audit trails that protect you from fines and penalties."
      />
      <ContentPage>
        <h2>What working with us feels like</h2>
        <p>
          Bookkeeping is the day-to-day recording of every financial transaction in your business. We maintain your
          ledgers — general, customer, supplier and daybooks — backed by source documents such as timecards, receipts and
          supplier invoices.
        </p>
        <Highlights
          items={[
            { title: "One-on-one expert support", body: "A dedicated bookkeeper who knows your business." },
            { title: "Financial reporting", body: "Clear monthly reports you can actually act on." },
            { title: "In-depth insights", body: "Trends and issues flagged before they cost you." },
            { title: "QuickBooks Online", body: "Industry-standard software, set up for how you work." },
          ]}
        />

        <h2>Why professional bookkeeping matters</h2>
        <p>
          Inaccurate books lead to poor decisions and problems with the CRA. Adept stays aligned with Canadian law so your
          bookkeeping is accurate and secure.
        </p>

        <h3>Records we keep</h3>
        <ul>
          {["Sales", "Purchases", "Receipts", "Payments", "Cash and bank transactions"].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3>What Adept offers</h3>
        <ul>
          <li>Accounts receivable: invoicing, customer statements and reconciliation</li>
          <li>Accounts payable: data entry, payment processing and reconciliation</li>
          <li>GST/PST and payroll remittances</li>
          <li>Payroll: T4s, T4 summaries and the Workers’ Compensation employer’s statement</li>
          <li>Bank reconciliations and inventory adjustments</li>
          <li>Inventory and manufacturing accounting, including WIP</li>
          <li>Departmental bookkeeping</li>
        </ul>

        <h2>Standards we follow</h2>
        <p>
          We adhere to GAAP. Since 2011, Canadian GAAP has been integrated into IFRS for publicly accountable enterprises,
          while private businesses may use ASPE. We stay current on changes that could affect you in an audit.
        </p>

        <h3>The four primary financial statements</h3>
        <ol>
          <li>
            <strong>Income statement</strong> — revenue and expenses over a period.
          </li>
          <li>
            <strong>Cash flow statement</strong> — inflows and outflows, so you can meet your obligations.
          </li>
          <li>
            <strong>Balance sheet</strong> — a snapshot of assets, liabilities and equity.
          </li>
          <li>
            <strong>Statement of changes in equity</strong> — owner contributions, dividends and surplus.
          </li>
        </ol>
      </ContentPage>
    </>
  );
}
