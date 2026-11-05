import { requireUser } from "@/lib/auth";
import { listStaff } from "@/lib/requests";
import { NewRequestForm } from "@/components/new-request-form";

export default async function NewRequestPage() {
  const me = await requireUser();
  const staff = await listStaff();
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">New request</h1>
        <p className="mt-1 text-sm text-ink-500">Import a forwarded email, or enter the inquiry by hand. Website submissions arrive here automatically.</p>
      </div>
      <NewRequestForm staff={staff} meId={me.id} />
    </div>
  );
}
