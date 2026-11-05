import Image from "next/image";
import type { Metadata } from "next";
import { FIRM } from "@/lib/firm";
import { IntakeForm } from "./intake-form";

export const metadata: Metadata = { title: "Company formation inquiry" };

export default function IntakePage() {
  return (
    <main className="min-h-screen flex-1 bg-ink-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/brand/logo-black.png" alt={FIRM.name} width={190} height={70} priority />
          <h1 className="mt-6 text-2xl font-semibold text-ink-900">Set up your company in Saudi Arabia</h1>
          <p className="mt-2 max-w-lg text-sm text-ink-600">
            Tell us about your business and the activities you plan to carry out. We reply with a fixed-fee proposal, usually within two business days.
          </p>
        </div>
        <div className="card p-6 sm:p-8">
          <IntakeForm />
        </div>
        <p className="mt-6 text-center text-xs text-ink-500">
          {FIRM.name} · {FIRM.address} · {FIRM.phone} · {FIRM.email}
        </p>
      </div>
    </main>
  );
}
