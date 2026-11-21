"use client";

import { useState } from "react";
import { Scheduler, describePick, type Pick } from "@/components/booking/Scheduler";
import { TOPICS } from "@/components/booking/BookingFlow";
import { Modal, ModalActions, SelectField, formData } from "@/components/studio/Modal";
import { Alert } from "@/components/ui/kit";
import { useClientWorkspace } from "@/store/app-store";

export function ClientMeetingModal({ open, onClose }: { open: boolean; onClose: () => void; defaultDate?: string }) {
  const { client, bookMeeting } = useClientWorkspace();
  const [pick, setPick] = useState<Pick | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setPick(null);
    setError(null);
    onClose();
  }

  return (
    <Modal open={open} title="Book an appointment" description={`We’ll send the video link to ${client?.email ?? "your email"}.`} onClose={close} size="lg">
      <form
        className="grid gap-6"
        onSubmit={async (e) => {
          const data = formData(e);
          if (!pick) return setError("Choose a time first.");
          setSaving(true);
          setError(null);
          const result = await bookMeeting({
            eventTypeId: pick.eventTypeId,
            start: pick.start,
            timeZone: pick.timeZone,
            topic: String(data.get("topic")),
          });
          setSaving(false);
          if (!result.ok) return setError(result.error);
          close();
        }}
      >
        <SelectField
          label="What’s it about?"
          name="topic"
          defaultValue="Books review"
          options={["Books review", ...TOPICS].map((v) => ({ value: v, label: v }))}
        />
        <Scheduler value={pick} onChange={setPick} />
        {pick ? <p className="rounded-2xl bg-sand px-4 py-3 text-sm text-navy">{describePick(pick)}</p> : null}
        {error ? <Alert>{error}</Alert> : null}
        <ModalActions onClose={close} submitLabel="Book appointment" loading={saving} disabled={!pick} />
      </form>
    </Modal>
  );
}
