import { Suspense } from "react";
import { PageSchema } from "@/components/seo/JsonLd";
import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/site/PageHero";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { Container } from "@/components/ui/kit";
import { getEventTypes, type EventType } from "@/lib/cal";

export const metadata = pageMeta({
  title: "Book a Free Consultation",
  description: "Book a free bookkeeping or tax consultation with Adept in Calgary. Pick a time online and get a private video-call link straight away — no obligation.",
  path: "/book",
  keywords: ["free tax consultation Calgary", "book an accountant Calgary", "bookkeeping consultation"],
});

async function loadEventTypes(): Promise<EventType[] | undefined> {
  try {
    return await getEventTypes();
  } catch (err) {
    console.error("Cal.com event types unavailable:", err);
    return undefined; // the scheduler retries from the browser
  }
}

export default async function BookPage() {
  const eventTypes = await loadEventTypes();
  return (
    <>
      <PageSchema path="/book" title="Book a Free Consultation" description="Book a free bookkeeping or tax consultation with Adept in Calgary. Pick a time online and get a private video-call link straight away — no obligation." />
      <PageHero
        image="hero"
        imageAlt="An Adept advisor in a working session with a client"
        kicker="Consultations"
        title="Book a working session."
        lead="Pick a time on Adept’s calendar. You’ll get a confirmation email with a private video link straight away."
      />
      <Container className="py-16 sm:py-20">
        {/* The calendar reads today's date, so it renders per visit; the rest of the page stays static. */}
        <Suspense fallback={<div className="h-[560px] animate-pulse rounded-3xl bg-white" />}>
          <BookingFlow eventTypes={eventTypes} />
        </Suspense>
      </Container>
    </>
  );
}
