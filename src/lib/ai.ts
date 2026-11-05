import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat, betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { FIRM, SERVICE_TYPES } from "./firm";

export const AI_MODEL = "claude-opus-5-5";
// Server-side fallback: a safety-classifier decline is retried on the model
// Anthropic recommends for that category instead of surfacing as a failure.
const BETAS = ["server-side-fallback-2026-07-01"];

let cached: Anthropic | null = null;
function client(): Anthropic {
  return (cached ??= new Anthropic());
}

export class AiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "AiError";
    this.status = status;
  }
}

/** Map SDK failures to a message the portal can show. */
export function toAiError(err: unknown): AiError {
  if (err instanceof AiError) return err;
  if (err instanceof Anthropic.AuthenticationError) {
    return new AiError("AI assistance is not configured on this server (set ANTHROPIC_API_KEY).", 503);
  }
  if (err instanceof Anthropic.RateLimitError) return new AiError("The AI service is busy; try again in a moment.", 429);
  if (err instanceof Anthropic.APIConnectionError) return new AiError("Could not reach the AI service.", 502);
  if (err instanceof Anthropic.APIError) return new AiError(`AI request failed (${err.status}): ${err.message}`, 502);
  if (err instanceof Error && /authentication method/i.test(err.message)) {
    return new AiError("AI assistance is not configured on this server (set ANTHROPIC_API_KEY).", 503);
  }
  return new AiError(err instanceof Error ? err.message : "AI request failed", 500);
}

const FIRM_CONTEXT = `You are the drafting assistant inside the staff portal of ${FIRM.name} (${FIRM.legalName}), a Saudi law firm in Jeddah and Riyadh. The firm helps foreign investors set up in Saudi Arabia: companies in Special Economic Zones (licensed through the Economic Cities and Special Zones Authority, ECZA), 100% foreign-owned companies under Ministry of Investment (MISA) licenses, branches of foreign companies, regional headquarters (RHQ), and the related registrations (Ministry of Commerce, ZATCA, GOSI, National Address, Qiwa, Mudad, Muqeem, the Saudi Council of Engineers and other sector regulators). Activities are matched to the Saudi Classification of Economic Activities (SSIC, July 2025).

Everything you produce is reviewed by a staff member before it reaches a client.`;

const DRAFT_STYLE = `

House style for client emails — follow it closely:
- Formal, warm and concise. Short paragraphs. American spelling. No exclamation marks, no marketing language, no bullet symbols.
- Open with "Dear {Mr./Ms.} {Surname}," and close with "Sincerely," followed by the sender's name and title on separate lines.
- When documents are enclosed, list them numbered and padded, e.g. "01  Fixed-Fee Proposal, dated October 14, 2026".
- Quote fees as "SAR 57,500, exclusive of VAT". Refer to the proposal's phases by their numbers and titles.
- Never invent fees, dates, deadlines, legal requirements, document names or government positions: use only the facts in the context you are given. If something is unknown, ask the client for it or leave a bracketed placeholder such as [date].
- When one-click sentences are supplied, include each of them, verbatim or minimally adapted, in a natural position.
- State requirements plainly and end with clear next steps.
- Output plain text only (no markdown, no subject line), ready to paste into an email.`;

export type DraftInput = {
  replyKind: "proposal" | "info_request" | "status" | "general";
  request: {
    ref: string;
    contactName: string;
    salutation: string | null;
    company: string | null;
    email: string | null;
    country: string | null;
    serviceType: string | null;
    activities: string | null;
    summary: string | null;
    details: string | null;
    status: string;
  };
  timeline: string;
  proposal: string | null;
  sentences: string[];
  instructions: string;
  author: { name: string; title: string | null };
};

const REPLY_KIND_GUIDE: Record<DraftInput["replyKind"], string> = {
  proposal:
    "Cover email for the attached fixed-fee proposal: thank the client for the inquiry, list the attachments, state the total fee and the number of phases, flag the one or two points that bear on the route, say what you need from the client, explain how to proceed (sign the approval block, return the required documents), state the validity date, and offer a call.",
  info_request: "Ask the client for the specific information or documents needed to move forward, explaining briefly why each item is needed.",
  status: "Give the client a clear update on where the matter stands and what happens next.",
  general: "Reply to the client's latest message, answering what was asked.",
};

