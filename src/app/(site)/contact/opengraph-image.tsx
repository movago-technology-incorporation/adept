import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Let’s talk about your books. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Contact",
    title: "Let’s talk about your books.",
    subtitle: "Tell us where you’re starting from — we reply within one business day.",
    photo: "consult",
  });
}
