import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listActivities, listQuickSentences, listServices, listUsers } from "@/lib/settings";
import { SentencesSettings } from "@/components/settings/sentences";
import { ServicesSettings } from "@/components/settings/services";
import { ActivitiesSettings } from "@/components/settings/activities";
import { TeamSettings } from "@/components/settings/team";
import { AccountSettings } from "@/components/settings/account";

const TABS = [
  { key: "sentences", label: "One-click sentences" },
  { key: "services", label: "Services & fees" },
  { key: "activities", label: "SSIC activities" },
  { key: "team", label: "Team" },
  { key: "account", label: "My account" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const me = await requireUser();
  const { tab: rawTab } = await searchParams;
  const tab: TabKey = (TABS.some((t) => t.key === rawTab) ? rawTab : "sentences") as TabKey;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-ink-900">Settings</h1>
      <p className="mt-1 text-sm text-ink-500">Everything the proposal builder and the composer draw from lives here.</p>

      <nav className="mt-5 flex flex-wrap gap-1 border-b border-ink-200" aria-label="Settings sections">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/settings?tab=${t.key}`}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium ${tab === t.key ? "border-brand-700 text-brand-800" : "border-transparent text-ink-500 hover:text-ink-800"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "sentences" ? <SentencesSettings sentences={await listQuickSentences(true)} /> : null}
        {tab === "services" ? <ServicesSettings services={await listServices(true)} /> : null}
        {tab === "activities" ? <ActivitiesSettings activities={await listActivities(true)} /> : null}
        {tab === "team" ? <TeamSettings users={await listUsers()} me={me} /> : null}
        {tab === "account" ? <AccountSettings me={me} /> : null}
      </div>
    </div>
  );
}
