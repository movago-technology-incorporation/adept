"use client";

import { useRef, useState, type DragEvent } from "react";
import { FileText, FileUp, Mail, X } from "lucide-react";
import { completeTaxReturn } from "@/app/actions";
import { Modal } from "@/components/studio/Modal";
import { Alert, Button, cx } from "@/components/ui/kit";

// Most mail servers reject messages over ~20 MB once encoded, so keep attachments well under that.
const MAX_BYTES = 15 * 1024 * 1024;

const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Marks a return Done, with an optional filed-return PDF that's emailed to the client and saved to their documents. */
export function CompleteReturnModal({
  open,
  onClose,
  onDone,
  returnId,
  clientId,
  clientName,
  email,
  year,
  alreadyDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (emailed: boolean) => void;
  returnId: string;
  clientId: string;
  clientName: string;
  email: string;
  year: number;
  alreadyDone: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<"" | "upload" | "send">("");
  const [error, setError] = useState("");

  const close = () => {
    if (busy) return;
    setFile(null);
    setError("");
    onClose();
  };

  const pick = (f: File | undefined | null) => {
    setError("");
    if (!f) return;
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) return setError("Please choose a PDF file.");
    if (f.size > MAX_BYTES) return setError(`That PDF is ${fmtSize(f.size)}. Email attachments need to be 15 MB or smaller.`);
    setFile(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  };

  const submit = async (withPdf: boolean) => {
    setError("");
    try {
      let pdf: { key: string; name: string; size: number } | undefined;
      if (withPdf && file) {
        setBusy("upload");
        const body = new FormData();
        body.append("file", file);
        body.append("clientId", clientId);
        body.append("category", `${year} tax return`);
        const res = await fetch("/api/storage", { method: "POST", body });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.error || "Upload failed. Please try again.");
        pdf = { key: json.key, name: file.name, size: file.size };
      }
      setBusy("send");
      const result = await completeTaxReturn(returnId, pdf);
      if (!result.ok) throw new Error(result.error);
      setFile(null);
      setBusy("");
      onDone(result.emailed);
    } catch (err) {
      setBusy("");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={alreadyDone ? "Send the filed return" : `Mark ${year} return as done`}
      description={`Attach ${clientName.split(" ")[0] || "the client"}’s filed tax return. It’s emailed as a PDF and saved to their portal documents.`}
    >
      <div className="grid gap-4">
        {file ? (
          <div className="flex items-center gap-4 rounded-2xl bg-sand p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy text-white">
              <FileText className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-navy">{file.name}</span>
              <span className="block text-sm text-muted">PDF · {fmtSize(file.size)}</span>
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={!!busy}
              aria-label="Remove file"
              className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full bg-white text-navy hover:bg-sand-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cx(
              "grid cursor-pointer place-items-center gap-3 rounded-3xl px-6 py-10 text-center transition-colors",
              dragging ? "bg-gold/25" : "bg-sand hover:bg-sand-2",
            )}
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-navy">
              <FileUp className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-semibold text-navy">Drop the tax return PDF here</span>
              <span className="mt-1 block text-sm text-muted">or click to browse · PDF up to 15 MB</span>
            </span>
          </button>
        )}
        <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ""))} />

        <p className="flex items-start gap-2 text-sm text-muted">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <span>
            Sends to <span className="font-medium text-navy">{email}</span> with a link to leave a review.
          </span>
        </p>

        {error ? <Alert>{error}</Alert> : null}

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={close} disabled={!!busy}>
            Cancel
          </Button>
          {!alreadyDone ? (
            <Button variant="soft" onClick={() => submit(false)} disabled={!!busy}>
              Done without PDF
            </Button>
          ) : null}
          <Button onClick={() => submit(true)} disabled={!file} loading={!!busy}>
            {busy === "upload" ? "Uploading…" : busy === "send" ? "Sending…" : alreadyDone ? "Send to client" : "Mark done & send"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
