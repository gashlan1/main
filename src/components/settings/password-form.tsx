"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions/auth";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="current">
          Current password
        </label>
        <input id="current" name="current" type="password" autoComplete="current-password" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="next">
          New password
        </label>
        <input id="next" name="next" type="password" autoComplete="new-password" className="input" required minLength={10} />
      </div>
      <div>
        <label className="label" htmlFor="confirm">
          Confirm new password
        </label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="input" required minLength={10} />
      </div>
      {state?.error ? <p className="text-sm text-brand-800">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-emerald-800">Password changed.</p> : null}
      <button type="submit" className="btn-dark" disabled={pending}>
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
