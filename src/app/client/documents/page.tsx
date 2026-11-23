"use client";

import { Card, PageHeader } from "@/components/portal/Shell";
import { DocumentList } from "@/components/client/DocumentList";
import { Uploader } from "@/components/portal/Uploader";
import { useClientWorkspace } from "@/store/app-store";
import { useState } from "react";
import { BUSINESS_DOC_CATEGORIES, PERSONAL_DOC_CATEGORIES, isBusiness } from "@/lib/client-kind";

export default function DocumentsPage() {
  const { client, clientDocuments } = useClientWorkspace();
  const rows = clientDocuments.filter((d) => (d.kind === "upload" || d.kind === "other") && d.category !== "Agreements");
  const business = isBusiness(client?.type);
  const categories = business ? BUSINESS_DOC_CATEGORIES : PERSONAL_DOC_CATEGORIES;
  const [picked, setPicked] = useState("");
  const category = picked || categories[0];

  return (
    <>
      <PageHeader
        eyebrow="Files"
        title={business ? "Bookkeeping uploads" : "Documents"}
        description={business ? "Bank and credit card statements, invoices, receipts and payroll records for your books." : "Slips, receipts and anything else you share with Adept."}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Upload">
          <label className="mb-3 grid gap-1.5 text-sm font-medium text-navy">
            What are you uploading?
            <select value={category} onChange={(e) => setPicked(e.target.value)} className="h-11 cursor-pointer rounded-xl bg-sand px-3 text-sm text-navy outline-none focus:bg-sand-2">
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <Uploader kind="upload" category={category} />
        </Card>
        <Card title="Your uploads" description={`${rows.length} files`}>
          <DocumentList rows={rows} empty="No uploads yet" emptyBody="Files you upload appear here and in Adept’s folder for you." />
        </Card>
      </div>
    </>
  );
}
