import type { Metadata } from "next";
import { HomePage } from "@/components/site/home-page";
import { ar } from "@/lib/site-content";
import { FIRM } from "@/lib/firm";

export const metadata: Metadata = {
  title: { absolute: `${ar.meta.title} | ${FIRM.shortName}` },
  description: ar.meta.description,
  alternates: { canonical: "/ar", languages: { en: "/", ar: "/ar" } },
  openGraph: { title: ar.meta.title, description: ar.meta.description, type: "website", locale: "ar_SA", siteName: FIRM.name },
};

export default function Page() {
  return <HomePage content={ar} />;
}
