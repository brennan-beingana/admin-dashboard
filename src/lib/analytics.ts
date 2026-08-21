import type { AdminStats, DailyRideStat } from "@/lib/types";
import {
  RIDER_ACTIVITY_COLORS,
  RIDE_STATUS_COLORS,
  UNMAPPED_SLICE,
} from "@/components/charts/chart-theme";
import type { DonutSlice } from "@/components/charts/donut-chart";

/** `2026-08-21T…` or `2026-08-21 08:41:23` → `2026-08-21`. */
export function toDayKey(timestamp: string): string | null {
  if (!timestamp) return null;
  const day = timestamp.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

export function toDateInputString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Short axis label — the year is already implied by the range control. */
export function formatDayLabel(day: string): string {
  const parsed = new Date(`${day}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * `/v1/admin/stats/rides` returns days newest-first and omits days with no
 * rides entirely. Plotting that raw draws time backwards and closes the gaps,
 * which makes a quiet week look like a busy one. Sort ascending and fill the
 * missing days with zeroes so the x-axis is real elapsed time.
 */
export function fillDailyRideStats(
  stats: DailyRideStat[],
  startDate: string,
  endDate: string,
): DailyRideStat[] {
  const byDay = new Map(stats.map((stat) => [toDayKey(stat.date) ?? stat.date, stat]));

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [...stats].sort((a, b) => a.date.localeCompare(b.date));
  }

  // A very wide range would emit a point per day for years; past this the chart
  // is unreadable anyway, so fall back to plotting only the days we have.
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (days > 400) {
    return [...stats].sort((a, b) => a.date.localeCompare(b.date));
  }

  const filled: DailyRideStat[] = [];
  for (let index = 0; index < days; index++) {
    const cursor = new Date(start);
    cursor.setDate(cursor.getDate() + index);
    const day = toDateInputString(cursor);
    filled.push(
      byDay.get(day) ?? {
        date: day,
        total_rides: 0,
        completed_rides: 0,
        cancelled_rides: 0,
        total_revenue: 0,
      },
    );
  }
  return filled;
}

export type CompletionPoint = {
  date: string;
  label: string;
  completion_rate: number;
  total_rides: number;
  completed_rides: number;
};

/**
 * Completion rate per day, skipping days with no rides.
 *
 * A zero-ride day has no rate — plotting it as 0% would invent a collapse that
 * did not happen, so those days are dropped rather than filled.
 */
export function toCompletionTrend(stats: DailyRideStat[]): CompletionPoint[] {
  return stats
    .filter((stat) => stat.total_rides > 0)
    .map((stat) => ({
      date: stat.date,
      label: formatDayLabel(stat.date),
      completion_rate: (stat.completed_rides / stat.total_rides) * 100,
      total_rides: stat.total_rides,
      completed_rides: stat.completed_rides,
    }));
}

export type GrowthPoint = {
  date: string;
  label: string;
  /** Epoch ms — lets the chart space points by elapsed time, not by index. */
  ts: number;
  /** Running total at the end of this day. */
  cumulative: number;
  /** Sign-ups on this day alone. */
  added: number;
};

/**
 * Cumulative sign-up curve from a set of `created_at` timestamps.
 *
 * Derived client-side: the API has no growth endpoint, so this counts the
 * records it was handed. That makes it accurate only for the window the caller
 * loaded — pass the whole window and say so in the caption.
 */
export function toGrowthSeries(createdAts: string[]): GrowthPoint[] {
  const perDay = new Map<string, number>();
  for (const timestamp of createdAts) {
    const day = toDayKey(timestamp);
    if (!day) continue;
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }

  let running = 0;
  return [...perDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, added]) => {
      running += added;
      return {
        date: day,
        label: formatDayLabel(day),
        ts: new Date(`${day}T00:00:00`).getTime(),
        cumulative: running,
        added,
      };
    });
}

const RIDE_STATUS_ORDER = [
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
] as const;

const RIDE_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Ride status mix, in lifecycle order so the ramp reads as progression. */
export function toRideStatusSlices(stats?: AdminStats): DonutSlice[] {
  if (!stats) return [];
  const counts: Record<string, number> = {
    pending: stats.pending_rides ?? 0,
    accepted: stats.accepted_rides ?? 0,
    in_progress: stats.in_progress_rides ?? 0,
    completed: stats.completed_rides ?? 0,
    cancelled: stats.cancelled_rides ?? 0,
  };

  return RIDE_STATUS_ORDER.filter((key) => counts[key] > 0).map((key) => ({
    key,
    label: RIDE_STATUS_LABELS[key],
    value: counts[key],
    color: RIDE_STATUS_COLORS[key] ?? UNMAPPED_SLICE,
  }));
}

const ACTIVITY_ORDER = ["available", "busy", "offline"] as const;

const ACTIVITY_LABELS: Record<string, string> = {
  available: "Available",
  busy: "Busy",
  offline: "Offline",
};

/**
 * Rider activity mix.
 *
 * Anything the backend reports that is not one of the three known states is
 * folded into "Other" rather than given a generated hue — a ninth colour is
 * never invented.
 */
export function toRiderActivitySlices(
  riders: Array<{ status?: string | null }>,
): DonutSlice[] {
  const counts = new Map<string, number>();
  for (const rider of riders) {
    const status = (rider.status ?? "offline").toLowerCase();
    const key = (ACTIVITY_ORDER as readonly string[]).includes(status) ? status : "other";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const slices: DonutSlice[] = ACTIVITY_ORDER.filter((key) => (counts.get(key) ?? 0) > 0).map(
    (key) => ({
      key,
      label: ACTIVITY_LABELS[key],
      value: counts.get(key)!,
      color: RIDER_ACTIVITY_COLORS[key],
    }),
  );

  const other = counts.get("other") ?? 0;
  if (other > 0) {
    slices.push({ key: "other", label: "Other", value: other, color: UNMAPPED_SLICE });
  }
  return slices;
}
