import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activities,
  quickSentences,
  services,
  users,
  type Activity,
  type QuickSentence,
  type Service,
  type ServiceRoute,
  type UserRole,
} from "@/db/schema";
import { newId } from "./ids";
import { nowIso } from "./dates";
import { hashPassword } from "./password";

export async function listQuickSentences(includeInactive = false): Promise<QuickSentence[]> {
  const db = await getDb();
  const rows = await db.select().from(quickSentences).orderBy(asc(quickSentences.sortOrder), asc(quickSentences.label));
  return includeInactive ? rows : rows.filter((r) => r.active);
}

export type QuickSentenceInput = { id?: string; category: string; label: string; text: string; sortOrder?: number; active?: boolean };

export async function upsertQuickSentence(input: QuickSentenceInput): Promise<void> {
  const db = await getDb();
  if (input.id) {
    await db
      .update(quickSentences)
      .set({ category: input.category, label: input.label, text: input.text, sortOrder: input.sortOrder ?? 0, active: input.active ?? true })
      .where(eq(quickSentences.id, input.id));
    return;
  }
  const rows = await db.select({ sortOrder: quickSentences.sortOrder }).from(quickSentences);
  const max = rows.reduce((m, r) => Math.max(m, r.sortOrder), 0);
  await db.insert(quickSentences).values({
    id: newId(),
    category: input.category,
    label: input.label,
    text: input.text,
    sortOrder: input.sortOrder ?? max + 10,
    active: input.active ?? true,
  });
}

export async function deleteQuickSentence(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(quickSentences).where(eq(quickSentences.id, id));
}

export async function listServices(includeInactive = false): Promise<Service[]> {
  const db = await getDb();
  const rows = await db.select().from(services).orderBy(asc(services.sortOrder), asc(services.title));
  return includeInactive ? rows : rows.filter((r) => r.active);
}

export type ServiceInput = {
  id?: string;
  key: string;
  title: string;
  description: string | null;
  bullets: string[];
  fee: number;
  duration: string | null;
  route: ServiceRoute;
  sortOrder?: number;
  active?: boolean;
};

export async function upsertService(input: ServiceInput): Promise<void> {
  const db = await getDb();
  const values = {
    key: input.key,
    title: input.title,
    description: input.description,
    bullets: input.bullets,
    fee: input.fee,
    duration: input.duration,
    route: input.route,
    sortOrder: input.sortOrder ?? 0,
    active: input.active ?? true,
  };
  if (input.id) {
    await db.update(services).set(values).where(eq(services.id, input.id));
    return;
  }
  const rows = await db.select({ sortOrder: services.sortOrder }).from(services);
  const max = rows.reduce((m, r) => Math.max(m, r.sortOrder), 0);
  await db.insert(services).values({ id: newId(), ...values, sortOrder: input.sortOrder ?? max + 10 });
}

export async function deleteService(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(services).where(eq(services.id, id));
}

export async function listActivities(includeInactive = false): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.select().from(activities).orderBy(asc(activities.sortOrder), asc(activities.code));
  return includeInactive ? rows : rows.filter((r) => r.active);
}

export type ActivityInput = {
  id?: string;
  code: string | null;
  activity: string;
  authority: string | null;
  license: string | null;
  remarks: string | null;
  active?: boolean;
};

export async function upsertActivity(input: ActivityInput): Promise<void> {
  const db = await getDb();
  const values = {
    code: input.code,
    activity: input.activity,
    authority: input.authority,
    license: input.license,
    remarks: input.remarks,
    active: input.active ?? true,
  };
  if (input.id) {
    await db.update(activities).set(values).where(eq(activities.id, input.id));
    return;
  }
  const rows = await db.select({ sortOrder: activities.sortOrder }).from(activities);
  const max = rows.reduce((m, r) => Math.max(m, r.sortOrder), 0);
  await db.insert(activities).values({ id: newId(), ...values, sortOrder: max + 10 });
}

export async function deleteActivity(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(activities).where(eq(activities.id, id));
}

export async function listUsers() {
  const db = await getDb();
  return db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, title: users.title, active: users.active, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.name));
}

export async function createUser(input: { name: string; email: string; password: string; role: UserRole; title: string | null }): Promise<void> {
  const db = await getDb();
  await db.insert(users).values({
    id: newId(),
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await hashPassword(input.password),
    role: input.role,
    title: input.title,
    createdAt: nowIso(),
  });
}

export async function setUserActive(id: string, active: boolean): Promise<void> {
  const db = await getDb();
  await db.update(users).set({ active }).where(eq(users.id, id));
}

export async function resetUserPassword(id: string, password: string): Promise<void> {
  const db = await getDb();
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, id));
}
