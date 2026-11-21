"use client";

import { Field, Modal, ModalActions, SelectField, formData } from "@/components/studio/Modal";
import { useApp } from "@/store/app-store";
import type { Testimonial } from "@/lib/types";

export function TestimonialModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item?: Testimonial;
}) {
  const { addTestimonial, updateTestimonial } = useApp();

  return (
    <Modal open={open} title={item ? "Edit testimonial" : "Add testimonial"} onClose={onClose}>
      <form
        key={item?.id || "new"}
        className="grid gap-4"
        onSubmit={(e) => {
          const data = formData(e);
          const next = {
            name: String(data.get("name")),
            role: String(data.get("role")),
            quote: String(data.get("quote")),
            featured: String(data.get("featured")) === "yes",
          };
          if (item) updateTestimonial(item.id, next);
          else addTestimonial({ id: `t_${Date.now()}`, ...next });
          onClose();
        }}
      >
        <Field label="Name" name="name" defaultValue={item?.name} />
        <Field label="Role" name="role" defaultValue={item?.role} />
        <Field label="Quote" name="quote" type="textarea" defaultValue={item?.quote} />
        <SelectField
          label="Show on homepage"
          name="featured"
          defaultValue={item?.featured ? "yes" : "no"}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
        />
        <ModalActions onClose={onClose} submitLabel={item ? "Save changes" : "Add testimonial"} />
      </form>
    </Modal>
  );
}
