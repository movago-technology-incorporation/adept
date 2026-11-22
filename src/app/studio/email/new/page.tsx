import { Suspense } from "react";
import { PageHeader } from "@/components/portal/Shell";
import { EmailComposer } from "@/components/studio/EmailComposer";
import { WorkspaceLoading } from "@/components/portal/States";
import { parseRecipients } from "@/lib/email-recipients";

export const metadata = { title: "New email" };

/** Full-page composer. Recipients can be pre-filled with ?to=client:ID,lead:ID */
export default function NewEmailPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  return (
    <>
      <PageHeader
        back={{ href: "/studio/email", label: "All emails" }}
        eyebrow="Communication"
        title="New email"
        description="Sent in the Adept email design from your address. Replies come straight back to you."
      />
      {/* The ?to= read happens inside Suspense so the page shell renders instantly. */}
      <Suspense fallback={<WorkspaceLoading />}>
        <Composer searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Composer({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const { to } = await searchParams;
  return <EmailComposer preset={parseRecipients(to)} />;
}
