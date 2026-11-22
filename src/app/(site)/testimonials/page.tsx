import { PageSchema } from "@/components/seo/JsonLd";
import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/site/PageHero";
import { TestimonialList } from "@/components/site/TestimonialList";
import { Container } from "@/components/ui/kit";

export const metadata = pageMeta({
  title: "Client Reviews & Testimonials",
  description: "Read what small business owners and families across Canada say about working with Adept Bookkeeping and Tax Services.",
  path: "/testimonials",
  keywords: ["Adept bookkeeping reviews", "Calgary accountant reviews"],
});

export default function TestimonialsPage() {
  return (
    <>
      <PageSchema path="/testimonials" title="Client Reviews & Testimonials" description="Read what small business owners and families across Canada say about working with Adept Bookkeeping and Tax Services." />
      <PageHero
        image="smallBusiness"
        imageAlt="A happy small business owner with a customer"
        kicker="Client voices"
        title="What our clients say."
        lead="Small business owners and individuals across Canada on working with Adept."
      />
      <Container className="py-20">
        <TestimonialList />
      </Container>
    </>
  );
}
