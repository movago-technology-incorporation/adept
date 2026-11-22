import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer, homeFor } from "@/lib/auth/viewer";
import { VerifyForm } from "@/components/auth/VerifyForm";

export const metadata = { title: "Confirm your email" };

export default function VerifyPage() {
  return (
    <main className="flex min-h-screen flex-col bg-paper px-5 py-8">
      <Link href="/" className="mx-auto" aria-label="Adept home">
        <Image src="/adept-logo.png" alt="Adept Bookkeeping Services" width={1364} height={608} className="h-14 w-auto" unoptimized />
      </Link>
      <div className="mx-auto flex w-full max-w-md flex-1 items-center py-10">
        <Suspense fallback={<div className="h-80 w-full rounded-3xl bg-white" aria-busy="true" />}>
          <Gate />
        </Suspense>
      </div>
    </main>
  );
}

/** Only pending (unconfirmed) accounts belong here. */
async function Gate() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== "pending") redirect(homeFor(viewer));
  return <VerifyForm email={viewer.email} />;
}
