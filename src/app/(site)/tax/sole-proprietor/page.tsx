import { ContentPage, PageHero } from "@/components/site/PageHero";

export const metadata = { title: "Sole Proprietor Tax Returns" };

export default function SolePropPage() {
  return (
    <>
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
