"use client";

import { useRef, useState } from "react";
import { cx } from "@/components/ui/kit";
import type { DocumentFile } from "@/lib/types";
import { useApp } from "@/store/app-store";

type Item = { name: string; state: "uploading" | "done" | "error"; message?: string };

/** Uploads to the signed-in client's folder, or (staff) to the folder of `forClientId`. */
export function Uploader({ kind, category, forClientId }: { kind: DocumentFile["kind"]; category: string; forClientId?: string }) {
  const { addDocument, clientId: ownClientId } = useApp();
  const clientId = forClientId ?? ownClientId;
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const busy = items.some((i) => i.state === "uploading");

  async function handleFiles(files: File[]) {
    if (!files.length || !clientId) return;
    setItems(files.map((f) => ({ name: f.name, state: "uploading" })));

    for (const [index, file] of files.entries()) {
      const update = (patch: Partial<Item>) => setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("category", category);
        if (forClientId) body.append("clientId", forClientId);
        const res = await fetch("/api/storage", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Upload failed");
        await addDocument({
          id: `doc_${Date.now()}_${index}`,
          clientId,
          name: file.name,
          kind,
          category,
          size: file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`,
          uploadedAt: new Date().toISOString().slice(0, 10),
          storageKey: data.key,
        });
        update({ state: "done" });
      } catch (err) {
        update({ state: "error", message: (err as Error).message });
      }
    }
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(Array.from(e.dataTransfer.files));
        }}
        className={cx(
          "grid place-items-center gap-2 rounded-3xl px-6 py-10 text-center transition-colors",
          dragging ? "bg-gold-soft" : "bg-sand hover:bg-sand-2",
          busy && "opacity-70",
        )}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-navy">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="font-medium text-navy">{busy ? "Uploading…" : "Drop files here or click to browse"}</span>
        <span className="text-xs text-muted">PDF, images or spreadsheets · up to 25 MB each · stored privately</span>
      </button>
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.currentTarget.value = "";
          void handleFiles(files);
        }}
      />
      {items.length ? (
        <ul className="grid gap-1.5 text-sm" aria-live="polite">
          {items.map((it, i) => (
            <li key={`${it.name}-${i}`} className="flex items-center justify-between gap-3 rounded-xl bg-paper px-4 py-2.5">
              <span className="truncate text-navy">{it.name}</span>
              <span className={cx("shrink-0 text-xs", it.state === "error" ? "text-danger" : it.state === "done" ? "text-success" : "text-muted")}>
                {it.state === "uploading" ? "Uploading…" : it.state === "done" ? "Uploaded" : it.message}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Link to a stored file on Adept's own domain (login-checked by /api/files). */
export const fileUrl = (key: string) => `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`;

/** Opens a stored file in a new tab. */
export function openStoredFile(key: string) {
  window.open(fileUrl(key), "_blank", "noopener");
}
