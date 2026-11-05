"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ArrowLeft, Flag, UserRound } from "lucide-react";
import type { RequestRow, RequestStatus } from "@/db/schema";
import { REQUEST_STATUSES, STATUS_LABELS } from "@/lib/labels";
import { ageLabel, formatDate } from "@/lib/dates";
import { assignAction, setPriorityAction, setStatusAction } from "@/app/actions/requests";
import { StatusBadge } from "@/components/status-badge";
import type { Staff } from "./workbench";

const NEXT_STEP: Partial<Record<RequestStatus, { label: string; to: RequestStatus }>> = {
  new: { label: "Start review", to: "in_review" },
  awaiting_client: { label: "Client replied — back to review", to: "in_review" },
  proposal_sent: { label: "Client approved — mark engaged", to: "engaged" },
  engaged: { label: "Close request", to: "closed" },
};

export function RequestHeader({ request, staff }: { request: RequestRow & { assigneeName: string | null }; staff: Staff[] }) {
  const [pending, startTransition] = useTransition();
  const next = NEXT_STEP[request.status];

  return (
    <header className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900">
            <ArrowLeft className="size-3.5" />
            All requests
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-xl font-semibold text-ink-900">{request.ref}</h1>
            <StatusBadge status={request.status} />
            {request.priority === "high" ? <span className="badge bg-brand-100 text-brand-800">High priority</span> : null}
          </div>
          <p className="mt-1 text-sm text-ink-700">
            <span className="font-medium text-ink-900">
              {request.salutation ? `${request.salutation} ` : ""}
              {request.contactName}
            </span>
            {request.company ? ` · ${request.company}` : ""}
            {request.country ? ` · ${request.country}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            Received {formatDate(request.createdAt)} ({ageLabel(request.createdAt)} ago) via {request.source}
            {request.serviceType ? ` · ${request.serviceType}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-medium text-ink-500">
            <UserRound className="size-4" />
            <select
              className="input w-44 py-1.5"
              value={request.assigneeId ?? ""}
              disabled={pending}
              onChange={(e) => startTransition(() => assignAction(request.id, e.target.value || null))}
              aria-label="Assigned to"
            >
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <select
            className="input w-44 py-1.5"
            value={request.status}
            disabled={pending}
            onChange={(e) => startTransition(() => setStatusAction(request.id, e.target.value as RequestStatus))}
            aria-label="Status"
          >
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            title={request.priority === "high" ? "Remove high priority" : "Mark high priority"}
            disabled={pending}
            onClick={() => startTransition(() => setPriorityAction(request.id, request.priority === "high" ? "normal" : "high"))}
            className={`btn-secondary px-2.5 ${request.priority === "high" ? "border-brand-300 bg-brand-50 text-brand-700" : ""}`}
          >
            <Flag className="size-4" />
          </button>
          {next ? (
            <button type="button" className="btn-dark" disabled={pending} onClick={() => startTransition(() => setStatusAction(request.id, next.to))}>
              {next.label}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
