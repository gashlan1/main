"use server";

import { revalidatePath } from "next/cache";
import type { ServiceRoute, UserRole } from "@/db/schema";
import { requireUserOrThrow } from "@/lib/auth";
import {
  createUser,
  deleteActivity,
  deleteQuickSentence,
  deleteService,
  resetUserPassword,
  setUserActive,
  upsertActivity,
  upsertQuickSentence,
  upsertService,
} from "@/lib/settings";

async function requireAdmin() {
  const me = await requireUserOrThrow();
  if (me.role !== "admin") throw new Error("Administrators only");
  return me;
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function saveSentenceAction(formData: FormData): Promise<void> {
  await requireUserOrThrow();
  const label = str(formData, "label");
  const text = str(formData, "text");
  const category = str(formData, "category") || "General";
  if (!label || !text) return;
  await upsertQuickSentence({
    id: str(formData, "id") || undefined,
    category,
    label,
    text,
    sortOrder: Number(formData.get("sortOrder")) || undefined,
    active: formData.get("active") !== "off",
  });
  revalidatePath("/portal/settings");
}

export async function deleteSentenceAction(formData: FormData): Promise<void> {
  await requireUserOrThrow();
  const id = str(formData, "id");
  if (id) await deleteQuickSentence(id);
  revalidatePath("/portal/settings");
}

export async function saveServiceAction(formData: FormData): Promise<void> {
  await requireUserOrThrow();
  const title = str(formData, "title");
  if (!title) return;
  const key =
    str(formData, "key") ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  const route = (["both", "sez", "mainland"] as ServiceRoute[]).includes(str(formData, "route") as ServiceRoute) ? (str(formData, "route") as ServiceRoute) : "both";
  await upsertService({
    id: str(formData, "id") || undefined,
    key,
    title,
    description: str(formData, "description") || null,
    bullets: str(formData, "bullets")
      .split("\n")
      .map((l) => l.replace(/^[•\-*]\s*/, "").trim())
      .filter(Boolean),
    fee: Math.max(0, Number(formData.get("fee")) || 0),
    duration: str(formData, "duration") || null,
    route,
    sortOrder: Number(formData.get("sortOrder")) || undefined,
    active: formData.get("active") !== "off",
  });
  revalidatePath("/portal/settings");
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  await requireUserOrThrow();
  const id = str(formData, "id");
  if (id) await deleteService(id);
  revalidatePath("/portal/settings");
}

export async function saveActivityAction(formData: FormData): Promise<void> {
  await requireUserOrThrow();
  const activity = str(formData, "activity");
  if (!activity) return;
  await upsertActivity({
    id: str(formData, "id") || undefined,
    code: str(formData, "code") || null,
    activity,
    authority: str(formData, "authority") || null,
    license: str(formData, "license") || null,
    remarks: str(formData, "remarks") || null,
    active: formData.get("active") !== "off",
  });
  revalidatePath("/portal/settings");
}

export async function deleteActivityAction(formData: FormData): Promise<void> {
  await requireUserOrThrow();
  const id = str(formData, "id");
  if (id) await deleteActivity(id);
  revalidatePath("/portal/settings");
}

export type TeamState = { error?: string; ok?: string } | undefined;

export async function createUserAction(_prev: TeamState, formData: FormData): Promise<TeamState> {
  await requireAdmin();
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role: UserRole = str(formData, "role") === "admin" ? "admin" : "associate";
  if (!name || !email) return { error: "Name and email are required." };
  if (password.length < 10) return { error: "Use an initial password of at least 10 characters." };
  try {
    await createUser({ name, email, password, role, title: str(formData, "title") || null });
  } catch {
    return { error: "That email is already registered." };
  }
  revalidatePath("/portal/settings");
  return { ok: `${name} can now sign in.` };
}

export async function setUserActiveAction(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = str(formData, "id");
  if (!id || id === me.id) return;
  await setUserActive(id, formData.get("active") === "1");
  revalidatePath("/portal/settings");
}

export async function resetPasswordAction(_prev: TeamState, formData: FormData): Promise<TeamState> {
  await requireAdmin();
  const id = str(formData, "id");
  const password = String(formData.get("password") ?? "");
  if (!id || password.length < 10) return { error: "Use at least 10 characters." };
  await resetUserPassword(id, password);
  return { ok: "Password updated." };
}
