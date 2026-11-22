import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Tax preparation, planning and filing. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Tax services",
    title: "Tax preparation, planning and filing.",
    subtitle: "Personal, self-employed and corporate returns — prepared carefully and filed on time.",
    photo: "documents",
  });
}