function draftUserMessage(input: DraftInput): string {
  const r = input.request;
  const lines = [
    `Reply type: ${input.replyKind} — ${REPLY_KIND_GUIDE[input.replyKind]}`,
    "",
    "Request context:",
    `- Reference: ${r.ref}`,
    `- Contact: ${[r.salutation, r.contactName].filter(Boolean).join(" ")}${r.company ? ` (${r.company})` : ""}`,
    `- Email: ${r.email ?? "unknown"}`,
    `- Country: ${r.country ?? "unknown"}`,
    `- Service: ${r.serviceType ?? "unknown"}`,
    `- Activities: ${r.activities ?? "not stated"}`,
    `- Status: ${r.status}`,
    `- Summary: ${r.summary ?? "none"}`,
    "",
    "Client's inquiry:",
    r.details ?? "(no text on file)",
    "",
    "Recent timeline (oldest first):",
    input.timeline || "(none)",
    "",
    "Latest fee proposal:",
    input.proposal ?? "(no proposal yet — do not quote fees)",
    "",
    "One-click sentences the staff member selected (include each):",
    input.sentences.length ? input.sentences.map((s) => `- ${s}`).join("\n") : "(none)",
    "",
    `Staff instructions: ${input.instructions || "(none)"}`,
    "",
    `Sender: ${input.author.name}${input.author.title ? `, ${input.author.title}` : ""} — sign the email with this name and title, and nothing else after it.`,
    "",
    "Write the email now.",
  ];
  return lines.join("\n");
}

/** Streams a client-ready email draft. The route handler forwards the text deltas. */
export function streamClientReply(input: DraftInput) {
  return client().beta.messages.stream({
    model: AI_MODEL,
    max_tokens: 6000,
    betas: BETAS,
    fallbacks: "default",
    output_config: { effort: "medium" },
    system: [{ type: "text", text: FIRM_CONTEXT + DRAFT_STYLE, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: draftUserMessage(input) }],
  });
}

export const InquiryExtraction = z.object({
  contactName: z.string().describe("Full name of the person who wrote, without honorific"),
  salutation: z.enum(["Mr.", "Ms.", "Dr.", "Eng.", ""]).describe("Honorific if it can be inferred; empty if unsure"),
  company: z.string().describe("Company or organization name, empty if not stated"),
  email: z.string().describe("Sender's email address, empty if not visible"),
  phone: z.string().describe("Phone number, empty if not stated"),
  country: z.string().describe("Country where the client or parent company is based, empty if not stated"),
  serviceType: z.string().describe(`One of: ${SERVICE_TYPES.join(" | ")}`),
  activities: z.string().describe("The business activities the client wants to carry out in Saudi Arabia, in one or two sentences"),
  summary: z.string().describe("One sentence for the request queue, e.g. 'UK software firm wants a 100% foreign-owned LLC in Riyadh'"),
  details: z.string().describe("The client's message as clean plain text with signatures, disclaimers and quoted earlier emails removed"),
  questions: z.array(z.string()).describe("Explicit questions the client asked"),
  receivedAt: z.string().describe("ISO 8601 date-time of the client's message if present in the text, else empty"),
});
export type InquiryExtraction = z.infer<typeof InquiryExtraction>;

/** Turns a forwarded email or form submission into request fields. */
export async function extractInquiry(rawText: string): Promise<InquiryExtraction> {
  const response = await client().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 4000,
    betas: BETAS,
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(InquiryExtraction) },
    system:
      FIRM_CONTEXT +
      "\n\nExtract the incorporation inquiry from the message below. The message may be a forwarded email with headers and quoted replies: the client is the original sender, not the firm's staff. Leave fields empty rather than guessing.",
    messages: [{ role: "user", content: `<message>\n${rawText.slice(0, 60000)}\n</message>` }],
  });
  if (response.stop_reason === "refusal") throw new AiError("The AI declined to process this message.", 422);
  if (!response.parsed_output) throw new AiError("The AI response could not be parsed.", 502);
  return response.parsed_output;
}

export const ProposalSuggestion = z.object({
  serviceKeys: z.array(z.string()).describe("Catalog keys of the phases to include, in the order they should appear"),
  activities: z.array(
    z.object({
      code: z.string().describe("SSIC code copied from the catalog, or empty when the activity is not in the catalog"),
      activity: z.string().describe("Activity name as in the Saudi classification"),
      authority: z.string().describe("Licensing authority, or 'To be confirmed'"),
      license: z.string().describe("'YES — <Authority> License', 'No', or 'To be confirmed'"),
      remarks: z.string().describe("Which of the client's activities this matches; add 'SSIC code to be confirmed at filing' when the code is empty"),
      highlight: z.boolean().describe("true when an additional license is required"),
    }),
  ),
  keyPoints: z.array(z.string()).describe("Section 5 'Key Points': one sentence each, grounded in the request; when a regulatory position is uncertain, say it will be confirmed in Phase One"),
  routeNote: z.string().describe("Sentence for the fee note about the alternative route, e.g. 'If the mainland (MISA) route is followed instead, the same fees apply.' Empty if not applicable"),
  subject: z.string().describe("Proposal subject line in the firm's style, e.g. 'Fixed-Fee Proposal for Establishing an Engineering Design Company in a Saudi Special Economic Zone'"),
  intro: z.string().describe("Opening paragraph in the firm's style, referencing the inquiry reference and ending with 'The engagement covers the following phases:'"),
  activitySummary: z.string().describe("Two or three sentences for the activity table summary box"),
  rationale: z.string().describe("Two sentences for the staff member explaining the choices"),
});
export type ProposalSuggestion = z.infer<typeof ProposalSuggestion>;

