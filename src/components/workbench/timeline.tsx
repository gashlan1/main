"use client";

import { useState, useTransition } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Flag,
  MessageSquareText,
  Paperclip,
  Settings2,
  UserRound,
  Inbox,
} from "lucide-react";
import type { EventType, RequestEvent } from "@/db/schema";
import { formatDateTime } from "@/lib/dates";
import { logClientMessageAction } from "@/app/actions/requests";

type Ev = RequestEvent & { authorName: string | null };

const ICONS: Record<EventType, typeof Inbox> = {
  note: MessageSquareText,
  email_in: ArrowDownLeft,
  email_out: ArrowUpRight,
  status: Flag,
  upload: Paperclip,
  proposal: FileText,
  assignment: UserRound,
  system: Settings2,
};

const TONES: Record<EventType, string> = {
  note: "bg-amber-100 text-amber-800",
  email_in: "bg-sky-100 text-sky-800",
  email_out: "bg-emerald-100 text-emerald-800",
  status: "bg-ink-100 text-ink-600",
  upload: "bg-violet-100 text-violet-800",
  proposal: "bg-brand-100 text-brand-800",
  assignment: "bg-ink-100 text-ink-600",
  system: "bg-ink-100 text-ink-600",
};

const DELIVERY: Record<string, string> = {
  smtp: "sent from the portal",
  eml: "prepared as .eml for Outlook",
  manual: "sent manually",
};

export function Timeline({ requestId, events }: { requestId: string; events: Ev[] }) {
  const [logging, setLogging] = useState(false);
  const [pending, startTransition] = useTransition();
  const ordered = [...events].reverse();

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">Timeline</h2>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setLogging((v) => !v)}>
          <ArrowDownLeft className="size-3.5" />
          Log a client reply
        </button>
      </div>

      {logging ? (
        <form
          className="mb-5 space-y-2 rounded-xl border border-sky-200 bg-sky-50 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              await logClientMessageAction(requestId, String(fd.get("body") ?? ""), String(fd.get("subject") ?? ""));
              setLogging(false);
            });
          }}
        >
          <p className="text-xs text-sky-900">Paste what the client sent (email or call notes) so the timeline and the AI drafts stay complete.</p>
          <input name="subject" className="input" placeholder="Subject (optional)" />
          <textarea name="body" rows={5} className="input" placeholder="Client's message…" required />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setLogging(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-dark btn-sm" disabled={pending}>
              {pending ? "Saving…" : "Add to timeline"}
            </button>
          </div>
        </form>
      ) : null}

      <ol className="space-y-4">
        {ordered.map((ev) => (
          <TimelineItem key={ev.id} ev={ev} />
        ))}
      </ol>
    </div>
  );
}

function TimelineItem({ ev }: { ev: Ev }) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[ev.type];
  const body = ev.body ?? "";
  const isMessage = ev.type === "email_in" || ev.type === "email_out" || ev.type === "note";
  const long = body.length > 280;
  const meta = ev.meta ?? {};
  const who = ev.type === "email_in" ? meta.from ?? "Client" : ev.authorName ?? "System";

  return (
    <li className="flex gap-3">
      <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${TONES[ev.type]}`}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-sm font-medium text-ink-900">{ev.subject ?? ev.type}</p>
          <time className="text-xs text-ink-400">{formatDateTime(ev.createdAt)}</time>
        </div>
        <p className="text-xs text-ink-500">
          {who}
          {meta.to ? ` → ${meta.to}` : ""}
          {meta.cc ? ` (cc ${meta.cc})` : ""}
          {meta.delivery ? ` · ${DELIVERY[meta.delivery] ?? meta.delivery}` : ""}
        </p>
        {isMessage && body ? (
          <div className="mt-2 rounded-lg bg-ink-50 px-3 py-2">
            <p className="prose-email text-sm text-ink-700">{open || !long ? body : `${body.slice(0, 280)}…`}</p>
            {long ? (
              <button type="button" className="mt-1 text-xs font-medium text-brand-800 hover:underline" onClick={() => setOpen((v) => !v)}>
                {open ? "Show less" : "Show full message"}
              </button>
            ) : null}
          </div>
        ) : null}
        {meta.attachments && meta.attachments.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {meta.attachments.map((a) => (
              <a key={a.id} href={`/api/documents/${a.id}`} target="_blank" rel="noreferrer" className="chip">
                <Paperclip className="size-3" />
                {a.filename}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
