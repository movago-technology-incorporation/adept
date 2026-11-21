"use client";

import { useState } from "react";
import { useApp } from "@/store/app-store";
import { Field, Modal, ModalActions, SelectField, formData } from "@/components/studio/Modal";
import { Alert } from "@/components/ui/kit";
import type { Client } from "@/lib/types";

const TYPES: Client["type"][] = ["Individual", "Sole proprietor", "Corporation"];

/** Create a client folder, or edit one when `item` is passed. */
export function ClientModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: Client }) {
  const { addClient, updateClient } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function close() {
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      title={item ? "Edit client" : "Add a client"}
      description={item ? undefined : "When they sign up at /login with this email, their portal opens straight onto this folder."}
      onClose={close}
    >
      <form
        key={item?.id ?? "new"}
        className="grid gap-4"
        onSubmit={async (e) => {
          const data = formData(e);
          const fields = {
            name: String(data.get("name")),
            company: String(data.get("company") || ""),
            email: String(data.get("email")),
            phone: String(data.get("phone") || ""),
            type: String(data.get("type")) as Client["type"],
          };
          if (item) {
            updateClient(item.id, fields);
            return close();
          }
          setSaving(true);
          const result = await addClient({ id: `cli_${Date.now()}`, since: new Date().toISOString().slice(0, 10), ...fields });
          setSaving(false);
          if (!result.ok) return setError(result.error);
          close();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact name" name="name" defaultValue={item?.name} />
          <Field label="Business name" name="company" required={false} defaultValue={item?.company} />
          <Field label="Email" name="email" type="email" defaultValue={item?.email} />
          <Field label="Phone" name="phone" type="tel" required={false} defaultValue={item?.phone} />
        </div>
        <SelectField label="Client type" name="type" defaultValue={item?.type ?? "Individual"} options={TYPES.map((v) => ({ value: v, label: v }))} />
        {error ? <Alert>{error}</Alert> : null}
        <ModalActions onClose={close} submitLabel={item ? "Save changes" : "Add client"} loading={saving} />
      </form>
    </Modal>
  );
}
