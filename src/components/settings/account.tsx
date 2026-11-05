import type { SessionUser } from "@/lib/auth";
import { PasswordForm } from "./password-form";

export function AccountSettings({ me }: { me: SessionUser }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Profile</h2>
        <dl className="space-y-2 text-sm">
          <div className="grid grid-cols-[80px_1fr]">
            <dt className="text-ink-500">Name</dt>
            <dd className="text-ink-900">{me.name}</dd>
          </div>
          <div className="grid grid-cols-[80px_1fr]">
            <dt className="text-ink-500">Email</dt>
            <dd className="text-ink-900">{me.email}</dd>
          </div>
          <div className="grid grid-cols-[80px_1fr]">
            <dt className="text-ink-500">Title</dt>
            <dd className="text-ink-900">{me.title ?? "—"}</dd>
          </div>
          <div className="grid grid-cols-[80px_1fr]">
            <dt className="text-ink-500">Role</dt>
            <dd className="text-ink-900">{me.role}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink-500">Your name and title are used to sign the emails you send from the portal.</p>
      </section>
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Change password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
