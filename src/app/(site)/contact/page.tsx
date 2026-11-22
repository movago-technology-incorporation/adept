import { PageSchema } from "@/components/seo/JsonLd";
import { pageMeta } from "@/lib/seo";
import { ContactPageClient } from "@/components/site/ContactPageClient";

export const metadata = pageMeta({
  title: "Contact Adept Bookkeeping and Tax Services",
  description: "Contact Adept Bookkeeping and Tax Services in Calgary, Alberta. Tell us about your business and we’ll reply within one business day.",
  path: "/contact",
  keywords: ["contact Calgary bookkeeper", "Calgary accountant phone"],
});

export default function ContactPage() {
  return (
    <>
      <PageSchema path="/contact" title="Contact Adept Bookkeeping and Tax Services" description="Contact Adept Bookkeeping and Tax Services in Calgary, Alberta. Tell us about your business and we’ll reply within one business day." />
      <ContactPageClient />
    </>
  );
}
