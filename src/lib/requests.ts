import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, getRawClient } from "@/db/client";
import {
  documents,
  proposals,
  requestEvents,
  requests,
  users,
  type EventMeta,
  type EventType,
  type RequestPriority,
  type RequestRow,
  type RequestSource,
  type RequestStatus,
} from "@/db/schema";
import { newId, newInquiryRef } from "./ids";
import { nowIso } from "./dates";

import { OPEN_STATUSES, STATUS_LABELS } from "./labels";

export { OPEN_STATUSES, STATUS_LABELS };

export type RequestListItem = {
  id: string;
  ref: string;
  status: RequestStatus;
  priority: RequestPriority;
  source: RequestSource;
  salutation: string | null;
  contactName: string;
  company: string | null;
  email: string | null;
  country: string | null;
  serviceType: string | null;
  summary: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
  lastClientMessageAt: string | null;
  lastStaffReplyAt: string | null;
  documentCount: number;
  proposalCount: number;
};

const listSelection = {
  id: requests.id,
  ref: requests.ref,
  status: requests.status,
  priority: requests.priority,
  source: requests.source,
  salutation: requests.salutation,
  contactName: requests.contactName,
  company: requests.company,
  email: requests.email,
  country: requests.country,
  serviceType: requests.serviceType,
  summary: requests.summary,
  assigneeId: requests.assigneeId,
  assigneeName: users.name,
  createdAt: requests.createdAt,
  updatedAt: requests.updatedAt,
  lastClientMessageAt: requests.lastClientMessageAt,
  lastStaffReplyAt: requests.lastStaffReplyAt,
  documentCount: sql<number>`(select count(*) from ${documents} where ${documents.requestId} = ${requests.id})`.mapWith(Number),
  proposalCount: sql<number>`(select count(*) from ${proposals} where ${proposals.requestId} = ${requests.id})`.mapWith(Number),
};

export type ListFilter = {
  status?: RequestStatus | "open" | "all";
  assigneeId?: string | null;
  ids?: string[];
  limit?: number;
};

