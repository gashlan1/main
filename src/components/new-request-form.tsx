"use client";

import { useActionState, useRef, useState } from "react";
import { FileUp, Sparkles, Wand2 } from "lucide-react";
import { createRequestAction } from "@/app/actions/requests";
import type { InquiryExtraction } from "@/lib/ai";
import { SERVICE_TYPES } from "@/lib/firm";
import { SALUTATIONS } from "@/lib/labels";

type Staff = { id: string; name: string };

type Fields = {
  source: string;
  salutation: string;
  contactName: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  serviceType: string;
  activities: string;
  summary: string;
  details: string;
  receivedAt: string;
};

const EMPTY: Fields = {
  source: "email",
  salutation: "",
  contactName: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  serviceType: "",
  activities: "",
  summary: "",
  details: "",
  receivedAt: "",
};

function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewRequestForm({ staff, meId }: { staff: Staff[]; meId: string }) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [pasted, setPasted] = useState("");
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);
  const [state, action, pending] = useActionState(createRequestAction, undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (k: keyof Fields, v: string) => setFields((f) => ({ ...f, [k]: v }));

  function applyExtraction(x: InquiryExtraction, mode: string, aiError?: string) {
    setFields((f) => ({
      ...f,
      source: "email",
      salutation: x.salutation || f.salutation,
      contactName: x.contactName || f.contactName,
      company: x.company || f.company,
      email: x.email || f.email,
      phone: x.phone || f.phone,
      country: x.country || f.country,
      serviceType: x.serviceType || f.serviceType,
      activities: x.activities || f.activities,
      summary: x.summary || f.summary,
      details: x.details || f.details,
      receivedAt: toLocalInput(x.receivedAt) || f.receivedAt,
    }));
    if (mode === "ai") setImportNote({ tone: "ok", text: `AI read the email${x.questions.length ? ` — the client asked: ${x.questions.join(" / ")}` : ""}. Check the fields, then create the request.` });
    else setImportNote({ tone: "warn", text: `Pre-filled from the email headers only (${aiError ?? "AI unavailable"}). Please complete the fields.` });
  }

  async function importEmail(input: { file?: File; text?: string }) {
    setImporting(true);
    setImportNote(null);
    try {
      let res: Response;
      if (input.file) {
        const fd = new FormData();
        fd.set("file", input.file);
        res = await fetch("/api/ai/extract", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/ai/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: input.text }) });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      applyExtraction(data.extracted as InquiryExtraction, data.mode, data.aiError);
    } catch (err) {
      setImportNote({ tone: "error", text: err instanceof Error ? err.message : "Import failed" });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Sparkles className="size-4 text-brand-700" />
            Import from an email
          </h2>
          <p className="mt-1 text-xs text-ink-500">Save the client&apos;s email from Outlook as .eml (or forward it to yourself and save it), then drop it here. AI fills in the details.</p>
          <button type="button" className="btn-dark mt-3 w-full" disabled={importing} onClick={() => fileRef.current?.click()}>
            <FileUp className="size-4" />
            {importing ? "Reading…" : "Choose .eml file"}
          </button>
          <input ref={fileRef} type="file" accept=".eml,message/rfc822" className="hidden" onChange={(e) => e.target.files?.[0] && void importEmail({ file: e.target.files[0] })} />
          <div className="my-3 flex items-center gap-2 text-[11px] uppercase tracking-wide text-ink-400">
            <span className="h-px flex-1 bg-ink-200" />
            or paste
            <span className="h-px flex-1 bg-ink-200" />
          </div>
          <textarea className="input" rows={6} placeholder="Paste the email text here…" value={pasted} onChange={(e) => setPasted(e.target.value)} />
          <button type="button" className="btn-secondary mt-2 w-full" disabled={importing || !pasted.trim()} onClick={() => void importEmail({ text: pasted })}>
            <Wand2 className="size-4" />
            Extract details
          </button>
          {importNote ? (
            <p className={`mt-3 rounded-lg px-3 py-2 text-xs ${importNote.tone === "ok" ? "bg-emerald-50 text-emerald-800" : importNote.tone === "warn" ? "bg-amber-50 text-amber-800" : "bg-brand-50 text-brand-800"}`}>
              {importNote.text}
            </p>
          ) : null}
        </div>
      </aside>

      <form action={action} className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Source</label>
            <select name="source" className="input" value={fields.source} onChange={(e) => update("source", e.target.value)}>
              <option value="email">Email</option>
              <option value="website">Website form</option>
              <option value="manual">Phone / in person</option>
            </select>
          </div>
          <div>
            <label className="label">Received</label>
            <input type="datetime-local" name="receivedAt" className="input" value={fields.receivedAt} onChange={(e) => update("receivedAt", e.target.value)} />
          </div>
          <div>
            <label className="label">Priority</label>
            <select name="priority" className="input" defaultValue="normal">
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[110px_1fr_1fr]">
          <div>
            <label className="label">Title</label>
            <select name="salutation" className="input" value={fields.salutation} onChange={(e) => update("salutation", e.target.value)}>
              <option value="">—</option>
              {SALUTATIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <Field label="Contact name *" name="contactName" value={fields.contactName} onChange={(v) => update("contactName", v)} required />
          <Field label="Company" name="company" value={fields.company} onChange={(v) => update("company", v)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Email" name="email" type="email" value={fields.email} onChange={(v) => update("email", v)} />
          <Field label="Phone" name="phone" value={fields.phone} onChange={(v) => update("phone", v)} />
          <Field label="Country" name="country" value={fields.country} onChange={(v) => update("country", v)} />
        </div>
        <div>
          <label className="label">Service</label>
          <input name="serviceType" list="new-service-types" className="input" value={fields.serviceType} onChange={(e) => update("serviceType", e.target.value)} placeholder="Choose or type" />
          <datalist id="new-service-types">
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <Field label="Activities" name="activities" value={fields.activities} onChange={(v) => update("activities", v)} placeholder="What the Saudi entity will do" />
        <Field label="Queue summary" name="summary" value={fields.summary} onChange={(v) => update("summary", v)} placeholder="One line for the request list" />
        <div>
          <label className="label">Inquiry text</label>
          <textarea name="details" rows={8} className="input" value={fields.details} onChange={(e) => update("details", e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
          <div className="flex items-center gap-3">
            <label className="label mb-0">Assign to</label>
            <select name="assigneeId" className="input w-48" defaultValue={meId}>
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            {state?.error ? <span className="text-sm text-brand-800">{state.error}</span> : null}
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Creating…" : "Create request"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} type={type} className="input" value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} />
    </div>
  );
}
