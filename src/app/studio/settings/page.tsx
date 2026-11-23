import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/portal/Shell";
import { TaxSeasonForm } from "@/components/studio/TaxSeasonForm";
import { requirePageRole } from "@/lib/auth/viewer";
import { getTaxSeason } from "@/lib/tax-season";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Admin" title="Settings" description="Controls for how the client portal behaves." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white" aria-busy="true" />}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  await requirePageRole("staff");
  await connection();
  const season = await getTaxSeason();
  // Today's date comes from the server so the preview renders identically on server and browser.
  const iso = new Date().toLocaleDateString("en-CA", { timeZone: "America/Edmonton" });
  return <TaxSeasonForm initial={season} today={{ year: Number(iso.slice(0, 4)), md: iso.slice(5, 10) }} />;
}
