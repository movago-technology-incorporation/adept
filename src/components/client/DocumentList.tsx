"use client";

import { ExternalLink, FileImage, FileSpreadsheet, FileText } from "lucide-react";
import { openStoredFile } from "@/components/portal/Uploader";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState, IconButton, formatDate } from "@/components/ui/kit";
import type { DocumentFile } from "@/lib/types";
import { useApp } from "@/store/app-store";

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const Icon = ["jpg", "jpeg", "png", "heic", "gif", "webp"].includes(ext) ? FileImage : ["xls", "xlsx", "csv"].includes(ext) ? FileSpreadsheet : FileText;
  return <Icon className="h-5 w-5" />;
}

/** File list with open + delete actions. Used in the client portal and Studio client folders. */
export function DocumentList({ rows, empty, emptyBody, canDelete = true }: { rows: DocumentFile[]; empty: string; emptyBody?: string; canDelete?: boolean }) {
  const { deleteDocument } = useApp();
  if (rows.length === 0) return <EmptyState title={empty} body={emptyBody} />;
  return (
    <ul className="grid gap-2">
      {rows.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-gold-deep">
              <FileIcon name={doc.name} />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-navy">{doc.name}</span>
              <span className="text-sm text-muted">
                {doc.category} · {doc.size} · {formatDate(doc.uploadedAt)}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-0.5">
            {doc.storageKey ? (
              <IconButton label="Open file" onClick={() => openStoredFile(doc.storageKey!)}>
                <ExternalLink className="h-4 w-4" />
              </IconButton>
            ) : null}
            {canDelete ? <ConfirmButton label="Delete file" onConfirm={() => deleteDocument(doc.id)} /> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
