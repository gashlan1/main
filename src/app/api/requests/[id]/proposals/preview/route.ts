import { NextResponse } from "next/server";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth";
import { renderActivityTablePdf, renderProposalPdf } from "@/lib/pdf/render";
import { proposalDataSchema } from "@/lib/proposal-schema";
import { getRequest } from "@/lib/requests";

/** Render the proposal (or ?doc=table) without saving anything. */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireUserOrThrow();
    const { id } = await ctx.params;
    const req = await getRequest(id);
    if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const parsed = proposalDataSchema.safeParse((await request.json())?.data);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: `Check the proposal: ${issue.path.join(".")} ${issue.message}` }, { status: 400 });
    }
    const doc = new URL(request.url).searchParams.get("doc");
    const pdf = doc === "table" ? await renderActivityTablePdf(parsed.data) : await renderProposalPdf(parsed.data, req.ref);
    return new NextResponse(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=preview.pdf", "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Could not render the preview" }, { status: 500 });
  }
}
