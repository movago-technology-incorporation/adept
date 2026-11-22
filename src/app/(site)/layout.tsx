import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { SiteSchema } from "@/components/seo/JsonLd";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[100] rounded-full bg-navy px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteSchema />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
