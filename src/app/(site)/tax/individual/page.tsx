import { ConsultCard, ContentPage, Highlights, PageHero } from "@/components/site/PageHero";

export const metadata = { title: "Individual Tax Returns" };

export default function IndividualTaxPage() {
  return (
    <>
      <PageHero
        image="calculator"
        imageAlt="Working through a personal tax return"
        kicker="Tax preparation"
        title="Individual tax returns, handled all year."
        lead="Healthy finances take more than one meeting at year-end. With a deep understanding of the Income Tax Act, we keep your information secure and your return right."
        crumbs={[{ href: "/tax", label: "Tax services" }]}
      />
      <ContentPage
        aside={
          <ConsultCard
            title="Ready to file your T1?"
            body="Send us your details through a confidential filing request, or book a call first."
          />
        }
      >
        <h2>Nobody wants penalties over a mistake</h2>
        <p>
          We build strong audit trails so a CRA review is far less stressful. Tax preparation becomes a year-round
          conversation, not a February scramble.
        </p>

        <h2>Even if you’ve left Canada or have no income</h2>
        <p>
          You may still need to file. You might be eligible for the GST/HST credit or the Canada Child Benefit, or have
          rental income to report. The CRA focuses audits on moving expenses, childcare and medical costs.
        </p>

        <h3>Income documents to have ready</h3>
        <ul>
          {["T4s from your employer", "Foreign income reports", "Investment portfolio statements", "Commissions or bonuses", "Pension income"].map(
            (i) => (
              <li key={i}>{i}</li>
            ),
          )}
        </ul>

        <Highlights
          items={[
            { title: "Credits", body: "Family, child, education and disability credits — we make sure you claim what you’re entitled to." },
            { title: "Bereavement", body: "We file for the deceased and help obtain a CRA clearance certificate to protect the executor." },
            { title: "Revisions", body: "If prior returns look wrong, we assess penalties or refunds and file the revisions." },
            { title: "Secure portal", body: "Share slips and statements privately through your Adept client portal." },
          ]}
        />
      </ContentPage>
    </>
  );
}
