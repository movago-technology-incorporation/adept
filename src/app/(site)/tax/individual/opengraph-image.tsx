import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Personal tax returns, handled all year. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Personal tax",
    title: "Personal tax returns, handled all year.",
    subtitle: "T1 returns with every credit claimed — for individuals, couples and families.",
    photo: "calculator",
  });
}
