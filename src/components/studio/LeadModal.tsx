"use client";

import { useApp } from "@/store/app-store";
import { Field, Modal, ModalActions, SelectField, formData } from "@/components/studio/Modal";
import type { Lead, LeadStatus } from "@/lib/types";

const INTERESTS = ["Bookkeeping", "Tax", "Payroll", "Catch-up books", "GST/HST", "Consultation"];
const STATUSES: LeadStatus[] = ["new", "engaged", "consult booked", "proposal sent", "won", "lost"];

/** Create a lead, or edit one when `item` is passed. */
export function LeadModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: Lead }) {
  const { addLead, updateLead } = useApp();
  const interests = item?.interest && !INTERESTS.includes(item.interest) ? [item.interest, ...INTERESTS] : INTERESTS;

  return (
    <Modal open={open} title={item ? "Edit lead" : "Add a lead"} onClose={onClose}>
      <form
        key={item?.id ?? "new"}
        className="grid gap-4"
        onSubmit={(e) => {
          const data = formData(e);
          const fields = {
            name: String(data.get("name")),
            email: String(data.get("email")),
            phone: String(data.get("phone") || ""),
            company: String(data.get("company") || ""),
            interest: String(data.get("interest")),
          };
          if (item) {
            updateLead(item.id, { ...fields, status: String(data.get("status")) as LeadStatus });
          } else {
            addLead({
              id: `lead_${Date.now()}`,
              ...fields,
              source: String(data.get("source")),
              status: "new",
              lastClick: "",
              page: "/studio",
              utm: "manual",
              notes: String(data.get("notes") || ""),
              createdAt: new Date().toISOString().slice(0, 10),
            });
          }
          onClose();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" defaultValue={item?.name} />
          <Field label="Email" name="email" type="email" defaultValue={item?.email} />
          <Field label="Phone" name="phone" type="tel" required={false} defaultValue={item?.phone} />
          <Field label="Company" name="company" required={false} defaultValue={item?.company} />
          <SelectField label="Interest" name="interest" defaultValue={item?.interest || "Bookkeeping"} options={interests.map((v) => ({ value: v, label: v }))} />
          {item ? (
            <SelectField label="Status" name="status" defaultValue={item.status} options={STATUSES.map((v) => ({ value: v, label: v }))} />
          ) : (
            <SelectField
              label="Source"
              name="source"
              defaultValue="Referral"
              options={["Referral", "Website", "Instagram", "Walk-in", "Phone", "Manual"].map((v) => ({ value: v, label: v }))}
            />
          )}
        </div>
        {item ? null : <Field label="Notes" name="notes" type="textarea" required={false} />}
        <ModalActions onClose={onClose} submitLabel={item ? "Save changes" : "Add lead"} />
      </form>
    </Modal>
  );
}
