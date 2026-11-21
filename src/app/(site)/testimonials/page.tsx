import { PageHero } from "@/components/site/PageHero";
import { TestimonialList } from "@/components/site/TestimonialList";
import { Container } from "@/components/ui/kit";

export const metadata = { title: "Testimonials" };

export default function TestimonialsPage() {
  return (
    <>
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
