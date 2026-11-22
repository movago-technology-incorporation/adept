import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "What our clients say. — Adept Bookkeeping and Tax Services, Calgary";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Client reviews",
    title: "What our clients say.",
    subtitle: "Small business owners and families across Canada on working with Adept.",
    photo: "smallBusiness",
  });
}
