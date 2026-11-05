"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, FileText, Paperclip, Trash2, UploadCloud } from "lucide-react";
import type { DocumentCategory, DocumentRow } from "@/db/schema";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/dates";
import { deleteDocumentAction } from "@/app/actions/requests";

const UPLOAD_CATEGORIES: DocumentCategory[] = ["client", "signed_proposal", "poa", "other"];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPanel({ requestId, documents }: { requestId: string; documents: DocumentRow[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<DocumentCategory>("client");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.set("category", category);
      for (const f of list) fd.append("files", f);
      const res = await fetch(`/api/requests/${requestId}/documents`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setMessage({ tone: "ok", text: `${list.length} file${list.length === 1 ? "" : "s"} uploaded.` });
      router.refresh();
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const generated = documents.filter((d) => d.category === "proposal" || d.category === "activity_table");
  const uploaded = documents.filter((d) => d.category !== "proposal" && d.category !== "activity_table");

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">Documents</h2>
        <span className="text-xs text-ink-500">{documents.length} file{documents.length === 1 ? "" : "s"}</span>
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        {UPLOAD_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${category === c ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"}`}
          >
            {DOCUMENT_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
          dragging ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-ink-50"
        }`}
      >
        <UploadCloud className="mx-auto size-7 text-ink-400" />
        <p className="mt-1 text-xs text-ink-500">Drop files here or</p>
        <button type="button" className="btn-dark mt-2 w-full" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Paperclip className="size-4" />
          {uploading ? "Uploading…" : `Upload ${DOCUMENT_CATEGORY_LABELS[category].toLowerCase()}`}
        </button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && void upload(e.target.files)} />
        <p className="mt-1 text-[11px] text-ink-400">PDF, Word, images · up to 25 MB each</p>
      </div>
      {message ? (
        <p className={`mt-2 rounded-lg px-3 py-1.5 text-xs ${message.tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-brand-50 text-brand-800"}`}>
          {message.text}
        </p>
      ) : null}

      {generated.length > 0 ? (
        <DocGroup title="Generated proposals" docs={generated} onDelete={(id) => startTransition(() => deleteDocumentAction(requestId, id))} pending={pending} />
      ) : null}
      <DocGroup
        title="Client & other documents"
        docs={uploaded}
        empty="Nothing uploaded yet."
        onDelete={(id) => startTransition(() => deleteDocumentAction(requestId, id))}
        pending={pending}
      />
    </div>
  );
}

function DocGroup({
  title,
  docs,
  empty,
  onDelete,
  pending,
}: {
  title: string;
  docs: DocumentRow[];
  empty?: string;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  return (
    <div className="mt-4">
      <div className="label">{title}</div>
      {docs.length === 0 ? (
        <p className="text-xs text-ink-400">{empty}</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-2 py-2">
              <FileText className="size-4 shrink-0 text-ink-400" />
              <div className="min-w-0 flex-1">
                <a href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" className="block truncate text-sm text-ink-800 hover:text-brand-800" title={d.filename}>
                  {d.filename}
                </a>
                <div className="text-[11px] text-ink-400">
                  {DOCUMENT_CATEGORY_LABELS[d.category]} · {formatSize(d.size)} · {formatDate(d.createdAt)}
                </div>
              </div>
              <a href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" className="btn-ghost p-1.5" title="Open">
                <ExternalLink className="size-3.5" />
              </a>
              <a href={`/api/documents/${d.id}?download=1`} className="btn-ghost p-1.5" title="Download">
                <Download className="size-3.5" />
              </a>
              <button
                type="button"
                className="btn-ghost p-1.5 text-ink-400 hover:text-brand-700"
                title="Delete"
                disabled={pending}
                onClick={() => {
                  if (confirm(`Delete ${d.filename}?`)) onDelete(d.id);
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
