/**
 * Copy for the public website (inc.aglc.sa) in English and Arabic.
 * Prices and package contents mirror the firm's current price list; the firm
 * facts come from the 2026 company profile.
 */

export type Lang = "en" | "ar";

export type Package = {
  key: "essential" | "full" | "premium";
  name: string;
  price: number;
  usd: number;
  tagline: string;
  lead: string;
  items: string[];
  recommended?: boolean;
};

export type ServiceLine = { code: string; name: string; price: number | null; unit?: string };
export type ServiceGroup = { title: string; services: ServiceLine[] };

export type Founder = { name: string; role: string; credentials: string; photo?: string };

export type SiteContent = {
  lang: Lang;
  dir: "ltr" | "rtl";
  otherLang: { label: string; href: string };
  meta: { title: string; description: string };
  nav: { process: string; fees: string; why: string; tenders: string; residency: string; faq: string; contact: string; cta: string; staff: string; mainSite: string };
  hero: { eyebrow: string; title: string; titleAccent: string; subtitle: string; cta: string; secondary: string; facts: string[] };
  process: {
    eyebrow: string;
    title: string;
    intro: string;
    steps: { title: string; text: string }[];
    checklistTitle: string;
    checklist: { title: string; text: string }[];
    note: string;
  };
  fees: {
    eyebrow: string;
    title: string;
    intro: string;
    currency: string;
    approx: string;
    plusVat: string;
    recommended: string;
    packages: Package[];
    choose: string;
    servicesTitle: string;
    servicesIntro: string;
    groups: ServiceGroup[];
    onRequest: string;
    units: Record<string, string>;
    servicesNote: string;
    footnote: string;
  };
  why: {
    eyebrow: string;
    title: string;
    points: { title: string; text: string }[];
    firmTitle: string;
    firmText: string;
    practiceTitle: string;
    practiceAreas: string[];
    foundersTitle: string;
    founders: Founder[];
    teamText: string;
    mainSiteCta: string;
  };
  proposal: { eyebrow: string; title: string; text: string; lines: string[] };
  tenders: { eyebrow: string; title: string; text: string; points: string[]; cta: string; url: string };
  residency: { eyebrow: string; title: string; intro: string; tracks: { title: string; items: string[] }[]; cta: string };
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[]; disclaimer: string };
  contact: { eyebrow: string; title: string; intro: string; phone: string; email: string; offices: string; officesValue: string; cta: string; whatsapp: string };
  footer: {
    legalName: string;
    staff: string;
    rights: string;
    resourcesTitle: string;
    resources: { label: string; href: string }[];
    sitesTitle: string;
    privacy: string;
  };
  privacy: { title: string; updated: string; sections: { h: string; p: string }[] };
  apply: {
    title: string;
    intro: string;
    package: string;
    packageNone: string;
    legalForm: string;
    legalForms: string[];
    salutation: string;
    name: string;
    company: string;
    country: string;
    email: string;
    phone: string;
    service: string;
    activities: string;
    activitiesPlaceholder: string;
    details: string;
    detailsPlaceholder: string;
    consent: string;
    consentLink: string;
    submit: string;
    sending: string;
    privacy: string;
    successTitle: string;
    /** "{ref}" is replaced with the reference number. */
    successText: string;
    error: string;
    /** Values stored on the request (always English, matching the portal). */
    serviceOptions: string[];
    /** Labels shown to the visitor, same order as serviceOptions. */
    serviceOptionLabels: string[];
    salutations: string[];
  };
};

const SERVICE_OPTIONS_EN = [
  "100% foreign-owned company (MISA, mainland)",
  "Company in a Special Economic Zone (SEZ)",
  "Branch of a foreign company",
  "Regional Headquarters (RHQ)",
  "Joint venture with a Saudi partner",
  "Professional / engineering office",
  "Premium Residency",
  "Other",
];

const RESOURCE_LINKS = [
  { key: "misa", href: "https://misa.gov.sa" },
  { key: "mc", href: "https://mc.gov.sa" },
  { key: "pr", href: "https://sapr.gov.sa" },
  { key: "zatca", href: "https://zatca.gov.sa" },
];

export const TENDERS_URL = "https://tender.aglc.sa";
export const MAIN_SITE_URL = "https://aglc.sa";

const FOUNDER_PHOTOS = {
  majed: "/brand/founders/majed-alahmari.jpg",
  mohamed: "/brand/founders/mohamed-gashlan.jpg",
  abdullah: "/brand/founders/abdullah-salamah.jpg",
};

