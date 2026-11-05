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
