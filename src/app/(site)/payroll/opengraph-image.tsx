import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Payroll your team can rely on. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Payroll",
    title: "Payroll your team can rely on.",
    subtitle: "Pay runs, CRA remittances, T4s and WCB statements, handled every cycle.",
    photo: "calculator",
  });
}
