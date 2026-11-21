"use client";

import { FormEvent, useEffect, type ReactNode } from "react";
import { Dropdown, dateOptions, timeOptions, type DropdownOption } from "@/components/ui/Dropdown";
import { Button, Input, Label, Textarea, cx } from "@/components/ui/kit";

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  size = "md",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-navy/60" aria-label="Close" onClick={onClose} />
      <div
        className={cx(
          "relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl sm:p-8",
          size === "lg" ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="serif text-3xl font-semibold text-navy">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand text-navy hover:bg-sand-2"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required = true,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  if (type === "date") {
    return (
      <Label label={label}>
        <Dropdown name={name} options={dateOptions()} defaultValue={defaultValue} />
      </Label>
    );
  }
  if (type === "time") {
    return (
      <Label label={label}>
        <Dropdown name={name} options={timeOptions()} defaultValue={defaultValue} />
      </Label>
    );
  }
  if (type === "datetime-local") {
    const [date, time = "09:00"] = (defaultValue || "").split("T");
    return (
      <Label label={label}>
        <div className="grid grid-cols-2 gap-2">
          <Dropdown name={`${name}Date`} options={dateOptions()} defaultValue={date} ariaLabel={`${label} date`} />
          <Dropdown name={`${name}Time`} options={timeOptions()} defaultValue={time} ariaLabel={`${label} time`} />
        </div>
      </Label>
    );
  }
  if (type === "textarea") {
    return (
      <Label label={label}>
        <Textarea name={name} required={required} defaultValue={defaultValue} placeholder={placeholder} rows={4} />
      </Label>
    );
  }
  return (
    <Label label={label}>
      <Input name={name} type={type} required={required} defaultValue={defaultValue} placeholder={placeholder} />
    </Label>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: DropdownOption[];
  defaultValue?: string;
}) {
  return (
    <Label label={label}>
      <Dropdown name={name} options={options} defaultValue={defaultValue} />
    </Label>
  );
}

export function ModalActions({
  onClose,
  submitLabel = "Save",
  loading,
  disabled,
}: {
  onClose: () => void;
  submitLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" loading={loading} disabled={disabled}>
        {submitLabel}
      </Button>
    </div>
  );
}

export function formData(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  return new FormData(e.currentTarget);
}

export function AddButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "soft" | "gold";
}) {
  return (
    <Button size="sm" variant={variant} onClick={onClick}>
      {variant === "primary" ? (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ) : null}
      {children}
    </Button>
  );
}
