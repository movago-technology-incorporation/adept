import { ContentPage, Highlights, PageHero } from "@/components/site/PageHero";

export const metadata = { title: "Tax Planning" };

export default function TaxPlanningPage() {
  return (
    <>
      <PageHero
        image="consult"
        imageAlt="Planning taxes with an Adept advisor"
        kicker="Tax services"
        title="Tax planning with a long view."
        lead="Financial planning through a tax-conscious lens. We use the Income Tax Act and provincial rules — legally — to reduce what you owe, with a clear understanding of Alberta’s rules and Calgary’s business needs."
        crumbs={[{ href: "/tax", label: "Tax services" }]}
      />
      <ContentPage>
        <h2>Strategies we work through</h2>
        <ul>
          <li>Credits for students, seniors, first-time homebuyers, working parents and persons with disabilities</li>
          <li>RRSPs to defer tax</li>
          <li>Income-splitting options within a family</li>
          <li>Estate planning with family trusts or estate freezes</li>
          <li>Home office, moving and vehicle expenses</li>
          <li>Investing in stocks, bonds and mutual funds with tax exposure in view</li>
        </ul>

        <h2>How we work</h2>
        <Highlights
          items={[
            { title: "Hands-on approach", body: "We keep you informed through the year, not only after fiscal close." },
            { title: "Proactive service", body: "The tax code moves. We apply updates to your situation before they cost you." },
          ]}
        />
      </ContentPage>
    </>
  );
}
