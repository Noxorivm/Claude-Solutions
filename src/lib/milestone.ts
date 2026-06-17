// Validación de la rúbrica de hitos (docs/05: ratings jsonb
// {item_id: 1..5} sobre los checklist_items de la lección). Pura; la
// action la aplica contra los items reales.

export type RatingsValidation =
  | { ok: true }
  | { ok: false; reason: "missing"; itemIds: string[] }
  | { ok: false; reason: "invalid"; itemIds: string[] };

export function validateRatings(
  itemIds: string[],
  ratings: Record<string, number>,
): RatingsValidation {
  const known = new Set(itemIds);
  const foreign = Object.keys(ratings).filter((id) => !known.has(id));
  const outOfRange = Object.entries(ratings)
    .filter(([, value]) => !Number.isInteger(value) || value < 1 || value > 5)
    .map(([id]) => id);
  const invalid = [...new Set([...foreign, ...outOfRange])];
  if (invalid.length > 0) {
    return { ok: false, reason: "invalid", itemIds: invalid };
  }
  const missing = itemIds.filter((id) => ratings[id] === undefined);
  if (missing.length > 0) {
    return { ok: false, reason: "missing", itemIds: missing };
  }
  return { ok: true };
}

/** Media de la rúbrica con 1 decimal. */
export function ratingsAverage(ratings: Record<string, number>): number {
  const values = Object.values(ratings);
  if (values.length === 0) {
    return 0;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}
