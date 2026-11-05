import type { Metadata } from "next";
import { PrivacyPage } from "@/components/site/privacy-page";
import { en } from "@/lib/site-content";

export const metadata: Metadata = {
  title: { absolute: `${en.privacy.title} | Alahmari & Gashlan` },
  alternates: { canonical: "/privacy", languages: { en: "/privacy", ar: "/ar/privacy" } },
};

export default function Page() {
  return <PrivacyPage content={en} />;
}
