import { ContentPage, Highlights, PageHero } from "@/components/site/PageHero";

export const metadata = { title: "Corporation Tax Returns" };

export default function CorpTaxPage() {
  return (
    <>
      <PageHero
        image="reports"
        imageAlt="Corporate financial statements on a desk"
        kicker="Tax preparation"
        title="Corporate accounting and T2 returns."
        lead="Once you incorporate, how you take money out changes — salary, dividends or a shareholder loan. We guide the tax implications before money moves."
        crumbs={[{ href: "/tax", label: "Tax services" }]}
      />
      <ContentPage>
        <p>The CRA watches shareholder loans closely. We make sure every withdrawal is planned, documented and defensible.</p>

        <h2>What we’ll need</h2>
        <Highlights
          items={[
            { title: "Expense receipts" },
            { title: "Bank and credit card statements" },
            { title: "A clean audit trail" },
            { title: "Access to corporate books" },
            { title: "Previous T2 returns" },
            { title: "Provincial corporate registration" },
            { title: "CRA correspondence and GST notices" },
            { title: "Head office, BN, articles and fiscal year-end" },
          ]}
        />

        <h2>Keep your record in check</h2>
        <p>
          Most corporations file a T2 every year — even with no tax due — within six months of year-end. Tax owed is
          generally due within three months. Inactive or tax-exempt corporations still file. We prepare the balance sheet,
          income statement and T2.
        </p>

        <h2>Timelines and tax planning</h2>
        <p>
          Standard turnaround is four weeks, or eight weeks from March to June. Year-round planning keeps filings on time and
          surprises off your desk.
        </p>
      </ContentPage>
    </>
  );
}
