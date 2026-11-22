import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Start your tax return online. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Tax filing",
    title: "Start your tax return online.",
    subtitle: "A secure questionnaire with slip uploads — save as you go and track your return.",
    photo: "documents",
  });
}
