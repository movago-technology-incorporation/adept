"use client";

import { Card, PageHeader } from "@/components/portal/Shell";
import { DocumentList } from "@/components/client/DocumentList";
import { useClientWorkspace } from "@/store/app-store";

export default function AgreementsPage() {
  const { clientDocuments } = useClientWorkspace();
  const rows = clientDocuments.filter((d) => d.category === "Agreements");
  return (
    <>
      <PageHeader eyebrow="Files" title="Agreements" description="Your signed proposal and engagement letter with Adept." />
      <Card title="Signed documents" description={`${rows.length} ${rows.length === 1 ? "file" : "files"}`}>
        <DocumentList rows={rows} empty="No agreements yet" emptyBody="When you sign a proposal and engagement letter with Adept, a copy is kept here." />
      </Card>
    </>
  );
}
