import type { RequestStatus } from "@/db/schema";
import { ageLabel } from "./dates";

export type WaitingState = { label: string; tone: "us" | "client" } | null;

/** Who the ball is with, for the queue chips. */
export function waitingState(
  item: {
    status: RequestStatus;
    lastClientMessageAt: string | null;
    lastStaffReplyAt: string | null;
  },
  now = Date.now(),
): WaitingState {
  if (item.status === "closed" || item.status === "declined") return null;
  const client = item.lastClientMessageAt ? new Date(item.lastClientMessageAt).getTime() : 0;
  const staff = item.lastStaffReplyAt ? new Date(item.lastStaffReplyAt).getTime() : 0;
  if (client && client >= staff) return { label: `Waiting on us · ${ageLabel(item.lastClientMessageAt, now)}`, tone: "us" };
  if (staff) return { label: `With client · ${ageLabel(item.lastStaffReplyAt, now)}`, tone: "client" };
  return null;
}
