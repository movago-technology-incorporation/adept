"use client";

import { Card, PageHeader } from "@/components/portal/Shell";
import { DocumentList } from "@/components/client/DocumentList";
import { Uploader } from "@/components/portal/Uploader";
import { useClientWorkspace } from "@/store/app-store";

export default function ReceiptsPage() {
  const { clientDocuments } = useClientWorkspace();
  const rows = clientDocuments.filter((d) => d.kind === "receipt");

  return (
    <>
      <PageHeader eyebrow="Files" title="Receipts" description="Snap a photo or drop a PDF — we’ll code it to the right account." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Send receipts">
          <Uploader kind="receipt" category="Receipts" />
        </Card>
        <Card title="Sent receipts" description={`${rows.length} receipts`}>
          <DocumentList rows={rows} empty="No receipts yet" />
        </Card>
      </div>
    </>
  );
}
