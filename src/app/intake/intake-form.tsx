"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { SERVICE_TYPES } from "@/lib/firm";
import { SALUTATIONS } from "@/lib/labels";

export function IntakeForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/intake", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setRef(data.ref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  if (ref) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h2 className="mt-4 text-lg font-semibold text-ink-900">Thank you — we have received your inquiry.</h2>
        <p className="mt-2 text-sm text-ink-600">
          Your reference is <span className="font-mono font-semibold text-ink-900">{ref}</span>. Please quote it in any follow-up. One of our lawyers will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
        <div>
          <label className="label" htmlFor="salutation">
            Title
          </label>
          <select id="salutation" name="salutation" className="input">
            <option value="">—</option>
            {SALUTATIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="contactName">
            Full name *
          </label>
          <input id="contactName" name="contactName" required className="input" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="company">
            Company
          </label>
          <input id="company" name="company" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="country">
            Country of the parent company
          </label>
          <input id="country" name="country" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email *
          </label>
          <input id="email" name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="serviceType">
          What do you need?
        </label>
        <select id="serviceType" name="serviceType" className="input" defaultValue="">
          <option value="">Choose…</option>
          {SERVICE_TYPES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="activities">
          Activities the Saudi entity will carry out
        </label>
        <input id="activities" name="activities" className="input" placeholder="e.g. mechanical and electrical engineering design services" />
      </div>
      <div>
        <label className="label" htmlFor="details">
          Tell us about your plans *
        </label>
        <textarea
          id="details"
          name="details"
          rows={6}
          required
          className="input"
          placeholder="Your business, where the parent company is licensed, timing, staff you expect to relocate, and any questions."
        />
      </div>
      {error ? <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{error}</p> : null}
      <button type="submit" className="btn-primary btn-lg w-full" disabled={busy}>
        <Send className="size-4" />
        {busy ? "Sending…" : "Send inquiry"}
      </button>
      <p className="text-center text-[11px] text-ink-400">Your details are used only to respond to this inquiry.</p>
    </form>
  );
}
