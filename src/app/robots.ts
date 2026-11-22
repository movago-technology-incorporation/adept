import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/seo";

/** Public marketing pages are crawlable; portal, Studio, auth and APIs are not. */
export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio", "/client", "/login", "/verify", "/portal", "/api/"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
