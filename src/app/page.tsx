import type { Metadata } from "next";
import { HomePage } from "@/components/site/home-page";
import { en } from "@/lib/site-content";
import { FIRM } from "@/lib/firm";

export const metadata: Metadata = {
  title: { absolute: `${en.meta.title} | ${FIRM.shortName}` },
  description: en.meta.description,
  alternates: { canonical: "/", languages: { en: "/", ar: "/ar" } },
  openGraph: { title: en.meta.title, description: en.meta.description, type: "website", locale: "en_US", siteName: FIRM.name },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  name: FIRM.name,
  alternateName: FIRM.legalName,
  telephone: FIRM.phone,
  email: FIRM.email,
  url: "https://inc.aglc.sa/",
  areaServed: "SA",
  address: [
    { "@type": "PostalAddress", addressLocality: "Jeddah", streetAddress: "Madinah Branch Road", addressCountry: "SA" },
    { "@type": "PostalAddress", addressLocality: "Riyadh", addressCountry: "SA" },
  ],
  description: en.meta.description,
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomePage content={en} />
    </>
  );
}
