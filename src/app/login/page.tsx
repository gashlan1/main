import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FIRM } from "@/lib/firm";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/portal");
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/brand/logo-white.png" alt={FIRM.name} width={168} height={62} priority />
          <h1 className="mt-6 text-lg font-semibold text-white">Staff portal</h1>
          <p className="mt-1 text-sm text-ink-400">{FIRM.portalName} · incorporation request desk</p>
        </div>
        <div className="card p-6">
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-ink-500">
          Access is limited to {FIRM.shortName} staff. Ask an administrator for an account.
        </p>
      </div>
    </main>
  );
}
