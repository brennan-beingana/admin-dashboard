/**
 * Client-side search helpers for the admin tables.
 *
 * The admin API still accepts only `limit`/`offset` — no search or status
 * parameter — so every table pulls one window and narrows it here. When the
 * backend grows real query params these callers should pass the term through
 * instead, and the window constant in `paging.ts` can go.
 */

/** True when any of the chosen fields contains the term, case-insensitively. */
export function matchesSearch<T>(
  record: T,
  fields: Array<(record: T) => string | number | null | undefined>,
  term: string,
): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;

  return fields.some((read) => {
    const value = read(record);
    if (value === null || value === undefined) return false;
    return String(value).toLowerCase().includes(needle);
  });
}

/** Inclusive day windows offered by the "joined"/"created" filters. */
export const RECENCY_FILTERS = ["all", "7d", "30d", "90d"] as const;
export type RecencyFilter = (typeof RECENCY_FILTERS)[number];

export const RECENCY_LABELS: Record<RecencyFilter, string> = {
  all: "Any time",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

const RECENCY_DAYS: Record<Exclude<RecencyFilter, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function withinRecency(timestamp: string | undefined, filter: RecencyFilter): boolean {
  if (filter === "all") return true;
  if (!timestamp) return false;

  // Backend timestamps arrive both as ISO and as "YYYY-MM-DD HH:MM:SS"; the
  // latter is not parseable by every engine until the space becomes a T.
  const parsed = new Date(timestamp.includes("T") ? timestamp : timestamp.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return false;

  const cutoff = Date.now() - RECENCY_DAYS[filter] * 86_400_000;
  return parsed.getTime() >= cutoff;
}
