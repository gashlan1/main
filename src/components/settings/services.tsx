import { Trash2 } from "lucide-react";
import type { Service } from "@/db/schema";
import { formatSar } from "@/lib/dates";
import { deleteServiceAction, saveServiceAction } from "@/app/actions/settings";
import { ConfirmButton } from "./confirm-button";

function ServiceForm({ service }: { service?: Service }) {
  return (
    <form action={saveServiceAction} className="grid gap-2 rounded-lg bg-ink-50 p-3 sm:grid-cols-4">
      {service ? <input type="hidden" name="id" value={service.id} /> : null}
      <input name="title" defaultValue={service?.title} className="input sm:col-span-2" placeholder="Phase title" required />
      <input name="key" defaultValue={service?.key} className="input font-mono text-xs" placeholder="key (auto)" />
      <select name="route" defaultValue={service?.route ?? "both"} className="input">
        <option value="both">Any route</option>
        <option value="sez">SEZ route</option>
        <option value="mainland">Mainland route</option>
      </select>
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-500">SAR</span>
        <input name="fee" type="number" min={0} step={500} defaultValue={service?.fee ?? 0} className="input" required />
      </div>
      <input name="duration" defaultValue={service?.duration ?? ""} className="input" placeholder="Duration, e.g. 2–4 weeks" />
      <input name="sortOrder" type="number" defaultValue={service?.sortOrder ?? 0} className="input" title="Order" />
      <label className="flex items-center gap-2 text-xs text-ink-600">
        <input type="checkbox" name="active" value="on" defaultChecked={service?.active ?? true} className="tick" />
        <input type="hidden" name="active" value={service?.active === false ? "off" : "on"} />
        Offered
      </label>
      <input name="description" defaultValue={service?.description ?? ""} className="input sm:col-span-4" placeholder="Short description shown in the builder" />
      <textarea name="bullets" defaultValue={service?.bullets.join("\n")} rows={4} className="input sm:col-span-4" placeholder="Scope bullets, one per line" />
      <div className="flex justify-end gap-2 sm:col-span-4">
        <button type="submit" className="btn-dark btn-sm">
          {service ? "Save" : "Add service"}
        </button>
        {service ? (
          <ConfirmButton message={`Delete “${service.title}”?`} className="btn-ghost btn-sm text-brand-700" formAction={deleteServiceAction}>
            <Trash2 className="size-3.5" />
          </ConfirmButton>
        ) : null}
      </div>
    </form>
  );
}

export function ServicesSettings({ services }: { services: Service[] }) {
  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink-900">Catalog of phases</h2>
        <p className="mb-3 text-xs text-ink-500">These are the tickboxes in the proposal builder. Fees and scope can still be adjusted per proposal.</p>
        <div className="divide-y divide-ink-100">
          {services.map((s) => (
            <details key={s.id} className="py-2">
              <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm">
                <span className={`font-medium text-ink-900 ${s.active ? "" : "line-through opacity-60"}`}>{s.title}</span>
                <span className="text-ink-500">SAR {formatSar(s.fee)}</span>
                <span className="text-xs text-ink-400">{s.duration}</span>
                <span className="badge bg-ink-100 text-ink-600">{s.route}</span>
              </summary>
              <div className="mt-3">
                <ServiceForm service={s} />
              </div>
            </details>
          ))}
        </div>
      </section>
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Add a service</h2>
        <ServiceForm />
      </section>
    </div>
  );
}
