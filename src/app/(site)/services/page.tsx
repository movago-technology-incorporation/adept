import { ContentPage, PageHero } from "@/components/site/PageHero";

export const metadata = { title: "Other Services" };

export default function ServicesPage() {
  return (
    <>
      <PageHero
        image="reports"
        imageAlt="Financial reports and a calculator on a desk"
        kicker="Services"
        title="Beyond the monthly books."
        lead="Setup, registration and clean-up work that keeps your business running smoothly — handled by the same team that keeps your books."
      />
      <ContentPage>
        <h2>Accounting software integration and training</h2>
        <p>
          We customize QuickBooks Online for your business and train your team to track expenses, generate reports and
          stay organized — so the software works for you, not the other way around.
        </p>

        <h2>Corporate registration in Alberta</h2>
        <p>
          Incorporation separates personal and business liability. In Alberta, incorporations and annual returns are filed with
          the Alberta Corporate Registry through an authorized registry agent. We guide you through the name search, articles and
          registration — and keep the annual returns that follow on schedule.
        </p>

        <h2>GST/HST filing</h2>
        <p>
          Staying compliant is a statutory requirement and a pillar of financial stability. A missed deadline or an error
          can mean costly penalties. We prepare and file your GST/HST returns accurately and on time.
        </p>

        <h2>Clean-up and catch-up</h2>
        <p>
          Behind on your books? We restore order to prior periods, file outstanding GST/HST, and leave you with a CRA-ready
          trail — without pausing the rest of your business.
        </p>
      </ContentPage>
    </>
  );
}
