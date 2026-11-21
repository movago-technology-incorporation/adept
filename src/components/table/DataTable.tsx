"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type RowData,
} from "@tanstack/react-table";
import { Button, EmptyState, cx } from "@/components/ui/kit";

// ── Shared feature registry (module scope = stable) ───────────────────

export type ColMeta = {
  /** Human label for the column chooser and CSV header. */
  label?: string;
  align?: "start" | "end";
  /** Plain-text value for CSV export (defaults to the cell value). */
  exportValue?: (row: unknown) => string;
  /** Cell classes, e.g. width or nowrap. */
  className?: string;
};

export const tableFx = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  columnFacetingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, datetime: sortFn_datetime, basic: sortFn_basic },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  columnVisibilityFeature,
  columnMeta: metaHelper<ColMeta>(),
});

export type Fx = typeof tableFx;
export const columnsFor = <T extends RowData>() => createColumnHelper<Fx, T>();

/** Multi-select facet filter: passes when no values are chosen or the row value is one of them. */
export const facetFilter = (row: { getValue: (id: string) => unknown }, columnId: string, value: unknown) => {
  const chosen = value as string[] | undefined;
  return !chosen?.length || chosen.includes(String(row.getValue(columnId) ?? ""));
};

// ── Component ─────────────────────────────────────────────────────────

type Facet = { column: string; label: string };

