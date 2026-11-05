import { NextResponse } from "next/server";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth";
import { suggestProposal, toAiError } from "@/lib/ai";
import { getCatalog } from "@/lib/proposals";
import { getRequest } from "@/lib/requests";

/** AI suggestion of phases, SSIC rows and key points for the proposal builder. */
export async function POST(request: Request) {
  try {
    await requireUserOrThrow();
    const { requestId } = (await request.json()) as { requestId?: string };
    if (!requestId) return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    const req = await getRequest(requestId);
    if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    const catalog = await getCatalog();

    const suggestion = await suggestProposal({
      request: {
        ref: req.ref,
        contactName: req.contactName,
        salutation: req.salutation,
        company: req.company,
        email: req.email,
        country: req.country,
        serviceType: req.serviceType,
        activities: req.activities,
        summary: req.summary,
        details: req.details,
        status: req.status,
      },
      services: catalog.services.map((s) => ({ key: s.key, title: s.title, route: s.route, description: s.description, fee: s.fee })),
      activities: catalog.activities.map((a) => ({ code: a.code, activity: a.activity, authority: a.authority, license: a.license })),
    });
    return NextResponse.json(suggestion);
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    const aiErr = toAiError(err);
    return NextResponse.json({ error: aiErr.message }, { status: aiErr.status });
  }
}
