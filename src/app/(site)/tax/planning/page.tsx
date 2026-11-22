import { PageSchema } from "@/components/seo/JsonLd";
import { pageMeta } from "@/lib/seo";
import { ContentPage, Highlights, PageHero } from "@/components/site/PageHero";

export const metadata = pageMeta({
  title: "Tax Planning for Individuals & Businesses",
  description: "Year-round tax planning in Calgary: RRSPs and FHSAs, income splitting, credits, home office and vehicle expenses — legally lowering what you owe.",
  path: "/tax/planning",
  keywords: ["tax planning Calgary", "reduce taxes Alberta", "RRSP tax planning", "income splitting Canada"],
});

export default function TaxPlanningPage() {
  return (
    <>
      <PageSchema path="/tax/planning" title="Tax Planning for Individuals & Businesses" description="Year-round tax planning in Calgary: RRSPs and FHSAs, income splitting, credits, home office and vehicle expenses — legally lowering what you owe." crumbs={[{"name": "Tax services", "path": "/tax"}]} service="Tax planning" />
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