export async function listRequests(filter: ListFilter = {}): Promise<RequestListItem[]> {
  const db = await getDb();
  const conditions = [];
  if (!filter.status || filter.status === "open") conditions.push(inArray(requests.status, OPEN_STATUSES));
  else if (filter.status !== "all") conditions.push(eq(requests.status, filter.status));
  if (filter.assigneeId) conditions.push(eq(requests.assigneeId, filter.assigneeId));
  if (filter.ids) {
    if (filter.ids.length === 0) return [];
    conditions.push(inArray(requests.id, filter.ids));
  }
  return db
    .select(listSelection)
    .from(requests)
    .leftJoin(users, eq(requests.assigneeId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(requests.updatedAt))
    .limit(filter.limit ?? 500);
}

export async function statusCounts(): Promise<Record<RequestStatus, number>> {
  const db = await getDb();
  const rows = await db
    .select({ status: requests.status, count: sql<number>`count(*)`.mapWith(Number) })
    .from(requests)
    .groupBy(requests.status);
  const counts = Object.fromEntries(Object.keys(STATUS_LABELS).map((s) => [s, 0])) as Record<RequestStatus, number>;
  for (const row of rows) counts[row.status] = row.count;
  return counts;
}

export type RequestDetail = {
  request: RequestRow & { assigneeName: string | null };
  events: Array<typeof requestEvents.$inferSelect & { authorName: string | null }>;
  documents: Array<typeof documents.$inferSelect>;
  proposals: Array<typeof proposals.$inferSelect>;
};

export async function getRequest(id: string): Promise<(RequestRow & { assigneeName: string | null }) | null> {
  const db = await getDb();
  const [row] = await db
    .select({ request: requests, assigneeName: users.name })
    .from(requests)
    .leftJoin(users, eq(requests.assigneeId, users.id))
    .where(eq(requests.id, id))
    .limit(1);
  if (!row) return null;
  return { ...row.request, assigneeName: row.assigneeName };
}

export async function getRequestDetail(id: string): Promise<RequestDetail | null> {
  const request = await getRequest(id);
  if (!request) return null;
  const db = await getDb();
  const [events, docs, props] = await Promise.all([
    db
      .select({
        id: requestEvents.id,
        requestId: requestEvents.requestId,
        type: requestEvents.type,
        authorId: requestEvents.authorId,
        subject: requestEvents.subject,
        body: requestEvents.body,
        meta: requestEvents.meta,
        createdAt: requestEvents.createdAt,
        authorName: users.name,
      })
      .from(requestEvents)
      .leftJoin(users, eq(requestEvents.authorId, users.id))
      .where(eq(requestEvents.requestId, id))
      .orderBy(requestEvents.createdAt),
    db.select().from(documents).where(eq(documents.requestId, id)).orderBy(desc(documents.createdAt)),
    db.select().from(proposals).where(eq(proposals.requestId, id)).orderBy(desc(proposals.version)),
  ]);
  return { request, events, documents: docs, proposals: props };
}

export type NewRequestInput = {
  salutation?: string | null;
  contactName: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  serviceType?: string | null;
  activities?: string | null;
  details?: string | null;
  summary?: string | null;
  source: RequestSource;
  priority?: RequestPriority;
  assigneeId?: string | null;
  /** When the client's message was received (defaults to now). */
  receivedAt?: string;
  /** Override for imported/sample data. */
  ref?: string;
};

export async function createRequest(input: NewRequestInput, actorId: string | null = null): Promise<RequestRow> {
  const db = await getDb();
  const now = nowIso();
  const receivedAt = input.receivedAt ?? now;
  const id = newId();
  const base = {
    id,
    status: "new" as RequestStatus,
    priority: input.priority ?? "normal",
    source: input.source,
    salutation: input.salutation ?? null,
    contactName: input.contactName.trim(),
    company: input.company?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    country: input.country?.trim() || null,
    serviceType: input.serviceType?.trim() || null,
    activities: input.activities?.trim() || null,
    details: input.details?.trim() || null,
    summary: input.summary?.trim() || null,
    assigneeId: input.assigneeId ?? null,
    createdAt: receivedAt,
    updatedAt: now,
    lastClientMessageAt: input.source === "manual" ? null : receivedAt,
    lastStaffReplyAt: null,
  };

  let row: RequestRow | undefined;
  for (let attempt = 0; attempt < 5 && !row; attempt++) {
    const ref = input.ref ?? newInquiryRef(new Date(receivedAt));
    try {
      [row] = await db.insert(requests).values({ ...base, ref }).returning();
    } catch (err) {
      if (input.ref || attempt === 4) throw err;
    }
  }
  if (!row) throw new Error("Could not allocate an inquiry reference");

  const sourceLabel: Record<RequestSource, string> = {
    website: "Inquiry received via the website form",
    email: "Inquiry received by email",
    manual: "Request created by staff",
  };
  await addEvent(row.id, {
    type: input.source === "manual" ? "note" : "email_in",
    authorId: input.source === "manual" ? actorId : null,
    subject: sourceLabel[input.source],
    body: input.details ?? null,
    meta: input.email ? { from: input.email } : undefined,
    createdAt: receivedAt,
  });
  return row;
}

export type RequestPatch = Partial<
  Pick<
    RequestRow,
    | "salutation"
    | "contactName"
    | "company"
    | "email"
    | "phone"
    | "country"
    | "serviceType"
    | "activities"
    | "details"
    | "summary"
    | "priority"
  >
>;

export async function updateRequest(id: string, patch: RequestPatch): Promise<void> {
  const db = await getDb();
  await db
    .update(requests)
    .set({ ...patch, updatedAt: nowIso() })
    .where(eq(requests.id, id));
  await reindexRequest(id);
}

export async function setStatus(id: string, status: RequestStatus, actorId: string | null, createdAt?: string): Promise<void> {
  const db = await getDb();
  const current = await getRequest(id);
  if (!current || current.status === status) return;
  await db.update(requests).set({ status, updatedAt: nowIso() }).where(eq(requests.id, id));
  await addEvent(id, {
    type: "status",
    authorId: actorId,
    subject: `Status changed to ${STATUS_LABELS[status]}`,
    meta: { statusFrom: current.status, statusTo: status },
    createdAt,
  });
}

export async function assignRequest(id: string, assigneeId: string | null, actorId: string | null, createdAt?: string): Promise<void> {
  const db = await getDb();
  let assigneeName: string | undefined;
  if (assigneeId) {
    const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, assigneeId)).limit(1);
    assigneeName = u?.name;
  }
  await db.update(requests).set({ assigneeId, updatedAt: nowIso() }).where(eq(requests.id, id));
  await addEvent(id, {
    type: "assignment",
    authorId: actorId,
    subject: assigneeId ? `Assigned to ${assigneeName ?? "a colleague"}` : "Unassigned",
    meta: assigneeName ? { assigneeName } : undefined,
    createdAt,
  });
}

