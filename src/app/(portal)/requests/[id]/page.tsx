import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { placeholderContext } from "@/lib/context";
import { mailConfigured } from "@/lib/mailer";
import { buildDefaultProposal, getCatalog } from "@/lib/proposals";
import { getRequestDetail, listStaff } from "@/lib/requests";
import { listQuickSentences } from "@/lib/settings";
import { Workbench } from "@/components/workbench/workbench";

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const { tab } = await searchParams;
  const detail = await getRequestDetail(id);
  if (!detail) notFound();

  const [staff, sentences, catalog] = await Promise.all([listStaff(), listQuickSentences(), getCatalog()]);
  const latest = detail.proposals[0] ?? null;

  return (
    <Workbench
      me={me}
      detail={detail}
      staff={staff}
      sentences={sentences}
      catalog={catalog}
      placeholders={placeholderContext(detail, latest)}
      defaultProposal={latest?.data ?? buildDefaultProposal(detail.request, catalog)}
      smtpConfigured={mailConfigured()}
      initialTab={tab === "proposal" ? "proposal" : "conversation"}
    />
  );
}
