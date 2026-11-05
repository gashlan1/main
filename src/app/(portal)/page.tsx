import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { REQUEST_STATUSES, type RequestStatus } from "@/db/schema";
import { listRequests, searchRequests, statusCounts, STATUS_LABELS, OPEN_STATUSES } from "@/lib/requests";
import { currentTimeMs } from "@/lib/dates";
import { RequestList } from "@/components/request-list";
import { SearchBar } from "@/components/search-bar";

type Search = { status?: string; mine?: string; q?: string };

function parseStatus(value: string | undefined): RequestStatus | "open" | "all" {
  if (!value || value === "open") return "open";
  if (value === "all") return "all";
  return (REQUEST_STATUSES as readonly string[]).includes(value) ? (value as RequestStatus) : "open";
}

export default async function QueuePage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser();
  const params = await searchParams;
  const status = parseStatus(params.status);
  const mine = params.mine === "1";
  const q = params.q?.trim() ?? "";

  const [counts, items, now] = await Promise.all([
    statusCounts(),
    q ? searchRequests(q) : listRequests({ status, assigneeId: mine ? user.id : undefined }),
    currentTimeMs(),
  ]);
  const openCount = OPEN_STATUSES.reduce((n, s) => n + counts[s], 0);

  const tabs: Array<{ key: string; label: string; count: number }> = [
    { key: "open", label: "Open", count: openCount },
    ...OPEN_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s], count: counts[s] })),
    { key: "closed", label: "Closed", count: counts.closed + counts.declined },
    { key: "all", label: "All", count: Object.values(counts).reduce((a, b) => a + b, 0) },
  ];

  const href = (key: string, mineFlag = mine) => `/?status=${key}${mineFlag ? "&mine=1" : ""}`;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Requests</h1>
          <p className="mt-1 text-sm text-ink-500">
            {openCount} open · {counts.new} new · {counts.awaiting_client} waiting on clients
          </p>
        </div>
        <Link href="/requests/new" className="btn-primary">
          <PlusCircle className="size-4" />
          New request
        </Link>
      </div>

      <div className="mb-5">
        <SearchBar initialQuery={q} />
      </div>

      {q ? (
        <div className="mb-4 flex items-center justify-between text-sm text-ink-600">
          <span>
            {items.length} result{items.length === 1 ? "" : "s"} for <strong>“{q}”</strong>
          </span>
          <Link href="/" className="btn-ghost btn-sm">
            Back to queue
          </Link>
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap gap-1" aria-label="Status">
            {tabs.map((tab) => {
              const active = (status === "closed" && tab.key === "closed") || (status === tab.key && tab.key !== "closed");
              return (
                <Link
                  key={tab.key}
                  href={href(tab.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    active ? "bg-ink-900 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 ${active ? "text-ink-300" : "text-ink-400"}`}>{tab.count}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex rounded-lg border border-ink-200 bg-white p-0.5 text-xs font-medium">
            <Link href={href(status, false)} className={`rounded-md px-3 py-1.5 ${!mine ? "bg-ink-900 text-white" : "text-ink-600"}`}>
              Everyone
            </Link>
            <Link href={href(status, true)} className={`rounded-md px-3 py-1.5 ${mine ? "bg-ink-900 text-white" : "text-ink-600"}`}>
              Mine
            </Link>
          </div>
        </div>
      )}

      <RequestList
        now={now}
        items={status === "closed" && !q ? items.filter((i) => i.status === "closed" || i.status === "declined") : items}
        emptyMessage={q ? "Nothing matched. Try fewer words, or switch to Ask AI." : "No requests in this view."}
      />
    </div>
  );
}
