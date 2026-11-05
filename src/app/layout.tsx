import type { Metadata } from "next";
import "./globals.css";
import { FIRM } from "@/lib/firm";
import { geistMono, geistSans, playfair, plexArabic } from "./fonts";

export const metadata: Metadata = {
  title: {
    default: `${FIRM.portalName} · Staff portal`,
    template: `%s · ${FIRM.portalName}`,
  },
  description: `Incorporation request desk for ${FIRM.name}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${plexArabic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
