"use client";

import { useMemo } from "react";
import { Card, PageHeader, Stat } from "@/components/portal/Shell";
import { EmptyState, cx } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";

export default function ClicksPage() {
  const { clicks } = useApp();

  const top = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of clicks) counts.set(c.cta, (counts.get(c.cta) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [clicks]);
  const max = top[0]?.[1] ?? 1;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Pipeline" title="Click trail" description="Calls-to-action visitors use across the website (latest 500)." />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="grid gap-4 content-start">
          <Stat label="Tracked clicks" value={clicks.length} />
          <Card title="Top calls-to-action">
            {top.length === 0 ? (
              <EmptyState title="No clicks yet" />
            ) : (
              <ul className="grid gap-3">
                {top.map(([cta, n]) => (
                  <li key={cta}>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="truncate text-navy">{cta}</span>
                      <span className="text-muted">{n}</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-paper">
                      <div className="h-2 rounded-full bg-gold" style={{ width: `${(n / max) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Card title="Recent activity">
          {clicks.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs tracking-wide text-muted uppercase">
                  <tr>
                    {["When", "Page", "Action", "Device", "Referrer"].map((h) => (
                      <th key={h} className="px-3 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clicks.map((row, i) => (
                    <tr key={row.id} className={cx(i % 2 === 0 && "bg-paper")}>
                      <td className="rounded-l-2xl px-3 py-2.5 whitespace-nowrap text-muted">{row.at}</td>
                      <td className="px-3 py-2.5 text-navy">{row.page}</td>
                      <td className="px-3 py-2.5">{row.cta}</td>
                      <td className="px-3 py-2.5 text-muted">{row.device}</td>
                      <td className="rounded-r-2xl px-3 py-2.5 text-muted">{row.referrer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
