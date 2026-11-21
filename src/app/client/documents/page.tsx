"use client";

import { Card, PageHeader } from "@/components/portal/Shell";
import { DocumentList } from "@/components/client/DocumentList";
import { Uploader } from "@/components/portal/Uploader";
import { useClientWorkspace } from "@/store/app-store";

export default function DocumentsPage() {
  const { clientDocuments } = useClientWorkspace();
  const rows = clientDocuments.filter((d) => d.kind === "upload" || d.kind === "other");

  return (
    <>
      <PageHeader eyebrow="Files" title="Documents" description="Bank statements, slips and anything else you share with Adept." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Upload">
          <Uploader kind="upload" category="Client uploads" />
        </Card>
        <Card title="Your uploads" description={`${rows.length} files`}>
          <DocumentList rows={rows} empty="No uploads yet" emptyBody="Files you upload appear here and in Adept’s folder for you." />
        </Card>
      </div>
    </>
  );
}
