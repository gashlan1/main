import type { Metadata } from "next";
import { PrivacyPage } from "@/components/site/privacy-page";
import { ar } from "@/lib/site-content";

export const metadata: Metadata = {
  title: { absolute: `${ar.privacy.title} | الأحمري وقشلان` },
  alternates: { canonical: "/ar/privacy", languages: { en: "/privacy", ar: "/ar/privacy" } },
};

export default function Page() {
  return <PrivacyPage content={ar} />;
}
