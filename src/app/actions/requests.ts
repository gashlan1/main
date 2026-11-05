"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { REQUEST_STATUSES, type RequestPriority, type RequestSource, type RequestStatus } from "@/db/schema";
import { requireUserOrThrow } from "@/lib/auth";
import { deleteDocument, getDocument } from "@/lib/documents";
import { markProposalSent } from "@/lib/proposals";
import {
  addEvent,
  assignRequest,
  createRequest,
  setStatus,
  updateRequest,
  type RequestPatch,
} from "@/lib/requests";
function refresh(requestId?: string) {
  revalidatePath("/");
  if (requestId) revalidatePath(`/requests/${requestId}`);
}

export async function setStatusAction(requestId: string, status: RequestStatus): Promise<void> {
  const me = await requireUserOrThrow();
  if (!REQUEST_STATUSES.includes(status)) throw new Error("Unknown status");
  await setStatus(requestId, status, me.id);
  refresh(requestId);
}

export async function assignAction(requestId: string, assigneeId: string | null): Promise<void> {
  const me = await requireUserOrThrow();
  await assignRequest(requestId, assigneeId || null, me.id);
  refresh(requestId);
}

export async function setPriorityAction(requestId: string, priority: RequestPriority): Promise<void> {
  await requireUserOrThrow();
  await updateRequest(requestId, { priority });
  refresh(requestId);
}

export async function addNoteAction(requestId: string, body: string): Promise<void> {
  const me = await requireUserOrThrow();
  const text = body.trim();
  if (!text) return;
  await addEvent(requestId, { type: "note", authorId: me.id, subject: "Internal note", body: text });
  refresh(requestId);
}

export async function logClientMessageAction(requestId: string, body: string, subject?: string): Promise<void> {
  const me = await requireUserOrThrow();
  const text = body.trim();
  if (!text) return;
  await addEvent(requestId, {
    type: "email_in",
    authorId: me.id,
    subject: subject?.trim() || "Message from client (logged by staff)",
    body: text,
  });
  refresh(requestId);
}

const NULLABLE_FIELDS = ["salutation", "company", "email", "phone", "country", "serviceType", "activities", "details", "summary"] as const;

export async function updateRequestAction(requestId: string, patch: RequestPatch): Promise<void> {
  await requireUserOrThrow();
  const clean: RequestPatch = {};
  for (const key of NULLABLE_FIELDS) {
    if (key in patch) clean[key] = patch[key]?.trim() || null;
  }
  const contactName = patch.contactName?.trim();
  if (contactName) clean.contactName = contactName;
  await updateRequest(requestId, clean);
  refresh(requestId);
}

export async function deleteDocumentAction(requestId: string, documentId: string): Promise<void> {
  const me = await requireUserOrThrow();
  const doc = await getDocument(documentId);
  if (!doc || doc.requestId !== requestId) throw new Error("Document not found");
  await deleteDocument(documentId);
  await addEvent(requestId, { type: "system", authorId: me.id, subject: `Deleted ${doc.filename}` });
  refresh(requestId);
}

export async function markProposalSentAction(requestId: string, proposalId: string): Promise<void> {
  const me = await requireUserOrThrow();
  await markProposalSent(proposalId);
  await addEvent(requestId, { type: "system", authorId: me.id, subject: "Proposal marked as sent", meta: { proposalId } });
  await setStatus(requestId, "proposal_sent", me.id);
  refresh(requestId);
}

export type CreateRequestState = { error?: string } | undefined;

export async function createRequestAction(_prev: CreateRequestState, formData: FormData): Promise<CreateRequestState> {
  const me = await requireUserOrThrow();
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const contactName = get("contactName");
  if (!contactName) return { error: "The contact name is required." };
  const source = (["website", "email", "manual"] as RequestSource[]).includes(get("source") as RequestSource)
    ? (get("source") as RequestSource)
    : "manual";
  const serviceType = get("serviceType");
  const receivedAt = get("receivedAt");
  const row = await createRequest(
    {
      source,
      salutation: get("salutation") || null,
      contactName,
      company: get("company") || null,
      email: get("email") || null,
      phone: get("phone") || null,
      country: get("country") || null,
      serviceType: serviceType || null,
      activities: get("activities") || null,
      details: get("details") || null,
      summary: get("summary") || null,
      priority: get("priority") === "high" ? "high" : "normal",
      assigneeId: get("assigneeId") || (formData.get("assignToMe") ? me.id : null),
      receivedAt: receivedAt ? new Date(receivedAt).toISOString() : undefined,
    },
    me.id,
  );
  refresh(row.id);
  redirect(`/requests/${row.id}`);
}
