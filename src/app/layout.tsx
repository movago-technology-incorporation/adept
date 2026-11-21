import type { Metadata } from "next";
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
  title: {
    default: "Adept Bookkeeping Services",
    template: "%s · Adept Bookkeeping Services",
  },
  description:
    "Expert bookkeeping, tax, and payroll services for small businesses and individuals across Canada.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
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
