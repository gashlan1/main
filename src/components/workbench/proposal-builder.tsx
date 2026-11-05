"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, FileCheck2, Plus, Sparkles, Trash2 } from "lucide-react";
import type { Activity, ProposalActivity, ProposalData, ProposalPhase, RequestRow, Service } from "@/db/schema";
import type { Catalog } from "@/lib/proposals";
import type { ProposalSuggestion } from "@/lib/ai";
import { FIRM } from "@/lib/firm";
import { addDays, formatLongDate, formatSar } from "@/lib/dates";

type Props = {
  request: RequestRow;
  catalog: Catalog;
  initialData: ProposalData;
  nextVersion: number;
  onCancel?: () => void;
  onGenerated: (docIds: string[]) => void;
};

function phaseFromService(s: Service): ProposalPhase {
  return { key: s.key, title: s.title, bullets: [...s.bullets], fee: s.fee, duration: s.duration ?? "" };
}

function rowFromActivity(a: Activity): ProposalActivity {
  const license = a.license ?? "";
  return { code: a.code ?? "", activity: a.activity, authority: a.authority ?? "", license, remarks: a.remarks ?? "", highlight: /^yes/i.test(license) };
}

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);
}

export function ProposalBuilder({ request, catalog, initialData, nextVersion, onCancel, onGenerated }: Props) {
  const router = useRouter();
  const [data, setData] = useState<ProposalData>(initialData);
  const [busy, setBusy] = useState<"suggest" | "preview" | "generate" | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [rationale, setRationale] = useState<string | null>(null);
  const [openPhase, setOpenPhase] = useState<string | null>(null);

  const set = <K extends keyof ProposalData>(key: K, value: ProposalData[K]) => setData((d) => ({ ...d, [key]: value }));

  const total = useMemo(() => data.phases.reduce((s, p) => s + (Number(p.fee) || 0), 0), [data.phases]);
  const selectedKeys = useMemo(() => new Set(data.phases.map((p) => p.key)), [data.phases]);
  const selectedCodes = useMemo(() => new Set(data.activities.map((a) => a.code).filter(Boolean)), [data.activities]);
  const validUntil = formatLongDate(`${addDays(`${data.dateG}T00:00:00Z`, data.validityDays)}T00:00:00Z`);

  function togglePhase(service: Service, on: boolean) {
    setData((d) => {
      if (!on) return { ...d, phases: d.phases.filter((p) => p.key !== service.key) };
      if (d.phases.some((p) => p.key === service.key)) return d;
      // Keep catalog order for catalog phases; custom phases stay where they are.
      const order = new Map(catalog.services.map((s, i) => [s.key, i]));
      const next = [...d.phases, phaseFromService(service)].sort((a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999));
      return { ...d, phases: next };
    });
  }

  function updatePhase(key: string, patch: Partial<ProposalPhase>) {
    setData((d) => ({ ...d, phases: d.phases.map((p) => (p.key === key ? { ...p, ...patch } : p)) }));
  }

  function movePhase(index: number, dir: -1 | 1) {
    setData((d) => {
      const phases = [...d.phases];
      const target = index + dir;
      if (target < 0 || target >= phases.length) return d;
      [phases[index], phases[target]] = [phases[target], phases[index]];
      return { ...d, phases };
    });
  }

  function addCustomPhase() {
    const key = `custom-${Date.now().toString(36)}`;
    setData((d) => ({ ...d, phases: [...d.phases, { key, title: "New phase", bullets: [], fee: 0, duration: "" }] }));
    setOpenPhase(key);
  }

  function toggleActivity(a: Activity, on: boolean) {
    setData((d) => {
      if (!on) return { ...d, activities: d.activities.filter((r) => r.code !== a.code) };
      if (d.activities.some((r) => r.code === a.code)) return d;
      return { ...d, activities: [...d.activities, rowFromActivity(a)], includeActivityTable: true };
    });
  }

  function updateActivity(index: number, patch: Partial<ProposalActivity>) {
    setData((d) => ({ ...d, activities: d.activities.map((r, i) => (i === index ? { ...r, ...patch } : r)) }));
  }

  async function suggest() {
    setBusy("suggest");
    setNotice(null);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id }),
      });
      const s = (await res.json()) as ProposalSuggestion & { error?: string };
      if (!res.ok) throw new Error(s.error ?? "Suggestion failed");
      const byKey = new Map(catalog.services.map((svc) => [svc.key, svc]));
      const phases = s.serviceKeys.map((k) => byKey.get(k)).filter((svc): svc is Service => Boolean(svc)).map(phaseFromService);
      setData((d) => ({
        ...d,
        phases: phases.length ? phases : d.phases,
        activities: s.activities.length ? s.activities : d.activities,
        includeActivityTable: s.activities.length > 0 || d.includeActivityTable,
        keyPoints: s.keyPoints.length ? s.keyPoints : d.keyPoints,
        routeNote: s.routeNote || d.routeNote,
        subject: s.subject || d.subject,
        intro: s.intro || d.intro,
        activitySummary: s.activitySummary || d.activitySummary,
      }));
      setRationale(s.rationale);
      setNotice({ tone: "ok", text: "AI suggestion applied — review every tick before generating." });
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "Suggestion failed" });
    } finally {
      setBusy(null);
    }
  }

  async function preview(doc: "proposal" | "table") {
    setBusy("preview");
    setNotice(null);
    try {
      const res = await fetch(`/api/requests/${request.id}/proposals/preview${doc === "table" ? "?doc=table" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? "Preview failed");
      }
      const url = URL.createObjectURL(await res.blob());
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "Preview failed" });
    } finally {
      setBusy(null);
    }
  }

  async function generate() {
    if (data.phases.length === 0) {
      setNotice({ tone: "error", text: "Tick at least one phase." });
      return;
    }
    setBusy("generate");
    setNotice(null);
    try {
      const res = await fetch(`/api/requests/${request.id}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Generation failed");
      router.refresh();
      onGenerated(result.docIds as string[]);
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "Generation failed" });
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <div className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Fixed-fee proposal · version {nextVersion}</h2>
              <p className="mt-1 text-xs text-ink-500">Tick the phases and activities, adjust fees, then generate the letterhead PDFs.</p>
            </div>
            <div className="flex gap-2">
              {onCancel ? (
                <button type="button" className="btn-ghost btn-sm" onClick={onCancel}>
                  Cancel
                </button>
              ) : null}
              <button type="button" className="btn-primary btn-sm" disabled={busy !== null} onClick={suggest}>
                <Sparkles className="size-3.5" />
                {busy === "suggest" ? "Thinking…" : "Suggest with AI"}
              </button>
            </div>
          </div>
          {rationale ? <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900">{rationale}</p> : null}
          {notice ? (
            <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${notice.tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-brand-50 text-brand-800"}`}>
              {notice.text}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Text label="Addressee" value={data.addresseeName} onChange={(v) => set("addresseeName", v)} />
            <Text label="Company" value={data.addresseeCompany} onChange={(v) => set("addresseeCompany", v)} />
            <Text label="Salutation line" value={data.salutationLine} onChange={(v) => set("salutationLine", v)} />
            <div>
              <label className="label">Proposal date</label>
              <input type="date" className="input" value={data.dateG} onChange={(e) => set("dateG", e.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <Text label="Subject" value={data.subject} onChange={(v) => set("subject", v)} />
          </div>
          <div className="mt-3">
            <label className="label">Opening paragraph</label>
            <textarea className="input" rows={3} value={data.intro} onChange={(e) => set("intro", e.target.value)} />
          </div>
        </div>

        {/* Phases */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900">Phases and fees</h3>
            <button type="button" className="btn-secondary btn-sm" onClick={addCustomPhase}>
              <Plus className="size-3.5" />
              Custom phase
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {catalog.services.map((s) => {
              const on = selectedKeys.has(s.key);
              return (
                <label key={s.key} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${on ? "border-brand-300 bg-brand-50/60" : "border-ink-200 hover:bg-ink-50"}`}>
                  <input type="checkbox" className="tick mt-0.5" checked={on} onChange={(e) => togglePhase(s, e.target.checked)} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink-900">{s.title}</span>
                    <span className="block text-xs text-ink-500">
                      SAR {formatSar(s.fee)} · {s.duration} · {s.route === "both" ? "any route" : s.route === "sez" ? "SEZ route" : "mainland route"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          {data.phases.length > 0 ? (
            <ol className="mt-4 divide-y divide-ink-100 rounded-lg border border-ink-200">
              {data.phases.map((p, i) => {
                const open = openPhase === p.key;
                return (
                  <li key={p.key} className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-16 text-xs font-semibold uppercase text-ink-400">Phase {i + 1}</span>
                      <input className="input flex-1 py-1.5" value={p.title} onChange={(e) => updatePhase(p.key, { title: e.target.value })} aria-label="Phase title" />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-ink-500">SAR</span>
                        <input
                          type="number"
                          min={0}
                          step={500}
                          className="input w-28 py-1.5 text-right"
                          value={p.fee}
                          onChange={(e) => updatePhase(p.key, { fee: Number(e.target.value) || 0 })}
                          aria-label="Fee"
                        />
                      </div>
                      <input className="input w-28 py-1.5" value={p.duration} placeholder="e.g. 2–4 weeks" onChange={(e) => updatePhase(p.key, { duration: e.target.value })} aria-label="Duration" />
                      <button type="button" className="btn-ghost p-1.5" onClick={() => movePhase(i, -1)} disabled={i === 0} title="Move up">
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button type="button" className="btn-ghost p-1.5" onClick={() => movePhase(i, 1)} disabled={i === data.phases.length - 1} title="Move down">
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button type="button" className="btn-ghost btn-sm" onClick={() => setOpenPhase(open ? null : p.key)}>
                        {open ? "Hide scope" : `Scope (${p.bullets.length})`}
                      </button>
                      <button type="button" className="btn-ghost p-1.5 text-ink-400 hover:text-brand-700" title="Remove" onClick={() => set("phases", data.phases.filter((x) => x.key !== p.key))}>
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    {open ? (
                      <div className="mt-2">
                        <label className="label">Scope bullets (one per line)</label>
                        <textarea className="input" rows={4} defaultValue={p.bullets.join("\n")} onBlur={(e) => updatePhase(p.key, { bullets: linesToList(e.target.value) })} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-ink-500">No phases ticked yet.</p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Employees included</label>
              <input type="number" min={0} className="input" value={data.includedEmployees} onChange={(e) => set("includedEmployees", Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className="label">Fee per extra employee (SAR)</label>
              <input type="number" min={0} step={100} className="input" value={data.perEmployeeFee} onChange={(e) => set("perEmployeeFee", Number(e.target.value) || 0)} />
            </div>
            <Text label="Route note (after the fee table)" value={data.routeNote} onChange={(v) => set("routeNote", v)} />
          </div>
        </div>

        {/* Activities */}
        <div className="card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink-900">Activity Matching & Licensing Table</h3>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" className="tick" checked={data.includeActivityTable} onChange={(e) => set("includeActivityTable", e.target.checked)} />
              Enclose the table
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {catalog.activities.map((a) => {
              const on = Boolean(a.code) && selectedCodes.has(a.code ?? "");
              return (
                <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${on ? "border-brand-300 bg-brand-50/60" : "border-ink-200 hover:bg-ink-50"}`}>
                  <input type="checkbox" className="tick mt-0.5" checked={on} onChange={(e) => toggleActivity(a, e.target.checked)} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink-900">
                      <span className="font-mono text-xs text-ink-500">{a.code}</span> {a.activity}
                    </span>
                    <span className="block text-xs text-ink-500">
                      {a.authority} · {a.license}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {data.activities.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="py-1 pr-2">Code</th>
                    <th className="py-1 pr-2">Activity</th>
                    <th className="py-1 pr-2">Authority</th>
                    <th className="py-1 pr-2">License</th>
                    <th className="py-1 pr-2">Remarks</th>
                    <th className="py-1 pr-2">Flag</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.activities.map((r, i) => (
                    <tr key={i} className="border-t border-ink-100 align-top">
                      <td className="py-1 pr-2">
                        <input className="input w-20 py-1 font-mono text-xs" value={r.code} placeholder="TBC" onChange={(e) => updateActivity(i, { code: e.target.value })} />
                      </td>
                      <td className="py-1 pr-2">
                        <input className="input min-w-44 py-1" value={r.activity} onChange={(e) => updateActivity(i, { activity: e.target.value })} />
                      </td>
                      <td className="py-1 pr-2">
                        <input className="input min-w-36 py-1" value={r.authority} onChange={(e) => updateActivity(i, { authority: e.target.value })} />
                      </td>
                      <td className="py-1 pr-2">
                        <input className="input min-w-32 py-1" value={r.license} onChange={(e) => updateActivity(i, { license: e.target.value, highlight: /^yes/i.test(e.target.value) })} />
                      </td>
                      <td className="py-1 pr-2">
                        <input className="input min-w-44 py-1" value={r.remarks} onChange={(e) => updateActivity(i, { remarks: e.target.value })} />
                      </td>
                      <td className="py-2 pr-2 text-center">
                        <input type="checkbox" className="tick" checked={r.highlight} title="Highlight (license required)" onChange={(e) => updateActivity(i, { highlight: e.target.checked })} />
                      </td>
                      <td className="py-1">
                        <button type="button" className="btn-ghost p-1.5 text-ink-400 hover:text-brand-700" onClick={() => set("activities", data.activities.filter((_, j) => j !== i))} title="Remove row">
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => set("activities", [...data.activities, { code: "", activity: "", authority: "To be confirmed", license: "To be confirmed", remarks: "SSIC code to be confirmed at filing", highlight: false }])}
            >
              <Plus className="size-3.5" />
              Add a row not in the catalog
            </button>
          </div>
          <div className="mt-3">
            <label className="label">Summary box</label>
            <textarea className="input" rows={3} value={data.activitySummary} onChange={(e) => set("activitySummary", e.target.value)} placeholder="Two or three sentences summarizing the classification and licensing position." />
          </div>
        </div>

        {/* Notes */}
        <div className="card space-y-3 p-5">
          <h3 className="text-sm font-semibold text-ink-900">Sections 2–6</h3>
          <Area label="2. Government fees" value={data.governmentFees} onChange={(v) => set("governmentFees", v)} />
          <Area label="3. Third-party costs" value={data.thirdPartyCosts} onChange={(v) => set("thirdPartyCosts", v)} />
          <Lines label="4. Required documents (one per line)" value={data.requiredDocuments} onChange={(v) => set("requiredDocuments", v)} />
          <Lines label="5. Key points (one per line; leave empty to omit the section)" value={data.keyPoints} onChange={(v) => set("keyPoints", v)} />
          <Area label="6. Recurring annual costs" value={data.recurringCosts} onChange={(v) => set("recurringCosts", v)} />
        </div>

        {/* Timeline & terms */}
        <div className="card space-y-3 p-5">
          <h3 className="text-sm font-semibold text-ink-900">Timeline, terms and signature</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <Text label="Overall timeline" value={data.overallTimeline} onChange={(v) => set("overallTimeline", v)} />
            <div>
              <label className="label">Validity (days)</label>
              <input type="number" min={1} className="input" value={data.validityDays} onChange={(e) => set("validityDays", Number(e.target.value) || 30)} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" className="tick" checked={data.phaseOneOnlyClause} onChange={(e) => set("phaseOneOnlyClause", e.target.checked)} />
                Only Phase One payable if it cannot proceed
              </label>
            </div>
          </div>
          <Area label="Timeline note" value={data.timelineNote} onChange={(v) => set("timelineNote", v)} rows={2} />
          <Text label="Payment terms" value={data.paymentTerms} onChange={(v) => set("paymentTerms", v)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Text label="Signatory" value={data.signatoryName} onChange={(v) => set("signatoryName", v)} />
            <Text label="Signatory title" value={data.signatoryTitle} onChange={(v) => set("signatoryTitle", v)} />
          </div>
        </div>
      </div>

      {/* Totals */}
      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="card p-5">
          <div className="label">Professional fees</div>
          <div className="text-3xl font-semibold text-ink-900">SAR {formatSar(total)}</div>
          <div className="mt-1 text-xs text-ink-500">
            {data.phases.length} phase{data.phases.length === 1 ? "" : "s"} · + VAT {Math.round(FIRM.vatRate * 100)}% = SAR {formatSar(total * (1 + FIRM.vatRate))}
          </div>
          <dl className="mt-4 space-y-1 text-xs text-ink-600">
            {data.phases.map((p, i) => (
              <div key={p.key} className="flex justify-between gap-2">
                <dt className="truncate">
                  {i + 1}. {p.title}
                </dt>
                <dd className="shrink-0 font-medium">{formatSar(p.fee)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-500">
            Valid until <span className="font-medium text-ink-800">{validUntil}</span>
            <br />
            {data.includeActivityTable && data.activities.length > 0 ? `${data.activities.length} activity rows enclosed` : "No activity table"}
          </div>
          <div className="mt-4 space-y-2">
            <button type="button" className="btn-primary w-full" disabled={busy !== null} onClick={generate}>
              <FileCheck2 className="size-4" />
              {busy === "generate" ? "Generating PDFs…" : `Generate version ${nextVersion}`}
            </button>
            <button type="button" className="btn-secondary w-full" disabled={busy !== null} onClick={() => preview("proposal")}>
              <Eye className="size-4" />
              Preview proposal
            </button>
            {data.includeActivityTable && data.activities.length > 0 ? (
              <button type="button" className="btn-secondary w-full" disabled={busy !== null} onClick={() => preview("table")}>
                <Eye className="size-4" />
                Preview activity table
              </button>
            ) : null}
          </div>
          <p className="mt-3 text-[11px] text-ink-400">Generating stores both PDFs under Documents and attaches them to your next reply.</p>
        </div>
      </aside>
    </div>
  );
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Area({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Lines({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input" rows={Math.max(3, value.length + 1)} defaultValue={value.join("\n")} onBlur={(e) => onChange(linesToList(e.target.value))} />
    </div>
  );
}
