"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { login } from "@/app/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="you@aglc.sa" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>
      {state?.error ? (
        <p role="alert" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-primary w-full btn-lg">
        <LogIn className="size-4" />
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
