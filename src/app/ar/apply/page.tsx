import type { Metadata } from "next";
import { ApplyPage } from "@/components/site/apply-page";
import { ar } from "@/lib/site-content";

export const metadata: Metadata = {
  title: { absolute: `${ar.apply.title} | الأحمري وقشلان` },
  description: ar.apply.intro,
  alternates: { canonical: "/ar/apply", languages: { en: "/apply", ar: "/ar/apply" } },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ package?: string; legalForm?: string; service?: string }> }) {
  const defaults = await searchParams;
  return <ApplyPage content={ar} defaults={defaults} />;
}
