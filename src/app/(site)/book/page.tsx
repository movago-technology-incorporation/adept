import { PageHero } from "@/components/site/PageHero";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { Container } from "@/components/ui/kit";
import { getEventTypes, type EventType } from "@/lib/cal";

export const metadata = { title: "Book a consultation" };

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
      <PageHero
        image="hero"
        imageAlt="An Adept advisor in a working session with a client"
        kicker="Consultations"
        title="Book a working session."
        lead="Pick a time on Adept’s calendar. You’ll get a confirmation email with a private video link straight away."
      />
      <Container className="py-16 sm:py-20">
        <BookingFlow eventTypes={eventTypes} />
      </Container>
    </>
  );
}
