"use client";

import { useApp } from "@/store/app-store";
import { todayIso } from "@/components/ui/Dropdown";
import { Field, Modal, ModalActions, SelectField, formData } from "@/components/studio/Modal";
import type { FollowUp } from "@/lib/types";

function defaultWhen() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const mins = d.getMinutes() < 30 ? "30" : "00";
  if (mins === "00") d.setHours(d.getHours() + 1);
  const h = String(Math.min(Math.max(d.getHours(), 8), 18)).padStart(2, "0");
  return `${todayIso()}T${h}:${mins}`;
}

/** Schedule an email follow-up, or edit one when `item` is passed. Times are Calgary local. */
export function FollowUpModal({ open, onClose, leadId, item }: { open: boolean; onClose: () => void; leadId?: string; item?: FollowUp }) {
  const { leads, addFollowUp, updateFollowUp } = useApp();
  const options = leads.filter((l) => l.status !== "won" && l.status !== "lost").map((l) => ({ value: l.id, label: `${l.name} · ${l.email}` }));
  const fixedLead = item?.leadId ?? leadId;
  const lead = leads.find((l) => l.id === fixedLead);

  return (
    <Modal
      open={open}
      title={item ? "Edit follow-up" : "Schedule a follow-up"}
      description={lead ? `Emailed to ${lead.name} (${lead.email}) at the time you choose.` : "Emailed automatically at the time you choose (Calgary time)."}
      onClose={onClose}
      size="lg"
    >
      <form
        key={item?.id ?? "new"}
        className="grid gap-4"
        onSubmit={(e) => {
          const data = formData(e);
          const fields = {
            leadId: fixedLead ?? String(data.get("leadId")),
            channel: "email" as const,
            subject: String(data.get("subject")),
            body: String(data.get("body")),
            scheduledFor: `${data.get("whenDate")} ${data.get("whenTime")}`,
          };
          if (item) updateFollowUp(item.id, fields);
          else addFollowUp({ id: `fu_${Date.now()}`, ...fields, status: "queued" });
          onClose();
        }}
      >
        {fixedLead ? null : <SelectField label="Lead" name="leadId" defaultValue={options[0]?.value} options={options} />}
        <Field label="Subject" name="subject" defaultValue={item?.subject ?? "Following up from Adept"} />
        <Field
          label="Message"
          name="body"
          type="textarea"
          defaultValue={item?.body ?? ""}
          placeholder={"Thanks for your interest in Adept…\n\nThe greeting (“Hi Name,”) and signature are added automatically."}
        />
        <Field
          label="Send at (Calgary time)"
          name="when"
          type="datetime-local"
          defaultValue={item ? item.scheduledFor.replace(" ", "T") : defaultWhen()}
        />
        <ModalActions onClose={onClose} submitLabel={item ? "Save changes" : "Schedule email"} disabled={!item && !fixedLead && options.length === 0} />
      </form>
    </Modal>
  );
}
