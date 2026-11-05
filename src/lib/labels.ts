import type { DocumentCategory, RequestStatus } from "@/db/schema";

/** Client-safe constants and labels (no database imports). */

export const REQUEST_STATUSES = ["new", "in_review", "awaiting_client", "proposal_sent", "engaged", "closed", "declined"] as const;

export const DOCUMENT_CATEGORIES = ["client", "proposal", "activity_table", "signed_proposal", "poa", "other"] as const;

export const STATUS_LABELS: Record<RequestStatus, string> = {
  new: "New",
  in_review: "In review",
  awaiting_client: "Awaiting client",
  proposal_sent: "Proposal sent",
  engaged: "Engaged",
  closed: "Closed",
  declined: "Declined",
};

export const OPEN_STATUSES: RequestStatus[] = ["new", "in_review", "awaiting_client", "proposal_sent", "engaged"];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  client: "Client document",
  proposal: "Fee proposal",
  activity_table: "Activity table",
  signed_proposal: "Signed proposal",
  poa: "Power of attorney",
  other: "Other",
};

export const SALUTATIONS = ["Mr.", "Ms.", "Dr.", "Eng."] as const;
