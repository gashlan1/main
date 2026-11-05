"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Paperclip, Send, Sparkles, StickyNote, Undo2, Zap } from "lucide-react";
import type { DocumentRow, ProposalRow, QuickSentence, RequestRow } from "@/db/schema";
import type { SessionUser } from "@/lib/auth";
import { FIRM } from "@/lib/firm";
import { fillPlaceholders, insertAtWritingPoint, insertParagraph, surnameOf } from "@/lib/sentences";
import { addNoteAction } from "@/app/actions/requests";

type ReplyKind = "proposal" | "info_request" | "status" | "general";

const REPLY_KINDS: { value: ReplyKind; label: string }[] = [
  { value: "proposal", label: "Proposal cover email" },
  { value: "info_request", label: "Request information" },
  { value: "status", label: "Status update" },
  { value: "general", label: "General reply" },
];

export type ComposerProps = {
  me: SessionUser;
  request: RequestRow;
  documents: DocumentRow[];
  proposals: ProposalRow[];
  sentences: QuickSentence[];
  placeholders: Record<string, string>;
  smtpConfigured: boolean;
  /** Documents to pre-tick, set when "Attach to reply" is clicked on the proposal tab. */
  preselectedAttachments: string[] | null;
};

function defaultSubject(request: RequestRow, latest: ProposalRow | null): string {
  if (latest) {
    const topic = latest.data.subject.replace(/^Fixed-Fee Proposal for (Establishing |Registering )?(an? |the )?/i, "");
    return `Fixed-Fee Proposal: ${topic} (Ref. ${request.ref})`;
  }
  return `Your inquiry (Ref. ${request.ref})`;
}

function defaultBody(request: RequestRow, me: SessionUser): string {
  const greeting = `Dear ${request.salutation ? `${request.salutation} ` : ""}${surnameOf(request.contactName)},`;
  return `${greeting}\n\n\n\nSincerely,\n${me.name}\n${FIRM.legalName}`;
}

