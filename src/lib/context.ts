import type { ProposalRow, RequestEvent } from "@/db/schema";
import { formatDateTime, formatLongDate, formatSar } from "./dates";
import { proposalValidUntil } from "./proposals";
import type { RequestDetail } from "./requests";

/** Compact timeline text for AI prompts. */
export function timelineForAi(events: Array<RequestEvent & { authorName: string | null }>, max = 8): string {
  return events
    .filter((e) => ["email_in", "email_out", "note", "status", "proposal"].includes(e.type))
    .slice(-max)
    .map((e) => {
      const who = e.type === "email_in" ? "Client" : e.authorName ?? "Staff";
      const body = (e.body ?? "").replace(/\s+/g, " ").slice(0, 1200);
      return `[${formatDateTime(e.createdAt)}] ${e.type.toUpperCase()} by ${who}: ${e.subject ?? ""}${body ? ` — ${body}` : ""}`;
    })
    .join("\n");
}

/** Proposal summary for AI prompts. */
export function proposalForAi(p: ProposalRow | null): string | null {
  if (!p) return null;
  const d = p.data;
  const lines = [
    `Version ${p.version}, dated ${formatLongDate(`${d.dateG}T00:00:00Z`)}, status ${p.status}. Subject: ${d.subject}`,
    ...d.phases.map((ph, i) => `Phase ${i + 1}: ${ph.title} — SAR ${formatSar(ph.fee)} (${ph.duration})`),
    `Total professional fees: SAR ${formatSar(p.total)} exclusive of VAT across ${d.phases.length} phases.`,
    d.perEmployeeFee ? `Each employee beyond ${d.includedEmployees}: SAR ${formatSar(d.perEmployeeFee)}.` : "",
    d.routeNote,
    `Payment: ${d.paymentTerms}`,
    `Valid until ${proposalValidUntil(d)}.`,
    d.keyPoints.length ? `Key points: ${d.keyPoints.join(" | ")}` : "",
    d.includeActivityTable && d.activities.length ? `Activity table rows: ${d.activities.map((a) => `${a.code || "code TBC"} ${a.activity} (${a.license})`).join("; ")}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

/** Values the one-click sentence placeholders are filled from. */
export function placeholderContext(detail: RequestDetail, latest: ProposalRow | null): Record<string, string> {
  const r = detail.request;
  const d = latest?.data;
  const phaseOne = d?.phases[0];
  return {
    ref: r.ref,
    salutation: r.salutation ?? "",
    contactName: r.contactName,
    surname: r.contactName.trim().split(/\s+/).pop() ?? r.contactName,
    company: r.company ?? "",
    country: r.country ?? "",
    serviceDescription: r.serviceType ? `the incorporation of ${articleFor(r.serviceType)} in Saudi Arabia` : "",
    activityShort: r.activities ?? "",
    total: latest ? formatSar(latest.total) : "",
    phaseCount: d ? numberWord(d.phases.length) : "",
    phaseOneFee: phaseOne ? formatSar(phaseOne.fee) : "",
    validUntil: d ? proposalValidUntil(d) : "",
    proposalDate: d ? formatLongDate(`${d.dateG}T00:00:00Z`) : "",
  };
}

function articleFor(serviceType: string): string {
  const t = serviceType.replace(/\s*\(.*?\)\s*/g, " ").trim().toLowerCase();
  return /^[aeiou]/.test(t) ? `an ${t}` : `a ${t}`;
}

function numberWord(n: number): string {
  return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] ?? String(n);
}
