"use client";

import Link from "next/link";
import { useEffect } from "react";
import { FileQuestion, RotateCw, TriangleAlert } from "lucide-react";
import { buttonClass } from "@/components/ui/kit";

/** In-workspace error state: keeps the sidebar, never shows raw error details. */
export function WorkspaceError({ error, retry, home }: { error: unknown; retry: () => void; home: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error ? (error as { digest?: string }).digest : undefined;
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-warn-soft text-warn">
          <TriangleAlert className="h-6 w-6" />
        </span>
        <h1 className="serif mt-5 text-3xl font-semibold text-navy">This page didn’t load</h1>
        <p className="mt-2 leading-relaxed text-muted">Usually a brief connection hiccup. Your data is safe — try again.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => retry()} className={buttonClass("primary")}>
            <RotateCw className="h-4 w-4" />
            Try again
          </button>
          <Link href={home} className={buttonClass("soft")}>
            Back to overview
          </Link>
        </div>
        {digest ? <p className="mt-6 text-xs text-muted">Reference {digest}</p> : null}
      </div>
    </div>
  );
}

export function WorkspaceNotFound({ home, what = "page" }: { home: string; what?: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sand text-navy">
          <FileQuestion className="h-6 w-6" />
        </span>
        <h1 className="serif mt-5 text-3xl font-semibold text-navy">We can’t find that {what}</h1>
        <p className="mt-2 leading-relaxed text-muted">It may have been deleted, or the link is out of date.</p>
        <Link href={home} className={buttonClass("primary", "md", "mt-7")}>
          Back to overview
        </Link>
      </div>
    </div>
  );
}

/** Content skeleton shown inside the shell while a workspace page loads. */
export function WorkspaceLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-28 rounded-full bg-sand" />
      <div className="mt-3 h-10 w-72 rounded-2xl bg-sand" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-3xl bg-sand" />
        ))}
      </div>
      <div className="mt-6 h-96 rounded-3xl bg-sand" />
    </div>
  );
}