export function Composer(props: ComposerProps) {
  const { request, me, sentences, placeholders } = props;
  const router = useRouter();
  const latest = props.proposals[0] ?? null;
  const attachable = useMemo(() => props.documents.filter((d) => d.mime === "application/pdf" || d.category !== "client"), [props.documents]);
  const latestDocIds = useMemo(
    () => props.documents.filter((d) => latest && d.proposalId === latest.id).map((d) => d.id),
    [props.documents, latest],
  );

  const preselected = props.preselectedAttachments;
  const [to, setTo] = useState(request.email ?? "");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(() => defaultSubject(request, latest));
  const [body, setBody] = useState(() => defaultBody(request, me));
  const [attachments, setAttachments] = useState<Set<string>>(
    () => new Set(preselected ?? (latest?.status === "generated" ? latestDocIds : [])),
  );
  const [category, setCategory] = useState<string>(() => sentences[0]?.category ?? "");
  const [usedSentences, setUsedSentences] = useState<string[]>([]);
  const [replyKind, setReplyKind] = useState<ReplyKind>(latest || preselected ? "proposal" : "general");
  const [instructions, setInstructions] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [undo, setUndo] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // False until the user (or a previous insert) puts the caret in the message;
  // until then an untouched textarea reports position 0, above the greeting.
  const caretPlaced = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const categories = useMemo(() => Array.from(new Set(sentences.map((s) => s.category))), [sentences]);
  const chips = sentences.filter((s) => s.category === category);

  function insertSentence(s: QuickSentence) {
    const text = fillPlaceholders(s.text, placeholders);
    const ta = textareaRef.current;
    const { value, caret } = ta && caretPlaced.current ? insertParagraph(body, ta.selectionEnd, text) : insertAtWritingPoint(body, text);
    setBody(value);
    setUsedSentences((u) => [...u, text]);
    requestAnimationFrame(() => {
      if (ta) {
        ta.focus();
        ta.setSelectionRange(caret, caret);
      }
    });
  }

  async function draftWithAi() {
    setNotice(null);
    setDrafting(true);
    setUndo(body);
    caretPlaced.current = false;
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(`/api/requests/${request.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyKind, sentences: usedSentences, instructions }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Drafting failed (${res.status})`);
      }
      setBody("");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setBody(text);
      }
      setNotice({ tone: "ok", text: "Draft ready — review it before sending." });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setNotice({ tone: "error", text: err instanceof Error ? err.message : "Drafting failed" });
        setBody((b) => (b.trim() ? b : (undo ?? b)));
      }
    } finally {
      setDrafting(false);
      abortRef.current = null;
    }
  }

  async function send(mode: "smtp" | "eml" | "manual") {
    setNotice(null);
    setBusy(mode);
    try {
      const res = await fetch(`/api/requests/${request.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, cc, subject, body, attachmentIds: Array.from(attachments), mode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed (${res.status})`);
      }
      if (mode === "eml") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const disposition = res.headers.get("Content-Disposition") ?? "";
        const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
        a.href = url;
        a.download = match ? decodeURIComponent(match[1]) : `${request.ref}.eml`;
        a.click();
        URL.revokeObjectURL(url);
        setNotice({ tone: "ok", text: "Saved as .eml — open it in Outlook, check it, and press Send. The timeline has been updated." });
      } else {
        const data = await res.json();
        setNotice({ tone: "ok", text: data.delivery ?? "Sent." });
      }
      setBody(defaultBody(request, me));
      caretPlaced.current = false;
      setUsedSentences([]);
      setAttachments(new Set());
      router.refresh();
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "Sending failed" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink-900">Reply to client</h2>
        <p className="text-xs text-ink-500">Click sentences to insert them, or let AI draft from the request.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
        <input className="input" placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
        <input className="input" placeholder="Cc (optional)" value={cc} onChange={(e) => setCc(e.target.value)} aria-label="Cc" />
      </div>
      <input className="input mt-2" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" />

      {/* One-click sentences */}
      <div className="mt-3 rounded-xl border border-ink-200 bg-ink-50 p-3">
        <div className="mb-2 flex flex-wrap items-center gap-1">
          <Zap className="mr-1 size-3.5 text-brand-700" />
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${category === c ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-200"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((s) => (
            <button key={s.id} type="button" className="chip" title={fillPlaceholders(s.text, placeholders)} onClick={() => insertSentence(s)}>
              {s.label}
            </button>
          ))}
          {chips.length === 0 ? <span className="text-xs text-ink-400">No sentences yet — add them under Settings.</span> : null}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className="input mt-3 min-h-[320px] font-sans text-[14px] leading-relaxed"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => (caretPlaced.current = true)}
        aria-label="Message"
        readOnly={drafting}
      />

      {/* AI assistance */}
      <div className="mt-3 flex flex-col gap-2 rounded-xl border border-brand-100 bg-brand-50/60 p-3 sm:flex-row sm:items-center">
        <Sparkles className="hidden size-4 shrink-0 text-brand-700 sm:block" />
        <select className="input sm:w-52" value={replyKind} onChange={(e) => setReplyKind(e.target.value as ReplyKind)} aria-label="Reply type">
          {REPLY_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <input
          className="input flex-1"
          placeholder="Anything to add? e.g. mention the call on Thursday, keep it short"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          aria-label="Instructions for the AI"
        />
        {drafting ? (
          <button type="button" className="btn-secondary" onClick={() => abortRef.current?.abort()}>
            Stop
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={draftWithAi}>
            <Sparkles className="size-4" />
            Draft with AI
          </button>
        )}
        {undo !== null && !drafting ? (
          <button
            type="button"
            className="btn-ghost"
            title="Restore the text from before the AI draft"
            onClick={() => {
              setBody(undo);
              setUndo(null);
            }}
          >
            <Undo2 className="size-4" />
            Undo
          </button>
        ) : null}
      </div>

      {/* Attachments */}
      {attachable.length > 0 ? (
        <div className="mt-3">
          <div className="label">Attachments</div>
          <div className="flex flex-wrap gap-2">
            {attachable.map((d) => {
              const checked = attachments.has(d.id);
              return (
                <label key={d.id} className={`chip ${checked ? "border-brand-400 bg-brand-50 text-brand-800" : ""}`}>
                  <input
                    type="checkbox"
                    className="tick size-3.5"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(attachments);
                      if (e.target.checked) next.add(d.id);
                      else next.delete(d.id);
                      setAttachments(next);
                    }}
                  />
                  <Paperclip className="size-3" />
                  <span className="max-w-[260px] truncate">{d.filename}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {notice ? (
        <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${notice.tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-brand-50 text-brand-800"}`}>
          {notice.text}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-4">
        {props.smtpConfigured ? (
          <button type="button" className="btn-primary" disabled={busy !== null || drafting} onClick={() => send("smtp")}>
            <Send className="size-4" />
            {busy === "smtp" ? "Sending…" : "Send email"}
          </button>
        ) : null}
        <button type="button" className={props.smtpConfigured ? "btn-secondary" : "btn-primary"} disabled={busy !== null || drafting} onClick={() => send("eml")}>
          <Download className="size-4" />
          {busy === "eml" ? "Preparing…" : "Open in Outlook (.eml)"}
        </button>
        <button type="button" className="btn-ghost" disabled={busy !== null || drafting} onClick={() => send("manual")} title="Record this email as sent from your own mailbox">
          Log as sent
        </button>
        <span className="flex-1" />
        <button
          type="button"
          className="btn-ghost"
          disabled={pending || drafting}
          onClick={() =>
            startTransition(async () => {
              await addNoteAction(request.id, body);
              setBody(defaultBody(request, me));
              caretPlaced.current = false;
              setNotice({ tone: "ok", text: "Saved as an internal note." });
            })
          }
        >
          <StickyNote className="size-4" />
          Save as internal note
        </button>
      </div>
      {!props.smtpConfigured ? (
        <p className="mt-2 text-[11px] text-ink-400">Direct sending is off (no SMTP configured). The .eml opens in Outlook with the attachments in place.</p>
      ) : null}
    </div>
  );
}
