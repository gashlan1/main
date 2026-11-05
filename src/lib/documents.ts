import fs from "node:fs/promises";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { DATA_DIR, getDb } from "@/db/client";
import { documents, type DocumentCategory, type DocumentRow } from "@/db/schema";
import { newId } from "./ids";
import { nowIso } from "./dates";
import { addEvent } from "./requests";

const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

import { DOCUMENT_CATEGORY_LABELS } from "./labels";

export function safeFilename(name: string): string {
  const base = path
    .basename(name)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .trim();
  return base.slice(0, 150) || "file";
}

export type StoreDocumentInput = {
  requestId: string;
  category: DocumentCategory;
  filename: string;
  mime: string;
  bytes: Uint8Array;
  uploadedBy?: string | null;
  proposalId?: string | null;
  /** Add an "Uploaded …" entry to the request timeline. */
  logEvent?: boolean;
};

export async function storeDocument(input: StoreDocumentInput): Promise<DocumentRow> {
  const id = newId();
  const filename = safeFilename(input.filename);
  const storageKey = `${id}${path.extname(filename).toLowerCase()}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, storageKey), input.bytes);

  const db = await getDb();
  const [row] = await db
    .insert(documents)
    .values({
      id,
      requestId: input.requestId,
      category: input.category,
      filename,
      mime: input.mime || "application/octet-stream",
      size: input.bytes.byteLength,
      storageKey,
      uploadedBy: input.uploadedBy ?? null,
      proposalId: input.proposalId ?? null,
      createdAt: nowIso(),
    })
    .returning();

  if (input.logEvent) {
    await addEvent(input.requestId, {
      type: "upload",
      authorId: input.uploadedBy ?? null,
      subject: `Uploaded ${filename}`,
      body: DOCUMENT_CATEGORY_LABELS[input.category],
      meta: { documentId: id },
    });
  }
  return row;
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const db = await getDb();
  const [row] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return row ?? null;
}

export async function listDocuments(requestId: string): Promise<DocumentRow[]> {
  const db = await getDb();
  return db.select().from(documents).where(eq(documents.requestId, requestId)).orderBy(desc(documents.createdAt));
}

export async function readDocumentBytes(doc: DocumentRow): Promise<Buffer> {
  return fs.readFile(path.join(UPLOAD_DIR, doc.storageKey));
}

export async function deleteDocument(id: string): Promise<void> {
  const doc = await getDocument(id);
  if (!doc) return;
  const db = await getDb();
  await db.delete(documents).where(eq(documents.id, id));
  await fs.rm(path.join(UPLOAD_DIR, doc.storageKey), { force: true });
}
