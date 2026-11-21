"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cx, inputClass } from "@/components/ui/kit";

export type DropdownOption = { value: string; label: string };

// Menus render in navy so they separate from the page by tone, not by shadow.

function useMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = anchor !== null;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const node = e.target as Node;
      if (ref.current?.contains(node) || menuRef.current?.contains(node)) return;
      setAnchor(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAnchor(null);
    }
    function onScroll(e: Event) {
      if (menuRef.current?.contains(e.target as Node)) return;
      setAnchor(null);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return {
    open,
    anchor,
    ref,
    menuRef,
    toggle: () => setAnchor((a) => (a ? null : ref.current)),
    close: () => setAnchor(null),
  };
}

function MenuPortal({
  anchor,
  align,
  menuRef,
  children,
}: {
  anchor: HTMLElement;
  align: "left" | "right";
  menuRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const [box, setBox] = useState<{ top: number; left?: number; right?: number; width: number } | null>(null);

  useLayoutEffect(() => {
    // Measuring the trigger requires a layout effect; one extra render is intended.
    const rect = anchor.getBoundingClientRect();
    const width = Math.max(rect.width, 200);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < 280 && rect.top > 280 ? rect.top - 8 - Math.min(288, 44 * 8) : rect.bottom + 8;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBox(
      align === "right"
        ? { top, right: window.innerWidth - rect.right, width }
        : { top, left: Math.min(rect.left, window.innerWidth - width - 8), width },
    );
  }, [anchor, align]);

  if (!box) return null;
  return createPortal(
    <div
      ref={menuRef}
      role="listbox"
      className="fixed z-[90] max-h-72 overflow-auto rounded-2xl bg-navy p-1.5 text-white"
      style={{ top: box.top, left: box.left, right: box.right, width: box.width }}
    >
      {children}
    </div>,
    document.body,
  );
}

const itemClass = "block w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors";

export function Dropdown({
  name,
  options,
  value,
  defaultValue,
  onChange,
  align = "left",
  className,
  ariaLabel,
}: {
  name?: string;
  options: DropdownOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  align?: "left" | "right";
  className?: string;
  ariaLabel?: string;
}) {
  const { open, anchor, ref, menuRef, toggle, close } = useMenu();
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? "");
  const selected = value ?? inner;
  const current = options.find((o) => o.value === selected) ?? options[0];

  return (
    <div ref={ref} className="relative">
      {name ? <input type="hidden" name={name} value={selected} /> : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={cx(inputClass, "flex items-center justify-between gap-3 text-left", open && "bg-gold-soft/50", className)}
        onClick={toggle}
      >
        <span className="truncate capitalize">{current?.label ?? "Select"}</span>
        <Chevron open={open} />
      </button>
      {anchor ? (
        <MenuPortal anchor={anchor} align={align} menuRef={menuRef}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === selected}
              className={cx(
                itemClass,
                "capitalize",
                option.value === selected ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/8 hover:text-white",
              )}
              onClick={() => {
                setInner(option.value);
                onChange?.(option.value);
                close();
              }}
            >
              {option.label}
            </button>
          ))}
        </MenuPortal>
      ) : null}
    </div>
  );
}

export function DropdownMenu({
  label,
  items,
  align = "left",
  triggerClassName,
  active,
}: {
  label: string;
  items: { href: string; label: string; onSelect?: () => void }[];
  align?: "left" | "right";
  triggerClassName?: string;
  active?: boolean;
}) {
  const { open, anchor, ref, menuRef, toggle, close } = useMenu();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        className={cx("inline-flex items-center gap-1.5", triggerClassName, (active || open) && "text-gold-deep")}
        onClick={toggle}
      >
        {label}
        <Chevron open={open} />
      </button>
      {anchor ? (
        <MenuPortal anchor={anchor} align={align} menuRef={menuRef}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(itemClass, "text-white/80 hover:bg-white/8 hover:text-white")}
              onClick={() => {
                item.onSelect?.();
                close();
              }}
            >
              {item.label}
            </Link>
          ))}
        </MenuPortal>
      ) : null}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={cx("h-3.5 w-3.5 shrink-0 opacity-60 transition-transform", open && "rotate-180")}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dateOptions(start = todayIso(), days = 60): DropdownOption[] {
  const [y, m, d] = start.split("-").map(Number);
  const origin = new Date(y, m - 1, d);
  return Array.from({ length: days }, (_, i) => {
    const next = new Date(origin);
    next.setDate(origin.getDate() + i);
    const value = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
    return { value, label: next.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" }) };
  });
}

export function timeOptions(): DropdownOption[] {
  const rows: DropdownOption[] = [];
  for (let h = 8; h <= 18; h += 1) {
    for (const min of [0, 30]) {
      const value = `${pad(h)}:${pad(min)}`;
      const label = new Date(2000, 0, 1, h, min).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
      rows.push({ value, label });
    }
  }
  return rows;
}
