import { Trash2 } from "lucide-react";
import type { QuickSentence } from "@/db/schema";
import { deleteSentenceAction, saveSentenceAction } from "@/app/actions/settings";
import { ConfirmButton } from "./confirm-button";

const PLACEHOLDERS = "{ref} {salutation} {contactName} {surname} {company} {country} {serviceDescription} {activityShort} {total} {phaseCount} {phaseOneFee} {validUntil} {proposalDate}";

export function SentencesSettings({ sentences }: { sentences: QuickSentence[] }) {
  const categories = Array.from(new Set(sentences.map((s) => s.category)));
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        {categories.map((cat) => (
          <section key={cat} className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">{cat}</h2>
            <div className="divide-y divide-ink-100">
              {sentences
                .filter((s) => s.category === cat)
                .map((s) => (
                  <details key={s.id} className="group py-2">
                    <summary className="flex cursor-pointer items-center gap-3 text-sm">
                      <span className={`chip ${s.active ? "" : "opacity-50"}`}>{s.label}</span>
                      <span className="min-w-0 flex-1 truncate text-ink-500">{s.text}</span>
                    </summary>
                    <form action={saveSentenceAction} className="mt-3 grid gap-2 rounded-lg bg-ink-50 p-3 sm:grid-cols-[1fr_1fr_90px]">
                      <input type="hidden" name="id" value={s.id} />
                      <input name="label" defaultValue={s.label} className="input" placeholder="Chip label" />
                      <input name="category" defaultValue={s.category} className="input" placeholder="Category" />
                      <input name="sortOrder" type="number" defaultValue={s.sortOrder} className="input" title="Order" />
                      <textarea name="text" defaultValue={s.text} rows={3} className="input sm:col-span-3" />
                      <label className="flex items-center gap-2 text-xs text-ink-600 sm:col-span-2">
                        <input type="checkbox" name="active" value="on" defaultChecked={s.active} className="tick" />
                        <input type="hidden" name="active" value={s.active ? "on" : "off"} />
                        Shown in the composer
                      </label>
                      <div className="flex justify-end gap-2">
                        <button type="submit" className="btn-dark btn-sm">
                          Save
                        </button>
                        <ConfirmButton message={`Delete “${s.label}”?`} className="btn-ghost btn-sm text-brand-700" formAction={deleteSentenceAction}>
                          <Trash2 className="size-3.5" />
                        </ConfirmButton>
                      </div>
                    </form>
                  </details>
                ))}
            </div>
          </section>
        ))}
      </div>
      <aside className="space-y-4">
        <form action={saveSentenceAction} className="card space-y-2 p-5">
          <h2 className="text-sm font-semibold text-ink-900">Add a sentence</h2>
          <input name="label" className="input" placeholder="Chip label, e.g. Ask for POA" required />
          <input name="category" className="input" list="sentence-categories" placeholder="Category" required />
          <datalist id="sentence-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <textarea name="text" rows={4} className="input" placeholder="Sentence text. Use {placeholders} for values filled from the request." required />
          <button type="submit" className="btn-primary w-full">
            Add sentence
          </button>
        </form>
        <div className="card p-5 text-xs text-ink-600">
          <div className="label">Placeholders</div>
          <p className="font-mono leading-relaxed">{PLACEHOLDERS}</p>
          <p className="mt-2">Anything that cannot be filled appears as [brackets] so the associate completes it.</p>
        </div>
      </aside>
    </div>
  );
}
