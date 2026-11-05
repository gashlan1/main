import { Trash2 } from "lucide-react";
import type { Activity } from "@/db/schema";
import { deleteActivityAction, saveActivityAction } from "@/app/actions/settings";
import { ConfirmButton } from "./confirm-button";

function ActivityForm({ activity }: { activity?: Activity }) {
  return (
    <form action={saveActivityAction} className="grid gap-2 rounded-lg bg-ink-50 p-3 sm:grid-cols-6">
      {activity ? <input type="hidden" name="id" value={activity.id} /> : null}
      <input name="code" defaultValue={activity?.code ?? ""} className="input font-mono" placeholder="SSIC code" />
      <input name="activity" defaultValue={activity?.activity} className="input sm:col-span-2" placeholder="Activity (Saudi classification)" required />
      <input name="authority" defaultValue={activity?.authority ?? ""} className="input" placeholder="Licensing authority" />
      <input name="license" defaultValue={activity?.license ?? ""} className="input" placeholder="YES — SCE License / No" />
      <label className="flex items-center gap-2 text-xs text-ink-600">
        <input type="checkbox" name="active" value="on" defaultChecked={activity?.active ?? true} className="tick" />
        <input type="hidden" name="active" value={activity?.active === false ? "off" : "on"} />
        Listed
      </label>
      <input name="remarks" defaultValue={activity?.remarks ?? ""} className="input sm:col-span-5" placeholder="Default remarks" />
      <div className="flex justify-end gap-2">
        <button type="submit" className="btn-dark btn-sm">
          {activity ? "Save" : "Add"}
        </button>
        {activity ? (
          <ConfirmButton message={`Delete ${activity.code ?? ""} ${activity.activity}?`} className="btn-ghost btn-sm text-brand-700" formAction={deleteActivityAction}>
            <Trash2 className="size-3.5" />
          </ConfirmButton>
        ) : null}
      </div>
    </form>
  );
}

export function ActivitiesSettings({ activities }: { activities: Activity[] }) {
  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink-900">Verified SSIC activities</h2>
        <p className="mb-3 text-xs text-ink-500">Rows available as tickboxes for the Activity Matching & Licensing Table. Add codes here once you have confirmed them in the SSIC (July 2025).</p>
        <div className="divide-y divide-ink-100">
          {activities.map((a) => (
            <details key={a.id} className="py-2">
              <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm">
                <span className="font-mono text-xs text-ink-500">{a.code ?? "—"}</span>
                <span className={`font-medium text-ink-900 ${a.active ? "" : "line-through opacity-60"}`}>{a.activity}</span>
                <span className="text-xs text-ink-500">{a.authority}</span>
                <span className="badge bg-brand-50 text-brand-700">{a.license}</span>
              </summary>
              <div className="mt-3">
                <ActivityForm activity={a} />
              </div>
            </details>
          ))}
        </div>
      </section>
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Add an activity</h2>
        <ActivityForm />
      </section>
    </div>
  );
}
