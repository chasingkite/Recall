export type SessionMode = "quick5" | "full" | "test";

/** Minimal card shape the builder needs. */
export interface BuilderCard {
  id: string;
  topic: string | null;
  deck_id: string;
  decks: { subject: string } | null;
}

/**
 * Session size by mode. Test Mode returns a larger set — 40 when a topic
 * focus is active (a deep single-topic drill), 30 when unfocused.
 */
export function getSessionSize(mode: string, hasFocus: boolean): number {
  if (mode === "quick5") return 5;
  if (mode === "test") return hasFocus ? 40 : 30;
  return 20; // "full" and any unknown mode
}

/** Keep only cards matching the given subject and/or topic. Null filters are ignored. */
export function selectFocusCards<T extends BuilderCard>(
  cards: T[],
  focus: { subject?: string | null; topic?: string | null }
): T[] {
  return cards.filter((c) => {
    if (focus.subject && c.decks?.subject !== focus.subject) return false;
    if (focus.topic && c.topic !== focus.topic) return false;
    return true;
  });
}

/** Stable-partition so cards from starred decks come first; order within each group is preserved. */
export function orderByStarred<T extends BuilderCard>(cards: T[], starredDeckIds: Set<string>): T[] {
  if (starredDeckIds.size === 0) return cards;
  const starred = cards.filter((c) => starredDeckIds.has(c.deck_id));
  const rest = cards.filter((c) => !starredDeckIds.has(c.deck_id));
  return [...starred, ...rest];
}
