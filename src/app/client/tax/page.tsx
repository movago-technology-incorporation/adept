"use client";

import { Card, PageHeader } from "@/components/portal/Shell";
import { DocumentList } from "@/components/client/DocumentList";
import { useClientWorkspace } from "@/store/app-store";

export default function TaxDocsPage() {
  const { clientDocuments } = useClientWorkspace();
  const rows = clientDocuments.filter((d) => d.kind === "tax");

  return (
    <>
      <PageHeader eyebrow="Files" title="Tax documents" description="Returns, notices and filings Adept has prepared for you." />
      <Card>
        <DocumentList canDelete={false} rows={rows} empty="No tax documents yet" emptyBody="Completed returns and CRA filings will appear here." />
      </Card>
    </>
  );
}
