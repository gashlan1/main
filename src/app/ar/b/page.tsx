import type { Metadata } from "next";
import { HomePageB } from "@/components/site/home-page-b";
import { ar } from "@/lib/site-content";
import { FIRM } from "@/lib/firm";

export const metadata: Metadata = {
  title: { absolute: `${ar.meta.title} | ${FIRM.shortName}` },
  description: ar.meta.description,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HomePageB content={ar} />;
}
