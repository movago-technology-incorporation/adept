import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Tax planning with a long view. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Tax planning",
    title: "Tax planning with a long view.",
    subtitle: "Credits, RRSPs, FHSAs and income splitting — legally lowering what you owe.",
    photo: "consult",
  });
}
