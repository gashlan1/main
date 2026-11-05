import type { ServiceRoute } from "@/db/schema";

/**
 * Default service catalog. The five phases marked `fromSample` carry the fees
 * from the firm's October 2026 SEZ proposal; the others are placeholders to
 * adjust under Settings → Services & fees.
 */
export type CatalogService = {
  key: string;
  title: string;
  description: string;
  bullets: string[];
  fee: number;
  duration: string;
  route: ServiceRoute;
  fromSample?: boolean;
};

export const DEFAULT_SERVICES: CatalogService[] = [
  {
    key: "eligibility",
    title: "Eligibility Assessment and Structuring",
    description: "Confirms the route (SEZ or MISA mainland) and the activities before anything is filed.",
    fee: 7500,
    duration: "1–2 weeks",
    route: "both",
    fromSample: true,
    bullets: [
      "Confirming with the Economic Cities and Special Zones Authority (ECZA) and the zone administration whether the intended activities qualify for licensing in a SEZ, and which zone best fits the business.",
      "Where SEZ licensing is not available for these activities, advising on the alternative of a 100% foreign-owned company registered with the Ministry of Investment (MISA) outside the zones.",
      "Finalizing the activity selection on the basis of the enclosed preliminary Activity Matching & Licensing Table, prepared under the Saudi Classification of Economic Activities (SSIC, July 2025).",
      "A short written opinion on capital, office, staffing and sector-regulator requirements before any filing is made.",
    ],
  },
  {
    key: "sez_licensing",
    title: "Zone Licensing and Company Registration",
    description: "Zone license and LLC registration in the ECZA companies register.",
    fee: 20000,
    duration: "4–8 weeks",
    route: "sez",
    fromSample: true,
    bullets: [
      "Preparing the application to the zone administration, including the business plan, activity description and financial forecasts.",
      "Reviewing the parent company documents after notarization, apostille and certified Arabic translation.",
      "Obtaining the zone license and registering the limited liability company (LLC) in the ECZA companies register, including trade name and Articles of Association.",
    ],
  },
  {
    key: "misa_license",
    title: "MISA Investment License (Mainland)",
    description: "Investment license for a 100% foreign-owned company outside the zones.",
    fee: 15000,
    duration: "2–4 weeks",
    route: "mainland",
    bullets: [
      "Preparing the MISA investment license application, including the activity description and the parent company documents after notarization, apostille and certified Arabic translation.",
      "Confirming that the parent company meets MISA's published eligibility requirements for the selected activities.",
      "Obtaining the investment license and setting up the investor account on the MISA portal.",
    ],
  },
  {
    key: "cr_aoa",
    title: "Commercial Registration and Articles of Association",
    description: "Trade name, Articles of Association and Commercial Registration (mainland).",
    fee: 12000,
    duration: "2–3 weeks",
    route: "mainland",
    bullets: [
      "Reserving the trade name with the Ministry of Commerce.",
      "Drafting the Articles of Association of the limited liability company (LLC) and completing their notarization.",
      "Obtaining the Commercial Registration (CR) and the Chamber of Commerce membership.",
    ],
  },
  {
    key: "gov_registrations",
    title: "Government Registrations",
    description: "ZATCA, GOSI, National Address and the employer portals.",
    fee: 10000,
    duration: "1–2 weeks",
    route: "both",
    fromSample: true,
    bullets: [
      "Registration with the Zakat, Tax and Customs Authority (ZATCA), the General Organization for Social Insurance (GOSI) and National Address.",
      "Employer setup on Qiwa, Mudad and Muqeem.",
    ],
  },
  {
    key: "sce_licensing",
    title: "Engineering Licensing (SCE)",
    description: "Engineering office registration with the Saudi Council of Engineers.",
    fee: 10000,
    duration: "2–4 weeks",
    route: "both",
    fromSample: true,
    bullets: [
      "Registering the company as an engineering office with the Saudi Council of Engineers (SCE), and registering its engineers with the SCE.",
    ],
  },
  {
    key: "sector_license",
    title: "Sector Licensing (other authority)",
    description: "Any additional license the selected activities require (e.g. HCIS, MoH, CST).",
    fee: 10000,
    duration: "2–6 weeks",
    route: "both",
    bullets: [
      "Preparing and filing the application for the sector license required for the selected activities with the competent authority, and following up until issuance.",
    ],
  },
  {
    key: "residency",
    title: "Residency, Workforce and Banking",
    description: "GM iqama, employee visas and the corporate bank account.",
    fee: 10000,
    duration: "3–6 weeks",
    route: "both",
    fromSample: true,
    bullets: [
      "Residency (iqama) for the General Manager.",
      "Work visas and iqamas for up to two (2) employees.",
      "Support in opening the company's corporate bank account.",
    ],
  },
  {
    key: "rhq",
    title: "Regional Headquarters (RHQ) License",
    description: "RHQ program eligibility, license and registration.",
    fee: 25000,
    duration: "4–8 weeks",
    route: "mainland",
    bullets: [
      "Assessing eligibility under the RHQ program and preparing the RHQ license application to MISA, including the regional structure and the activities to be performed from the Kingdom.",
      "Obtaining the RHQ license, registering the RHQ entity, and advising on the program's incentives and the conditions attached to them.",
    ],
  },
  {
    key: "branch",
    title: "Branch of a Foreign Company",
    description: "MISA license and Commercial Registration for a branch.",
    fee: 18000,
    duration: "4–8 weeks",
    route: "mainland",
    bullets: [
      "Preparing the branch registration file, including the parent company resolution and the appointment of the branch manager.",
      "Obtaining the MISA license for the branch and its Commercial Registration.",
    ],
  },
  {
    key: "trademark",
    title: "Trademark Registration (SAIP)",
    description: "Clearance search and filing with the Saudi Authority for Intellectual Property.",
    fee: 6000,
    duration: "6–9 months",
    route: "both",
    bullets: [
      "Clearance search, filing the trademark application with the Saudi Authority for Intellectual Property (SAIP), and following up until registration.",
    ],
  },
  {
    key: "compliance",
    title: "Post-Incorporation Compliance (First Year)",
    description: "Renewals calendar and routine portal updates for the first year.",
    fee: 12000,
    duration: "12 months",
    route: "both",
    bullets: [
      "A calendar of filings and renewals (CR, licenses, GOSI, ZATCA), reminders ahead of each deadline, and handling of routine government-portal updates during the first year.",
    ],
  },
];

