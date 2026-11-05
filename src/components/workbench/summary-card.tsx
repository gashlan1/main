"use client";

import { useState, useTransition } from "react";
import { Mail, Pencil, Phone } from "lucide-react";
import type { RequestRow } from "@/db/schema";
import { SERVICE_TYPES } from "@/lib/firm";
import { SALUTATIONS } from "@/lib/labels";
import { updateRequestAction } from "@/app/actions/requests";

export function SummaryCard({ request }: { request: RequestRow }) {
  const [editing, setEditing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        className="card space-y-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const get = (k: string) => String(fd.get(k) ?? "");
          startTransition(async () => {
            await updateRequestAction(request.id, {
              salutation: get("salutation"),
              contactName: get("contactName"),
              company: get("company"),
              email: get("email"),
              phone: get("phone"),
              country: get("country"),
              serviceType: get("serviceType"),
              activities: get("activities"),
              summary: get("summary"),
              details: get("details"),
            });
            setEditing(false);
          });
        }}
      >
        <h2 className="text-sm font-semibold text-ink-900">Edit request details</h2>
        <div className="grid grid-cols-[88px_1fr] gap-2">
          <div>
            <label className="label">Title</label>
            <select name="salutation" defaultValue={request.salutation ?? ""} className="input">
              <option value="">—</option>
              {SALUTATIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Contact name</label>
            <input name="contactName" defaultValue={request.contactName} required className="input" />
          </div>
        </div>
        <Field label="Company" name="company" value={request.company} />
        <Field label="Email" name="email" value={request.email} type="email" />
        <Field label="Phone" name="phone" value={request.phone} />
        <Field label="Country" name="country" value={request.country} />
        <div>
          <label className="label">Service</label>
          <input name="serviceType" list="service-types" defaultValue={request.serviceType ?? ""} className="input" />
          <datalist id="service-types">
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="label">Activities</label>
          <textarea name="activities" defaultValue={request.activities ?? ""} rows={2} className="input" />
        </div>
        <Field label="Queue summary" name="summary" value={request.summary} />
        <div>
          <label className="label">Inquiry text</label>
          <textarea name="details" defaultValue={request.details ?? ""} rows={6} className="input" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => setEditing(false)} disabled={pending}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    );
  }

  const details = request.details ?? "";
  const long = details.length > 360;

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">Request details</h2>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(true)}>
          <Pencil className="size-3.5" />
          Edit
        </button>
      </div>
      <dl className="space-y-2.5 text-sm">
        <Row label="Contact">
          {request.salutation ? `${request.salutation} ` : ""}
          {request.contactName}
        </Row>
        <Row label="Company">{request.company ?? "—"}</Row>
        <Row label="Email">
          {request.email ? (
            <a href={`mailto:${request.email}`} className="inline-flex items-start gap-1 break-all text-brand-800 hover:underline">
              <Mail className="mt-0.5 size-3.5 shrink-0" />
              <span>{request.email}</span>
            </a>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Phone">
          {request.phone ? (
            <a href={`tel:${request.phone}`} className="inline-flex items-center gap-1 text-brand-800 hover:underline">
              <Phone className="size-3.5" />
              {request.phone}
            </a>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Country">{request.country || "—"}</Row>
        <Row label="Service">{request.serviceType ?? "—"}</Row>
        <Row label="Activities">{request.activities ?? "—"}</Row>
      </dl>
      {details ? (
        <div className="mt-4 border-t border-ink-100 pt-3">
          <div className="label">Inquiry</div>
          <p className="prose-email text-sm text-ink-700">{showAll || !long ? details : `${details.slice(0, 360)}…`}</p>
          {long ? (
            <button type="button" className="mt-1 text-xs font-medium text-brand-800 hover:underline" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show less" : "Show full inquiry"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[84px_1fr] gap-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="min-w-0 break-words text-ink-800">{children}</dd>
    </div>
  );
}

function Field({ label, name, value, type = "text" }: { label: string; name: string; value: string | null; type?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} type={type} defaultValue={value ?? ""} className="input" />
    </div>
  );
}
