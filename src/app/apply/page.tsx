import type { Metadata } from "next";
import { ApplyPage } from "@/components/site/apply-page";
import { en } from "@/lib/site-content";

export const metadata: Metadata = {
  title: { absolute: `${en.apply.title} | Alahmari & Gashlan` },
  description: en.apply.intro,
  alternates: { canonical: "/apply", languages: { en: "/apply", ar: "/ar/apply" } },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ package?: string; legalForm?: string; service?: string }> }) {
  const defaults = await searchParams;
  return <ApplyPage content={en} defaults={defaults} />;
}
