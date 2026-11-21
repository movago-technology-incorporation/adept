"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Catches runtime errors from any page or nested layout (Studio, client portal, site). */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error && "digest" in error ? String((error as { digest?: string }).digest ?? "") : "";

  return (
    <main className="grid min-h-[70vh] place-items-center bg-paper px-5 py-16">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center sm:p-12">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-warn-soft text-warn">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
            <path d="M12 8v5m0 3.5h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="serif mt-6 text-4xl font-semibold text-navy">We couldn’t load this page</h1>
        <p className="mt-3 leading-relaxed text-muted">
          The connection dropped while loading your data. This is usually a brief network hiccup — please try again.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => retry()} className="inline-flex h-11 items-center rounded-full bg-navy px-6 font-medium text-white hover:bg-navy-3">
            Try again
          </button>
          <Link href="/" className="inline-flex h-11 items-center rounded-full bg-sand px-6 font-medium text-navy hover:bg-sand-2">
            Go to homepage
          </Link>
        </div>
        {digest ? <p className="mt-6 text-xs text-muted">Reference: {digest}</p> : null}
      </div>
    </main>
  );
}
