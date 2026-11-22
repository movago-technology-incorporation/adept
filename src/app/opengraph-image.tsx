import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Taxes filed right. Books kept clean. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Bookkeeping \u00b7 Tax \u00b7 Payroll",
    title: "Taxes filed right.\nBooks kept clean.",
    subtitle: "Bookkeeping, tax returns and payroll for small businesses and families across Calgary and Canada.",
    photo: "hero",
  });
}