export type NewEventInput = {
  type: EventType;
  authorId?: string | null;
  subject?: string | null;
  body?: string | null;
  meta?: EventMeta;
  createdAt?: string;
};

export async function addEvent(requestId: string, input: NewEventInput) {
  const db = await getDb();
  const createdAt = input.createdAt ?? nowIso();
  const [event] = await db
    .insert(requestEvents)
    .values({
      id: newId(),
      requestId,
      type: input.type,
      authorId: input.authorId ?? null,
      subject: input.subject ?? null,
      body: input.body ?? null,
      meta: input.meta ?? null,
      createdAt,
    })
    .returning();

  const touch: Partial<RequestRow> = { updatedAt: nowIso() };
  if (input.type === "email_in") touch.lastClientMessageAt = createdAt;
  if (input.type === "email_out") touch.lastStaffReplyAt = createdAt;
  await db.update(requests).set(touch).where(eq(requests.id, requestId));
  await reindexRequest(requestId);
  return event;
}

/** Rebuild the full-text row for one request (cheap; a request has few events). */
export async function reindexRequest(id: string): Promise<void> {
  const db = await getDb();
  const raw = await getRawClient();
  const [req] = await db.select().from(requests).where(eq(requests.id, id)).limit(1);
  await raw.execute({ sql: "DELETE FROM requests_fts WHERE request_id = ?", args: [id] });
  if (!req) return;
  const events = await db
    .select({ subject: requestEvents.subject, body: requestEvents.body })
    .from(requestEvents)
    .where(and(eq(requestEvents.requestId, id), inArray(requestEvents.type, ["note", "email_in", "email_out"])));
  const conversation = events.map((e) => [e.subject, e.body].filter(Boolean).join("\n")).join("\n\n");
  await raw.execute({
    sql: `INSERT INTO requests_fts(request_id, ref, contact_name, company, country, service_type, activities, details, summary, conversation)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      req.ref,
      req.contactName,
      req.company ?? "",
      req.country ?? "",
      req.serviceType ?? "",
      req.activities ?? "",
      req.details ?? "",
      req.summary ?? "",
      conversation,
    ],
  });
}

/** Turn free text into an FTS5 MATCH expression: every word must match, as a prefix. */
export function toFtsQuery(text: string): string | null {
  const tokens = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  if (tokens.length === 0) return null;
  return tokens.map((t) => `"${t}"*`).join(" AND ");
}

export async function searchRequests(query: string, limit = 25): Promise<RequestListItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const db = await getDb();

  // Exact reference lookups first (INQ-2026-J-DRVG).
  if (/^inq-/i.test(trimmed)) {
    const [byRef] = await db.select({ id: requests.id }).from(requests).where(eq(requests.ref, trimmed.toUpperCase())).limit(1);
    if (byRef) return listRequests({ status: "all", ids: [byRef.id] });
  }

  const match = toFtsQuery(trimmed);
  if (!match) return [];
  const raw = await getRawClient();
  const result = await raw.execute({
    sql: "SELECT request_id, bm25(requests_fts) AS rank FROM requests_fts WHERE requests_fts MATCH ? ORDER BY rank LIMIT ?",
    args: [match, limit],
  });
  const ids = result.rows.map((r) => String(r.request_id));
  const items = await listRequests({ status: "all", ids });
  const order = new Map(ids.map((id, i) => [id, i]));
  return items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function listStaff(): Promise<Array<{ id: string; name: string; title: string | null }>> {
  const db = await getDb();
  return db
    .select({ id: users.id, name: users.name, title: users.title })
    .from(users)
    .where(eq(users.active, true))
    .orderBy(users.name);
}
