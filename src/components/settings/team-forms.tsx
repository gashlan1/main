"use client";

import { useActionState, useState } from "react";
import { createUserAction, resetPasswordAction } from "@/app/actions/settings";

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUserAction, undefined);
  return (
    <form action={action} className="card space-y-2 p-5">
      <h2 className="text-sm font-semibold text-ink-900">Add a staff account</h2>
      <input name="name" className="input" placeholder="Full name" required />
      <input name="email" type="email" className="input" placeholder="name@aglc.sa" required />
      <input name="title" className="input" placeholder="Title, e.g. Associate" />
      <select name="role" className="input" defaultValue="associate">
        <option value="associate">Associate</option>
        <option value="admin">Administrator</option>
      </select>
      <input name="password" type="text" className="input" placeholder="Initial password (10+ characters)" required minLength={10} />
      {state?.error ? <p className="text-xs text-brand-800">{state.error}</p> : null}
      {state?.ok ? <p className="text-xs text-emerald-800">{state.ok}</p> : null}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  if (!open) {
    return (
      <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(true)}>
        Reset password
      </button>
    );
  }
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={userId} />
      <input name="password" type="text" className="input w-44 py-1.5" placeholder="New password" minLength={10} required />
      <button type="submit" className="btn-dark btn-sm" disabled={pending}>
        Save
      </button>
      <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>
        Cancel
      </button>
      {state?.error ? <span className="text-xs text-brand-800">{state.error}</span> : null}
      {state?.ok ? <span className="text-xs text-emerald-800">{state.ok}</span> : null}
    </form>
  );
}
