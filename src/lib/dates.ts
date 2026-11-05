export function nowIso(): string {
  return new Date().toISOString();
}

/** Request-time clock for server components (kept out of render bodies). */
export async function currentTimeMs(): Promise<number> {
  return Date.now();
}

/** 2026-10-14 -> 14/10/2026G */
export function formatGregorian(dateIso: string): string {
  const d = new Date(dateIso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}G`;
}

/** 2026-10-14 -> 03/05/1448H (Umm al-Qura calendar). */
export function formatHijri(dateIso: string): string {
  const d = new Date(dateIso);
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")}H`;
}

/** 2026-10-14 -> October 14, 2026 */
export function formatLongDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Riyadh",
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  });
}

/** "3h", "2d", "5w" style age for queue chips. */
export function ageLabel(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "";
  const ms = now - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d`;
  return `${Math.round(days / 7)}w`;
}

export function daysBetween(fromIso: string, toMs = Date.now()): number {
  return Math.floor((toMs - new Date(fromIso).getTime()) / 86400000);
}

export function formatSar(amount: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
}
