"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ExternalLink, Paperclip, Plus } from "lucide-react";
import type { ProposalData, ProposalRow, RequestRow } from "@/db/schema";
import type { Catalog } from "@/lib/proposals";
import { formatDate, formatSar } from "@/lib/dates";
import { markProposalSentAction } from "@/app/actions/requests";
import { ProposalBuilder } from "./proposal-builder";

export function ProposalPanel({
  request,
  proposals,
  catalog,
  defaultData,
  onAttach,
}: {
  request: RequestRow;
  proposals: ProposalRow[];
  catalog: Catalog;
  defaultData: ProposalData;
  onAttach: (docIds: string[]) => void;
}) {
  const [building, setBuilding] = useState(proposals.length === 0);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {proposals.length > 0 ? (
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">Proposal versions</h2>
            {!building ? (
              <button type="button" className="btn-dark btn-sm" onClick={() => setBuilding(true)}>
                <Plus className="size-3.5" />
                New version
              </button>
            ) : null}
          </div>
          <ul className="divide-y divide-ink-100">
            {proposals.map((p) => {
              const docIds = [p.proposalDocId, p.tableDocId].filter((x): x is string => Boolean(x));
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink-900">Version {p.version}</span>
                      <span className={`badge ${p.status === "sent" ? "bg-teal-100 text-teal-800" : p.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-ink-100 text-ink-600"}`}>
                        {p.status}
                      </span>
                      <span className="text-sm text-ink-700">SAR {formatSar(p.total)} · {p.data.phases.length} phases</span>
                    </div>
                    <div className="text-xs text-ink-500">
                      Dated {formatDate(`${p.data.dateG}T00:00:00Z`)} · generated {formatDate(p.createdAt)}
                      {p.sentAt ? ` · sent ${formatDate(p.sentAt)}` : ""}
                    </div>
                  </div>
                  {p.proposalDocId ? (
                    <a href={`/api/documents/${p.proposalDocId}`} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
                      <ExternalLink className="size-3.5" />
                      Proposal
                    </a>
                  ) : null}
                  {p.tableDocId ? (
                    <a href={`/api/documents/${p.tableDocId}`} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
                      <ExternalLink className="size-3.5" />
                      Activity table
                    </a>
                  ) : null}
                  <button type="button" className="btn-primary btn-sm" onClick={() => onAttach(docIds)}>
                    <Paperclip className="size-3.5" />
                    Attach to reply
                  </button>
                  {p.status === "generated" ? (
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      disabled={pending}
                      title="Record that this version was sent from your own mailbox"
                      onClick={() => startTransition(() => markProposalSentAction(request.id, p.id))}
                    >
                      <CheckCircle2 className="size-3.5" />
                      Mark sent
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {building ? (
        <ProposalBuilder
          request={request}
          catalog={catalog}
          initialData={defaultData}
          nextVersion={(proposals[0]?.version ?? 0) + 1}
          onCancel={proposals.length > 0 ? () => setBuilding(false) : undefined}
          onGenerated={(docIds) => {
            setBuilding(false);
            onAttach(docIds);
          }}
        />
      ) : null}
    </div>
  );
}