export const en: SiteContent = {
  lang: "en",
  dir: "ltr",
  otherLang: { label: "عربي", href: "/ar" },
  meta: {
    title: "Company formation in Saudi Arabia for foreign investors",
    description:
      "A licensed Saudi law firm sets up your company — MISA license, commercial registration, bank account and visas — for a fixed fee agreed in writing before any work begins.",
  },
  nav: {
    process: "How it works",
    fees: "Fees",
    why: "The firm",
    tenders: "Tenders",
    residency: "Residency",
    faq: "FAQ",
    contact: "Contact",
    cta: "Start application",
    staff: "Staff sign-in",
    mainSite: "aglc.sa",
  },
  hero: {
    eyebrow: "Alahmari & Gashlan · Attorneys & Legal Consultants · Jeddah and Riyadh",
    title: "Company formation in Saudi Arabia",
    titleAccent: "for foreign investors",
    subtitle:
      "A licensed Saudi law firm sets up your company — MISA license, commercial registration, bank account and visas — for a fixed fee agreed in writing before any work begins.",
    cta: "Start application",
    secondary: "See the fixed fees",
    facts: ["100% foreign ownership for most activities", "Written proposal within two business days", "Pay 50% on signing, 50% on completion"],
  },
  process: {
    eyebrow: "How it works",
    title: "From first email to a registered company, in four steps",
    intro: "You deal with one lawyer throughout. Every phase, fee and deadline is written down before you pay anything.",
    steps: [
      {
        title: "Tell us about your business",
        text: "Five minutes on our form: what the company will do, where the parent company is based and who will manage the Saudi entity. You receive a reference number immediately.",
      },
      {
        title: "Receive a fixed-fee proposal",
        text: "Within two business days a lawyer sends a written proposal: phases, fees, timeline, the documents we need, and your activities matched to the Saudi classification. Sign it only if you are satisfied.",
      },
      {
        title: "We form the company",
        text: "MISA investment license, articles of association, commercial registration, Chamber, National Address, ZATCA and GOSI — handled by a named lawyer who reports to you at every step.",
      },
      {
        title: "Bank, visas and beyond",
        text: "Corporate bank account, work visas and iqamas for your manager and staff, and the registrations you need to employ people and invoice clients.",
      },
    ],
    checklistTitle: "What we file, in order",
    checklist: [
      { title: "Document collection and preparation", text: "Parent company certificate and articles, audited financials, board resolution, power of attorney, passports." },
      { title: "Document authentication", text: "Notarization and apostille abroad, then certified Arabic translation." },
      { title: "MISA investment license", text: "Activities matched to the Saudi classification; eligibility confirmed before anything is filed." },
      { title: "Articles of Association", text: "Drafted for your structure and notarized." },
      { title: "Commercial Registration (CR)", text: "Trade name reservation and registration with the Ministry of Commerce." },
      { title: "Chamber, National Address, ZATCA and GOSI", text: "Membership, address, tax and social insurance registrations; Qiwa and Mudad employer setup." },
      { title: "Corporate bank account", text: "Introduction to the bank and support with its compliance requirements." },
      { title: "General manager's visa and iqama", text: "Residency for the general manager, then visas for employees." },
    ],
    note: "Durations and government fees are stated in your proposal; they depend on the activity and on the authorities' processing times.",
  },
  fees: {
    eyebrow: "Fees",
    title: "Fixed fees, agreed before we start",
    intro:
      "Professional fees are fixed per package or per service. Government fees are charged at cost and VAT (15%) applies. Nothing is paid until you have signed the proposal.",
    currency: "SAR",
    approx: "≈ USD",
    plusVat: "+ VAT and government fees",
    recommended: "Recommended",
    packages: [
      {
        key: "essential",
        name: "AGLC Essential",
        price: 30000,
        usd: 8000,
        tagline: "Licensed and registered",
        lead: "Everything needed for a licensed, registered company:",
        items: ["MISA investment license", "Articles of Association, drafted and notarized", "Commercial Registration (CR)", "Chamber of Commerce membership", "National Address registration", "ZATCA registration"],
      },
      {
        key: "full",
        name: "AGLC Full Formation",
        price: 55000,
        usd: 14667,
        tagline: "Ready to operate",
        lead: "Everything in Essential, plus:",
        items: ["Corporate bank account opening", "Work visa and iqama for one person", "GOSI registration", "HRSD / Qiwa registration", "Municipality license"],
        recommended: true,
      },
      {
        key: "premium",
        name: "AGLC Premium All-Inclusive",
        price: 102500,
        usd: 27333,
        tagline: "Set up and supported",
        lead: "Everything in Full Formation, plus:",
        items: [
          "Work visas and iqamas for two people",
          "Internet banking activation",
          "Saudization compliance setup",
          "Official Gazette publication",
          "Company structure advisory",
          "Annual compliance review",
          "Introductions to legal and accounting advisers",
        ],
      },
    ],
    choose: "Start with this package",
    servicesTitle: "Or choose individual services",
    servicesIntro: "Thirty-two services priced individually, so a proposal can be built from exactly what you need.",
    groups: [
      {
        title: "Core incorporation",
        services: [
          { code: "INC-01", name: "MISA investment license application", price: 8000 },
          { code: "INC-02", name: "Articles of Association drafting", price: 5000 },
          { code: "INC-03", name: "Articles of Association notarization", price: 2500 },
          { code: "INC-04", name: "Commercial Registration (CR)", price: 3500 },
          { code: "INC-05", name: "Chamber of Commerce membership", price: 2000 },
          { code: "INC-06", name: "National Address registration", price: 1500 },
          { code: "INC-07", name: "Official Gazette publication", price: 1500 },
          { code: "INC-08", name: "Company structure advisory", price: 4000 },
        ],
      },
      {
        title: "Regulatory registrations",
        services: [
          { code: "REG-01", name: "ZATCA registration (VAT / withholding tax)", price: 3500 },
          { code: "REG-02", name: "GOSI registration (social insurance)", price: 2500 },
          { code: "REG-03", name: "HRSD / Qiwa registration (labour)", price: 2500 },
          { code: "REG-04", name: "Municipality license", price: 3000 },
          { code: "REG-05", name: "Saudization (Nitaqat) compliance setup", price: 3500 },
        ],
      },
      {
        title: "Banking and financial setup",
        services: [
          { code: "BNK-01", name: "Corporate bank account opening", price: null },
          { code: "BNK-02", name: "Internet banking activation", price: 1500 },
          { code: "BNK-03", name: "Additional bank account (second bank)", price: 4500 },
        ],
      },
      {
        title: "Visa and immigration",
        services: [
          { code: "VIS-01", name: "Work visa application", price: 5000, unit: "person" },
          { code: "VIS-02", name: "Iqama issuance", price: 5000, unit: "person" },
          { code: "VIS-03", name: "Medical examination coordination", price: 1000, unit: "person" },
          { code: "VIS-04", name: "Visa transfer", price: 3500, unit: "person" },
          { code: "VIS-05", name: "Exit / re-entry visa processing", price: 1500, unit: "person" },
          { code: "VIS-06", name: "Premium Residency application support", price: 20000 },
        ],
      },
      {
        title: "Ongoing and add-on",
        services: [
          { code: "ADD-01", name: "Accounting and tax compliance", price: 3500, unit: "month" },
          { code: "ADD-02", name: "PRO / GRO retainer", price: 4800, unit: "month" },
          { code: "ADD-03", name: "Document attestation and legalization", price: 4000 },
          { code: "ADD-04", name: "Virtual office address", price: 6500, unit: "year" },
          { code: "ADD-05", name: "Trademark registration", price: 6500, unit: "class" },
          { code: "ADD-06", name: "Annual compliance review", price: 12500, unit: "year" },
          { code: "ADD-07", name: "Company amendment (CR / AoA changes)", price: 5000, unit: "each" },
          { code: "ADD-08", name: "Annual CR renewal support", price: 3000, unit: "year" },
          { code: "ADD-09", name: "MISA license renewal support", price: 4000, unit: "year" },
          { code: "ADD-10", name: "Liquidation / deregistration support", price: 15000 },
        ],
      },
    ],
    onRequest: "In Full Formation",
    units: { person: "/ person", month: "/ month", year: "/ year", class: "/ class", each: "each" },
    servicesNote: "Prices in SAR, before VAT and government fees.",
    footnote: "Payment: 50% on signing the proposal, 50% on completion. If the eligibility phase shows that your activity cannot be licensed on the proposed route, only that phase's fee is payable.",
  },
  why: {
    eyebrow: "The firm",
    title: "A licensed law firm, not a formation agent",
    points: [
      { title: "Lawyers handle your file", text: "Alahmari & Gashlan is a Saudi law firm. The person forming your company can also give you a written legal opinion on structure, capital, licensing and employment." },
      { title: "Eligibility before fees", text: "The first phase of every engagement confirms that your activity can be licensed on the route we propose. If it cannot, only that phase is charged." },
      { title: "A proposal you can hold us to", text: "Phases, fees, timeline and required documents in one signed document, with the activity-matching table attached." },
      { title: "One point of contact", text: "A named associate from the first email to the bank account, with every step reported in writing." },
    ],
    firmTitle: "Part of a full-service Saudi law firm",
    firmText:
      "The incorporation desk is one practice of Alahmari & Gashlan, a law firm in Jeddah and Riyadh whose lawyers advise on corporate, finance, employment, tax, real estate and dispute resolution. The company we form for you has a law firm behind it as it grows.",
    practiceTitle: "Practice areas",
    practiceAreas: [
      "General corporate and commercial",
      "Contract drafting and negotiation",
      "Banking, finance and capital markets",
      "Dispute resolution and international arbitration",
      "Major projects and investments",
      "Employment and labor law",
      "Governance and compliance",
      "Sports law",
      "Healthcare law",
      "Tax and international trade",
      "Intellectual property and technology",
      "Real estate",
    ],
    foundersTitle: "Leadership",
    founders: [
      {
        name: "Majed Bin Dhafer Al-Ahmari",
        role: "Co-Founder & Managing Director",
        credentials: "Bachelor of Law, King Abdulaziz University. Administrative, commercial, financial and sports law; litigation before commercial, administrative and criminal courts and judicial committees.",
        photo: FOUNDER_PHOTOS.majed,
      },
      {
        name: "Mohamed Ahmed Gashlan",
        role: "Co-Founder & Director",
        credentials: "LLM and LLB, United Kingdom. Corporate and commercial law: governance, capital markets, fintech and international advisory for clients locally and globally.",
        photo: FOUNDER_PHOTOS.mohamed,
      },
      {
        name: "Abdullah Salamah Mahdi",
        role: "Head of Advisory",
        credentials:
          "In Saudi practice since 2011, Abdullah advises family conglomerates, investors and founders from structure to license: group restructurings, acquisitions and joint ventures, commercial contracts, governance and regulatory licensing in Saudi Arabia and the UAE. LL.M., USC Gould School of Law.",
        photo: FOUNDER_PHOTOS.abdullah,
      },
    ],
    teamText:
      "Senior consultants include Mohamed Said Abbas (19+ years, international commercial arbitration), Hawazen Ahmad Saeed (12+ years, corporate and intellectual property) and Ibrahim Ahmed Rezq (LL.M., University of Miami; formerly legal counsel at Aramco Luberef).",
    mainSiteCta: "Visit aglc.sa",
  },
  proposal: {
    eyebrow: "What you receive",
    title: "A proposal, not a quote",
    text: "Every engagement starts with a signed fixed-fee proposal on the firm's letterhead. This is the structure of a recent one for an engineering design company in a Special Economic Zone.",
    lines: [
      "Phase One: Eligibility Assessment and Structuring — SAR 7,500",
      "Phase Two: Zone Licensing and Company Registration — SAR 20,000",
      "Phase Three: Government Registrations — SAR 10,000",
      "Phase Four: Engineering Licensing (SCE) — SAR 10,000",
      "Phase Five: Residency, Workforce and Banking — SAR 10,000",
      "Total professional fees, exclusive of VAT — SAR 57,500",
      "Enclosure: Activity Matching & Licensing Table (SSIC, July 2025)",
    ],
  },
  tenders: {
    eyebrow: "Free for new entrants",
    title: "A licensed company needs work. AGLC Tenders helps you find it, free of charge.",
    text: "Tender opportunities in Saudi Arabia, gathered in one place by Alahmari & Gashlan so that companies entering the market can start competing for contracts from the day they are registered.",
    points: ["No charge for new entrants to the Saudi market", "Opportunities across sectors, in one place", "Our lawyers are on hand for bid documents, bonds and contract terms"],
    cta: "Open AGLC Tenders",
    url: TENDERS_URL,
  },
  residency: {
    eyebrow: "Premium Residency",
    title: "Residency without a sponsor, for investors and talent",
    intro: "The Premium Residency program grants self-sponsored residency, applied for alongside or independently of your company. We assess eligibility and prepare the application.",
    tracks: [
      { title: "Special Talent", items: ["Executives and professionals", "Healthcare and scientific experts", "Researchers and innovators"] },
      { title: "Investor Residency", items: ["Business owners and investors"] },
      { title: "Gifted Residency", items: ["Cultural and artistic talent", "Sports professionals", "Exceptional achievements"] },
    ],
    cta: "Check eligibility",
  },
  faq: {
    eyebrow: "Common questions",
    title: "Frequently asked questions",
    items: [
      {
        q: "What types of companies can foreigners establish in Saudi Arabia?",
        a: "A limited liability company (LLC), a simplified joint stock company (SJSC), a joint stock company (JSC), a branch of a foreign company, a regional headquarters (RHQ), or a representative or technical office for limited activities. Most foreign investors choose a 100% foreign-owned LLC.",
      },
      {
        q: "What is a MISA license and why do I need one?",
        a: "The Ministry of Investment (MISA) license is the permission for foreign ownership of a Saudi company. It is issued for specific activities and must be in place before the commercial registration. Some activities carry additional conditions, such as a parent company with a track record in several countries.",
      },
      {
        q: "How long does incorporation take?",
        a: "Licensing and registration usually take a few weeks once your documents are complete and authenticated; the full setup including the bank account and the manager's residency commonly takes two to four months. Your proposal states the estimated duration of each phase.",
      },
      {
        q: "What is the minimum capital for an LLC?",
        a: "There is no general minimum capital for most service activities. MISA sets minimum capital for certain activities, such as trading and some regulated sectors, and the capital must be realistic for the business plan. We confirm the requirement for your activity in the eligibility phase.",
      },
      {
        q: "What documents are required?",
        a: "The parent company's certificate of incorporation, trade license and articles; its latest audited financial statements; a board resolution approving the Saudi company and appointing the general manager; a power of attorney in our favor; and passport copies of the general manager and the authorized signatory. Documents issued abroad are notarized, apostilled and translated into Arabic.",
      },
      {
        q: "Can I own 100% of my company as a foreign investor?",
        a: "Yes, for most activities. A limited list of activities is reserved for Saudi nationals or requires a Saudi partner, and some professional activities have additional conditions. We confirm the position for your activity before you commit.",
      },
      {
        q: "What is the Premium Residency program?",
        a: "A Saudi residency that does not require an employer or sponsor, available to investors, special talents and gifted individuals in permanent and renewable forms. Holders can own property, run businesses and sponsor family members.",
      },
      {
        q: "What are the tax obligations for companies in Saudi Arabia?",
        a: "Foreign-owned companies pay corporate income tax at 20% on the foreign-owned share of profits (zakat applies to any Saudi or GCC share), charge VAT at 15%, file annual returns with ZATCA with audited financial statements, and withhold tax on certain payments abroad. Special Economic Zones offer reduced rates to eligible companies.",
      },
    ],
    disclaimer: "General information, not legal advice. Your proposal and engagement letter govern our work for you.",
  },
  contact: {
    eyebrow: "Contact",
    title: "Talk to a lawyer",
    intro: "Tell us about your plans and we reply within two business days with next steps or a proposal.",
    phone: "Phone",
    email: "Email",
    offices: "Offices",
    officesValue: "Jeddah, Madinah Branch Road · Riyadh",
    cta: "Start application",
    whatsapp: "Message us on WhatsApp",
  },
  footer: {
    legalName: "Al-Ahmari & Gashlan Lawyers & Legal Consultants",
    staff: "Staff sign-in",
    rights: "All rights reserved.",
    resourcesTitle: "Government resources",
    resources: [
      { label: "Ministry of Investment (MISA)", href: RESOURCE_LINKS[0].href },
      { label: "Ministry of Commerce", href: RESOURCE_LINKS[1].href },
      { label: "Premium Residency Center", href: RESOURCE_LINKS[2].href },
      { label: "ZATCA", href: RESOURCE_LINKS[3].href },
    ],
    sitesTitle: "Alahmari & Gashlan",
    privacy: "Privacy notice",
  },
  privacy: {
    title: "Privacy notice",
    updated: "Last updated: November 2026",
    sections: [
      { h: "Who we are", p: "Al-Ahmari & Gashlan Lawyers & Legal Consultants (Alahmari & Gashlan), Jeddah and Riyadh, Saudi Arabia. Contact: info@aglc.sa, +966 12 693 6418." },
      { h: "What we collect", p: "When you apply or write to us we collect the details you provide: name, company, country, email, phone, the service you are interested in and the description of your plans." },
      { h: "Why we use it", p: "To respond to your application, prepare a fee proposal, and, if you engage us, to provide legal services and meet our regulatory obligations. We do not sell personal data and we do not use it for unrelated marketing." },
      { h: "Where it is kept", p: "On the firm's request-management system, accessible only to our staff, and in our email and document systems. Applications that do not lead to an engagement are retained for as long as needed to answer follow-up questions and then deleted." },
      { h: "Your rights", p: "Under the Saudi Personal Data Protection Law you may ask what personal data we hold about you, request corrections or deletion, and withdraw consent where processing is based on it. Write to info@aglc.sa." },
    ],
  },
  apply: {
    title: "Start your application",
    intro: "Five minutes. You receive a reference number now and a fixed-fee proposal from a lawyer within two business days.",
    package: "Package",
    packageNone: "Not sure yet — advise me",
    legalForm: "Legal form",
    legalForms: ["Limited Liability Company (LLC)", "Simplified Joint Stock Company (SJSC)", "Joint Stock Company (JSC)", "Branch of a foreign company", "Representative / technical office", "Not sure"],
    salutation: "Title",
    name: "Full name",
    company: "Company",
    country: "Country of the parent company",
    email: "Email",
    phone: "Phone",
    service: "What do you need?",
    activities: "Activities the Saudi entity will carry out",
    activitiesPlaceholder: "e.g. mechanical and electrical engineering design services",
    details: "Tell us about your plans",
    detailsPlaceholder: "Your business, where the parent company is licensed, timing, staff you expect to relocate, and any questions.",
    consent: "I consent to Alahmari & Gashlan processing my personal data to respond to this application, as described in the",
    consentLink: "privacy notice (Saudi PDPL)",
    submit: "Send application",
    sending: "Sending…",
    privacy: "Your details are used only to respond to this application.",
    successTitle: "Thank you — we have received your application.",
    successText: "Your reference is {ref}. Please quote it in any follow-up. A lawyer will be in touch within two business days.",
    error: "Something went wrong. Please try again or email info@aglc.sa.",
    serviceOptions: SERVICE_OPTIONS_EN,
    serviceOptionLabels: SERVICE_OPTIONS_EN,
    salutations: ["Mr.", "Ms.", "Dr.", "Eng."],
  },
};

