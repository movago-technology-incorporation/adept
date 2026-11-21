"use client";

import { Modal } from "@/components/studio/Modal";
import { Uploader } from "@/components/portal/Uploader";
import { Button } from "@/components/ui/kit";

export function ClientUploadModal({
  open,
  onClose,
  kind,
  category,
  title,
}: {
  open: boolean;
  onClose: () => void;
  kind: "upload" | "receipt";
  category: string;
  title: string;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <Uploader kind={kind} category={category} />
      <p className="mt-4 text-sm text-muted">Files go straight to your private folder at Adept.</p>
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
