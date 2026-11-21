"use client";

import Link from "next/link";
import { Card, PageHeader } from "@/components/portal/Shell";
import { Badge, EmptyState, buttonClass, formatDate } from "@/components/ui/kit";
import { todayIso } from "@/components/ui/Dropdown";
import { useClientWorkspace } from "@/store/app-store";

export default function OutstandingPage() {
  const { outstanding } = useClientWorkspace();
  const today = todayIso();
  const rows = [...outstanding].sort((a, b) => a.due.localeCompare(b.due));

  return (
    <>
      <PageHeader eyebrow="Work" title="What’s outstanding" description="Items Adept is waiting on, soonest first." />
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="You’re all clear" body="Adept will post the next request here." />
        ) : (
          <ul className="grid gap-2">
            {rows.map((item) => {
              const overdue = item.due < today;
              return (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper p-4">
                  <span>
                    <span className="block font-medium text-navy">{item.title}</span>
                    <span className="text-sm text-muted">Due {formatDate(item.due)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge tone={overdue ? "danger" : "warn"}>{overdue ? "Overdue" : item.status}</Badge>
                    <Link href="/client/forms" className={buttonClass("soft", "sm")}>
                      Open
                    </Link>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
