"use client";

import { Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader, Stat } from "@/components/portal/Shell";
import { AddButton } from "@/components/studio/Modal";
import { TestimonialModal } from "@/components/studio/TestimonialModal";
import { DataTable, columnsFor, facetFilter } from "@/components/table/DataTable";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Button, cx, IconButton } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";
import type { Testimonial } from "@/lib/types";

type Row = Testimonial & { placement: string };
const h = columnsFor<Row>();

export default function StudioTestimonialsPage() {
  const { testimonials, deleteTestimonial, updateTestimonial } = useApp();
  const [modal, setModal] = useState<{ item?: Testimonial } | null>(null);
  const rows = useMemo<Row[]>(() => testimonials.map((t) => ({ ...t, placement: t.featured ? "Homepage" : "Testimonials page" })), [testimonials]);

  const columns = useMemo(
    () =>
      h.columns([
        h.accessor("name", {
          header: "Client",
          meta: { label: "Client" },
          cell: ({ row }) => (
            <span className="block min-w-40">
              <span className="block font-medium text-navy">{row.original.name}</span>
              <span className="block text-xs text-muted">{row.original.role}</span>
            </span>
          ),
        }),
        h.accessor("quote", {
          header: "Quote",
          meta: { label: "Quote" },
          enableSorting: false,
          cell: (c) => <span className="line-clamp-2 block max-w-xl text-ink/80">“{c.getValue()}”</span>,
        }),
        h.accessor("placement", {
          header: "Shown on",
          meta: { label: "Shown on", className: "w-40" },
          filterFn: facetFilter,
          cell: ({ row }) => (
            <button
              type="button"
              role="switch"
              aria-checked={row.original.featured}
              onClick={() => updateTestimonial(row.original.id, { featured: !row.original.featured })}
              className="inline-flex items-center gap-2 text-sm text-navy"
              title="Toggle homepage"
            >
              <span className={cx("relative h-5 w-9 rounded-full transition-colors", row.original.featured ? "bg-gold" : "bg-sand-2")}>
                <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", row.original.featured ? "left-[18px]" : "left-0.5")} />
              </span>
              {row.original.featured ? "Homepage" : "Page only"}
            </button>
          ),
        }),
        h.display({
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          meta: { className: "w-px whitespace-nowrap", align: "end" },
          cell: ({ row }) => (
            <span className="flex justify-end gap-1">
              <IconButton label="Edit" onClick={() => setModal({ item: row.original })}>
<Pencil className="h-4 w-4" />
</IconButton>
              <ConfirmButton onConfirm={() => deleteTestimonial(row.original.id)} confirmLabel="Delete" label="Delete" />
            </span>
          ),
        }),
      ]),
    [deleteTestimonial, updateTestimonial],
  );

  const featured = testimonials.filter((t) => t.featured).length;

  return (
    <>
      <PageHeader
        eyebrow="Reputation"
        title="Testimonials"
        description="Published on the public testimonials page. Featured ones also appear on the homepage (up to three)."
        actions={<AddButton onClick={() => setModal({})}>Add testimonial</AddButton>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="Published" value={testimonials.length} />
        <Stat label="On homepage" value={featured} hint={featured > 3 ? "Only the first three are shown" : undefined} />
        <Stat label="Page only" value={testimonials.length - featured} />
      </div>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        searchPlaceholder="Search name or quote…"
        facets={[{ column: "placement", label: "Shown on" }]}
        onRowClick={(r) => setModal({ item: r })}
        exportFileName="testimonials"
        emptyTitle="No testimonials yet"
        emptyAction={<AddButton onClick={() => setModal({})}>Add testimonial</AddButton>}
        bulkActions={(selected, clear) => (
          <>
            <Button
              size="sm"
              variant="light"
              onClick={() => {
                selected.forEach((t) => updateTestimonial(t.id, { featured: true }));
                clear();
              }}
            >
              Feature
            </Button>
            <Button
              size="sm"
              variant="light"
              onClick={() => {
                selected.forEach((t) => updateTestimonial(t.id, { featured: false }));
                clear();
              }}
            >
              Unfeature
            </Button>
            <ConfirmButton
              tone="light" size="sm"
              confirmLabel={`Delete ${selected.length}`}
              onConfirm={() => {
                selected.forEach((t) => deleteTestimonial(t.id));
                clear();
              }} label="Delete" />
          </>
        )}
      />
      <TestimonialModal open={modal !== null} onClose={() => setModal(null)} item={modal?.item} />
    </>
  );
}
