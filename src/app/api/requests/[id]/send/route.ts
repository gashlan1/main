import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth";
import { getDocument, readDocumentBytes } from "@/lib/documents";
import { buildEml, mailConfigured, sendMail, type OutgoingAttachment } from "@/lib/mailer";
import { markProposalSent } from "@/lib/proposals";
import { addEvent, getRequest, setStatus } from "@/lib/requests";

type SendBody = {
  to?: string;
  cc?: string;
  subject?: string;
  body?: string;
  attachmentIds?: string[];
  mode?: "smtp" | "eml" | "manual";
};

const EMAIL_LIST = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+(\s*[,;]\s*[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+)*$/;

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUserOrThrow();
    const { id } = await ctx.params;
    const req = await getRequest(id);
    if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const body = (await request.json()) as SendBody;
    const mode = body.mode ?? (mailConfigured() ? "smtp" : "eml");
    const to = (body.to ?? "").trim();
    const cc = (body.cc ?? "").trim();
    const subject = (body.subject ?? "").trim();
    const text = (body.body ?? "").trim();
    if (!to || !EMAIL_LIST.test(to)) return NextResponse.json({ error: "Enter a valid recipient address." }, { status: 400 });
    if (cc && !EMAIL_LIST.test(cc)) return NextResponse.json({ error: "Check the Cc address." }, { status: 400 });
    if (!subject) return NextResponse.json({ error: "Add a subject." }, { status: 400 });
    if (!text) return NextResponse.json({ error: "The message is empty." }, { status: 400 });
    if (mode === "smtp" && !mailConfigured()) {
      return NextResponse.json({ error: "SMTP is not configured on this server. Download the .eml instead." }, { status: 503 });
    }

    const attachments: OutgoingAttachment[] = [];
    const attachmentMeta: { id: string; filename: string }[] = [];
    const proposalIds = new Set<string>();
    for (const docId of (body.attachmentIds ?? []).slice(0, 10)) {
      const doc = await getDocument(docId);
      if (!doc || doc.requestId !== id) continue;
      attachments.push({ filename: doc.filename, content: await readDocumentBytes(doc), contentType: doc.mime });
      attachmentMeta.push({ id: doc.id, filename: doc.filename });
      if (doc.proposalId) proposalIds.add(doc.proposalId);
    }

    const mail = { to, cc: cc || undefined, subject, text, attachments };
    let emlBytes: Buffer | null = null;
    if (mode === "smtp") await sendMail(mail);
    else if (mode === "eml") emlBytes = await buildEml(mail);

    const deliveryLabel = mode === "smtp" ? "Sent to client" : mode === "eml" ? "Prepared for Outlook (.eml downloaded)" : "Sent manually (logged)";
    await addEvent(id, {
      type: "email_out",
      authorId: me.id,
      subject,
      body: text,
      meta: { to, cc: cc || undefined, attachments: attachmentMeta, delivery: mode, proposalId: [...proposalIds][0] },
    });
    for (const pid of proposalIds) await markProposalSent(pid);
    if (proposalIds.size > 0) await setStatus(id, "proposal_sent", me.id);
    else if (req.status === "new" || req.status === "in_review") await setStatus(id, "awaiting_client", me.id);

    revalidatePath(`/portal/requests/${id}`);
    revalidatePath("/portal");

    if (emlBytes) {
      const filename = `${req.ref} - ${subject.replace(/[\\/:*?"<>|]+/g, " ").slice(0, 80)}.eml`;
      return new NextResponse(new Uint8Array(emlBytes), {
        headers: {
          "Content-Type": "message/rfc822",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
          "X-Delivery": deliveryLabel,
        },
      });
    }
    return NextResponse.json({ ok: true, delivery: deliveryLabel });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Sending failed" }, { status: 500 });
  }
}
