"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { iconMap } from "@/components/portal/NavIcons";
import { cx } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";
import type { PortalGroup } from "@/components/portal/Shell";

type Item = { id: string; group: string; label: string; hint?: string; href: string; icon?: keyof typeof iconMap };

/** ⌘K / Ctrl+K: jump to any page or record. */
export function CommandPalette({ open, onClose, groups, studio }: { open: boolean; onClose: () => void; groups: PortalGroup[]; studio: boolean }) {
  const router = useRouter();
  const { leads, clients, appointments } = useApp();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const items = useMemo<Item[]>(() => {
    const pages: Item[] = groups.flatMap((g) => g.links.map((l) => ({ id: `p:${l.href}`, group: "Go to", label: l.label, hint: g.title, href: l.href, icon: l.icon })));
    if (!studio) return pages;
    return [
      ...pages,
      ...leads.map((l) => ({ id: `l:${l.id}`, group: "Leads", label: l.name, hint: [l.company, l.email].filter(Boolean).join(" · "), href: `/studio/leads/${l.id}` })),
      ...clients.map((c) => ({ id: `c:${c.id}`, group: "Clients", label: c.company || c.name, hint: c.company ? c.name : c.email, href: `/studio/clients/${c.id}` })),
      ...appointments
        .filter((a) => a.status === "scheduled")
        .map((a) => ({ id: `a:${a.id}`, group: "Meetings", label: a.topic, hint: `${a.name} · ${a.date} ${a.time}`, href: `/studio/meetings/${a.id}` })),
    ];
  }, [groups, studio, leads, clients, appointments]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const matched = needle ? items.filter((i) => `${i.label} ${i.hint ?? ""}`.toLowerCase().includes(needle)) : items.filter((i) => i.group === "Go to");
    return matched.slice(0, 40).map((item, i, all) => ({ ...item, header: i === 0 || all[i - 1].group !== item.group ? item.group : null }));
  }, [items, q]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  function go(item?: Item) {
    if (!item) return;
    onClose();
    setQ("");
    router.push(item.href);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-navy/60" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white">
        <div className="flex items-center gap-3 bg-paper px-5">
          <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-muted" fill="none" aria-hidden>
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(results[active]);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder={studio ? "Search pages, leads, clients, meetings…" : "Search pages…"}
            className="h-14 flex-1 bg-transparent text-base text-navy outline-none placeholder:text-muted/70"
            aria-label="Search"
          />
          <kbd className="rounded-lg bg-white px-2 py-1 text-[11px] text-muted">Esc</kbd>
        </div>
        <ul ref={list} className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {results.length === 0 ? <li className="px-4 py-8 text-center text-sm text-muted">No matches for “{q}”</li> : null}
          {results.map((item, i) => {
            const header = item.header;
            const Icon = item.icon ? iconMap[item.icon] : null;
            return (
              <li key={item.id}>
                {header ? <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">{header}</p> : null}
                <button
                  type="button"
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item)}
                  className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", i === active ? "bg-sand" : "hover:bg-paper")}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper text-navy">
                    {Icon ? <Icon className="h-4 w-4" /> : <span className="text-xs font-semibold">{item.label.slice(0, 1)}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-navy">{item.label}</span>
                    {item.hint ? <span className="block truncate text-xs text-muted">{item.hint}</span> : null}
                  </span>
                  {i === active ? <span className="text-xs text-muted">↵</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-4 bg-paper px-5 py-2.5 text-[11px] text-muted">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
