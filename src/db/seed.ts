/**
 * Seeds staff accounts, the service catalog, SSIC activities, one-click
 * sentences and sample requests (including the October 2026 SEZ proposal
 * that this portal was modelled on).
 *
 *   npm run seed            # add anything missing
 *   npm run seed:reset      # wipe the local database + uploads first
 */
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    for (const raw of fs.readFileSync(p, "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFiles();
  const reset = process.argv.includes("--reset");
  const dataDir = path.resolve(process.cwd(), process.env.DATA_DIR ?? "./data");
  if (reset && !process.env.DATABASE_URL) {
    fs.rmSync(dataDir, { recursive: true, force: true });
    console.log(`Removed ${dataDir}`);
  }

  const { getDb } = await import("./client");
  const schema = await import("./schema");
  const { hashPassword } = await import("@/lib/password");
  const { DEFAULT_ACTIVITIES, DEFAULT_SENTENCES, DEFAULT_SERVICES } = await import("@/lib/catalog");
  const { newId } = await import("@/lib/ids");
  const { nowIso } = await import("@/lib/dates");
  const { createRequest, addEvent, setStatus, assignRequest } = await import("@/lib/requests");
  const { createProposalVersion, markProposalSent, buildDefaultProposal, getCatalog } = await import("@/lib/proposals");
  const { eq, sql } = await import("drizzle-orm");

  const db = await getDb();
  const now = nowIso();

  // --- Staff -------------------------------------------------------------
  const password = process.env.SEED_STAFF_PASSWORD || randomBytes(6).toString("base64url");
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "mag@aglc.sa").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || password;
  const staff: Array<{ name: string; email: string; role: "admin" | "associate"; title: string }> = [
    { name: "Mohamed Gashlan", email: "mag@aglc.sa", role: "admin", title: "Co-Founder & Managing Director" },
    { name: "Majed Alahmari", email: "majed@aglc.sa", role: "admin", title: "Co-Founder & Managing Director" },
    { name: "Abdullah Salamah", email: "abdullah@aglc.sa", role: "associate", title: "Associate" },
    { name: "Ibrahem Rezq", email: "iar@aglc.sa", role: "associate", title: "Associate" },
  ];
  if (!staff.some((s) => s.email === adminEmail)) staff.unshift({ name: "Administrator", email: adminEmail, role: "admin", title: "Administrator" });

  const userIds: Record<string, string> = {};
  let createdUsers = 0;
  for (const s of staff) {
    const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, s.email)).limit(1);
    if (existing) {
      userIds[s.email] = existing.id;
      continue;
    }
    const id = newId();
    await db.insert(schema.users).values({
      id,
      name: s.name,
      email: s.email,
      passwordHash: await hashPassword(s.email === adminEmail ? adminPassword : password),
      role: s.email === adminEmail ? "admin" : s.role,
      title: s.title,
      createdAt: now,
    });
    userIds[s.email] = id;
    createdUsers++;
  }

  // --- Catalog ------------------------------------------------------------
  let createdServices = 0;
  for (const [i, s] of DEFAULT_SERVICES.entries()) {
    const [existing] = await db.select({ id: schema.services.id }).from(schema.services).where(eq(schema.services.key, s.key)).limit(1);
    if (existing) continue;
    await db.insert(schema.services).values({
      id: newId(),
      key: s.key,
      title: s.title,
      description: s.description,
      bullets: s.bullets,
      fee: s.fee,
      duration: s.duration,
      route: s.route,
      sortOrder: (i + 1) * 10,
    });
    createdServices++;
  }

  const [{ activityCount }] = await db.select({ activityCount: sql<number>`count(*)`.mapWith(Number) }).from(schema.activities);
  if (activityCount === 0) {
    for (const [i, a] of DEFAULT_ACTIVITIES.entries()) {
      await db.insert(schema.activities).values({ id: newId(), ...a, sortOrder: (i + 1) * 10 });
    }
  }

  const [{ sentenceCount }] = await db.select({ sentenceCount: sql<number>`count(*)`.mapWith(Number) }).from(schema.quickSentences);
  if (sentenceCount === 0) {
    for (const [i, s] of DEFAULT_SENTENCES.entries()) {
      await db.insert(schema.quickSentences).values({ id: newId(), ...s, sortOrder: (i + 1) * 10 });
    }
  }

  // --- Sample requests ----------------------------------------------------
  const [{ requestCount }] = await db.select({ requestCount: sql<number>`count(*)`.mapWith(Number) }).from(schema.requests);
  let createdRequests = 0;
  if (requestCount === 0 && !process.argv.includes("--no-samples")) {
    const abdullah = userIds["abdullah@aglc.sa"];
    const ibrahem = userIds["iar@aglc.sa"];
    const catalog = await getCatalog();

    // 1. The real October 2026 matter the portal was modelled on.
    const sez = await createRequest(
      {
        ref: "INQ-2026-J-DRVG",
        source: "website",
        salutation: "Ms.",
        contactName: "Hennah Bhatia",
        company: "Audax Bridges",
        email: "rekha.ramchandani@audaxbridges.com",
        country: "",
        serviceType: "Company in a Special Economic Zone (SEZ)",
        activities: "Mechanical and electrical engineering design services",
        summary: "Audax Bridges wants a mechanical & electrical engineering design company in a Saudi SEZ.",
        details:
          "Website inquiry: Audax Bridges is considering the incorporation of a company in a Saudi Special Economic Zone to provide mechanical and electrical engineering design services, and asked for a fixed-fee proposal covering licensing, company registration and the related government registrations.",
        receivedAt: "2026-10-12T09:15:00.000Z",
      },
      null,
    );
    await assignRequest(sez.id, abdullah, abdullah, "2026-10-12T10:02:00.000Z");
    await setStatus(sez.id, "in_review", abdullah, "2026-10-12T10:02:30.000Z");

    const sezData = buildDefaultProposal(
      { ...sez, assigneeId: abdullah },
      catalog,
      {
        serviceKeys: ["eligibility", "sez_licensing", "gov_registrations", "sce_licensing", "residency"],
        activityCodes: ["711041", "711032", "711040", "711013", "711088", "711011"],
        dateG: "2026-10-14",
      },
    );
    sezData.subject = "Fixed-Fee Proposal for Establishing an Engineering Design Company in a Saudi Special Economic Zone";
    sezData.intro =
      "Further to your website inquiry (Ref. INQ-2026-J-DRVG), we are pleased to submit our fixed-fee proposal for establishing a company in a Saudi Special Economic Zone (SEZ) to provide mechanical and electrical engineering design services. The engagement covers the following phases:";
    sezData.phases[0].bullets = [
      "Confirming with the Economic Cities and Special Zones Authority (ECZA) and the zone administration whether engineering design services qualify for licensing in a SEZ, and which zone best fits the business.",
      "Where SEZ licensing is not available for these activities, advising on the alternative of a 100% foreign-owned company registered with the Ministry of Investment (MISA) outside the zones.",
      "Finalizing the activity selection on the basis of the enclosed preliminary Activity Matching & Licensing Table, prepared under the Saudi Classification of Economic Activities (SSIC, July 2025).",
      "A short written opinion on capital, office, staffing and Saudi Council of Engineers (SCE) requirements before any filing is made.",
    ];
    sezData.governmentFees =
      "Payable at actual cost and not included in our fees. These include zone license and registration fees, SCE registration fees, and visa, iqama and work permit fees. An itemized estimate will be provided on completion of Phase One, once the zone and route are confirmed.";
    sezData.thirdPartyCosts =
      "Not included: notarization and apostille of parent company documents, certified Arabic translation, office lease within the zone, medical insurance, and courier costs.";
    sezData.requiredDocuments[3] = "Company profile, including engineering experience, project references and engineers' qualifications.";
    sezData.keyPoints = [
      "SEZ eligibility: the four zones currently in operation (King Abdullah Economic City, Ras Al-Khair, Jazan and Cloud Computing) target manufacturing, logistics, maritime, metals and digital sectors. Standalone engineering design services are not among the published target sectors, so eligibility must be confirmed with the zone before any filing.",
      "SEZ incentives, where available, include corporate income tax at 5% for up to 20 years, 0% withholding tax on profit repatriation and expatriate levy exemptions during the first five years.",
      "Mainland alternative: MISA's published requirements for a 100% foreign-owned engineering consultancy require the parent company, or one of its affiliates, to be licensed in at least four countries in the same field and to have at least ten years of experience.",
      "In both routes, the company must register with the SCE and employ SCE-registered engineers before providing engineering services.",
    ];
    sezData.recurringCosts =
      "Zone license and registration renewal, SCE renewal, iqama renewals, work permit fees, GOSI contributions, medical insurance, office lease, and ZATCA filings with audited financial statements.";
    sezData.overallTimeline = "3–5 months";
    sezData.paymentTerms = "50% upon signing, 25% upon company registration, and 25% upon completion of Phase Five.";
    sezData.activityTableSubtitle =
      "Intended engineering design activities matched against the Saudi Classification of Economic Activities (SSIC, July 2025), with licensing flags";
    sezData.activitySummary =
      "The requested mechanical and electrical design services are classified under SSIC Group 711 (Engineering activities and related technical consultancy) and are licensed by the Saudi Council of Engineers (SCE). These are professional services; they are not among the published target sectors of the operating Special Economic Zones, so SEZ eligibility must be confirmed with the zone administration. Fire protection design requires a separate HCIS license.";

    const { proposal, attachments } = await createProposalVersion(sez, sezData, abdullah, { createdAt: "2026-10-14T15:30:00.000Z" });
    await addEvent(sez.id, {
      type: "email_out",
      authorId: abdullah,
      subject: "Fixed-Fee Proposal: Engineering Design Company in a Saudi Special Economic Zone (Ref. INQ-2026-J-DRVG)",
      body: `Dear Ms. Bhatia,

Thank you for your inquiry regarding the incorporation of a mechanical and electrical engineering design company in a Saudi Special Economic Zone (SEZ). Attached are:

01  Fixed-Fee Proposal, dated October 14, 2026
02  Preliminary Activity Matching and Licensing Table

Our professional fees are fixed at SAR 57,500, exclusive of VAT, across five phases. Government fees and third-party costs are not included; we will provide an itemized estimate of government fees once the zone and route are confirmed.

One point bears on the route from the outset. Standalone engineering design services are not among the published target sectors of the operating zones, so Phase One confirms eligibility with the zone administration before anything is filed. If an SEZ license is not available, the same fees apply to the alternative of a 100% foreign-owned company registered with the Ministry of Investment (MISA) outside the zones. Under MISA's published requirements, that route requires the parent company, or one of its affiliates, to be licensed in at least four countries in the same field and to have at least ten years of experience. If neither route is available, only the Phase One fee of SAR 7,500 is payable.

To help us assess this early, please let us know in which countries the parent company is currently licensed and how long it has practiced engineering.

To proceed, please sign the approval block on the final page of the proposal and return it with the documents listed in Section 4. The proposal is valid until November 13, 2026.

We would be pleased to arrange a call at your convenience.

Sincerely,
Abdullah Salamah
Al-Ahmari Gashlan Legal Consulting`,
      meta: { to: "rekha.ramchandani@audaxbridges.com", attachments, delivery: "manual", proposalId: proposal.id },
      createdAt: "2026-10-14T18:04:33.000Z",
    });
    await markProposalSent(proposal.id, "2026-10-14T18:04:33.000Z");
    await setStatus(sez.id, "proposal_sent", abdullah, "2026-10-14T18:05:00.000Z");
    await addEvent(sez.id, {
      type: "note",
      authorId: abdullah,
      subject: "Internal note",
      body: "Proposal prepared off-platform and sent from info@aglc.sa. Kept here as the model for the new proposal builder.",
      createdAt: "2026-10-20T00:37:00.000Z",
    });
    createdRequests++;

    // 2–4. Fictional samples so the queue shows every stage.
    const logistics = await createRequest(
      {
        source: "website",
        salutation: "Ms.",
        contactName: "Nadia Haddad",
        company: "Levant Freight Solutions LLC",
        email: "nadia.haddad@example.com",
        phone: "+971 50 000 0000",
        country: "United Arab Emirates",
        serviceType: "100% foreign-owned company (MISA, mainland)",
        activities: "Freight forwarding, customs clearance and warehousing",
        summary: "(Sample) UAE freight forwarder wants a 100% foreign-owned logistics LLC in Riyadh.",
        details:
          "Sample inquiry: We are a Dubai-based freight forwarding company with 60 staff and want to open a fully owned subsidiary in Riyadh for freight forwarding, customs clearance and warehousing. Please send a fixed-fee proposal and let us know the capital requirements and timeline.",
        receivedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      null,
    );
    createdRequests++;

    const rhq = await createRequest(
      {
        source: "email",
        salutation: "Mr.",
        contactName: "Thomas Reinholt",
        company: "Nordic Grid Software AB",
        email: "t.reinholt@example.com",
        country: "Sweden",
        serviceType: "Regional Headquarters (RHQ)",
        activities: "Regional management of a grid-analytics software business",
        summary: "(Sample) Swedish software group exploring an RHQ license in Riyadh.",
        details:
          "Sample inquiry: Our group has subsidiaries in the UAE and Egypt and is evaluating a Regional Headquarters in Riyadh to qualify for government contracts. We would like to understand the RHQ license requirements, the incentives and your fees.",
        receivedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
      null,
    );
    const rhqAt = new Date(Date.now() - 5 * 86400000).toISOString();
    await assignRequest(rhq.id, ibrahem, ibrahem, rhqAt);
    await setStatus(rhq.id, "in_review", ibrahem, rhqAt);
    await addEvent(rhq.id, {
      type: "note",
      authorId: ibrahem,
      subject: "Internal note",
      body: "Sample note: check whether the existing UAE and Egypt subsidiaries satisfy the two-subsidiaries condition before drafting the proposal.",
    });
    createdRequests++;

    const medtech = await createRequest(
      {
        source: "website",
        salutation: "Ms.",
        contactName: "Priya Natarajan",
        company: "Chennai Medtech Pvt Ltd",
        email: "priya.n@example.com",
        country: "India",
        serviceType: "Branch of a foreign company",
        activities: "Distribution and maintenance of medical imaging equipment",
        summary: "(Sample) Indian medtech distributor wants a branch to service hospital contracts.",
        details:
          "Sample inquiry: We supply imaging equipment to hospitals in the Gulf and have been awarded a maintenance contract in Jeddah. We need a branch or company that can invoice locally and employ service engineers.",
        receivedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      },
      null,
    );
    await assignRequest(medtech.id, abdullah, abdullah, new Date(Date.now() - 8 * 86400000).toISOString());
    await addEvent(medtech.id, {
      type: "email_out",
      authorId: abdullah,
      subject: "Your inquiry — documents needed (Ref. " + medtech.ref + ")",
      body: "Dear Ms. Natarajan,\n\nThank you for your inquiry. To assess the branch route, please send us the certificate of incorporation, trade license and articles of the parent company, together with its latest audited financial statements, and a copy of the Jeddah maintenance contract.\n\nSincerely,\nAbdullah Salamah\nAl-Ahmari Gashlan Legal Consulting",
      meta: { to: "priya.n@example.com", delivery: "manual" },
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    });
    await setStatus(medtech.id, "awaiting_client", abdullah, new Date(Date.now() - 5 * 86400000 + 60000).toISOString());
    createdRequests++;
    void logistics;
  }

  console.log(`Seed complete: ${createdUsers} staff, ${createdServices} services, ${createdRequests} sample requests added.`);
  if (createdUsers > 0) {
    console.log("");
    console.log("Sign-in details (change them under Settings → My account):");
    for (const s of staff) {
      if (!userIds[s.email]) continue;
      const created = createdUsers > 0;
      if (created) console.log(`  ${s.email.padEnd(22)} ${s.email === adminEmail ? adminPassword : password}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
