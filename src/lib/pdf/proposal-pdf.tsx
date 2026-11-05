import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ProposalData } from "@/db/schema";
import { formatGregorian, formatHijri, formatSar } from "@/lib/dates";
import { Letterhead } from "./letterhead";
import { base } from "./styles";

const ORDINALS = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

export function phaseLabel(index: number): string {
  return `Phase ${ORDINALS[index] ?? index + 1}`;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={base.bullet} wrap={false}>
          <Text style={base.bulletDot}>•</Text>
          <Text style={base.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const COL = { no: 40, fee: 120 };

export function ProposalPdf({ data, ref }: { data: ProposalData; ref: string }) {
  const total = data.phases.reduce((sum, p) => sum + (Number(p.fee) || 0), 0);
  const phaseOne = data.phases[0];
  const dateIso = `${data.dateG}T00:00:00Z`;

  return (
    <Document title={data.subject} author={data.signatoryName} subject={`${data.subject} (Ref. ${ref})`}>
      <Page size="A4" style={base.page}>
        <Letterhead />

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
          <Text style={base.bold}>Date: {formatHijri(dateIso)}</Text>
          <Text style={base.bold}>Corresponding to: {formatGregorian(dateIso)}</Text>
        </View>

        <Text style={base.bold}>{data.addresseeName}</Text>
        {data.addresseeCompany ? <Text style={[base.bold, { marginBottom: 10 }]}>{data.addresseeCompany}</Text> : null}
        <Text style={[base.bold, { marginBottom: 12 }]}>{data.salutationLine}</Text>

        <Text style={[base.bold, { textAlign: "center", textDecoration: "underline", marginBottom: 12, paddingHorizontal: 20 }]}>
          Subject: {data.subject}
        </Text>

        <Text style={base.paragraph}>{data.intro}</Text>

        {data.phases.map((phase, i) => (
          <View key={phase.key + i}>
            <View style={base.band} wrap={false}>
              <Text style={base.bandText}>
                {phaseLabel(i)}: {phase.title}
              </Text>
            </View>
            <Bullets items={phase.bullets} />
          </View>
        ))}

        <View wrap={false} style={{ marginTop: 10 }}>
          <Text style={base.sectionTitle}>1. Professional Fees (Fixed)</Text>
          <View style={base.table}>
            <View style={base.tr}>
              <Text style={[base.th, { width: COL.no }]}>No.</Text>
              <Text style={[base.th, { flex: 1 }]}>Phase</Text>
              <Text style={[base.th, base.tdLast, { width: COL.fee, textAlign: "center" }]}>Fee (SAR)</Text>
            </View>
            {data.phases.map((phase, i) => (
              <View key={phase.key + i} style={base.tr} wrap={false}>
                <Text style={[base.td, { width: COL.no }]}>{i + 1}</Text>
                <Text style={[base.td, { flex: 1 }]}>{phase.title}</Text>
                <Text style={[base.td, base.tdLast, { width: COL.fee, textAlign: "center" }]}>{formatSar(phase.fee)}</Text>
              </View>
            ))}
            <View style={[base.trLast, base.totalRow]}>
              <Text style={[base.td, { width: COL.no }]}> </Text>
              <Text style={[base.td, base.bold, { flex: 1 }]}>Total</Text>
              <Text style={[base.td, base.tdLast, base.bold, { width: COL.fee, textAlign: "center" }]}>{formatSar(total)}</Text>
            </View>
          </View>
          <Text style={base.paragraph}>
            Fees are exclusive of VAT (15%).
            {data.perEmployeeFee > 0 ? ` Each employee beyond the number stated above: SAR ${formatSar(data.perEmployeeFee)}.` : ""}
            {data.routeNote ? ` ${data.routeNote}` : ""}
          </Text>
        </View>

        <View wrap={false}>
          <Text style={base.sectionTitle}>2. Government Fees</Text>
          <Text style={base.paragraph}>{data.governmentFees}</Text>
        </View>

        <View wrap={false}>
          <Text style={base.sectionTitle}>3. Third-Party Costs</Text>
          <Text style={base.paragraph}>{data.thirdPartyCosts}</Text>
        </View>

        <Text style={base.sectionTitle} minPresenceAhead={40}>
          4. Required Documents
        </Text>
        <Bullets items={data.requiredDocuments} />

        {data.keyPoints.length > 0 ? (
          <View>
            <Text style={base.sectionTitle} minPresenceAhead={40}>
              5. Key Points
            </Text>
            <Bullets items={data.keyPoints} />
          </View>
        ) : null}

        <View wrap={false}>
          <Text style={base.sectionTitle}>{data.keyPoints.length > 0 ? "6" : "5"}. Recurring Annual Costs</Text>
          <Text style={base.paragraph}>{data.recurringCosts}</Text>
        </View>

        <View wrap={false}>
          <Text style={base.sectionTitle}>{data.keyPoints.length > 0 ? "7" : "6"}. Estimated Timeline</Text>
          <View style={base.table}>
            <View style={base.tr}>
              <Text style={[base.th, { width: COL.no }]}>No.</Text>
              <Text style={[base.th, { flex: 1 }]}>Phase</Text>
              <Text style={[base.th, base.tdLast, { width: 130, textAlign: "center" }]}>Estimated Duration</Text>
            </View>
            {data.phases.map((phase, i) => (
              <View key={phase.key + i} style={base.tr} wrap={false}>
                <Text style={[base.td, { width: COL.no }]}>{i + 1}</Text>
                <Text style={[base.td, { flex: 1 }]}>{phase.title}</Text>
                <Text style={[base.td, base.tdLast, { width: 130, textAlign: "center" }]}>{phase.duration}</Text>
              </View>
            ))}
            <View style={[base.trLast, base.totalRow]}>
              <Text style={[base.td, { width: COL.no }]}> </Text>
              <Text style={[base.td, base.bold, { flex: 1 }]}>Overall (some phases run in parallel)</Text>
              <Text style={[base.td, base.tdLast, base.bold, { width: 130, textAlign: "center" }]}>{data.overallTimeline}</Text>
            </View>
          </View>
          <Text style={base.paragraph}>{data.timelineNote}</Text>
        </View>

        <View wrap={false}>
          <Text style={base.sectionTitle}>{data.keyPoints.length > 0 ? "8" : "7"}. Terms</Text>
          <Text style={base.paragraph}>
            Payment: {data.paymentTerms}
            {data.phaseOneOnlyClause && phaseOne
              ? ` If ${phaseLabel(0)} shows that the engagement cannot proceed, only the ${phaseLabel(0)} fee is payable.`
              : ""}
            {` This proposal is valid for ${numberWords(data.validityDays)} (${data.validityDays}) days from its date.`}
          </Text>

          <Text style={[base.paragraph, { marginTop: 6 }]}>We would be pleased to arrange a call to discuss the engagement.</Text>
          <Text style={[base.paragraph, { marginBottom: 26 }]}>Please accept our best regards and appreciation,</Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ width: "44%", alignItems: "center", paddingTop: 8 }}>
              <Text style={base.bold}>{data.signatoryName}</Text>
              <Text style={base.bold}>{data.signatoryTitle}</Text>
            </View>
            <View style={{ width: "50%", borderWidth: 1.2, borderColor: "#111111", padding: 8 }}>
              <Text style={[base.bold, { marginBottom: 6 }]}>We approve the above proposal and authorize commencement of work</Text>
              <Text style={[base.bold, { marginBottom: 8 }]}>Name:</Text>
              <Text style={base.bold}>Signature:</Text>
            </View>
          </View>

          {data.includeActivityTable ? (
            <Text style={{ marginTop: 24 }}>Enclosure: Preliminary Activity Matching & Licensing Table.</Text>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

function numberWords(n: number): string {
  const words: Record<number, string> = {
    7: "seven",
    10: "ten",
    14: "fourteen",
    15: "fifteen",
    21: "twenty-one",
    30: "thirty",
    45: "forty-five",
    60: "sixty",
    90: "ninety",
  };
  return words[n] ?? String(n);
}
