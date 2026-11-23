"use client";

import { Card, PageHeader } from "@/components/portal/Shell";
import { Checklist } from "@/components/portal/Checklist";
import { Uploader } from "@/components/portal/Uploader";
import { useState } from "react";
import { BUSINESS_DOC_CATEGORIES } from "@/lib/client-kind";

export default function ChecklistPage() {
  const [category, setCategory] = useState(BUSINESS_DOC_CATEGORIES[0]);
  return (
    <>
      <PageHeader eyebrow="Work" title="Monthly checklist" description="What Adept needs from you each month. Tick items off as you go, and upload files right here." />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card title="This month">
          <Checklist />
        </Card>
        <Card title="Upload files" description="Statements, invoices and receipts go straight to Adept">
          <label className="mb-3 grid gap-1.5 text-sm font-medium text-navy">
            What are you uploading?
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 cursor-pointer rounded-xl bg-sand px-3 text-sm text-navy outline-none focus:bg-sand-2">
              {BUSINESS_DOC_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <Uploader kind="upload" category={category} />
        </Card>
      </div>
    </>
  );
}
