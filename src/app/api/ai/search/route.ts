import { NextResponse } from "next/server";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth";
import { aiSearch, toAiError, type SearchHit } from "@/lib/ai";
import { listRequests, searchRequests, type RequestListItem } from "@/lib/requests";
import { REQUEST_STATUSES, type RequestStatus } from "@/db/schema";

function toHit(item: RequestListItem): SearchHit {
  return {
    id: item.id,
    ref: item.ref,
    status: item.status,
    contactName: item.contactName,
    company: item.company,
    country: item.country,
    serviceType: item.serviceType,
    summary: item.summary,
    assigneeName: item.assigneeName,
    updatedAt: item.updatedAt,
  };
}

export async function POST(request: Request) {
  try {
    await requireUserOrThrow();
    const { question } = (await request.json()) as { question?: string };
    if (!question?.trim()) return NextResponse.json({ error: "Ask a question first." }, { status: 400 });

    const result = await aiSearch(question.trim(), {
      search: async (q) => (await searchRequests(q, 15)).map(toHit),
      list: async (status) => {
        const key = (REQUEST_STATUSES as readonly string[]).includes(status) ? (status as RequestStatus) : status === "all" ? "all" : "open";
        return (await listRequests({ status: key, limit: 40 })).map(toHit);
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    const aiErr = toAiError(err);
    return NextResponse.json({ error: aiErr.message }, { status: aiErr.status });
  }
}
