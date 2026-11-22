"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, CircleDot, ListTodo, MailCheck, PencilLine, Undo2 } from "lucide-react";
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
  const [emailed, setEmailed] = useState(false);

  const set = (next: TaxReturnStatus) =>
    start(async () => {
      setCurrent(next);
      setConfirmReopen(false);
      const res = await setTaxReturnStatus(id, next);
      setEmailed(res.emailed);
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
      {emailed ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm text-gold-soft">
          <MailCheck className="h-4 w-4" /> Client emailed with a review link
        </span>
      ) : null}
      {current === "done" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => set("in_progress")}
          title="Move back to In progress so staff can make changes, then mark Done again. The client isn’t emailed again."
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm text-white hover:bg-white/20"
        >
          <PencilLine className="h-4 w-4" /> Reopen for staff
        </button>
      ) : null}
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
