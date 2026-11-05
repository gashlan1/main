import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activities,
  proposals,
  services,
  type Activity,
  type ProposalActivity,
  type ProposalData,
  type ProposalPhase,
  type ProposalRow,
  type RequestRow,
  type Service,
} from "@/db/schema";
import { DEFAULT_PROPOSAL_TEXT } from "./catalog";
import { addDays, formatLongDate, formatSar, nowIso } from "./dates";
import { storeDocument } from "./documents";
import { FIRM } from "./firm";
import { newId } from "./ids";
import { renderActivityTablePdf, renderProposalPdf } from "./pdf/render";
import { addEvent } from "./requests";

export type Catalog = { services: Service[]; activities: Activity[] };

export async function getCatalog(): Promise<Catalog> {
  const db = await getDb();
  const [svc, act] = await Promise.all([
    db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.sortOrder), asc(services.title)),
    db.select().from(activities).where(eq(activities.active, true)).orderBy(asc(activities.sortOrder), asc(activities.code)),
  ]);
  return { services: svc, activities: act };
}

export function serviceToPhase(service: Pick<Service, "key" | "title" | "bullets" | "fee" | "duration">): ProposalPhase {
  return {
    key: service.key,
    title: service.title,
    bullets: [...service.bullets],
    fee: service.fee,
    duration: service.duration ?? "",
  };
}

export function activityToRow(activity: Pick<Activity, "code" | "activity" | "authority" | "license" | "remarks">): ProposalActivity {
  const license = activity.license ?? "";
  return {
    code: activity.code ?? "",
    activity: activity.activity,
    authority: activity.authority ?? "",
    license,
    remarks: activity.remarks ?? "",
    highlight: /^yes/i.test(license),
  };
}

export function proposalTotal(data: Pick<ProposalData, "phases">): number {
  return data.phases.reduce((sum, p) => sum + (Number(p.fee) || 0), 0);
}

/** Pick sensible default phases from the request's service type. */
export function defaultServiceKeys(request: Pick<RequestRow, "serviceType" | "activities" | "details">, catalog: Catalog): string[] {
  const type = (request.serviceType ?? "").toLowerCase();
  const text = `${request.activities ?? ""} ${request.details ?? ""}`.toLowerCase();
  const keys = ["eligibility"];
  if (type.includes("sez") || type.includes("economic zone")) keys.push("sez_licensing");
  else if (type.includes("branch")) keys.push("branch");
  else if (type.includes("rhq") || type.includes("headquarters")) keys.push("rhq");
  else if (type.includes("trademark")) return ["trademark"];
  else keys.push("misa_license", "cr_aoa");
  keys.push("gov_registrations");
  if (/engineer/.test(text) || type.includes("engineering")) keys.push("sce_licensing");
  keys.push("residency");
  const available = new Set(catalog.services.map((s) => s.key));
  return keys.filter((k) => available.has(k));
}

export type DefaultProposalOptions = {
  serviceKeys?: string[];
  activityCodes?: string[];
  dateG?: string;
};

export function buildDefaultProposal(request: RequestRow, catalog: Catalog, opts: DefaultProposalOptions = {}): ProposalData {
  const keys = opts.serviceKeys ?? defaultServiceKeys(request, catalog);
  const byKey = new Map(catalog.services.map((s) => [s.key, s]));
  const phases = keys.map((k) => byKey.get(k)).filter((s): s is Service => Boolean(s)).map(serviceToPhase);

  const codes = new Set(opts.activityCodes ?? []);
  const rows = catalog.activities.filter((a) => a.code && codes.has(a.code)).map(activityToRow);

  const salutation = request.salutation ? `${request.salutation} ` : "";
  const surname = request.contactName.trim().split(/\s+/).pop() ?? request.contactName;
  const engagement = describeEngagement(request);
  const isSez = /sez|economic zone/i.test(request.serviceType ?? "");

  return {
    addresseeName: `${salutation}${request.contactName}`.trim(),
    addresseeCompany: request.company ?? "",
    salutationLine: `Dear ${salutation}${surname},`,
    subject: `Fixed-Fee Proposal for ${engagement.subject}`,
    intro: `Further to your ${request.source === "website" ? "website " : ""}inquiry (Ref. ${request.ref}), we are pleased to submit our fixed-fee proposal for ${engagement.body}. The engagement covers the following phases:`,
    phases,
    includedEmployees: 2,
    perEmployeeFee: 1500,
    routeNote: isSez ? "If the mainland (MISA) route is followed instead, the same fees apply." : "",
    governmentFees: DEFAULT_PROPOSAL_TEXT.governmentFees,
    thirdPartyCosts: DEFAULT_PROPOSAL_TEXT.thirdPartyCosts,
    requiredDocuments: [...DEFAULT_PROPOSAL_TEXT.requiredDocuments],
    keyPoints: [],
    recurringCosts: DEFAULT_PROPOSAL_TEXT.recurringCosts,
    overallTimeline: estimateOverall(phases),
    timelineNote: DEFAULT_PROPOSAL_TEXT.timelineNote,
    paymentTerms: DEFAULT_PROPOSAL_TEXT.paymentTerms,
    phaseOneOnlyClause: true,
    validityDays: 30,
    signatoryName: FIRM.defaultSignatory.name,
    signatoryTitle: FIRM.defaultSignatory.title,
    includeActivityTable: rows.length > 0,
    activityTableTitle: DEFAULT_PROPOSAL_TEXT.activityTableTitle,
    activityTableSubtitle: DEFAULT_PROPOSAL_TEXT.activityTableSubtitle,
    activities: rows,
    activitySummary: "",
    activityNote: DEFAULT_PROPOSAL_TEXT.activityNote,
    dateG: opts.dateG ?? nowIso().slice(0, 10),
  };
}

