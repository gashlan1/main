import type { RequestStatus } from "@/db/schema";
import { STATUS_LABELS } from "@/lib/labels";

const TONES: Record<RequestStatus, string> = {
  new: "bg-sky-100 text-sky-800",
  in_review: "bg-amber-100 text-amber-800",
  awaiting_client: "bg-violet-100 text-violet-800",
  proposal_sent: "bg-teal-100 text-teal-800",
  engaged: "bg-emerald-100 text-emerald-800",
  closed: "bg-ink-100 text-ink-600",
  declined: "bg-brand-50 text-brand-700",
};

export function StatusBadge({ status, className = "" }: { status: RequestStatus; className?: string }) {
  return <span className={`badge ${TONES[status]} ${className}`}>{STATUS_LABELS[status]}</span>;
}
