"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { CommandPalette } from "@/components/portal/CommandPalette";
import { iconMap } from "@/components/portal/NavIcons";
import { todayIso } from "@/components/ui/Dropdown";
import { authClient } from "@/lib/auth/client";
import { Alert, Badge, cx, statusTone } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";

export type PortalLink = { href: string; label: string; icon: keyof typeof iconMap };
export type PortalGroup = { title: string; links: PortalLink[] };

// Sidebar collapsed/expanded preference, persisted per browser.
const KEY = "adept.sidebar";
const EVT = "adept-sidebar";
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVT, cb);
  };
}
function readCollapsed() {
  try {
    return localStorage.getItem(KEY) === "collapsed";
  } catch {
    return false;
  }
}
function setCollapsed(v: boolean) {
  try {
    localStorage.setItem(KEY, v ? "collapsed" : "expanded");
  } catch {}
  window.dispatchEvent(new Event(EVT));
}

export function PortalShell({
  brand,
  user,
  groups,
  children,
}: {
  brand: string;
  user: { name: string; detail: string };
  groups: PortalGroup[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const app = useApp();
  const { syncError } = app;
  const studio = brand === "Studio";
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const root = groups[0]?.links[0]?.href ?? "/";

  // Keyboard: ⌘K / Ctrl+K palette, "[" toggles the sidebar.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable='true']");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "[" && !typing && !e.metaKey && !e.ctrlKey) {
        setCollapsed(!readCollapsed());
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Live counts shown next to nav items.
  const badges = useMemo<Record<string, { n: number; tone: "gold" | "danger" }>>(() => {
    const today = todayIso();
    const out: Record<string, { n: number; tone: "gold" | "danger" }> = {};
    const put = (href: string, n: number, tone: "gold" | "danger" = "gold") => {
      if (n > 0) out[href] = { n, tone };
    };
    if (studio) {
      put("/studio/leads", app.leads.filter((l) => l.status === "new").length);
      put("/studio/follow-up", app.followUps.filter((f) => f.status === "failed").length, "danger");
      put("/studio/proposals", app.proposals.filter((p) => p.status === "sent" || p.status === "viewed").length);
      put("/studio/calendar", app.appointments.filter((a) => a.status === "scheduled" && a.date === today).length);
    } else {
      put("/client/outstanding", app.forms.filter((f) => f.status !== "completed").length);
      put("/client/appointments", app.appointments.filter((a) => a.status === "scheduled" && a.date >= today).length);
    }
    return out;
  }, [studio, app.leads, app.followUps, app.proposals, app.appointments, app.forms]);

  const isActive = (href: string) => pathname === href || (href !== root && pathname.startsWith(`${href}/`));
  const current = groups.flatMap((g) => g.links.map((l) => ({ ...l, group: g.title }))).find((l) => isActive(l.href));

  async function signOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      // Full reload so every cached view of the session is dropped.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    }
  }

  const nav = (rail: boolean) => (
    <nav
      aria-label={`${brand} navigation`}
      className={cx("grid", rail ? "gap-4" : "gap-6")}
      onClick={(e) => (e.target as HTMLElement).closest("a") && setMenuOpen(false)}
    >
      {groups.map((group) => (
        <div key={group.title}>
          {rail ? (
            <span className="mx-auto mb-2 block h-px w-6 rounded-full bg-white/10" aria-hidden />
          ) : (
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.14em] text-white/35 uppercase">{group.title}</p>
          )}
          <div className="grid gap-0.5">
            {group.links.map((link) => {
              const Icon = iconMap[link.icon];
              const active = isActive(link.href);
              const badge = badges[link.href];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={rail ? link.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "group/nav relative flex items-center rounded-xl text-sm transition-colors",
                    rail ? "h-11 justify-center" : "gap-3 px-3 py-2.5",
                    active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {active ? <span className="absolute top-2 bottom-2 left-0 w-1 rounded-r-full bg-gold" aria-hidden /> : null}
                  <Icon className={cx("h-[18px] w-[18px] shrink-0", active ? "text-gold-soft" : "text-white/45 group-hover/nav:text-white/80")} />
                  {rail ? (
                    badge ? <span className={cx("absolute top-2 right-2 h-2 w-2 rounded-full", badge.tone === "danger" ? "bg-danger" : "bg-gold")} /> : null
                  ) : (
                    <>
                      <span className="flex-1 truncate">{link.label}</span>
                      {badge ? (
                        <span
                          className={cx(
                            "min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold",
                            badge.tone === "danger" ? "bg-danger text-white" : "bg-gold text-navy",
                          )}
                        >
                          {badge.n}
                        </span>
                      ) : null}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const account = (rail: boolean) =>
    rail ? (
      <div className="grid justify-items-center gap-2">
        <span title={`${user.name} · ${user.detail}`} className="serif grid h-10 w-10 place-items-center rounded-full bg-gold text-base font-semibold text-navy">
          {initials(user.name)}
        </span>
        <button
          type="button"
          onClick={signOut}
          title="Sign out"
          aria-label="Sign out"
          className="grid h-9 w-9 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          <SignOutIcon />
        </button>
      </div>
    ) : (
      <div className="rounded-2xl bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <span className="serif grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-base font-semibold text-navy">{initials(user.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-white/45">{user.detail}</p>
          </div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gold-soft uppercase">{studio ? "Staff" : "Client"}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <Link href="/" className="rounded-xl bg-white/5 py-2 text-center text-xs text-white/70 hover:bg-white/10 hover:text-white">
            View website
          </Link>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="rounded-xl bg-white/5 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    );

  const searchButton = (rail: boolean) => (
    <button
      type="button"
      onClick={() => setPaletteOpen(true)}
      title={rail ? "Search (⌘K)" : undefined}
      className={cx(
        "flex items-center rounded-xl bg-white/5 text-sm text-white/55 transition-colors hover:bg-white/10 hover:text-white",
        rail ? "mx-auto h-11 w-11 justify-center" : "w-full gap-3 px-3 py-2.5",
      )}
    >
      <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0" fill="none" aria-hidden>
        <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {rail ? <span className="sr-only">Search</span> : (
        <>
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">⌘K</kbd>
        </>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Desktop sidebar */}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-30 hidden flex-col bg-navy py-5 text-white transition-[width] duration-200 lg:flex",
          collapsed ? "w-20 px-3" : "w-72 px-4",
        )}
      >
        <div className={cx("flex items-center", collapsed ? "justify-center" : "justify-between gap-2 px-1")}>
          <Brand brand={brand} rail={collapsed} />
          {collapsed ? null : <CollapseButton collapsed={false} />}
        </div>
        <div className="mt-6">{searchButton(collapsed)}</div>
        <div className="mt-6 flex-1 overflow-y-auto [scrollbar-width:thin]">{nav(collapsed)}</div>
        {collapsed ? (
          <div className="my-3 flex justify-center">
            <CollapseButton collapsed />
          </div>
        ) : null}
        <div className="mt-3">{account(collapsed)}</div>
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 bg-navy px-4 text-white lg:hidden">
        <Brand brand={brand} rail={false} />
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setPaletteOpen(true)} aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden>
              <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation" className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-navy/60" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col overflow-y-auto bg-navy px-4 py-5 text-white">
            <Brand brand={brand} rail={false} />
            <div className="mt-6 flex-1">{nav(false)}</div>
            <div className="mt-6">{account(false)}</div>
          </div>
        </div>
      ) : null}

      {/* Content */}
      <div className={cx("transition-[padding] duration-200", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <div className="sticky top-0 z-20 hidden h-14 items-center justify-between bg-paper/95 px-8 backdrop-blur lg:flex">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted">
            <span>{brand}</span>
            {current ? (
              <>
                <span aria-hidden>/</span>
                <span>{current.group}</span>
                <span aria-hidden>/</span>
                <Link href={current.href} className="font-medium text-navy">
                  {current.label}
                </Link>
              </>
            ) : null}
          </nav>
          <button type="button" onClick={() => setPaletteOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-3.5 text-sm text-muted hover:text-navy">
            Jump to…
            <kbd className="rounded-md bg-paper px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </button>
        </div>
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:pt-4 lg:pb-12">
          {syncError ? (
            <div className="mb-6">
              <Alert>{syncError}</Alert>
            </div>
          ) : null}
          {children}
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} groups={groups} studio={studio} />
    </div>
  );
}

function CollapseButton({ collapsed }: { collapsed: boolean }) {
  return (
    <button
      type="button"
      onClick={() => setCollapsed(!collapsed)}
      title={collapsed ? "Expand sidebar ( [ )" : "Collapse sidebar ( [ )"}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
    >
      <svg viewBox="0 0 20 20" className={cx("h-4 w-4 transition-transform", collapsed && "rotate-180")} fill="none" aria-hidden>
        <rect x="3" y="4" width="14" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4v12" stroke="currentColor" strokeWidth="1.5" />
        <path d="m13.5 8-2 2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8M12.5 13.5 16 10l-3.5-3.5M16 10H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Brand({ brand, rail }: { brand: string; rail: boolean }) {
  // The real Adept logo, full colour, on a white tile so the brand colours stay true on navy.
  if (rail) {
    return (
      <Link href="/" aria-label="Adept website" title="Adept website" className="grid h-11 w-14 place-items-center rounded-xl bg-white px-1.5">
        <Image src="/adept-logo.png" alt="Adept" width={1364} height={608} className="h-auto w-full" priority unoptimized />
      </Link>
    );
  }
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Adept website">
      <span className="grid h-11 shrink-0 place-items-center rounded-xl bg-white px-3">
        <Image src="/adept-logo.png" alt="Adept Bookkeeping and Tax Services" width={1364} height={608} className="h-8 w-auto" priority unoptimized />
      </span>
      <span className="truncate rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium tracking-wide text-gold-soft">{brand}</span>
    </Link>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}

export function PortalSkeleton() {
  return (
    <div className="min-h-screen bg-paper" aria-busy="true" aria-label="Loading workspace">
      <div className="fixed inset-y-0 left-0 hidden w-72 bg-navy lg:block" />
      <div className="h-16 bg-navy lg:hidden" />
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-8 lg:pl-80">
        <div className="h-9 w-64 rounded-xl bg-sand" />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-3xl bg-sand" />
          ))}
        </div>
        <div className="mt-6 h-80 rounded-3xl bg-sand" />
      </div>
    </div>
  );
}

// ── Shared portal building blocks ──────────────────────────────────────

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-3 inline-flex text-sm text-muted hover:text-navy">
            ← {back.label}
          </Link>
        ) : null}
        {eyebrow ? <p className="eyebrow text-gold-deep">{eyebrow}</p> : null}
        <h1 className="serif mt-1 text-4xl leading-tight font-semibold text-navy sm:text-5xl">{title}</h1>
        {description ? <div className="mt-2 max-w-2xl text-muted">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-3xl bg-white p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="serif mt-2 text-4xl font-semibold text-navy">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Card({
  title,
  description,
  children,
  action,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("rounded-3xl bg-white p-5 sm:p-7", className)}>
      {title || action ? (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-lg font-semibold text-navy">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** A tappable row inside a Card. */
export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3.5", className)}>{children}</div>;
}

export function Status({ value }: { value: string }) {
  return <Badge tone={statusTone(value)}>{value}</Badge>;
}
