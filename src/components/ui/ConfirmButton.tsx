"use client";

import { useState, type ReactNode } from "react";
import { IconButton } from "@/components/ui/kit";
import { Check, Trash2, X } from "lucide-react";

/**
 * Two-step destructive icon action: first click arms it (turns red), second confirms.
 * Defaults to a trash icon labelled "Delete".
 */
export function ConfirmButton({
  onConfirm,
  label = "Delete",
  confirmLabel,
  icon,
  tone = "neutral",
  size = "md",
}: {
  onConfirm: () => void;
  label?: string;
  confirmLabel?: string;
  icon?: ReactNode;
  tone?: "neutral" | "light";
  size?: "sm" | "md";
}) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <IconButton label={label} tone={tone} size={size} onClick={() => setArmed(true)}>
        {icon ?? <Trash2 className="h-4 w-4" />}
      </IconButton>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5">
      <IconButton
        label={confirmLabel ?? `Confirm ${label.toLowerCase()}`}
        tone="danger"
        size={size}
        autoFocus
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
      >
        <Check className="h-4 w-4" />
      </IconButton>
      <IconButton label="Cancel" tone={tone} size={size} onClick={() => setArmed(false)}>
        <X className="h-4 w-4" />
      </IconButton>
    </span>
  );
}
