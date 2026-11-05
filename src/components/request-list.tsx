import Link from "next/link";
import { FileText, Paperclip, UserRound } from "lucide-react";
import type { RequestListItem } from "@/lib/requests";
import { ageLabel, formatDate } from "@/lib/dates";
import { waitingState } from "@/lib/queue";
import { StatusBadge } from "./status-badge";

export function RequestList({
  items,
  now,
  emptyMessage = "No requests here.",
}: {
  items: RequestListItem[];
  /** Render time in ms, taken once by the page so every chip agrees. */
  now: number;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <div className="card px-6 py-12 text-center text-sm text-ink-500">{emptyMessage}</div>;
  }
  return (
    <div className="card divide-y divide-ink-100 overflow-hidden">
      <div className="hidden grid-cols-[150px_1fr_1fr_150px_180px_120px] gap-4 bg-ink-50 px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500 lg:grid">
        <span>Reference</span>
        <span>Client</span>
        <span>Service</span>
        <span>Assigned</span>
        <span>Status</span>
        <span className="text-right">Updated</span>
      </div>
      {items.map((item) => {
        const waiting = waitingState(item, now);
        return (
          <Link
            key={item.id}
            href={`/portal/requests/${item.id}`}
            className="grid grid-cols-1 gap-2 px-5 py-4 transition-colors hover:bg-brand-50/40 lg:grid-cols-[150px_1fr_1fr_150px_180px_120px] lg:items-center lg:gap-4"
          >
            <div>
              <div className="flex items-center gap-2 font-mono text-sm font-semibold text-ink-900">
                {item.priority === "high" ? <span className="size-2 rounded-full bg-brand-600" title="High priority" /> : null}
                {item.ref}
              </div>
              <div className="text-xs text-ink-500">received {ageLabel(item.createdAt, now)} ago</div>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink-900">
                {item.contactName}
                {item.company ? <span className="text-ink-500"> · {item.company}</span> : null}
              </div>
              <div className="truncate text-xs text-ink-500">{[item.country, item.summary].filter(Boolean).join(" — ")}</div>
            </div>
            <div className="truncate text-sm text-ink-700">{item.serviceType ?? "—"}</div>
            <div className="flex items-center gap-1.5 text-sm text-ink-700">
              <UserRound className="size-3.5 text-ink-400" />
              {item.assigneeName ?? <span className="text-ink-400">Unassigned</span>}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={item.status} />
              {waiting ? (
                <span
                  className={`badge normal-case tracking-normal ${
                    waiting.tone === "us" ? "bg-brand-100 text-brand-800" : "bg-ink-100 text-ink-600"
                  }`}
                >
                  {waiting.label}
                </span>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-ink-500 lg:flex-col lg:items-end lg:justify-center lg:gap-1">
              <span className="flex items-center gap-2">
                {item.proposalCount > 0 ? (
                  <span className="inline-flex items-center gap-0.5" title={`${item.proposalCount} proposal version(s)`}>
                    <FileText className="size-3.5" />
                    {item.proposalCount}
                  </span>
                ) : null}
                {item.documentCount > 0 ? (
                  <span className="inline-flex items-center gap-0.5" title={`${item.documentCount} document(s)`}>
                    <Paperclip className="size-3.5" />
                    {item.documentCount}
                  </span>
                ) : null}
              </span>
              <span className="whitespace-nowrap">{formatDate(item.updatedAt)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