export type CatalogActivity = {
  code: string;
  activity: string;
  authority: string;
  license: string;
  remarks: string;
};

/** SSIC (July 2025) rows verified in the firm's Activity Matching table. */
export const DEFAULT_ACTIVITIES: CatalogActivity[] = [
  {
    code: "711041",
    activity: "Mechanical engineering consultancy",
    authority: "Saudi Council of Engineers (SCE)",
    license: "YES — SCE License",
    remarks: "Mechanical design (core activity)",
  },
  {
    code: "711032",
    activity: "Engineering activities for electrical, excavation, safety and chemical projects",
    authority: "Saudi Council of Engineers (SCE)",
    license: "YES — SCE License",
    remarks: "Electrical design (core activity)",
  },
  {
    code: "711040",
    activity: "Engineering and technical activities for all specialized engineering branches",
    authority: "Saudi Council of Engineers (SCE)",
    license: "YES — SCE License",
    remarks: "General engineering design services",
  },
  {
    code: "711013",
    activity: "Engineering and architectural consultancy",
    authority: "Saudi Council of Engineers (SCE)",
    license: "YES — SCE License",
    remarks: "Optional: if architectural design is included",
  },
  {
    code: "711088",
    activity: "Solar photovoltaic systems consultancy",
    authority: "Saudi Council of Engineers (SCE)",
    license: "YES — SCE License",
    remarks: "Optional: if solar PV design is included",
  },
  {
    code: "711011",
    activity: "Fire prevention and protection engineering consultancy",
    authority: "High Commission for Industrial Security (HCIS)",
    license: "YES — HCIS License",
    remarks: "Optional: only if fire protection design is included",
  },
];

export type CatalogSentence = { category: string; label: string; text: string };

/**
 * One-click sentences. Placeholders in braces are filled from the request and
 * its latest proposal when the chip is clicked.
 */
