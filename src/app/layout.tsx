import type { Metadata, Viewport } from "next";
import { BASE_KEYWORDS, SITE, siteOrigin } from "@/lib/seo";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import { Suspense } from "react";
import { getFirm, getTestimonials } from "@/lib/data";
import { AppProvider } from "@/store/app-store";
import "./globals.css";

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Adept Bookkeeping & Tax Services, Calgary",
    template: `%s | ${SITE.shortName}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: BASE_KEYWORDS,
  authors: [{ name: SITE.name, url: "/" }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "Accounting",
  alternates: { canonical: "/", languages: { "en-CA": "/" } },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    url: "/",
    title: "Adept Bookkeeping & Tax Services, Calgary",
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Adept Bookkeeping & Tax Services, Calgary",
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  formatDetection: { telephone: true, email: true, address: true },
  manifest: "/manifest.webmanifest",
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } } : {}),
  },
  other: {
    "geo.region": `${SITE.country}-${SITE.regionCode}`,
    "geo.placename": `${SITE.city}, ${SITE.region}`,
  },
};

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <PublicDataProvider>{children}</PublicDataProvider>
        </Suspense>
      </body>
    </html>
  );
}

/** Public site content from Neon (cached, so it's part of the static shell). */
async function PublicDataProvider({ children }: { children: React.ReactNode }) {
  const [testimonials, firm] = await Promise.all([getTestimonials(), getFirm()]);
  return <AppProvider initial={{ testimonials, firm }}>{children}</AppProvider>;
}
