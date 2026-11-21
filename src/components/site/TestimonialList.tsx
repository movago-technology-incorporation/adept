"use client";

import { useApp } from "@/store/app-store";
import { EmptyState, cx } from "@/components/ui/kit";

export function TestimonialList({ featuredOnly = false, tone = "white" }: { featuredOnly?: boolean; tone?: "white" | "sand" }) {
  const { testimonials } = useApp();
  const rows = featuredOnly ? testimonials.filter((item) => item.featured).slice(0, 3) : testimonials;

  if (!rows.length) return <EmptyState title="Reviews are on their way" body="Client stories will appear here soon." />;

  return (
    <div className={cx("grid gap-4", featuredOnly ? "md:grid-cols-3" : "md:grid-cols-2")}>
      {rows.map((item) => (
        <figure key={item.id} className={cx("flex flex-col rounded-3xl p-8", tone === "white" ? "bg-white" : "bg-sand")}>
          <Stars />
          <blockquote className="mt-5 flex-1 text-[17px] leading-relaxed text-ink/85">“{item.quote}”</blockquote>
          <figcaption className="mt-8 flex items-center gap-3">
            <span className="serif grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy text-lg font-semibold text-gold-soft">
              {item.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span>
              <span className="block font-semibold text-navy">{item.name}</span>
              <span className="block text-sm text-muted">{item.role}</span>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function Stars() {
  return (
    <div className="flex gap-0.5 text-gold" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="m10 1.8 2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.8l-5.1 2.6 1-5.6-4.1-4 5.7-.8L10 1.8Z" />
        </svg>
      ))}
    </div>
  );
}
