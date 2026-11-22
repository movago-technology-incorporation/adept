import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Book a free working session. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Free consultation",
    title: "Book a free working session.",
    subtitle: "Pick a time online and get a private video link straight away. No obligation.",
    photo: "hero",
  });
}
