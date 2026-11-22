import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Beyond the monthly books. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Services",
    title: "Beyond the monthly books.",
    subtitle: "Clean-up and catch-up, GST/HST filing, corporate registration and QuickBooks setup.",
    photo: "reports",
  });
}
