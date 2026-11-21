"use client";

import { useApp } from "@/store/app-store";
import { Field, Modal, ModalActions, SelectField, formData } from "@/components/studio/Modal";

export function JobModal({ open, onClose, clientId }: { open: boolean; onClose: () => void; clientId?: string }) {
  const { clients, addJob } = useApp();

  return (
    <Modal open={open} title="Add a job" description="Track delivery work for a client." onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          const data = formData(e);
          addJob({
            id: `job_${Date.now()}`,
            clientId: clientId ?? String(data.get("clientId")),
            title: String(data.get("title")),
            status: String(data.get("status")) as "queued" | "in progress",
            reviewStatus: "idle",
            reminders: 0,
          });
          onClose();
        }}
      >
        {clientId ? null : (
          <SelectField
            label="Client"
            name="clientId"
            defaultValue={clients[0]?.id}
            options={clients.map((c) => ({ value: c.id, label: c.company || c.name }))}
          />
        )}
        <Field label="Job" name="title" defaultValue="Monthly books" />
        <SelectField
          label="Status"
          name="status"
          defaultValue="queued"
          options={[
            { value: "queued", label: "Queued" },
            { value: "in progress", label: "In progress" },
          ]}
        />
        <ModalActions onClose={onClose} submitLabel="Add job" disabled={!clientId && clients.length === 0} />
      </form>
    </Modal>
  );
}
