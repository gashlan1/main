/** Client-safe helpers for the one-click sentence chips. */

export type PlaceholderContext = Record<string, string | undefined>;

/**
 * Replace {placeholders} with values from the request/proposal. Anything we
 * cannot fill becomes a bracketed prompt such as [authority] so the staff
 * member sees what to complete.
 */
export function fillPlaceholders(text: string, ctx: PlaceholderContext): string {
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => {
    const value = ctx[key];
    return value && value.trim() ? value : `[${key.replace(/([A-Z])/g, " $1").toLowerCase().trim()}]`;
  });
}

export function surnameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? fullName;
}

/** Insert text at the caret of a textarea, as its own paragraph. */
export function insertParagraph(current: string, selectionEnd: number | null, text: string): { value: string; caret: number } {
  const at = selectionEnd ?? current.length;
  const before = current.slice(0, at);
  const after = current.slice(at);
  const prefix = before.length === 0 ? "" : before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const suffix = after.length === 0 ? "" : after.startsWith("\n") ? "" : "\n\n";
  const inserted = `${prefix}${text}${suffix}`;
  return { value: before + inserted + after, caret: before.length + inserted.length - (suffix.length ? suffix.length : 0) };
}

/** Sign-off lines that close a letter; a sentence goes above them, never below. */
const SIGN_OFF = /^[ \t]*(sincerely|yours sincerely|yours faithfully|kind regards|best regards|warm regards|with (?:best|kind) regards|regards|best wishes|مع خالص التحية|وتفضلوا بقبول)/im;

/**
 * Where a sentence belongs when the user has not placed the caret yet: after
 * the greeting and anything already written, above the sign-off.
 */
export function writingPoint(current: string): number {
  const m = SIGN_OFF.exec(current);
  let end = m ? m.index : current.length;
  while (end > 0 && /\s/.test(current[end - 1])) end--;
  return end;
}

/** Insert text as its own paragraph at the writing point, one blank line on each side. */
export function insertAtWritingPoint(current: string, text: string): { value: string; caret: number } {
  const at = writingPoint(current);
  const before = current.slice(0, at);
  const after = current.slice(at).replace(/^\s+/, "");
  const prefix = before.length === 0 ? "" : "\n\n";
  const suffix = after.length === 0 ? "" : "\n\n";
  return { value: before + prefix + text + suffix + after, caret: before.length + prefix.length + text.length };
}