export function DataTable<T extends RowData>({
  data,
  columns,
  getRowId,
  searchPlaceholder = "Search…",
  facets = [],
  toolbar,
  bulkActions,
  onRowClick,
  exportFileName,
  emptyTitle = "Nothing here yet",
  emptyBody,
  emptyAction,
  initialSorting = [],
  initialHidden = {},
  pageSize = 25,
}: {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: any[];
  getRowId: (row: T) => string;
  searchPlaceholder?: string;
  facets?: Facet[];
  toolbar?: ReactNode;
  bulkActions?: (rows: T[], clear: () => void) => ReactNode;
  onRowClick?: (row: T) => void;
  exportFileName?: string;
  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: ReactNode;
  initialSorting?: { id: string; desc: boolean }[];
  initialHidden?: Record<string, boolean>;
  pageSize?: number;
}) {
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  const allColumns = useMemo(() => {
    if (!bulkActions) return columns;
    const h = createColumnHelper<Fx, T>();
    const select = h.display({
      id: "__select",
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          label="Select all on this page"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => <Checkbox label="Select row" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      meta: { className: "w-12" },
    });
    return [select, ...columns];
  }, [columns, bulkActions]);

  const table = useTable({
    features: tableFx,
    columns: allColumns,
    data,
    getRowId: (row: T) => getRowId(row),
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (column) => !column.id.startsWith("__") && column.id !== "actions",
    initialState: {
      sorting: initialSorting,
      columnVisibility: initialHidden,
      pagination: { pageIndex: 0, pageSize },
    },
  });

  const state = table.state;
  const filtered = table.getFilteredRowModel().rows;
  const rows = table.getRowModel().rows;
  const selected = table.getSelectedRowModel().rows.map((r) => r.original as T);
  const total = data.length;
  const { pageIndex, pageSize: size } = state.pagination;
  const from = filtered.length ? pageIndex * size + 1 : 0;
  const to = Math.min(filtered.length, (pageIndex + 1) * size);
  const activeFilters = state.columnFilters.length + (state.globalFilter ? 1 : 0);
  const pad = density === "compact" ? "py-2" : "py-3.5";

  // Drop selections for rows that no longer exist (e.g. after delete).
  const ids = useMemo(() => new Set(data.map(getRowId)), [data, getRowId]);
  useEffect(() => {
    const stale = Object.keys(table.state.rowSelection).filter((id) => !ids.has(id));
    if (stale.length) {
      table.setRowSelection((old) => {
        const next = { ...old };
        for (const id of stale) delete next[id];
        return next;
      });
    }
  }, [ids, table]);

  function exportCsv() {
    const cols = table.getAllLeafColumns().filter((c) => c.getIsVisible() && !c.id.startsWith("__") && c.id !== "actions");
    const head = cols.map((c) => c.columnDef.meta?.label ?? c.id);
    const body = table.getFilteredRowModel().rows.map((r) =>
      cols.map((c) => {
        const meta = c.columnDef.meta;
        const v = meta?.exportValue ? meta.exportValue(r.original) : r.getValue(c.id);
        return v === undefined || v === null ? "" : String(v);
      }),
    );
    const csv = [head, ...body].map((line) => line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName ?? "export"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-w-0 rounded-3xl bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5">
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          <span className="sr-only">Search</span>
          <svg viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" fill="none" aria-hidden>
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={String(state.globalFilter ?? "")}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-full bg-paper pr-4 pl-10 text-sm text-navy outline-none placeholder:text-muted/70 focus:bg-gold-soft/40"
          />
        </label>

        {facets.map((f) => {
          const column = table.getColumn(f.column);
          if (!column) return null;
          return <FacetFilter key={f.column} label={f.label} column={column} />;
        })}

        {activeFilters ? (
          <button
            type="button"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
            className="h-10 rounded-full px-3 text-sm text-gold-deep hover:bg-paper"
          >
            Clear filters
          </button>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Popover
            label={
              <>
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                View
              </>
            }
          >
            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-white/40 uppercase">Density</p>
            <div className="mx-2 mb-2 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1">
              {(["comfortable", "compact"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d)}
                  className={cx("rounded-lg py-1.5 text-xs capitalize", density === d ? "bg-white/15 text-white" : "text-white/60 hover:text-white")}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-white/40 uppercase">Columns</p>
            {table
              .getAllLeafColumns()
              .filter((c) => c.getCanHide() && !c.id.startsWith("__"))
              .map((c) => (
                <label key={c.id} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/8">
                  <input type="checkbox" className="h-4 w-4 accent-[#b8914a]" checked={c.getIsVisible()} onChange={(e) => c.toggleVisibility(e.target.checked)} />
                  {c.columnDef.meta?.label ?? c.id}
                </label>
              ))}
          </Popover>
          {exportFileName ? (
            <button type="button" onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-full bg-paper px-4 text-sm text-navy hover:bg-sand">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
                <path d="M10 3v9m0 0-3.5-3.5M10 12l3.5-3.5M4 16h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export
            </button>
          ) : null}
          {toolbar}
        </div>
      </div>

      {/* Bulk action bar */}
      {bulkActions && selected.length ? (
        <div className="mx-4 mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-navy px-4 py-2.5 text-sm text-white sm:mx-5">
          <span className="font-medium">{selected.length} selected</span>
          <span className="mx-1 h-4 w-px bg-white/20" aria-hidden />
          <div className="flex flex-wrap gap-1.5">{bulkActions(selected, () => table.resetRowSelection())}</div>
          <button type="button" onClick={() => table.resetRowSelection()} className="ml-auto text-white/60 hover:text-white">
            Clear
          </button>
        </div>
      ) : null}

      {/* Table */}
      {total === 0 ? (
        <div className="px-4 pb-5 sm:px-5">
          <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-4 pb-5 sm:px-5">
          <EmptyState
            title="No results"
            body="Try a different search or clear your filters."
            action={
              <Button
                size="sm"
                variant="soft"
                onClick={() => {
                  table.resetColumnFilters();
                  table.setGlobalFilter("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto px-2 sm:px-3">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => {
                    const meta = header.column.columnDef.meta;
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                        className={cx(
                          "sticky top-0 z-10 bg-white px-3 py-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-muted uppercase",
                          meta?.align === "end" && "text-right",
                          meta?.className,
                        )}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className={cx("inline-flex items-center gap-1.5 uppercase hover:text-navy", sorted && "text-navy")}
                          >
                            <table.FlexRender header={header} />
                            <SortIcon dir={sorted} />
                          </button>
                        ) : (
                          <table.FlexRender header={header} />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isSelected = row.getIsSelected();
                return (
                  <tr
                    key={row.id}
                    onClick={(e) => {
                      if (!onRowClick) return;
                      if ((e.target as HTMLElement).closest("button, a, input, label, [role='button'], [role='listbox']")) return;
                      onRowClick(row.original as T);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && onRowClick?.(row.original as T)}
                    tabIndex={onRowClick ? 0 : undefined}
                    className={cx(
                      "group transition-colors",
                      onRowClick && "cursor-pointer",
                      isSelected ? "bg-gold-soft/45" : i % 2 === 1 ? "bg-paper/70 hover:bg-sand" : "hover:bg-sand",
                    )}
                  >
                    {row.getVisibleCells().map((cell, ci, all) => {
                      const meta = cell.column.columnDef.meta;
                      return (
                        <td
                          key={cell.id}
                          className={cx(
                            "px-3 align-middle text-ink",
                            pad,
                            ci === 0 && "rounded-l-2xl",
                            ci === all.length - 1 && "rounded-r-2xl",
                            meta?.align === "end" && "text-right",
                            meta?.className,
                          )}
                        >
                          <table.FlexRender cell={cell} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer / pagination */}
      {filtered.length ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-b-3xl bg-paper px-4 py-3 text-sm text-muted sm:px-5">
          <span>
            {from}–{to} of {filtered.length}
            {filtered.length !== total ? <span className="text-muted/70"> (filtered from {total})</span> : null}
          </span>
          <div className="flex items-center gap-3">
            <label className="hidden items-center gap-2 sm:flex">
              Rows
              <select
                value={size}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="h-8 rounded-full bg-white px-3 text-navy outline-none"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <PageBtn label="First page" disabled={!table.getCanPreviousPage()} onClick={() => table.firstPage()}>
                «
              </PageBtn>
              <PageBtn label="Previous page" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
                ‹
              </PageBtn>
              <span className="px-2 text-navy">
                {pageIndex + 1} / {Math.max(1, table.getPageCount())}
              </span>
              <PageBtn label="Next page" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
                ›
              </PageBtn>
              <PageBtn label="Last page" disabled={!table.getCanNextPage()} onClick={() => table.lastPage()}>
                »
              </PageBtn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Pieces ─────────────────────────────────────────────────────────────

function Checkbox({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate?: boolean; onChange: (e: unknown) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate && !checked);
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 cursor-pointer accent-[#0b1a2e]"
    />
  );
}

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  return (
    <svg viewBox="0 0 12 12" className={cx("h-3 w-3", dir ? "text-gold-deep" : "opacity-30")} fill="currentColor" aria-hidden>
      <path d="M6 1.5 9 5H3l3-3.5Z" opacity={dir === "desc" ? 0.25 : 1} />
      <path d="M6 10.5 3 7h6l-3 3.5Z" opacity={dir === "asc" ? 0.25 : 1} />
    </svg>
  );
}

function PageBtn({ children, onClick, disabled, label }: { children: ReactNode; onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-full bg-white text-navy hover:bg-sand disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Popover({ label, children, active }: { label: ReactNode; children: ReactNode; active?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm transition-colors",
          active ? "bg-navy text-white" : "bg-paper text-navy hover:bg-sand",
        )}
      >
        {label}
      </button>
      {open ? <div className="absolute top-12 right-0 z-40 max-h-80 w-64 overflow-y-auto rounded-2xl bg-navy p-1.5 text-white">{children}</div> : null}
    </div>
  );
}

function FacetFilter({
  label,
  column,
}: {
  label: string;
  column: {
    getFacetedUniqueValues: () => Map<unknown, number>;
    getFilterValue: () => unknown;
    setFilterValue: (v: unknown) => void;
  };
}) {
  const values = [...column.getFacetedUniqueValues().entries()]
    .filter(([v]) => v !== undefined && v !== null && v !== "")
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const chosen = (column.getFilterValue() as string[] | undefined) ?? [];
  const toggle = (v: string) => {
    const next = chosen.includes(v) ? chosen.filter((x) => x !== v) : [...chosen, v];
    column.setFilterValue(next.length ? next : undefined);
  };
  return (
    <Popover
      active={chosen.length > 0}
      label={
        <>
          {label}
          {chosen.length ? <span className="rounded-full bg-gold px-1.5 text-[11px] font-semibold text-navy">{chosen.length}</span> : null}
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 opacity-60" fill="none" aria-hidden>
            <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
      }
    >
      {values.length === 0 ? <p className="px-3 py-2 text-sm text-white/60">No values</p> : null}
      {values.map(([v, n]) => (
        <label key={String(v)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/85 capitalize hover:bg-white/8">
          <input type="checkbox" className="h-4 w-4 accent-[#b8914a]" checked={chosen.includes(String(v))} onChange={() => toggle(String(v))} />
          <span className="flex-1 truncate">{String(v)}</span>
          <span className="text-xs text-white/40">{n}</span>
        </label>
      ))}
      {chosen.length ? (
        <button type="button" onClick={() => column.setFilterValue(undefined)} className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-gold-soft hover:bg-white/8">
          Clear {label.toLowerCase()}
        </button>
      ) : null}
    </Popover>
  );
}
