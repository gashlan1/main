/** Firm identity used on letterheads, emails and the portal chrome. */
export const FIRM = {
  shortName: "Alahmari & Gashlan",
  name: "Alahmari & Gashlan Attorneys & Legal Consultants",
  legalName: "Al-Ahmari Gashlan Legal Consulting",
  nameAr: "الأحمري وقشلان للمحاماة والاستشارات القانونية",
  address: "Kingdom Saudi Arabia, Jeddah - Riyadh",
  phone: "+966 12 693 6418",
  phoneCompact: "+966126936418",
  email: "info@aglc.sa",
  website: "www.aglc.sa",
  portalName: "inc.aglc.sa",
  defaultSignatory: {
    name: "Lawyer Mohammed Ahmed Gashlan",
    title: "Founding Partner",
  },
  vatRate: 0.15,
};

export const SERVICE_TYPES = [
  "Company in a Special Economic Zone (SEZ)",
  "100% foreign-owned company (MISA, mainland)",
  "Branch of a foreign company",
  "Regional Headquarters (RHQ)",
  "Joint venture with a Saudi partner",
  "Professional / engineering office",
  "Trademark registration",
  "Other",
] as const;
