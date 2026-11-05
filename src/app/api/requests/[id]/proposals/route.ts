import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth";
import { proposalDataSchema } from "@/lib/proposal-schema";
import { createProposalVersion } from "@/lib/proposals";
import { getRequest } from "@/lib/requests";

/** Generate a new proposal version (PDFs + record) from the builder's JSON. */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUserOrThrow();
    const { id } = await ctx.params;
    const req = await getRequest(id);
    if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const parsed = proposalDataSchema.safeParse((await request.json())?.data);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: `Check the proposal: ${issue.path.join(".")} ${issue.message}` }, { status: 400 });
    }

    const { proposal, attachments } = await createProposalVersion(req, parsed.data, me.id);
    revalidatePath(`/portal/requests/${id}`);
    revalidatePath("/portal");
    return NextResponse.json({ proposalId: proposal.id, version: proposal.version, docIds: attachments.map((a) => a.id) });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Could not generate the proposal" }, { status: 500 });
  }
}
