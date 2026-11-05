import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { DOCUMENT_CATEGORIES, REQUEST_STATUSES } from "@/lib/labels";

export { DOCUMENT_CATEGORIES, REQUEST_STATUSES };

export type UserRole = "admin" | "associate";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<UserRole>().notNull().default("associate"),
  title: text("title"),
  phone: text("phone"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type RequestPriority = "normal" | "high";
export type RequestSource = "website" | "email" | "manual";

export const requests = sqliteTable("requests", {
  id: text("id").primaryKey(),
  ref: text("ref").notNull().unique(),
  status: text("status").$type<RequestStatus>().notNull().default("new"),
  priority: text("priority").$type<RequestPriority>().notNull().default("normal"),
  source: text("source").$type<RequestSource>().notNull().default("website"),
  salutation: text("salutation"),
  contactName: text("contact_name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  country: text("country"),
  serviceType: text("service_type"),
  activities: text("activities"),
  details: text("details"),
  summary: text("summary"),
  assigneeId: text("assignee_id").references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  lastClientMessageAt: text("last_client_message_at"),
  lastStaffReplyAt: text("last_staff_reply_at"),
});

export type EventType =
  | "note"
  | "email_in"
  | "email_out"
  | "status"
  | "upload"
  | "proposal"
  | "assignment"
  | "system";

export type EventMeta = {
  to?: string;
  cc?: string;
  attachments?: { id: string; filename: string }[];
  from?: string;
  statusFrom?: string;
  statusTo?: string;
  documentId?: string;
  proposalId?: string;
  delivery?: "smtp" | "eml" | "manual";
  assigneeName?: string;
};

export const requestEvents = sqliteTable("request_events", {
  id: text("id").primaryKey(),
  requestId: text("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  type: text("type").$type<EventType>().notNull(),
  authorId: text("author_id").references(() => users.id),
  subject: text("subject"),
  body: text("body"),
  meta: text("meta", { mode: "json" }).$type<EventMeta>(),
  createdAt: text("created_at").notNull(),
});

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  requestId: text("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  category: text("category").$type<DocumentCategory>().notNull().default("client"),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  storageKey: text("storage_key").notNull(),
  uploadedBy: text("uploaded_by").references(() => users.id),
  proposalId: text("proposal_id"),
  createdAt: text("created_at").notNull(),
});

export type ProposalPhase = {
  key: string;
  title: string;
  bullets: string[];
  fee: number;
  duration: string;
};

export type ProposalActivity = {
  code: string;
  activity: string;
  authority: string;
  license: string;
  remarks: string;
  highlight: boolean;
};

export type ProposalData = {
  addresseeName: string;
  addresseeCompany: string;
  salutationLine: string;
  subject: string;
  intro: string;
  phases: ProposalPhase[];
  includedEmployees: number;
  perEmployeeFee: number;
  routeNote: string;
  governmentFees: string;
  thirdPartyCosts: string;
  requiredDocuments: string[];
  keyPoints: string[];
  recurringCosts: string;
  overallTimeline: string;
  timelineNote: string;
  paymentTerms: string;
  phaseOneOnlyClause: boolean;
  validityDays: number;
  signatoryName: string;
  signatoryTitle: string;
  includeActivityTable: boolean;
  activityTableTitle: string;
  activityTableSubtitle: string;
  activities: ProposalActivity[];
  activitySummary: string;
  activityNote: string;
  dateG: string; // YYYY-MM-DD
};

export type ProposalStatus = "draft" | "generated" | "sent" | "approved";

export const proposals = sqliteTable("proposals", {
  id: text("id").primaryKey(),
  requestId: text("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  status: text("status").$type<ProposalStatus>().notNull().default("draft"),
  data: text("data", { mode: "json" }).$type<ProposalData>().notNull(),
  total: real("total").notNull(),
  proposalDocId: text("proposal_doc_id"),
  tableDocId: text("table_doc_id"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").notNull(),
  sentAt: text("sent_at"),
});

export const quickSentences = sqliteTable("quick_sentences", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  label: text("label").notNull(),
  text: text("text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export type ServiceRoute = "both" | "sez" | "mainland";

export const services = sqliteTable("services", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  bullets: text("bullets", { mode: "json" }).$type<string[]>().notNull(),
  fee: real("fee").notNull(),
  duration: text("duration"),
  route: text("route").$type<ServiceRoute>().notNull().default("both"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  code: text("code"),
  activity: text("activity").notNull(),
  authority: text("authority"),
  license: text("license"),
  remarks: text("remarks"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export type User = typeof users.$inferSelect;
export type RequestRow = typeof requests.$inferSelect;
export type RequestEvent = typeof requestEvents.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type ProposalRow = typeof proposals.$inferSelect;
export type QuickSentence = typeof quickSentences.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Activity = typeof activities.$inferSelect;
