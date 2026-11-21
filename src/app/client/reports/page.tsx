"use client";

import { Card, PageHeader } from "@/components/portal/Shell";
import { DocumentList } from "@/components/client/DocumentList";
import { useClientWorkspace } from "@/store/app-store";

export default function ReportsPage() {
  const { clientDocuments } = useClientWorkspace();
  const rows = clientDocuments.filter((d) => d.kind === "report");

  return (
    <>
      <PageHeader eyebrow="Files" title="Reports" description="Financial statements and management reports from Adept." />
      <Card>
        <DocumentList canDelete={false} rows={rows} empty="No reports yet" emptyBody="Monthly and year-end reports will appear here once your books are closed." />
      </Card>
    </>
  );
}
