import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Flat design primitives: tonal fills, no shadows, no borders.

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export type Variant = "primary" | "gold" | "soft" | "ghost" | "light" | "danger";
export type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy-3",
  gold: "bg-gold text-navy hover:bg-gold-soft",
  soft: "bg-sand text-navy hover:bg-sand-2",
  ghost: "text-navy hover:bg-sand",
  light: "bg-white/10 text-white hover:bg-white/20",
  danger: "bg-danger-soft text-danger hover:bg-danger hover:text-white",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cx(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    extra,
  );
}

export function Button({
  variant,
  size,
  className,
  loading,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={buttonClass(variant, size, className)}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cx("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ── Form controls ───────────────────────────────────────────────────────

export const inputClass =
  "w-full rounded-xl bg-sand px-4 py-3 text-[15px] text-navy placeholder:text-muted/70 outline-none transition-colors focus:bg-gold-soft/50 disabled:opacity-60";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={cx(inputClass, props.className)} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea rows={4} {...props} className={cx(inputClass, "resize-y leading-relaxed", props.className)} />;
}

export function Label({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("grid gap-2", className)}>
      <span className="text-sm font-medium text-navy">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Alert({ tone = "danger", children }: { tone?: "danger" | "success" | "info"; children: ReactNode }) {
  const map = {
    danger: "bg-danger-soft text-danger",
    success: "bg-success-soft text-success",
    info: "bg-sand text-navy",
  };
  return (
    <p role={tone === "danger" ? "alert" : "status"} className={cx("rounded-xl px-4 py-3 text-sm leading-relaxed", map[tone])}>
      {children}
    </p>
  );
}

// ── Layout & display ────────────────────────────────────────────────────

export function Surface({
  tone = "white",
  className,
  children,
  ...props
}: ComponentProps<"div"> & { tone?: "white" | "sand" | "paper" | "navy" }) {
  const map = { white: "bg-white", sand: "bg-sand", paper: "bg-paper", navy: "bg-navy text-white" };
  return (
    <div {...props} className={cx("rounded-3xl", map[tone], className)}>
      {children}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "gold" | "success" | "danger" | "warn" | "navy";
  children: ReactNode;
}) {
  const map = {
    neutral: "bg-sand text-navy",
    gold: "bg-gold-soft text-gold-deep",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    warn: "bg-warn-soft text-warn",
    navy: "bg-navy text-white",
  };
  return (
    <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium capitalize", map[tone])}>
      {children}
    </span>
  );
}

/** Status → badge tone, shared by Studio and the client portal. */
export function statusTone(status: string): "neutral" | "gold" | "success" | "danger" | "warn" | "navy" {
  if (["completed", "accepted", "won", "sent", "left review", "ready"].includes(status)) return "success";
  if (["lost", "declined", "cancelled"].includes(status)) return "danger";
  if (["outstanding", "queued", "draft", "reminded", "review"].includes(status)) return "warn";
  if (["consult booked", "proposal sent", "scheduled", "in progress", "engaged", "viewed", "live"].includes(status)) return "gold";
  return "neutral";
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-paper px-6 py-10 text-center">
      <p className="font-medium text-navy">{title}</p>
      {body ? <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("eyebrow text-gold-deep", className)}>{children}</p>;
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>;
}

/** Format "2026-10-28" + "10:00" as "Wed, Oct 28 · 10:00 a.m." */
export function formatWhen(date: string, time?: string) {
  if (!date) return "";
  const d = new Date(`${date}T${time || "12:00"}:00`);
  const day = d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
  if (!time) return day;
  return `${day} · ${d.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}`;
}

export function formatDate(date?: string) {
  if (!date) return "";
  return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}


/** Icon-only action with an accessible label and a hover tooltip. */
export function IconButton({
  label,
  children,
  tone = "neutral",
  size = "md",
  className,
  ...props
}: Omit<ComponentProps<"button">, "children"> & {
  label: string;
  children: ReactNode;
  tone?: "neutral" | "primary" | "danger" | "gold" | "light";
  size?: "sm" | "md";
}) {
  const tones = {
    neutral: "text-navy/70 hover:bg-sand hover:text-navy",
    primary: "bg-navy text-white hover:bg-navy-3",
    danger: "bg-danger text-white hover:bg-danger/90",
    gold: "bg-gold text-navy hover:bg-gold-soft",
    light: "bg-white/10 text-white hover:bg-white/20",
  };
  return (
    <span className="group/tip relative inline-flex">
      <button
        type="button"
        aria-label={label}
        {...props}
        className={cx(
          "inline-grid place-items-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-40",
          size === "sm" ? "h-8 w-8" : "h-9 w-9",
          tones[tone],
          className,
        )}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 rounded-lg bg-navy px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white opacity-0 transition-opacity group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
