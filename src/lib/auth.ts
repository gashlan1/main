import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users, type User } from "@/db/schema";
import { getSessionUserId } from "./session";

export type SessionUser = Pick<User, "id" | "name" | "email" | "role" | "title">;

/** The signed-in staff member, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const db = await getDb();
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      title: users.title,
      active: users.active,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role, title: user.title };
});

/** For pages: redirect to the login screen when there is no valid session. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For route handlers and server actions: throw instead of redirecting. */
export async function requireUserOrThrow(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "UnauthorizedError";
  }
}
