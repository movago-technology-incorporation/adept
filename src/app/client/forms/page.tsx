"use client";

import { Card, PageHeader, Status } from "@/components/portal/Shell";
import { Button, EmptyState, formatDate } from "@/components/ui/kit";
import { useClientWorkspace } from "@/store/app-store";

export default function FormsPage() {
  const { clientForms, completeForm } = useClientWorkspace();
  const open = clientForms.filter((f) => f.status !== "completed");
  const done = clientForms.filter((f) => f.status === "completed");

  return (
    <>
      <PageHeader eyebrow="Work" title="Forms" description="Organizers and worksheets Adept needs from you." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="To complete" action={<span className="text-sm text-muted">{open.length}</span>}>
          {open.length === 0 ? (
            <EmptyState title="All forms complete" body="Nice work — nothing left to fill in." />
          ) : (
            <ul className="grid gap-2">
              {open.map((form) => (
                <li key={form.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper p-4">
                  <span>
                    <span className="block font-medium text-navy">{form.title}</span>
                    <span className="text-sm text-muted">Due {formatDate(form.due)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Status value={form.status} />
                    <Button size="sm" onClick={() => completeForm(form.id)}>
                      Mark complete
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Completed">
          {done.length === 0 ? (
            <EmptyState title="Nothing completed yet" />
          ) : (
            <ul className="grid gap-2">
              {done.map((form) => (
                <li key={form.id} className="flex items-center justify-between gap-3 rounded-2xl bg-paper p-4">
                  <span className="font-medium text-navy">{form.title}</span>
                  <Status value="completed" />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
