import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Ahead of the numbers, all year. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "About Adept",
    title: "Ahead of the numbers, all year.",
    subtitle: "A Calgary team keeping small businesses and families organized, compliant and financially sound.",
    photo: "team",
  });
}
