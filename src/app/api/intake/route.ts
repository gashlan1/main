import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { SERVICE_TYPES } from "@/lib/firm";
import { notifyNewInquiry } from "@/lib/mailer";
import { createRequest } from "@/lib/requests";

/**
 * Public inquiry endpoint used by /intake and by the firm's website form.
 * Accepts JSON or form-encoded bodies.
 */

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

type IntakeBody = Record<string, string | undefined>;

async function readBody(request: Request): Promise<IntakeBody> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return (await request.json()) as IntakeBody;
  const form = await request.formData();
  const out: IntakeBody = {};
  form.forEach((v, k) => {
    if (typeof v === "string") out[k] = v;
  });
  return out;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });

  let body: IntakeBody;
  try {
    body = await readBody(request);
  } catch {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }
  // Honeypot: real visitors never fill this.
  if (body.website) return NextResponse.json({ ok: true, ref: "INQ-0000-X-XXXX" });

  const get = (k: string) => (body[k] ?? "").toString().trim().slice(0, 4000);
  const contactName = get("contactName") || get("name");
  const email = get("email");
  const details = get("details") || get("message");
  if (!contactName || !email || !details) {
    return NextResponse.json({ error: "Name, email and a description of your inquiry are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const serviceType = get("serviceType");
  const row = await createRequest(
    {
      source: "website",
      salutation: ["Mr.", "Ms.", "Dr.", "Eng."].includes(get("salutation")) ? get("salutation") : null,
      contactName,
      company: get("company") || null,
      email,
      phone: get("phone") || null,
      country: get("country") || null,
      serviceType: serviceType || (SERVICE_TYPES as readonly string[])[SERVICE_TYPES.length - 1],
      activities: get("activities") || null,
      details,
      summary: get("company") ? `${get("company")} — ${serviceType || "inquiry"}` : null,
    },
    null,
  );
  revalidatePath("/");

  const base = process.env.APP_URL || new URL(request.url).origin;
  await notifyNewInquiry({
    ref: row.ref,
    contactName: row.contactName,
    company: row.company,
    serviceType: row.serviceType,
    summary: row.summary,
    link: `${base}/requests/${row.id}`,
  });

  return NextResponse.json({ ok: true, ref: row.ref });
}
