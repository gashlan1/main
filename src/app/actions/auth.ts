"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { requireUserOrThrow } from "@/lib/auth";

export type LoginState = { error?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const ok = user && user.active && (await verifyPassword(password, user.passwordHash));
  if (!ok) return { error: "Email or password is incorrect." };

  await setSessionCookie(user.id);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/portal");
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

export type PasswordState = { error?: string; ok?: boolean } | undefined;

export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const me = await requireUserOrThrow();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next.length < 10) return { error: "Use at least 10 characters." };
  if (next !== confirm) return { error: "The new passwords do not match." };

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    return { error: "Your current password is incorrect." };
  }
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, me.id));
  return { ok: true };
}