function describeEngagement(request: RequestRow): { subject: string; body: string } {
  const type = request.serviceType ?? "";
  if (/sez|economic zone/i.test(type)) {
    return {
      subject: "Establishing a Company in a Saudi Special Economic Zone",
      body: "establishing a company in a Saudi Special Economic Zone (SEZ)",
    };
  }
  if (/branch/i.test(type)) return { subject: "Registering a Branch of a Foreign Company in Saudi Arabia", body: "registering a branch of a foreign company in Saudi Arabia" };
  if (/rhq|headquarters/i.test(type)) return { subject: "Establishing a Regional Headquarters in Saudi Arabia", body: "establishing a regional headquarters (RHQ) in Saudi Arabia" };
  if (/trademark/i.test(type)) return { subject: "Trademark Registration in Saudi Arabia", body: "registering your trademark in Saudi Arabia" };
  return {
    subject: "Establishing a 100% Foreign-Owned Company in Saudi Arabia",
    body: "establishing a 100% foreign-owned company in Saudi Arabia under a Ministry of Investment (MISA) license",
  };
}

/** Rough overall estimate from the phase durations, e.g. "3–5 months". */
export function estimateOverall(phases: ProposalPhase[]): string {
  let min = 0;
  let max = 0;
  for (const p of phases) {
    const m = p.duration.match(/(\d+)\s*[–-]\s*(\d+)\s*(week|month)/i);
    if (!m) continue;
    const factor = m[3].toLowerCase().startsWith("month") ? 4.33 : 1;
    min += Number(m[1]) * factor;
    max += Number(m[2]) * factor;
  }
  if (max === 0) return "To be confirmed";
  // Phases overlap in practice; the sample quotes 3–5 months for 11–22 weeks of phases.
  const lo = Math.max(1, Math.round((min * 0.6) / 4.33));
  const hi = Math.max(lo + 1, Math.round((max * 0.9) / 4.33));
  return `${lo}–${hi} months`;
}

export function proposalValidUntil(data: Pick<ProposalData, "dateG" | "validityDays">): string {
  return formatLongDate(`${addDays(`${data.dateG}T00:00:00Z`, data.validityDays)}T00:00:00Z`);
}

export function proposalFilenames(ref: string): { proposal: string; table: string } {
  return {
    proposal: `01 Fixed-Fee Proposal (AGLC) - ${ref}.pdf`,
    table: `02 Activity Matching and Licensing Table (AGLC) - ${ref}.pdf`,
  };
}

export async function listProposals(requestId: string): Promise<ProposalRow[]> {
  const db = await getDb();
  return db.select().from(proposals).where(eq(proposals.requestId, requestId)).orderBy(desc(proposals.version));
}

export async function getProposal(id: string): Promise<ProposalRow | null> {
  const db = await getDb();
  const [row] = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  return row ?? null;
}

export async function getLatestProposal(requestId: string): Promise<ProposalRow | null> {
  const [latest] = await listProposals(requestId);
  return latest ?? null;
}

/** Render the PDFs, store them as documents and record a new proposal version. */
export async function createProposalVersion(
  request: Pick<RequestRow, "id" | "ref">,
  data: ProposalData,
  userId: string | null,
  options: { createdAt?: string } = {},
): Promise<{ proposal: ProposalRow; attachments: { id: string; filename: string }[] }> {
  const db = await getDb();
  const [latest] = await listProposals(request.id);
  const version = (latest?.version ?? 0) + 1;
  const id = newId();
  const names = proposalFilenames(request.ref);
  const total = proposalTotal(data);

  const proposalPdf = await renderProposalPdf(data, request.ref);
  const proposalDoc = await storeDocument({
    requestId: request.id,
    category: "proposal",
    filename: names.proposal,
    mime: "application/pdf",
    bytes: proposalPdf,
    uploadedBy: userId,
    proposalId: id,
  });

  let tableDocId: string | null = null;
  const attachments = [{ id: proposalDoc.id, filename: proposalDoc.filename }];
  if (data.includeActivityTable && data.activities.length > 0) {
    const tablePdf = await renderActivityTablePdf(data);
    const tableDoc = await storeDocument({
      requestId: request.id,
      category: "activity_table",
      filename: names.table,
      mime: "application/pdf",
      bytes: tablePdf,
      uploadedBy: userId,
      proposalId: id,
    });
    tableDocId = tableDoc.id;
    attachments.push({ id: tableDoc.id, filename: tableDoc.filename });
  }

  const [proposal] = await db
    .insert(proposals)
    .values({
      id,
      requestId: request.id,
      version,
      status: "generated",
      data,
      total,
      proposalDocId: proposalDoc.id,
      tableDocId,
      createdBy: userId,
      createdAt: options.createdAt ?? nowIso(),
    })
    .returning();

  await addEvent(request.id, {
    type: "proposal",
    authorId: userId,
    subject: `Fixed-Fee Proposal v${version} generated — SAR ${formatSar(total)} across ${data.phases.length} phase${data.phases.length === 1 ? "" : "s"}`,
    meta: { proposalId: id, attachments },
    createdAt: options.createdAt,
  });

  return { proposal, attachments };
}

export async function markProposalSent(id: string, sentAt = nowIso()): Promise<void> {
  const db = await getDb();
  await db.update(proposals).set({ status: "sent", sentAt }).where(eq(proposals.id, id));
}
