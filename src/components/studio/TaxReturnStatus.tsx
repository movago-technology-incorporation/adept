"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, CircleDot, ListTodo, Undo2 } from "lucide-react";
import { setTaxReturnStatus } from "@/app/actions";
import { cx } from "@/components/ui/kit";
import type { TaxReturnStatus } from "@/lib/tax-return-server";

const OPTIONS = [
  { value: "submitted", label: "Todo", icon: ListTodo },
  { value: "in_progress", label: "In progress", icon: CircleDot },
  { value: "done", label: "Done", icon: CheckCircle2 },
] as const;

/** Staff workflow tags from the PDF (Todo / In Progress / Done), plus reopening for the client. */
export function TaxReturnStatusControl({ id, status }: { id: string; status: TaxReturnStatus }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [pending, start] = useTransition();
  const [confirmReopen, setConfirmReopen] = useState(false);

  const set = (next: TaxReturnStatus) =>
    start(async () => {
      setCurrent(next);
      await setTaxReturnStatus(id, next);
      router.refresh();
    });

  return (
    <div className={cx("flex flex-wrap items-center gap-2", pending && "opacity-70")}>
      <div className="flex gap-1 rounded-full bg-white/10 p-1">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            disabled={pending || current === "draft"}
            onClick={() => set(value)}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors disabled:opacity-50",
              current === value ? "bg-gold text-navy" : "text-white/75 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      {current !== "draft" ? (
        confirmReopen ? (
          <button type="button" onClick={() => set("draft")} className="inline-flex items-center gap-1.5 rounded-full bg-danger px-3.5 py-1.5 text-sm text-white">
            <Undo2 className="h-4 w-4" /> Confirm: reopen for client
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmReopen(true)} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white">
            <Undo2 className="h-4 w-4" /> Reopen for client
          </button>
        )
      ) : (
        <span className="text-sm text-white/60">The client is still filling this in.</span>
      )}
    </div>
  );
}
