import { randomBytes, randomUUID } from "node:crypto";

export function newId(): string {
  return randomUUID();
}

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to avoid confusion with 1/0

function randomLetters(n: number): string {
  const bytes = randomBytes(n);
  let out = "";
  for (let i = 0; i < n; i++) out += LETTERS[bytes[i] % LETTERS.length];
  return out;
}

/** Inquiry reference in the firm's existing format, e.g. INQ-2026-J-DRVG. */
export function newInquiryRef(date = new Date()): string {
  return `INQ-${date.getFullYear()}-${randomLetters(1)}-${randomLetters(4)}`;
}
