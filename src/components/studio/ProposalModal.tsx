"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/store/app-store";
import { Field, Modal, ModalActions, SelectField, formData } from "@/components/studio/Modal";
import type { Proposal, ProposalStatus } from "@/lib/types";

const STATUSES: ProposalStatus[] = ["draft", "sent", "viewed", "changes requested", "accepted", "signed", "declined"];

/** Create a proposal, or edit one when `item` is passed. */
export function ProposalModal({
  open,
  onClose,
  leadId,
  clientId,
  item,
}: {
  open: boolean;
  onClose: () => void;
  leadId?: string;
  clientId?: string;
  item?: Proposal;
}) {
  const { leads, clients, addProposal, updateProposal } = useApp();
  const router = useRouter();
  const fixed = leadId ? `lead:${leadId}` : clientId ? `client:${clientId}` : undefined;
  const options = [
    ...leads.filter((l) => l.status !== "lost").map((l) => ({ value: `lead:${l.id}`, label: `Lead · ${l.name}` })),
    ...clients.map((c) => ({ value: `client:${c.id}`, label: `Client · ${c.company || c.name}` })),
  ];

  return (
    <Modal
      open={open}
      title={item ? "Edit proposal" : "New proposal"}
      description={item ? undefined : "Uses Adept’s Business Bookkeeping Proposal and Engagement Letter."}
      onClose={onClose}
    >
      <form
        key={item?.id ?? "new"}
        className="grid gap-4"
        onSubmit={(e) => {
          const data = formData(e);
          const title = String(data.get("title"));
          const amount = String(data.get("amount"));
          if (item) {
            const status = String(data.get("status")) as ProposalStatus;
            const today = new Date().toISOString().slice(0, 10);
            updateProposal(item.id, {
              title,
              amount,
              status,
              ...(status === "sent" && !item.sentAt ? { sentAt: today } : {}),
              ...(status === "accepted" && !item.acceptedAt ? { acceptedAt: today } : {}),
            });
          } else {
            const [kind, id] = String(fixed ?? data.get("who")).split(":");
            const newId = `pr_${Date.now()}`;
            // Create the draft, then open the builder to fill in the proposal + engagement letter.
            void addProposal({ id: newId, ...(kind === "client" ? { clientId: id } : { leadId: id }), title, amount, status: "draft" }).then(() =>
              router.push(`/studio/proposals/${newId}`),
            );
          }
          onClose();
        }}
      >
        {item || fixed ? null : <SelectField label="For" name="who" defaultValue={options[0]?.value} options={options} />}
        {item ? (
          <>
            <Field label="Title" name="title" defaultValue={item.title} />
            <Field label="Fee" name="amount" defaultValue={item.amount} />
          </>
        ) : (
          <>
            <input type="hidden" name="title" value="Growth bookkeeping" />
            <input type="hidden" name="amount" value="$550 / month" />
            <p className="text-sm text-muted">Next, you’ll choose the package, fees and QuickBooks details, with a live preview of the proposal and engagement letter.</p>
          </>
        )}
        {item ? <SelectField label="Status" name="status" defaultValue={item.status} options={STATUSES.map((v) => ({ value: v, label: v }))} /> : null}
        <ModalActions onClose={onClose} submitLabel={item ? "Save changes" : "Create and open builder"} disabled={!item && !fixed && options.length === 0} />
      </form>
    </Modal>
  );
}
