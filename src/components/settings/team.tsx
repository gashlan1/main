import type { SessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { setUserActiveAction } from "@/app/actions/settings";
import { CreateUserForm, ResetPasswordForm } from "./team-forms";

type UserRow = { id: string; name: string; email: string; role: string; title: string | null; active: boolean; createdAt: string };

export function TeamSettings({ users, me }: { users: UserRow[]; me: SessionUser }) {
  const admin = me.role === "admin";
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Staff accounts</h2>
        <ul className="divide-y divide-ink-100">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink-900">
                  {u.name} {u.id === me.id ? <span className="text-xs text-ink-400">(you)</span> : null}
                </div>
                <div className="text-xs text-ink-500">
                  {u.email} · {u.title ?? "—"} · {u.role} · since {formatDate(u.createdAt)}
                </div>
              </div>
              <span className={`badge ${u.active ? "bg-emerald-100 text-emerald-800" : "bg-ink-100 text-ink-500"}`}>{u.active ? "active" : "disabled"}</span>
              {admin && u.id !== me.id ? (
                <>
                  <form action={setUserActiveAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                    <button type="submit" className="btn-secondary btn-sm">
                      {u.active ? "Disable" : "Enable"}
                    </button>
                  </form>
                  <ResetPasswordForm userId={u.id} />
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      {admin ? (
        <aside>
          <CreateUserForm />
        </aside>
      ) : (
        <aside className="card p-5 text-sm text-ink-600">Ask an administrator to add or disable accounts.</aside>
      )}
    </div>
  );
}
