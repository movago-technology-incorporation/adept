"use client";

import { useState } from "react";
import { Scheduler, describePick, type Pick } from "@/components/booking/Scheduler";
import { TOPICS } from "@/components/booking/BookingFlow";
import { Modal, ModalActions, SelectField, formData } from "@/components/studio/Modal";
import { Alert } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";

/** Staff book a Cal.com meeting with a lead or client; Cal.com emails them the invite. */
export function MeetingModal({
  open,
  onClose,
  leadId,
  clientId,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  leadId?: string;
  clientId?: string;
}) {
  const { leads, clients, bookMeeting } = useApp();
  const [pick, setPick] = useState<Pick | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fixed = leadId ? `lead:${leadId}` : clientId ? `client:${clientId}` : undefined;
  const options = [
    ...clients.map((c) => ({ value: `client:${c.id}`, label: `Client · ${c.company || c.name}` })),
    ...leads.filter((l) => l.status !== "won" && l.status !== "lost").map((l) => ({ value: `lead:${l.id}`, label: `Lead · ${l.name}` })),
  ];

  function close() {
    setPick(null);
    setError(null);
    onClose();
  }

  return (
    <Modal open={open} title="Schedule a meeting" description="Booked on Adept’s Cal.com calendar — the invite and video link go out automatically." onClose={close} size="lg">
      <form
        className="grid gap-6"
        onSubmit={async (e) => {
          const data = formData(e);
          if (!pick) return setError("Choose a time first.");
          const [kind, id] = String(fixed ?? data.get("who")).split(":");
          setSaving(true);
          setError(null);
          const result = await bookMeeting({
            eventTypeId: pick.eventTypeId,
            start: pick.start,
            timeZone: pick.timeZone,
            topic: String(data.get("topic")),
            ...(kind === "client" ? { clientId: id } : { leadId: id }),
          });
          setSaving(false);
          if (!result.ok) return setError(result.error);
          close();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {fixed ? null : <SelectField label="With" name="who" defaultValue={options[0]?.value} options={options} />}
          <SelectField label="Topic" name="topic" defaultValue={TOPICS[0]} options={[...TOPICS, "Working session", "Year-end review"].map((v) => ({ value: v, label: v }))} />
        </div>
        <Scheduler value={pick} onChange={setPick} />
        {pick ? <p className="rounded-2xl bg-sand px-4 py-3 text-sm text-navy">{describePick(pick)}</p> : null}
        {error ? <Alert>{error}</Alert> : null}
        <ModalActions onClose={close} submitLabel="Book meeting" loading={saving} disabled={!pick || options.length === 0} />
      </form>
    </Modal>
  );
}
