import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ProposalData } from "@/db/schema";
import { Letterhead } from "./letterhead";
import { base, COLORS } from "./styles";

const s = StyleSheet.create({
  page: { ...base.page, paddingHorizontal: 40, paddingTop: 30, fontSize: 9.5 },
  title: { fontFamily: "Times-Bold", fontSize: 14, color: COLORS.accent, textAlign: "center", marginTop: -10 },
  subtitle: { fontSize: 10, color: COLORS.muted, textAlign: "center", marginBottom: 10 },
  th: { ...base.th, fontSize: 9.5, textAlign: "center" },
  td: { ...base.td, fontSize: 9.5 },
  highlightRow: { backgroundColor: COLORS.highlightBg },
  highlightText: { fontFamily: "Times-Bold", color: COLORS.highlightText },
  box: {
    marginTop: 12,
    backgroundColor: COLORS.boxBg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9.5,
  },
});

const W = { no: 32, code: 58, activity: 180, authority: 128, license: 150 };

export function ActivityTablePdf({ data }: { data: ProposalData }) {
  return (
    <Document title={data.activityTableTitle} author={data.signatoryName}>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Letterhead logoWidth={130} />
        <Text style={s.title}>{data.activityTableTitle}</Text>
        <Text style={s.subtitle}>{data.activityTableSubtitle}</Text>

        <View style={base.table}>
          <View style={base.tr}>
            <Text style={[s.th, { width: W.no }]}>No.</Text>
            <Text style={[s.th, { width: W.code }]}>SSIC Code</Text>
            <Text style={[s.th, { width: W.activity }]}>Activity (Saudi Classification)</Text>
            <Text style={[s.th, { width: W.authority }]}>Licensing Authority</Text>
            <Text style={[s.th, { width: W.license }]}>Requires Additional License?</Text>
            <Text style={[s.th, base.tdLast, { flex: 1 }]}>Matching Activity / Remarks</Text>
          </View>
          {data.activities.map((row, i) => {
            const last = i === data.activities.length - 1;
            const hl = row.highlight;
            return (
              <View key={i} style={[last ? base.trLast : base.tr, hl ? s.highlightRow : {}]} wrap={false}>
                <Text style={[s.td, { width: W.no, textAlign: "center" }]}>{i + 1}</Text>
                <Text style={[s.td, { width: W.code, textAlign: "center" }]}>{row.code || "—"}</Text>
                <Text style={[s.td, { width: W.activity, textAlign: "center" }, hl ? s.highlightText : {}]}>{row.activity}</Text>
                <Text style={[s.td, { width: W.authority, textAlign: "center" }]}>{row.authority}</Text>
                <Text style={[s.td, { width: W.license, textAlign: "center" }, hl ? s.highlightText : {}]}>{row.license}</Text>
                <Text style={[s.td, base.tdLast, { flex: 1 }]}>{row.remarks}</Text>
              </View>
            );
          })}
        </View>

        {data.activitySummary ? <Text style={s.box}>Summary: {data.activitySummary}</Text> : null}
        {data.activityNote ? <Text style={s.box}>Note: {data.activityNote}</Text> : null}
      </Page>
    </Document>
  );
}
