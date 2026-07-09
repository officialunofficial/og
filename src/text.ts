/**
 * Caps text at `max` characters, breaking on a word boundary and appending an
 * ellipsis, so overlong copy degrades cleanly instead of overflowing a card.
 */
export function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  const clipped = trimmed.slice(0, max);
  const lastSpace = clipped.lastIndexOf(" ");
  const head = lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped;
  return `${head.replace(/[\s.,;:!?-]+$/, "")}…`;
}