export const ar: SiteContent = {
  lang: "ar",
  dir: "rtl",
  otherLang: { label: "English", href: "/" },
  meta: {
    title: "تأسيس الشركات في السعودية للمستثمرين الأجانب",
    description: "مكتب محاماة سعودي مرخّص يؤسس شركتك — ترخيص وزارة الاستثمار والسجل التجاري والحساب البنكي والتأشيرات — بأتعاب ثابتة يُتفق عليها كتابةً قبل بدء أي عمل.",
  },
  nav: { process: "كيف نعمل", fees: "الأتعاب", why: "المكتب", tenders: "المنافسات", residency: "الإقامة المميزة", faq: "الأسئلة الشائعة", contact: "تواصل معنا", cta: "ابدأ طلبك", staff: "دخول الموظفين", mainSite: "aglc.sa" },
  hero: {
    eyebrow: "الأحمري وقشلان · محامون ومستشارون قانونيون · جدة والرياض",
    title: "تأسيس الشركات في المملكة العربية السعودية",
    titleAccent: "للمستثمرين الأجانب",
    subtitle: "مكتب محاماة سعودي مرخّص يؤسس شركتك — ترخيص وزارة الاستثمار، والسجل التجاري، والحساب البنكي، والتأشيرات — بأتعاب ثابتة يُتفق عليها كتابةً قبل بدء أي عمل.",
    cta: "ابدأ طلبك",
    secondary: "اطّلع على الأتعاب الثابتة",
    facts: ["تملّك أجنبي بنسبة 100% لمعظم الأنشطة", "عرض أتعاب مكتوب خلال يومي عمل", "50% عند التوقيع و50% عند الإنجاز"],
  },
  process: {
    eyebrow: "كيف نعمل",
    title: "من أول رسالة إلى شركة مسجّلة في أربع خطوات",
    intro: "تتعامل مع محامٍ واحد طوال المدة، وتُكتب كل مرحلة وكل أتعاب وكل موعد قبل أن تدفع شيئًا.",
    steps: [
      { title: "أخبرنا عن نشاطك", text: "خمس دقائق في نموذجنا: ما الذي ستزاوله الشركة، وأين تقع الشركة الأم، ومن سيدير الكيان السعودي. تحصل على رقم مرجعي فورًا." },
      { title: "تستلم عرض أتعاب ثابتًا", text: "خلال يومي عمل يرسل لك محامٍ عرضًا مكتوبًا: المراحل والأتعاب والجدول الزمني والمستندات المطلوبة، مع مطابقة أنشطتك للتصنيف السعودي للأنشطة الاقتصادية. لا توقّع إلا إذا اقتنعت." },
      { title: "نؤسس الشركة", text: "ترخيص وزارة الاستثمار، وعقد التأسيس، والسجل التجاري، والغرفة التجارية، والعنوان الوطني، وهيئة الزكاة والضريبة والجمارك، والتأمينات الاجتماعية — يتولاها محامٍ محدد بالاسم يطلعك على كل خطوة." },
      { title: "البنك والتأشيرات وما بعدها", text: "فتح الحساب البنكي للشركة، وتأشيرات العمل والإقامات للمدير والموظفين، والتسجيلات اللازمة لتوظيف العاملين وإصدار الفواتير للعملاء." },
    ],
    checklistTitle: "ما نقدّمه للجهات بالترتيب",
    checklist: [
      { title: "جمع المستندات وتجهيزها", text: "شهادة تأسيس الشركة الأم وعقدها، والقوائم المالية المدققة، وقرار مجلس الإدارة، والوكالة، وجوازات السفر." },
      { title: "تصديق المستندات", text: "التوثيق والأبوستيل في الخارج ثم الترجمة المعتمدة إلى العربية." },
      { title: "ترخيص وزارة الاستثمار", text: "مطابقة الأنشطة للتصنيف السعودي والتأكد من الأهلية قبل تقديم أي طلب." },
      { title: "عقد التأسيس", text: "صياغته بما يناسب هيكلكم وتوثيقه." },
      { title: "السجل التجاري", text: "حجز الاسم التجاري والقيد لدى وزارة التجارة." },
      { title: "الغرفة التجارية والعنوان الوطني والزكاة والتأمينات", text: "العضوية والعنوان والتسجيل الضريبي والتأمينات الاجتماعية، وتهيئة منصتي قوى ومدد." },
      { title: "الحساب البنكي للشركة", text: "التعريف بالبنك والمساندة في متطلبات الالتزام لديه." },
      { title: "تأشيرة المدير العام وإقامته", text: "إقامة المدير العام ثم تأشيرات الموظفين." },
    ],
    note: "تُذكر المدد والرسوم الحكومية في عرض الأتعاب، وهي تعتمد على النشاط وعلى مدد الإنجاز لدى الجهات الحكومية.",
  },
  fees: {
    eyebrow: "الأتعاب",
    title: "أتعاب ثابتة يُتفق عليها قبل البدء",
    intro: "الأتعاب المهنية ثابتة لكل باقة أو خدمة. تُحتسب الرسوم الحكومية بقيمتها الفعلية وتُضاف ضريبة القيمة المضافة (15%). لا تدفع شيئًا قبل توقيع عرض الأتعاب.",
    currency: "ر.س",
    approx: "≈ دولار",
    plusVat: "+ الضريبة والرسوم الحكومية",
    recommended: "الأكثر طلبًا",
    packages: [
      {
        key: "essential",
        name: "الباقة الأساسية",
        price: 30000,
        usd: 8000,
        tagline: "شركة مرخّصة ومسجّلة",
        lead: "كل ما يلزم لشركة مرخّصة ومسجّلة:",
        items: ["ترخيص وزارة الاستثمار", "عقد التأسيس صياغةً وتوثيقًا", "السجل التجاري", "عضوية الغرفة التجارية", "تسجيل العنوان الوطني", "التسجيل لدى هيئة الزكاة والضريبة والجمارك"],
      },
      {
        key: "full",
        name: "باقة التأسيس الكامل",
        price: 55000,
        usd: 14667,
        tagline: "جاهزة للتشغيل",
        lead: "كل ما في الباقة الأساسية، إضافةً إلى:",
        items: ["فتح الحساب البنكي للشركة", "تأشيرة عمل وإقامة لشخص واحد", "التسجيل في التأمينات الاجتماعية", "التسجيل في منصة قوى", "رخصة البلدية"],
        recommended: true,
      },
      {
        key: "premium",
        name: "الباقة المتكاملة",
        price: 102500,
        usd: 27333,
        tagline: "تأسيس ومساندة",
        lead: "كل ما في باقة التأسيس الكامل، إضافةً إلى:",
        items: ["تأشيرات عمل وإقامات لشخصين", "تفعيل الخدمات البنكية الإلكترونية", "تهيئة الالتزام بمتطلبات التوطين", "النشر في الجريدة الرسمية", "استشارة في هيكلة الشركة", "مراجعة سنوية للالتزام النظامي", "التعريف بمستشارين قانونيين ومحاسبيين"],
      },
    ],
    choose: "ابدأ بهذه الباقة",
    servicesTitle: "أو اختر خدمات منفردة",
    servicesIntro: "اثنتان وثلاثون خدمة بأسعار منفردة، ليُبنى عرض الأتعاب مما تحتاجه تحديدًا.",
    groups: [
      {
        title: "التأسيس الأساسي",
        services: [
          { code: "INC-01", name: "طلب ترخيص وزارة الاستثمار", price: 8000 },
          { code: "INC-02", name: "صياغة عقد التأسيس", price: 5000 },
          { code: "INC-03", name: "توثيق عقد التأسيس", price: 2500 },
          { code: "INC-04", name: "السجل التجاري", price: 3500 },
          { code: "INC-05", name: "عضوية الغرفة التجارية", price: 2000 },
          { code: "INC-06", name: "تسجيل العنوان الوطني", price: 1500 },
          { code: "INC-07", name: "النشر في الجريدة الرسمية", price: 1500 },
          { code: "INC-08", name: "استشارة في هيكلة الشركة", price: 4000 },
        ],
      },
      {
        title: "التسجيلات التنظيمية",
        services: [
          { code: "REG-01", name: "التسجيل في هيئة الزكاة والضريبة والجمارك (القيمة المضافة / الاستقطاع)", price: 3500 },
          { code: "REG-02", name: "التسجيل في التأمينات الاجتماعية", price: 2500 },
          { code: "REG-03", name: "التسجيل في منصة قوى (الموارد البشرية)", price: 2500 },
          { code: "REG-04", name: "رخصة البلدية", price: 3000 },
          { code: "REG-05", name: "تهيئة الالتزام بالتوطين (نطاقات)", price: 3500 },
        ],
      },
      {
        title: "الخدمات البنكية والمالية",
        services: [
          { code: "BNK-01", name: "فتح الحساب البنكي للشركة", price: null },
          { code: "BNK-02", name: "تفعيل الخدمات البنكية الإلكترونية", price: 1500 },
          { code: "BNK-03", name: "حساب بنكي إضافي (بنك ثانٍ)", price: 4500 },
        ],
      },
      {
        title: "التأشيرات والإقامة",
        services: [
          { code: "VIS-01", name: "طلب تأشيرة عمل", price: 5000, unit: "person" },
          { code: "VIS-02", name: "إصدار الإقامة", price: 5000, unit: "person" },
          { code: "VIS-03", name: "تنسيق الفحص الطبي", price: 1000, unit: "person" },
          { code: "VIS-04", name: "نقل الكفالة", price: 3500, unit: "person" },
          { code: "VIS-05", name: "تأشيرة الخروج والعودة", price: 1500, unit: "person" },
          { code: "VIS-06", name: "المساندة في طلب الإقامة المميزة", price: 20000 },
        ],
      },
      {
        title: "خدمات مستمرة وإضافية",
        services: [
          { code: "ADD-01", name: "المحاسبة والالتزام الضريبي", price: 3500, unit: "month" },
          { code: "ADD-02", name: "خدمات العلاقات الحكومية (PRO / GRO)", price: 4800, unit: "month" },
          { code: "ADD-03", name: "تصديق المستندات وتوثيقها", price: 4000 },
          { code: "ADD-04", name: "عنوان مكتب افتراضي", price: 6500, unit: "year" },
          { code: "ADD-05", name: "تسجيل علامة تجارية", price: 6500, unit: "class" },
          { code: "ADD-06", name: "مراجعة سنوية للالتزام النظامي", price: 12500, unit: "year" },
          { code: "ADD-07", name: "تعديل بيانات الشركة (السجل / عقد التأسيس)", price: 5000, unit: "each" },
          { code: "ADD-08", name: "المساندة في تجديد السجل التجاري", price: 3000, unit: "year" },
          { code: "ADD-09", name: "المساندة في تجديد ترخيص وزارة الاستثمار", price: 4000, unit: "year" },
          { code: "ADD-10", name: "المساندة في التصفية وشطب السجل", price: 15000 },
        ],
      },
    ],
    onRequest: "ضمن باقة التأسيس الكامل",
    units: { person: "/ للشخص", month: "/ شهريًا", year: "/ سنويًا", class: "/ للفئة", each: "لكل تعديل" },
    servicesNote: "الأسعار بالريال السعودي قبل الضريبة والرسوم الحكومية.",
    footnote: "الدفع: 50% عند توقيع عرض الأتعاب و50% عند الإنجاز. وإذا تبيّن في مرحلة الأهلية أن نشاطكم لا يمكن ترخيصه على المسار المقترح، فلا تُستحق إلا أتعاب تلك المرحلة.",
  },
  why: {
    eyebrow: "المكتب",
    title: "مكتب محاماة مرخّص، لا وكيل تأسيس",
    points: [
      { title: "محامون يتولون ملفك", text: "الأحمري وقشلان مكتب محاماة سعودي. من يؤسس شركتك يستطيع أيضًا أن يقدّم لك رأيًا قانونيًا مكتوبًا في الهيكلة ورأس المال والترخيص والتوظيف." },
      { title: "الأهلية قبل الأتعاب", text: "المرحلة الأولى من كل تعاقد تؤكد إمكانية ترخيص نشاطك على المسار الذي نقترحه. وإن تعذّر ذلك فلا تُستحق إلا أتعاب تلك المرحلة." },
      { title: "عرض أتعاب يُحاسَب عليه", text: "المراحل والأتعاب والجدول الزمني والمستندات المطلوبة في مستند واحد موقّع، مع جدول مطابقة الأنشطة مرفقًا." },
      { title: "جهة اتصال واحدة", text: "مستشار محدد بالاسم من أول رسالة حتى فتح الحساب البنكي، مع تقرير مكتوب عن كل خطوة." },
    ],
    firmTitle: "جزء من مكتب محاماة سعودي متكامل",
    firmText: "خدمة التأسيس إحدى ممارسات الأحمري وقشلان، مكتب محاماة في جدة والرياض يقدّم محاموه الاستشارة في شؤون الشركات والتمويل والعمل والضرائب والعقارات وتسوية المنازعات. فالشركة التي نؤسسها لك يقف خلفها مكتب محاماة كلما نمت.",
    practiceTitle: "مجالات الممارسة",
    practiceAreas: [
      "الشركات والأعمال التجارية",
      "صياغة العقود والتفاوض",
      "المصارف والتمويل وأسواق المال",
      "تسوية المنازعات والتحكيم الدولي",
      "المشاريع الكبرى والاستثمار",
      "العمل والعمال",
      "الحوكمة والالتزام",
      "القانون الرياضي",
      "القانون الصحي",
      "الضرائب والتجارة الدولية",
      "الملكية الفكرية والتقنية",
      "العقارات",
    ],
    foundersTitle: "القيادة",
    founders: [
      {
        name: "ماجد بن ظافر الأحمري",
        role: "شريك مؤسس والمدير العام",
        credentials: "بكالوريوس القانون من جامعة الملك عبدالعزيز. متخصص في القانون الإداري والتجاري والمالي والرياضي، وفي الترافع أمام المحاكم التجارية والإدارية والجزائية واللجان القضائية.",
        photo: FOUNDER_PHOTOS.majed,
      },
      {
        name: "محمد أحمد قشلان",
        role: "شريك مؤسس ومدير",
        credentials: "ماجستير وبكالوريوس في القانون من المملكة المتحدة. متخصص في قانون الشركات والأعمال: الحوكمة وأسواق المال والتقنية المالية والاستشارات الدولية لعملاء محليين ودوليين.",
        photo: FOUNDER_PHOTOS.mohamed,
      },
      {
        name: "عبدالله سلامة مهدي",
        role: "رئيس قسم الاستشارات",
        credentials:
          "يمارس العمل القانوني في المملكة منذ عام 2011، ويرافق المجموعات العائلية الكبرى والمستثمرين ورواد الأعمال من الهيكلة حتى الترخيص: إعادة هيكلة المجموعات، والاستحواذ والمشاريع المشتركة، والعقود التجارية، والحوكمة، والتراخيص النظامية في المملكة العربية السعودية والإمارات. ماجستير في القانون من كلية غولد للقانون بجامعة جنوب كاليفورنيا.",
        photo: FOUNDER_PHOTOS.abdullah,
      },
    ],
    teamText: "يضم فريق المستشارين محمد سعيد عباس (أكثر من 19 عامًا في التحكيم التجاري الدولي)، وهوازن أحمد سعيد (أكثر من 12 عامًا في قانون الشركات والملكية الفكرية)، وإبراهيم أحمد رزق (ماجستير في القانون من جامعة ميامي، ومستشار قانوني سابق في أرامكو لوبريف).",
    mainSiteCta: "زيارة aglc.sa",
  },
  proposal: {
    eyebrow: "ما الذي تستلمه",
    title: "عرض أتعاب، لا مجرد تسعيرة",
    text: "يبدأ كل تعاقد بعرض أتعاب ثابت موقّع على ورق المكتب الرسمي. هذا هيكل عرض حديث لشركة تصميم هندسي في منطقة اقتصادية خاصة.",
    lines: [
      "المرحلة الأولى: تقييم الأهلية والهيكلة — 7,500 ر.س",
      "المرحلة الثانية: ترخيص المنطقة وتسجيل الشركة — 20,000 ر.س",
      "المرحلة الثالثة: التسجيلات الحكومية — 10,000 ر.س",
      "المرحلة الرابعة: الترخيص الهندسي (هيئة المهندسين) — 10,000 ر.س",
      "المرحلة الخامسة: الإقامة والعمالة والبنك — 10,000 ر.س",
      "إجمالي الأتعاب المهنية غير شاملة الضريبة — 57,500 ر.س",
      "المرفق: جدول مطابقة الأنشطة والتراخيص (التصنيف الوطني، يوليو 2025)",
    ],
  },
  tenders: {
    eyebrow: "مجانًا للشركات الجديدة",
    title: "الشركة المرخّصة تحتاج إلى أعمال. منصة منافسات الأحمري وقشلان تساعدك على إيجادها مجانًا.",
    text: "فرص المنافسات والعطاءات في المملكة مجموعة في مكان واحد من الأحمري وقشلان، ليتمكن الداخلون الجدد إلى السوق من المنافسة على العقود منذ يوم تسجيل شركاتهم.",
    points: ["بلا رسوم للشركات الجديدة في السوق السعودية", "فرص من مختلف القطاعات في مكان واحد", "محامونا جاهزون لمساندتكم في مستندات العطاء والضمانات وشروط العقود"],
    cta: "افتح منصة المنافسات",
    url: TENDERS_URL,
  },
  residency: {
    eyebrow: "الإقامة المميزة",
    title: "إقامة بلا كفيل للمستثمرين وأصحاب المواهب",
    intro: "يمنح برنامج الإقامة المميزة إقامة ذاتية الكفالة، تُطلب إلى جانب تأسيس شركتك أو مستقلة عنه. نقيّم الأهلية ونعدّ الطلب.",
    tracks: [
      { title: "إقامة الكفاءات", items: ["التنفيذيون والمهنيون", "خبراء الصحة والعلوم", "الباحثون والمبتكرون"] },
      { title: "إقامة المستثمر", items: ["أصحاب الأعمال والمستثمرون"] },
      { title: "إقامة الموهوبين", items: ["المواهب الثقافية والفنية", "الرياضيون المحترفون", "أصحاب الإنجازات الاستثنائية"] },
    ],
    cta: "تحقق من الأهلية",
  },
  faq: {
    eyebrow: "أسئلة شائعة",
    title: "الأسئلة المتكررة",
    items: [
      { q: "ما أنواع الشركات التي يمكن للأجانب تأسيسها في السعودية؟", a: "شركة ذات مسؤولية محدودة، أو شركة مساهمة مبسطة، أو شركة مساهمة، أو فرع لشركة أجنبية، أو مقر إقليمي، أو مكتب تمثيل أو مكتب فني لأنشطة محدودة. ويختار معظم المستثمرين الأجانب شركة ذات مسؤولية محدودة مملوكة لهم بالكامل." },
      { q: "ما ترخيص وزارة الاستثمار ولماذا أحتاجه؟", a: "ترخيص وزارة الاستثمار هو الإذن بالتملّك الأجنبي لشركة سعودية. يصدر لأنشطة محددة ويجب الحصول عليه قبل السجل التجاري. وتفرض بعض الأنشطة شروطًا إضافية، كأن تكون للشركة الأم خبرة في عدة دول." },
      { q: "كم يستغرق التأسيس؟", a: "يستغرق الترخيص والتسجيل عادةً بضعة أسابيع بعد اكتمال المستندات وتصديقها، أما التأسيس الكامل بما فيه الحساب البنكي وإقامة المدير فيستغرق غالبًا من شهرين إلى أربعة أشهر. ويبيّن عرض الأتعاب المدة التقديرية لكل مرحلة." },
      { q: "ما الحد الأدنى لرأس مال الشركة ذات المسؤولية المحدودة؟", a: "لا يوجد حد أدنى عام لرأس المال لمعظم الأنشطة الخدمية. وتحدد وزارة الاستثمار حدًا أدنى لبعض الأنشطة كالتجارة وبعض القطاعات المنظّمة، ويجب أن يكون رأس المال واقعيًا بالنسبة لخطة العمل. ونؤكد المتطلب الخاص بنشاطك في مرحلة الأهلية." },
      { q: "ما المستندات المطلوبة؟", a: "شهادة تأسيس الشركة الأم ورخصتها التجارية وعقدها، وآخر قوائم مالية مدققة لها، وقرار مجلس الإدارة بالموافقة على تأسيس الشركة السعودية وتعيين المدير العام، ووكالة لمكتبنا، وصور جوازات المدير العام والمفوض بالتوقيع. وتُوثّق المستندات الصادرة في الخارج وتُصدّق بالأبوستيل وتُترجم إلى العربية." },
      { q: "هل أستطيع تملّك شركتي بنسبة 100% بصفتي مستثمرًا أجنبيًا؟", a: "نعم لمعظم الأنشطة. وهناك قائمة محدودة من الأنشطة المقصورة على السعوديين أو التي تتطلب شريكًا سعوديًا، كما أن لبعض الأنشطة المهنية شروطًا إضافية. ونؤكد لك وضع نشاطك قبل أن تلتزم بشيء." },
      { q: "ما برنامج الإقامة المميزة؟", a: "إقامة سعودية لا تتطلب صاحب عمل أو كفيلًا، متاحة للمستثمرين وأصحاب الكفاءات والموهوبين بصيغتين دائمة ومتجددة. ويحق لحاملها تملّك العقار وإدارة الأعمال واستقدام أفراد الأسرة." },
      { q: "ما الالتزامات الضريبية للشركات في السعودية؟", a: "تدفع الشركات المملوكة لأجانب ضريبة دخل بنسبة 20% على حصة الملكية الأجنبية من الأرباح (وتخضع الحصة السعودية أو الخليجية للزكاة)، وتفرض ضريبة قيمة مضافة بنسبة 15%، وتقدّم إقرارات سنوية لهيئة الزكاة والضريبة والجمارك مع قوائم مالية مدققة، وتستقطع ضريبة على بعض المدفوعات للخارج. وتوفر المناطق الاقتصادية الخاصة معدلات مخفضة للشركات المؤهلة." },
    ],
    disclaimer: "معلومات عامة لا تُعد استشارة قانونية. ويحكم عملنا لكم عرض الأتعاب وخطاب التعاقد.",
  },
  contact: {
    eyebrow: "تواصل معنا",
    title: "تحدّث إلى محامٍ",
    intro: "أخبرنا عن خططك ونرد خلال يومي عمل بالخطوات التالية أو بعرض أتعاب.",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    offices: "المكاتب",
    officesValue: "جدة، طريق المدينة الفرعي · الرياض",
    cta: "ابدأ طلبك",
    whatsapp: "راسلنا عبر واتساب",
  },
  footer: {
    legalName: "الأحمري وقشلان محامون ومستشارون قانونيون",
    staff: "دخول الموظفين",
    rights: "جميع الحقوق محفوظة.",
    resourcesTitle: "جهات حكومية",
    resources: [
      { label: "وزارة الاستثمار", href: RESOURCE_LINKS[0].href },
      { label: "وزارة التجارة", href: RESOURCE_LINKS[1].href },
      { label: "مركز الإقامة المميزة", href: RESOURCE_LINKS[2].href },
      { label: "هيئة الزكاة والضريبة والجمارك", href: RESOURCE_LINKS[3].href },
    ],
    sitesTitle: "الأحمري وقشلان",
    privacy: "إشعار الخصوصية",
  },
  privacy: {
    title: "إشعار الخصوصية",
    updated: "آخر تحديث: نوفمبر 2026",
    sections: [
      { h: "من نحن", p: "الأحمري وقشلان محامون ومستشارون قانونيون، جدة والرياض، المملكة العربية السعودية. للتواصل: info@aglc.sa، +966 12 693 6418." },
      { h: "ما الذي نجمعه", p: "عندما تقدّم طلبًا أو تراسلنا نجمع البيانات التي تزوّدنا بها: الاسم والشركة والدولة والبريد الإلكتروني والهاتف والخدمة التي تهمّك ووصف خططك." },
      { h: "لماذا نستخدمها", p: "للرد على طلبك وإعداد عرض الأتعاب، وإذا تعاقدت معنا فلتقديم الخدمات القانونية والوفاء بالتزاماتنا النظامية. لا نبيع البيانات الشخصية ولا نستخدمها لأغراض تسويقية غير ذات صلة." },
      { h: "أين تُحفظ", p: "في نظام إدارة الطلبات الخاص بالمكتب الذي لا يصل إليه إلا موظفونا، وفي أنظمة البريد والمستندات لدينا. وتُحفظ الطلبات التي لا تنتهي بتعاقد للمدة اللازمة للرد على الاستفسارات اللاحقة ثم تُحذف." },
      { h: "حقوقك", p: "بموجب نظام حماية البيانات الشخصية السعودي يمكنك معرفة ما نحتفظ به من بياناتك الشخصية، وطلب تصحيحها أو حذفها، وسحب الموافقة حيثما كانت المعالجة قائمة عليها. راسلنا على info@aglc.sa." },
    ],
  },
  apply: {
    title: "ابدأ طلبك",
    intro: "خمس دقائق. تحصل على رقم مرجعي الآن وعلى عرض أتعاب ثابت من محامٍ خلال يومي عمل.",
    package: "الباقة",
    packageNone: "لست متأكدًا بعد — أرشدوني",
    legalForm: "الشكل القانوني",
    legalForms: ["شركة ذات مسؤولية محدودة", "شركة مساهمة مبسطة", "شركة مساهمة", "فرع شركة أجنبية", "مكتب تمثيل / مكتب فني", "لست متأكدًا"],
    salutation: "اللقب",
    name: "الاسم الكامل",
    company: "الشركة",
    country: "دولة الشركة الأم",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    service: "ما الذي تحتاجه؟",
    activities: "الأنشطة التي سيزاولها الكيان السعودي",
    activitiesPlaceholder: "مثال: خدمات التصميم الهندسي الميكانيكي والكهربائي",
    details: "أخبرنا عن خططك",
    detailsPlaceholder: "نشاطكم، وأين الشركة الأم مرخّصة، والتوقيت، والموظفون الذين تتوقعون نقلهم، وأي أسئلة.",
    consent: "أوافق على معالجة الأحمري وقشلان لبياناتي الشخصية للرد على هذا الطلب وفق",
    consentLink: "إشعار الخصوصية (نظام حماية البيانات الشخصية)",
    submit: "إرسال الطلب",
    sending: "جارٍ الإرسال…",
    privacy: "تُستخدم بياناتك للرد على هذا الطلب فقط.",
    successTitle: "شكرًا لك — استلمنا طلبك.",
    successText: "رقمك المرجعي هو {ref}. يرجى ذكره في أي مراسلة لاحقة. سيتواصل معك محامٍ خلال يومي عمل.",
    error: "حدث خطأ ما. يرجى المحاولة مرة أخرى أو مراسلتنا على info@aglc.sa.",
    serviceOptions: SERVICE_OPTIONS_EN,
    serviceOptionLabels: [
      "شركة مملوكة بالكامل لأجانب (وزارة الاستثمار)",
      "شركة في منطقة اقتصادية خاصة",
      "فرع شركة أجنبية",
      "مقر إقليمي",
      "شراكة مع شريك سعودي",
      "مكتب مهني / هندسي",
      "الإقامة المميزة",
      "أخرى",
    ],
    salutations: ["السيد", "السيدة", "د.", "م."],
  },
};

export const SITE_CONTENT: Record<Lang, SiteContent> = { en, ar };

/** Map a package key to the request's service type and summary text. */
export const PACKAGE_LABELS: Record<Package["key"], string> = {
  essential: "AGLC Essential (SAR 30,000)",
  full: "AGLC Full Formation (SAR 55,000)",
  premium: "AGLC Premium All-Inclusive (SAR 102,500)",
};