export const DEFAULT_SENTENCES: CatalogSentence[] = [
  // Opening
  { category: "Opening", label: "Thank you for your inquiry", text: "Thank you for your inquiry regarding {serviceDescription}." },
  { category: "Opening", label: "Further to your website inquiry", text: "Further to your website inquiry (Ref. {ref}), we are pleased to submit our fixed-fee proposal." },
  { category: "Opening", label: "Thank you for your reply", text: "Thank you for your reply and for the information provided." },
  { category: "Opening", label: "Thank you for the documents", text: "Thank you for sending the documents; we have received them and are reviewing them now." },
  // Proposal
  { category: "Proposal", label: "Attached are (numbered)", text: "Attached are:\n01  Fixed-Fee Proposal, dated {proposalDate}\n02  Preliminary Activity Matching and Licensing Table" },
  { category: "Proposal", label: "Fees are fixed at SAR …", text: "Our professional fees are fixed at SAR {total}, exclusive of VAT, across {phaseCount} phases." },
  { category: "Proposal", label: "Government fees not included", text: "Government fees and third-party costs are not included; we will provide an itemized estimate of government fees once the zone and route are confirmed." },
  { category: "Proposal", label: "Same fees on the MISA route", text: "If an SEZ license is not available, the same fees apply to the alternative of a 100% foreign-owned company registered with the Ministry of Investment (MISA) outside the zones." },
  { category: "Proposal", label: "Only Phase One payable if no route", text: "If neither route is available, only the Phase One fee of SAR {phaseOneFee} is payable." },
  { category: "Proposal", label: "Payment terms", text: "Payment is 50% upon signing, 25% upon company registration, and 25% upon completion of the final phase." },
  // Eligibility & route
  { category: "Eligibility & route", label: "Eligibility confirmed first", text: "One point bears on the route from the outset. Standalone {activityShort} services are not among the published target sectors of the operating zones, so Phase One confirms eligibility with the zone administration before anything is filed." },
  { category: "Eligibility & route", label: "MISA requirement (4 countries / 10 years)", text: "Under MISA's published requirements, that route requires the parent company, or one of its affiliates, to be licensed in at least four countries in the same field and to have at least ten years of experience." },
  { category: "Eligibility & route", label: "SCE registration required", text: "In both routes, the company must register with the Saudi Council of Engineers (SCE) and employ SCE-registered engineers before providing engineering services." },
  { category: "Eligibility & route", label: "SEZ incentives", text: "SEZ incentives, where available, include corporate income tax at 5% for up to 20 years, 0% withholding tax on profit repatriation and expatriate levy exemptions during the first five years." },
  // Request information
  { category: "Request information", label: "Countries licensed / years of experience", text: "To help us assess this early, please let us know in which countries the parent company is currently licensed and how long it has practiced in this field." },
  { category: "Request information", label: "Parent company documents", text: "Please send us the certificate of incorporation, trade license and articles of the parent company, together with its latest audited financial statements." },
  { category: "Request information", label: "Board resolution and GM", text: "Please provide the board resolution approving the Saudi company, its capital and the appointment of the General Manager, with passport copies of the General Manager and the authorized signatory." },
  { category: "Request information", label: "Company profile", text: "Kindly share a company profile, including experience, project references and the qualifications of the key professionals." },
  { category: "Request information", label: "Proposed names", text: "Kindly confirm the proposed company name(s) in order of preference so that we can check availability." },
  { category: "Request information", label: "Describe the activities", text: "Could you describe the activities the Saudi company will carry out, so that we can match them to the Saudi Classification of Economic Activities?" },
  // Next steps
  { category: "Next steps", label: "Sign the approval block", text: "To proceed, please sign the approval block on the final page of the proposal and return it with the documents listed in Section 4." },
  { category: "Next steps", label: "Proposal valid until", text: "The proposal is valid until {validUntil}." },
  { category: "Next steps", label: "Arrange a call", text: "We would be pleased to arrange a call at your convenience." },
  { category: "Next steps", label: "Itemized government fees after Phase One", text: "On completion of Phase One we will send an itemized estimate of the government fees, once the zone and route are confirmed." },
  // Status update
  { category: "Status update", label: "Documents received, revert in 2 days", text: "We have received your documents and will revert within two business days." },
  { category: "Status update", label: "Application submitted", text: "Your application has been submitted to the {authority}; we will update you as soon as we receive a response." },
  { category: "Status update", label: "License issued", text: "We are pleased to confirm that the license has been issued; a copy is attached, and we are proceeding with the next phase." },
  { category: "Status update", label: "Awaiting authority", text: "The matter is currently with the authority for processing; we are following up and will keep you informed." },
  // Closing
  { category: "Closing", label: "Decline politely", text: "Having reviewed your inquiry, we regret that this matter falls outside the scope of our practice; we would be glad to refer you to a suitable firm." },
  { category: "Closing", label: "Happy to answer questions", text: "Please do not hesitate to contact us with any questions." },
  { category: "Closing", label: "Look forward to working together", text: "We look forward to working with you on this matter." },
];

export const DEFAULT_PROPOSAL_TEXT = {
  governmentFees:
    "Payable at actual cost and not included in our fees. These include license and registration fees, sector-regulator registration fees, and visa, iqama and work permit fees. An itemized estimate will be provided on completion of Phase One, once the route is confirmed.",
  thirdPartyCosts:
    "Not included: notarization and apostille of parent company documents, certified Arabic translation, office lease, medical insurance, and courier costs.",
  requiredDocuments: [
    "Certificate of incorporation, trade license and articles of the parent company.",
    "Latest audited financial statements of the parent company.",
    "Board resolution approving the Saudi company, its capital and the appointment of the General Manager.",
    "Company profile, including experience, project references and the qualifications of key professionals.",
    "Power of attorney in favor of our firm, and passport copies of the General Manager and the authorized signatory.",
  ],
  recurringCosts:
    "License and registration renewal, professional-body renewals, iqama renewals, work permit fees, GOSI contributions, medical insurance, office lease, and ZATCA filings with audited financial statements.",
  timelineNote:
    "Durations run from receipt of complete documents and exclude the time needed to notarize and apostille documents abroad and the processing time of government authorities.",
  paymentTerms: "50% upon signing, 25% upon company registration, and 25% upon completion of the final phase.",
  activityTableTitle: "Activity Matching & Licensing Table",
  activityTableSubtitle:
    "Intended activities matched against the Saudi Classification of Economic Activities (SSIC, July 2025), with licensing flags",
  activityNote:
    "Codes and licensing authorities are taken from the SSIC (July 2025) published classification. Final codes are subject to confirmation with the zone administration or on the MISA and Ministry of Commerce activity-matching systems at filing. Highlighted rows require a license from the stated authority before the activity may be practiced.",
};
