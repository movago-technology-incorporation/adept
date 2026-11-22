import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Corporate accounting and T2 returns. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Corporate tax",
    title: "Corporate accounting and T2 returns.",
    subtitle: "Financial statements, shareholder loans and T2 filings for Alberta corporations.",
    photo: "reports",
  });
}
