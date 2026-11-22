import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Small business bookkeeping, done properly. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Bookkeeping",
    title: "Small business bookkeeping, done properly.",
    subtitle: "Monthly books, reconciliations and reports with an audit trail the CRA can follow.",
    photo: "accountant",
  });
}
