import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, siteOrigin } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return PUBLIC_ROUTES.map((r) => ({
    url: `${origin}${r.path === "/" ? "" : r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
    ...(r.path === "/" ? { images: [`${origin}/opengraph-image`] } : {}),
  }));
}
