import { PageSchema } from "@/components/seo/JsonLd";
import { pageMeta } from "@/lib/seo";
import { ContentPage, PageHero } from "@/components/site/PageHero";

export const metadata = pageMeta({
  title: "Sole Proprietor & Self-Employed Tax Returns",
  description: "Tax returns for sole proprietors and the self-employed in Calgary: business income and expenses, GST/HST registration and advice on when to incorporate.",
  path: "/tax/sole-proprietor",
  keywords: ["self-employed tax return Calgary", "sole proprietor taxes Alberta", "T2125 business income", "GST registration small supplier"],
});

export default function SolePropPage() {
  return (
    <>
      <PageSchema path="/tax/sole-proprietor" title="Sole Proprietor & Self-Employed Tax Returns" description="Tax returns for sole proprietors and the self-employed in Calgary: business income and expenses, GST/HST registration and advice on when to incorporate." crumbs={[{"name": "Tax services", "path": "/tax"}]} service="Sole proprietor and self-employed tax returns" />
      <PageHero
        image="smallBusiness"
        imageAlt="A sole proprietor serving a customer in their shop"
        kicker="Tax preparation"
        title="Sole proprietor tax returns."
        lead="The CRA treats any activity carried out to make a profit as a business. As a sole proprietor, you’re a business — and your own employer."
        crumbs={[{ href: "/tax", label: "Tax services" }]}
      />
      <ContentPage>
        <h2>What you need to know</h2>
        <p>
          Track every form of income: sales, goods, services received or property. Special rules apply to farming, fishing
          and home daycares. Those records become your return.
        </p>

        <h2>Do I need to charge GST/HST?</h2>
        <p>
          Small suppliers under $30,000 across four fiscal quarters generally don’t charge GST. Charities under $250,000
          may also qualify. If you’re not a small supplier and you sell taxable goods or services, we’ll help you register,
          file and remit.
        </p>

        <h2>Should I incorporate?</h2>
        <p>
          Corporate rules differ from personal ones. If you’re considering incorporation, Adept will walk you through the
          tax and compliance impact for your situation and long-term goals.
        </p>
      </ContentPage>
    </>
  );
}
