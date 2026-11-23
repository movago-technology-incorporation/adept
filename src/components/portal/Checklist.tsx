"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Check, ChevronLeft, ChevronRight, ListChecks, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  addChecklistItem,
  addStarterChecklist,
  getChecklist,
  removeChecklistItem,
  setChecklistDone,
  type ChecklistRow,
} from "@/app/portal-actions";
import { Button, Input, cx } from "@/components/ui/kit";

const shift = (month: string, by: number) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
};
const label = (month: string) => new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-CA", { month: "long", year: "numeric", timeZone: "UTC" });

/**
 * Monthly checklist. Clients tick items off each month; staff (`manage`) also add and remove items.
 * `clientId` is required for staff and ignored for clients (the server uses the signed-in client).
 */
export function Checklist({ clientId, manage = false }: { clientId?: string; manage?: boolean }) {
  const [month, setMonth] = useState<string | null>(null);
  const [items, setItems] = useState<ChecklistRow[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const load = useCallback(
    async (m?: string) => {
      try {
        const res = await getChecklist(clientId, m);
        setMonth(res.month);
        setItems(res.items);
      } catch {
        setError("Couldn’t load the checklist.");
      }
    },
    [clientId],
  );

  useEffect(() => {
    let live = true;
    getChecklist(clientId)
      .then((res) => {
        if (!live) return;
        setMonth(res.month);
        setItems(res.items);
      })
      .catch(() => live && setError("Couldn’t load the checklist."));
    return () => {
      live = false;
    };
  }, [clientId]);

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      setError("");
      try {
        await fn();
        await load(month ?? undefined);
      } catch {
        setError("That didn’t save. Please try again.");
      }
    });

  const toggle = (item: ChecklistRow) => {
    setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)) ?? prev);
    run(() => setChecklistDone(item.id, !item.done, month ?? undefined, clientId));
  };

  if (!items || !month) return <div className="h-40 animate-pulse rounded-2xl bg-sand/60" aria-busy="true" />;

  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className={cx("grid gap-4", pending && "opacity-80")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-full bg-sand p-1">
          <button type="button" aria-label="Previous month" onClick={() => void load(shift(month, -1))} className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-navy hover:bg-white">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-36 text-center text-sm font-semibold text-navy">{label(month)}</span>
          <button type="button" aria-label="Next month" onClick={() => void load(shift(month, 1))} className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-navy hover:bg-white">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {items.length ? (
          <span className="text-sm text-muted">
            {done} of {items.length} done
          </span>
        ) : null}
      </div>

      {items.length ? (
        <div className="h-2 overflow-hidden rounded-full bg-sand">
          <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl bg-paper px-6 py-10 text-center">
          <ListChecks className="h-6 w-6 text-gold" />
          <p className="font-medium text-navy">No checklist yet</p>
          <p className="max-w-sm text-sm text-muted">
            {manage ? "Add the things this client should send or do every month." : "Adept will set up the things to send each month here."}
          </p>
          {manage && clientId ? (
            <Button size="sm" variant="soft" className="mt-2" onClick={() => run(() => addStarterChecklist(clientId))}>
              <Sparkles className="h-4 w-4" /> Add business starter list
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li key={item.id} className={cx("flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors", item.done ? "bg-success-soft" : "bg-paper")}>
              <button
                type="button"
                role="checkbox"
                aria-checked={item.done}
                aria-label={item.title}
                onClick={() => toggle(item)}
                className={cx(
                  "grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-lg transition-colors",
                  item.done ? "bg-success text-white" : "bg-white text-transparent hover:text-muted",
                )}
              >
                <Check className="h-4 w-4" />
              </button>
              <span className="min-w-0 flex-1">
                <span className={cx("block font-medium", item.done ? "text-navy/70" : "text-navy")}>{item.title}</span>
                {item.done && item.doneAt ? (
                  <span className="block text-xs text-muted">
                    Done {new Date(item.doneAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                    {item.doneBy === "adept" ? " · marked by Adept" : ""}
                  </span>
                ) : null}
              </span>
              {manage ? (
                <button
                  type="button"
                  aria-label={`Remove ${item.title}`}
                  onClick={() => run(() => removeChecklistItem(item.id))}
                  className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {manage && clientId ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = draft.trim();
            if (!t) return;
            setDraft("");
            run(() => addChecklistItem(clientId, t));
          }}
        >
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a monthly item, e.g. Upload bank statements" aria-label="New checklist item" className="py-2" />
          <Button type="submit" size="sm" disabled={!draft.trim()}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
