import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Sole proprietor tax returns. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Self-employed tax",
    title: "Sole proprietor tax returns.",
    subtitle: "Business income, expenses, GST/HST and when it makes sense to incorporate.",
    photo: "smallBusiness",
  });
}
