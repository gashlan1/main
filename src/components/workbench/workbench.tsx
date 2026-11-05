"use client";

import { useState } from "react";
import { FileText, MessagesSquare } from "lucide-react";
import type { ProposalData, QuickSentence } from "@/db/schema";
import type { SessionUser } from "@/lib/auth";
import type { Catalog } from "@/lib/proposals";
import type { RequestDetail } from "@/lib/requests";
import { RequestHeader } from "./request-header";
import { SummaryCard } from "./summary-card";
import { DocumentsPanel } from "./documents-panel";
import { Composer } from "./composer";
import { Timeline } from "./timeline";
import { ProposalPanel } from "./proposal-panel";

export type Staff = { id: string; name: string; title: string | null };

export type WorkbenchProps = {
  me: SessionUser;
  detail: RequestDetail;
  staff: Staff[];
  sentences: QuickSentence[];
  catalog: Catalog;
  placeholders: Record<string, string>;
  defaultProposal: ProposalData;
  smtpConfigured: boolean;
  initialTab: "conversation" | "proposal";
};

export function Workbench(props: WorkbenchProps) {
  const { detail } = props;
  const [tab, setTab] = useState<"conversation" | "proposal">(props.initialTab);
  // Documents the composer should pre-tick, set by "Attach to reply". The
  // composer mounts fresh on each tab switch, so this seeds its initial state.
  const [attachRequest, setAttachRequest] = useState<string[] | null>(null);

  const emails = detail.events.filter((e) => e.type === "email_in" || e.type === "email_out").length;

  return (
    <div className="mx-auto max-w-7xl">
      <RequestHeader request={detail.request} staff={props.staff} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <SummaryCard request={detail.request} />
          <DocumentsPanel requestId={detail.request.id} documents={detail.documents} />
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex gap-1 border-b border-ink-200">
            <TabButton
              active={tab === "conversation"}
              onClick={() => {
                setAttachRequest(null);
                setTab("conversation");
              }}
              icon={MessagesSquare}
              label="Conversation"
              count={emails}
            />
            <TabButton
              active={tab === "proposal"}
              onClick={() => {
                setAttachRequest(null);
                setTab("proposal");
              }}
              icon={FileText}
              label="Fee proposal"
              count={detail.proposals.length}
            />
          </div>

          {tab === "conversation" ? (
            <div className="space-y-6">
              <Composer
                me={props.me}
                request={detail.request}
                documents={detail.documents}
                proposals={detail.proposals}
                sentences={props.sentences}
                placeholders={props.placeholders}
                smtpConfigured={props.smtpConfigured}
                preselectedAttachments={attachRequest}
              />
              <Timeline requestId={detail.request.id} events={detail.events} />
            </div>
          ) : (
            <ProposalPanel
              request={detail.request}
              proposals={detail.proposals}
              catalog={props.catalog}
              defaultData={props.defaultProposal}
              onAttach={(docIds) => {
                setAttachRequest(docIds);
                setTab("conversation");
              }}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof FileText;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        active ? "border-brand-700 text-brand-800" : "border-transparent text-ink-500 hover:text-ink-800"
      }`}
    >
      <Icon className="size-4" />
      {label}
      <span className={`rounded-full px-1.5 text-xs ${active ? "bg-brand-100 text-brand-800" : "bg-ink-100 text-ink-500"}`}>{count}</span>
    </button>
  );
}
