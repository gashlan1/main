"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import type { SiteContent } from "@/lib/site-content";

export type ApplyDefaults = { package?: string; legalForm?: string; service?: string };

export function ApplyForm({ content, defaults }: { content: SiteContent; defaults: ApplyDefaults }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const a = content.apply;
  const packages = content.fees.packages;
  const validPackage = packages.some((p) => p.key === defaults.package) ? defaults.package : "";
  const defaultService = defaults.service === "residency" ? "Premium Residency" : a.serviceOptions[0];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("lang", content.lang);
    try {
      const res = await fetch("/api/intake", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? a.error);
      setRef(data.ref);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : a.error);
    } finally {
      setBusy(false);
    }
  }

  if (ref) {
    return (
      <div className="site-card text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h2 className="mt-4 font-display text-2xl font-semibold text-navy-900">{a.successTitle}</h2>
        <p className="mt-3 text-[15px] text-navy-900/75">{a.successText.replace("{ref}", ref)}</p>
        <p className="mt-4 font-mono text-lg font-semibold text-navy-900" dir="ltr">
          {ref}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="site-card space-y-5">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="package">
            {a.package}
          </label>
          <select id="package" name="package" className="input" defaultValue={validPackage}>
            <option value="">{a.packageNone}</option>
            {packages.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name} — {content.fees.currency} {new Intl.NumberFormat("en-US").format(p.price)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="legalForm">
            {a.legalForm}
          </label>
          <select id="legalForm" name="legalForm" className="input" defaultValue={defaults.legalForm ?? ""}>
            <option value="">—</option>
            {a.legalForms.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-[120px_1fr]">
        <div>
          <label className="label" htmlFor="salutation">
            {a.salutation}
          </label>
          <select id="salutation" name="salutation" className="input" defaultValue="">
            <option value="">—</option>
            {a.salutations.map((s, i) => (
              <option key={s} value={["Mr.", "Ms.", "Dr.", "Eng."][i]}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="contactName">
            {a.name} *
          </label>
          <input id="contactName" name="contactName" required className="input" autoComplete="name" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="company">
            {a.company}
          </label>
          <input id="company" name="company" className="input" autoComplete="organization" />
        </div>
        <div>
          <label className="label" htmlFor="country">
            {a.country}
          </label>
          <input id="country" name="country" className="input" autoComplete="country-name" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            {a.email} *
          </label>
          <input id="email" name="email" type="email" required className="input" autoComplete="email" dir="ltr" />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            {a.phone}
          </label>
          <input id="phone" name="phone" type="tel" className="input" autoComplete="tel" dir="ltr" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="serviceType">
          {a.service}
        </label>
        <select id="serviceType" name="serviceType" className="input" defaultValue={defaultService}>
          {a.serviceOptions.map((value, i) => (
            <option key={value} value={value}>
              {a.serviceOptionLabels[i]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="activities">
          {a.activities}
        </label>
        <input id="activities" name="activities" className="input" placeholder={a.activitiesPlaceholder} />
      </div>
      <div>
        <label className="label" htmlFor="details">
          {a.details} *
        </label>
        <textarea id="details" name="details" rows={6} required className="input" placeholder={a.detailsPlaceholder} />
      </div>
      <label className="flex items-start gap-3 text-sm text-navy-900/80">
        <input type="checkbox" name="consent" required className="tick mt-0.5" />
        <span>
          {a.consent}{" "}
          <a href={content.lang === "ar" ? "/ar/privacy" : "/privacy"} target="_blank" rel="noreferrer" className="font-medium text-gold-700 underline">
            {a.consentLink}
          </a>
          .
        </span>
      </label>
      {error ? <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{error}</p> : null}
      <button type="submit" className="site-btn-gold w-full" disabled={busy}>
        <Send className="size-4" />
        {busy ? a.sending : a.submit}
      </button>
      <p className="text-center text-xs text-navy-900/55">{a.privacy}</p>
    </form>
  );
}
