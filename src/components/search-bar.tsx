"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "./status-badge";
import type { SearchHit } from "@/lib/ai";
import type { RequestStatus } from "@/db/schema";

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"keyword" | "ai">("keyword");
  const [query, setQuery] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const [aiState, setAiState] = useState<{ answer: string; hits: SearchHit[] } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (mode === "keyword") {
      startTransition(() => router.push(q ? `/portal?q=${encodeURIComponent(q)}` : "/portal"));
      return;
    }
    if (!q) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setAiState(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          {mode === "ai" ? (
            <Sparkles className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-600" />
          ) : (
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input pl-9 pr-9"
            placeholder={
              mode === "ai"
                ? "Ask anything, e.g. which engineering inquiries are waiting on us?"
                : "Search by reference, client, company, country, activity or email text"
            }
            aria-label={mode === "ai" ? "Ask AI" : "Search requests"}
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => {
                setQuery("");
                setAiState(null);
                if (mode === "keyword") router.push("/portal");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-ink-200 bg-white p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("keyword")}
              className={`rounded-md px-3 py-1.5 ${mode === "keyword" ? "bg-ink-900 text-white" : "text-ink-600"}`}
            >
              Keyword
            </button>
            <button
              type="button"
              onClick={() => setMode("ai")}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 ${mode === "ai" ? "bg-brand-700 text-white" : "text-ink-600"}`}
            >
              <Sparkles className="size-3.5" />
              Ask AI
            </button>
          </div>
          <button type="submit" className="btn-dark" disabled={pending || aiLoading}>
            {aiLoading ? "Thinking…" : mode === "ai" ? "Ask" : "Search"}
          </button>
        </div>
      </form>

      {aiError ? <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{aiError}</p> : null}
      {aiState ? (
        <div className="card mt-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 text-sm text-ink-800">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-600" />
              <p className="whitespace-pre-wrap">{aiState.answer || "No answer."}</p>
            </div>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setAiState(null)}>
              Dismiss
            </button>
          </div>
          {aiState.hits.length > 0 ? (
            <ul className="mt-3 divide-y divide-ink-100 border-t border-ink-100">
              {aiState.hits.map((h) => (
                <li key={h.id}>
                  <Link href={`/portal/requests/${h.id}`} className="flex flex-wrap items-center gap-3 py-2 text-sm hover:text-brand-800">
                    <span className="font-mono font-semibold">{h.ref}</span>
                    <span>
                      {h.contactName}
                      {h.company ? ` · ${h.company}` : ""}
                    </span>
                    <StatusBadge status={h.status as RequestStatus} />
                    <span className="text-xs text-ink-500">{h.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
