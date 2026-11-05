import { Font, renderToBuffer } from "@react-pdf/renderer";
import type { ProposalData } from "@/db/schema";
import { ActivityTablePdf } from "./activity-table-pdf";
import { ProposalPdf } from "./proposal-pdf";

// The firm's documents never hyphenate; wrap whole words instead.
Font.registerHyphenationCallback((word) => [word]);

export async function renderProposalPdf(data: ProposalData, ref: string): Promise<Buffer> {
  return Buffer.from(await renderToBuffer(<ProposalPdf data={data} ref={ref} />));
}

export async function renderActivityTablePdf(data: ProposalData): Promise<Buffer> {
  return Buffer.from(await renderToBuffer(<ActivityTablePdf data={data} />));
}
