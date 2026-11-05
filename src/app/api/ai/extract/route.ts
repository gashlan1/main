import { NextResponse } from "next/server";
import PostalMime from "postal-mime";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth";
import { AiError, extractInquiry, toAiError, type InquiryExtraction } from "@/lib/ai";

const MAX_EML_BYTES = 15 * 1024 * 1024;

type Parsed = { from: string; fromName: string; fromAddress: string; subject: string; date: string; text: string };

function stripHtml(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/tr>|<\/li>|<\/h\d>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

async function parseEml(bytes: ArrayBuffer): Promise<Parsed> {
  const email = await PostalMime.parse(bytes);
  const text = (email.text?.trim() || (email.html ? stripHtml(email.html) : "")).trim();
  return {
    from: email.from ? `${email.from.name ?? ""} <${email.from.address ?? ""}>`.trim() : "",
    fromName: email.from?.name ?? "",
    fromAddress: email.from?.address ?? "",
    subject: email.subject ?? "",
    date: email.date ?? "",
    text,
  };
}

/** Pasted email text: pick up "From:", "Subject:" and "Sent/Date:" lines when present. */
function parsePastedText(text: string): Parsed {
  const header = (name: string) => text.match(new RegExp(`^${name}:\\s*(.+)$`, "im"))?.[1]?.trim() ?? "";
  const from = header("From");
  const fromMatch = from.match(/^"?([^"<]*)"?\s*<([^>]+)>/) ?? from.match(/^([^\s@]+@[^\s@]+)$/);
  const fromName = fromMatch ? (fromMatch.length > 2 ? fromMatch[1].trim() : "") : from.replace(/<.*>/, "").trim();
  const fromAddress = fromMatch ? (fromMatch.length > 2 ? fromMatch[2] : fromMatch[1]) : (text.match(/[^\s<>"',;]+@[^\s<>"',;]+\.[a-z]{2,}/i)?.[0] ?? "");
  const rawDate = header("Date") || header("Sent");
  const date = rawDate && !Number.isNaN(new Date(rawDate).getTime()) ? new Date(rawDate).toISOString() : "";
  const body = text.replace(/^(From|To|Cc|Subject|Date|Sent):.*$/gim, "").trim();
  return { from, fromName, fromAddress, subject: header("Subject"), date, text: body };
}

/** Used when the AI is unavailable: enough to pre-fill the form from the headers. */
function heuristic(p: Parsed): InquiryExtraction {
  const name = p.fromName || p.fromAddress.split("@")[0].replace(/[._-]+/g, " ");
  return {
    contactName: name,
    salutation: "",
    company: "",
    email: p.fromAddress,
    phone: "",
    country: "",
    serviceType: "",
    activities: "",
    summary: p.subject,
    details: p.text,
    questions: [],
    receivedAt: p.date ? new Date(p.date).toISOString() : "",
  };
}

export async function POST(request: Request) {
  try {
    await requireUserOrThrow();
    const type = request.headers.get("content-type") ?? "";
    let parsed: Parsed;
    if (type.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose an .eml file." }, { status: 400 });
      if (file.size > MAX_EML_BYTES) return NextResponse.json({ error: "The email file is larger than 15 MB." }, { status: 413 });
      parsed = await parseEml(await file.arrayBuffer());
    } else {
      const { text } = (await request.json()) as { text?: string };
      if (!text?.trim()) return NextResponse.json({ error: "Paste the email text first." }, { status: 400 });
      parsed = parsePastedText(text.trim());
    }

    const raw = [
      parsed.from ? `From: ${parsed.from}` : "",
      parsed.subject ? `Subject: ${parsed.subject}` : "",
      parsed.date ? `Date: ${parsed.date}` : "",
      "",
      parsed.text,
    ]
      .filter((l, i) => i > 2 || l)
      .join("\n");

    try {
      const extracted = await extractInquiry(raw);
      return NextResponse.json({ mode: "ai", extracted, parsed: { subject: parsed.subject, from: parsed.from, date: parsed.date } });
    } catch (err) {
      const aiErr = err instanceof AiError ? err : toAiError(err);
      return NextResponse.json({
        mode: "heuristic",
        extracted: heuristic(parsed),
        parsed: { subject: parsed.subject, from: parsed.from, date: parsed.date },
        aiError: aiErr.message,
      });
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Could not read that email" }, { status: 500 });
  }
}
