"use client";

import { Field, Modal, ModalActions, formData } from "@/components/studio/Modal";
import { useClientWorkspace } from "@/store/app-store";

export function ClientMessageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addMessage } = useClientWorkspace();

  return (
    <Modal open={open} title="Message Adept" onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          const data = formData(e);
          addMessage(String(data.get("body")), "client");
          onClose();
        }}
      >
        <Field label="Message" name="body" type="textarea" placeholder="Ask about a filing, a receipt or an appointment" />
        <ModalActions onClose={onClose} submitLabel="Send message" />
      </form>
    </Modal>
  );
}
