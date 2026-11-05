import { NextResponse } from "next/server";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth";
import { streamClientReply, toAiError, type DraftInput } from "@/lib/ai";
import { proposalForAi, timelineForAi } from "@/lib/context";
import { getRequestDetail } from "@/lib/requests";

const KINDS: DraftInput["replyKind"][] = ["proposal", "info_request", "status", "general"];

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  let me;
  try {
    me = await requireUserOrThrow();
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    throw err;
  }
  const { id } = await ctx.params;
  const detail = await getRequestDetail(id);
  if (!detail) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as {
    replyKind?: string;
    sentences?: string[];
    instructions?: string;
  };
  const replyKind = KINDS.includes(body.replyKind as DraftInput["replyKind"]) ? (body.replyKind as DraftInput["replyKind"]) : "general";
  const r = detail.request;

  const stream = streamClientReply({
    replyKind,
    request: {
      ref: r.ref,
      contactName: r.contactName,
      salutation: r.salutation,
      company: r.company,
      email: r.email,
      country: r.country,
      serviceType: r.serviceType,
      activities: r.activities,
      summary: r.summary,
      details: r.details,
      status: r.status,
    },
    timeline: timelineForAi(detail.events),
    proposal: proposalForAi(detail.proposals[0] ?? null),
    sentences: Array.isArray(body.sentences) ? body.sentences.filter((s) => typeof s === "string").slice(0, 20) : [],
    instructions: typeof body.instructions === "string" ? body.instructions.slice(0, 2000) : "",
    author: { name: me.name, title: me.title },
  });

  // Wait for the first event so configuration/auth problems become a JSON
  // error instead of an empty stream.
  const iterator = stream[Symbol.asyncIterator]();
  let first;
  try {
    first = await iterator.next();
  } catch (err) {
    const aiErr = toAiError(err);
    return NextResponse.json({ error: aiErr.message }, { status: aiErr.status });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (event: IteratorResult<unknown>) => {
        const ev = event.value as { type?: string; delta?: { type?: string; text?: string } } | undefined;
        if (ev?.type === "content_block_delta" && ev.delta?.type === "text_delta" && ev.delta.text) {
          controller.enqueue(encoder.encode(ev.delta.text));
        }
      };
      try {
        if (!first.done) push(first);
        for (let next = await iterator.next(); !next.done; next = await iterator.next()) push(next);
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\n[The AI declined to draft this message. Please write it manually.]"));
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n[AI error: ${toAiError(err).message}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