export type SuggestInput = {
  request: DraftInput["request"];
  services: Array<{ key: string; title: string; route: string; description: string | null; fee: number }>;
  activities: Array<{ code: string | null; activity: string; authority: string | null; license: string | null }>;
};

/** Proposes phases, SSIC rows and key points for the tickbox builder. */
export async function suggestProposal(input: SuggestInput): Promise<ProposalSuggestion> {
  const r = input.request;
  const content = [
    "Request:",
    `- Reference: ${r.ref}`,
    `- Client: ${r.contactName}${r.company ? ` (${r.company})` : ""}, ${r.country ?? "country unknown"}`,
    `- Service: ${r.serviceType ?? "unknown"}`,
    `- Activities: ${r.activities ?? "not stated"}`,
    `- Inquiry: ${r.details ?? "(none)"}`,
    "",
    "Service catalog (key | title | route | fee SAR | description):",
    ...input.services.map((s) => `- ${s.key} | ${s.title} | ${s.route} | ${s.fee} | ${s.description ?? ""}`),
    "",
    "Verified SSIC activities (code | activity | authority | license):",
    ...input.activities.map((a) => `- ${a.code ?? ""} | ${a.activity} | ${a.authority ?? ""} | ${a.license ?? ""}`),
    "",
    "Rules: choose only catalog keys; put 'eligibility' first and 'residency' last when included; include 'sce_licensing' only for engineering activities; prefer SEZ phases for SEZ inquiries and MISA + CR phases for mainland inquiries. Use catalog SSIC codes only where they fit the client's activities; for activities outside the catalog add a row with an empty code. Keep key points factual and cautious.",
  ].join("\n");

  const response = await client().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 6000,
    betas: BETAS,
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(ProposalSuggestion) },
    system: FIRM_CONTEXT + "\n\nYou prepare the first draft of a fixed-fee proposal for a staff member to review.",
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") throw new AiError("The AI declined to prepare this suggestion.", 422);
  if (!response.parsed_output) throw new AiError("The AI response could not be parsed.", 502);
  return response.parsed_output;
}

export type SearchHit = {
  id: string;
  ref: string;
  status: string;
  contactName: string;
  company: string | null;
  country: string | null;
  serviceType: string | null;
  summary: string | null;
  assigneeName: string | null;
  updatedAt: string;
};

export type SearchDeps = {
  search: (query: string) => Promise<SearchHit[]>;
  list: (status: string) => Promise<SearchHit[]>;
};

/** Natural-language search: Claude runs the full-text search tool and answers from the hits. */
export async function aiSearch(question: string, deps: SearchDeps): Promise<{ answer: string; hits: SearchHit[] }> {
  const found = new Map<string, SearchHit>();
  const remember = (hits: SearchHit[]) => hits.forEach((h) => found.set(h.id, h));

  const searchTool = betaZodTool({
    name: "search_requests",
    description:
      "Full-text search over incorporation requests: client and company names, countries, activities, emails and notes. Every word must match (prefix matching), so prefer one or two distinctive words per call and run several calls for synonyms.",
    inputSchema: z.object({ query: z.string().describe("One or more keywords") }),
    run: async ({ query }) => {
      const hits = await deps.search(query);
      remember(hits);
      return hits.length ? JSON.stringify(hits) : "No matches.";
    },
  });
  const listTool = betaZodTool({
    name: "list_requests",
    description: "List requests by status: open (all active), new, in_review, awaiting_client, proposal_sent, engaged, closed, declined, or all.",
    inputSchema: z.object({ status: z.string().describe("A status keyword") }),
    run: async ({ status }) => {
      const hits = await deps.list(status);
      remember(hits);
      return hits.length ? JSON.stringify(hits) : "No requests.";
    },
  });

  const runner = client().beta.messages.toolRunner({
    model: AI_MODEL,
    max_tokens: 2000,
    betas: BETAS,
    fallbacks: "default",
    output_config: { effort: "low" },
    max_iterations: 6,
    system:
      FIRM_CONTEXT +
      `\n\nA staff member is searching the request desk. Use the tools to find the relevant requests, then answer in two to four plain sentences, citing requests by their reference (e.g. INQ-2026-J-DRVG). Today is ${new Date().toISOString().slice(0, 10)}. If nothing matches, say so.`,
    tools: [searchTool, listTool],
    messages: [{ role: "user", content: question }],
  });
  const final = await runner.runUntilDone();
  if (final.stop_reason === "refusal") throw new AiError("The AI declined this search.", 422);
  const answer = final.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  return { answer, hits: [...found.values()] };
}
