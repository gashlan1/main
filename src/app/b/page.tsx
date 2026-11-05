import type { Metadata } from "next";
import { HomePageB } from "@/components/site/home-page-b";
import { en } from "@/lib/site-content";
import { FIRM } from "@/lib/firm";

export const metadata: Metadata = {
  title: { absolute: `${en.meta.title} | ${FIRM.shortName}` },
  description: en.meta.description,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HomePageB content={en} />;
}
