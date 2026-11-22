import { PRIVATE_METADATA } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { photos } from "@/assets/photos";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer, homeFor } from "@/lib/auth/viewer";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in", ...PRIVATE_METADATA };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy p-12 text-white lg:flex">
        <Image src={photos.hero} alt="An Adept advisor reviewing a client’s finances" fill priority placeholder="blur" sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/40" aria-hidden />
        <Link href="/" aria-label="Back to Adept home" className="relative inline-flex w-fit rounded-xl bg-white px-3 py-2">
          <Image src="/adept-logo.png" alt="Adept Bookkeeping Services" width={1364} height={608} className="h-9 w-auto" unoptimized />
        </Link>
        <div className="relative max-w-md">
          <p className="eyebrow text-gold-soft">Adept portal</p>
          <p className="serif mt-4 text-5xl leading-[1.05] font-semibold">Your books, documents and filings in one secure place.</p>
          <ul className="mt-8 grid gap-3 text-white/70">
            {["Upload receipts and statements", "Track what’s outstanding", "Message your bookkeeper", "Book meetings in seconds"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/50">Secure sign-in · Encrypted sessions · Private document storage</p>
      </section>

      <section className="flex flex-col bg-paper px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="lg:hidden" aria-label="Back to Adept home">
            <Image src="/adept-logo.png" alt="Adept" width={1364} height={608} className="h-9 w-auto" unoptimized />
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-navy">
            ← Back to site
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <Suspense fallback={<div className="h-96" aria-busy="true" />}>
            <SignedInGate>
              <LoginForm />
            </SignedInGate>
          </Suspense>
        </div>
      </section>
    </main>
  );
}

/** Already signed in? Skip the form and go straight to the right workspace. */
async function SignedInGate({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer));
  return children;
}
