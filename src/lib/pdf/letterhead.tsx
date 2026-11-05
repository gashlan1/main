import { Image, Text, View } from "@react-pdf/renderer";
import { FIRM } from "@/lib/firm";
import { LOGO_PNG_DATA_URI } from "./logo-data";
import { base } from "./styles";

/** Logo left, contact block right, on every page. */
export function Letterhead({ logoWidth = 150 }: { logoWidth?: number }) {
  return (
    <View style={base.header} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
      <Image src={LOGO_PNG_DATA_URI} style={{ width: logoWidth }} />
      <View style={base.contact}>
        <Text>{FIRM.address}</Text>
        <Text>T. {FIRM.phone}</Text>
        <Text style={base.contactStrong}>
          {FIRM.email} | {FIRM.website}
        </Text>
      </View>
    </View>
  );
}
