"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats, getRideStats, unwrapError } from "@/lib/api";
import { ChartCard } from "@/components/charts/chart-card";
import { DonutChart } from "@/components/charts/donut-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { SERIES } from "@/components/charts/chart-theme";
import {
  fillDailyRideStats,
  formatDayLabel,
  toCompletionTrend,
  toDateInputString,
  toRideStatusSlices,
} from "@/lib/analytics";

const RANGE_PRESETS = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
  { value: "365", label: "Last 12 months" },
] as const;

export default function RideAnalyticsPage() {
  const [preset, setPreset] = useState<string>("90");

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - Number(preset));
    return { startDate: toDateInputString(start), endDate: toDateInputString(end) };
  }, [preset]);

  const statsQuery = useQuery({ queryKey: ["admin-stats"], queryFn: getAdminStats });

  const rideStatsQuery = useQuery({
    queryKey: ["ride-stats", startDate, endDate],
    queryFn: () => getRideStats(startDate, endDate),
  });

  const daily = useMemo(
    () => fillDailyRideStats(rideStatsQuery.data?.stats ?? [], startDate, endDate),
    [rideStatsQuery.data, startDate, endDate],
  );

  const volume = useMemo(
    () =>
      daily.map((stat) => ({
        label: formatDayLabel(stat.date),
        date: stat.date,
        total_rides: stat.total_rides,
        completed_rides: stat.completed_rides,
      })),
    [daily],
  );

  const completion = useMemo(() => toCompletionTrend(daily), [daily]);
  const statusSlices = useMemo(() => toRideStatusSlices(statsQuery.data), [statsQuery.data]);

  const totalRidesInRange = volume.reduce((sum, point) => sum + point.total_rides, 0);
  const statusTotal = statusSlices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="space-y-6">
      {/* Snapshot sits above the date control on purpose: it counts every ride
          ever recorded, so putting it under a range filter would imply a
          scoping that does not apply to it. */}
      <ChartCard
        title="Ride status mix"
        description="Every ride on record, by current status. Not affected by the date range below."
        columns={[
          { key: "label", label: "Status" },
          { key: "value", label: "Rides", numeric: true },
          { key: "share", label: "Share", numeric: true },
        ]}
        rows={statusSlices.map((slice) => ({
          label: slice.label,
          value: slice.value,
          share: `${statusTotal ? ((slice.value / statusTotal) * 100).toFixed(1) : "0.0"}%`,
        }))}
        isLoading={statsQuery.isLoading}
        isRefreshing={statsQuery.isFetching && !statsQuery.isLoading}
        error={statsQuery.error ? unwrapError(statsQuery.error) : null}
        isEmpty={!statusSlices.length}
        emptyLabel="No rides recorded yet."
      >
        <DonutChart
          slices={statusSlices}
          centerValue={statusTotal.toLocaleString()}
          centerLabel="total rides"
        />
      </ChartCard>

      {/* One filter row above everything it scopes — both trend charts redraw
          against the same slice. */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="ride-range">
          Date range
        </label>
        <select
          id="ride-range"
          value={preset}
          onChange={(event) => setPreset(event.target.value)}
          className="field"
        >
          {RANGE_PRESETS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-[var(--text-secondary)]">
          {startDate} → {endDate} · {totalRidesInRange} rides
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Rides over time"
          description="Daily ride volume against how many of them completed."
          columns={[
            { key: "label", label: "Day" },
            { key: "total_rides", label: "Total", numeric: true },
            { key: "completed_rides", label: "Completed", numeric: true },
          ]}
          rows={volume}
          isLoading={rideStatsQuery.isLoading}
          isRefreshing={rideStatsQuery.isFetching && !rideStatsQuery.isLoading}
          error={rideStatsQuery.error ? unwrapError(rideStatsQuery.error) : null}
          isEmpty={!volume.length}
        >
          <TrendChart
            data={volume}
            xKey="label"
            series={[
              { key: "total_rides", label: "Total rides", color: SERIES.one, fill: true },
              { key: "completed_rides", label: "Completed", color: SERIES.two },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Completion rate trend"
          description="Share of each day's rides that finished. Zero-ride days are omitted, not drawn as 0%."
          columns={[
            { key: "label", label: "Day" },
            { key: "rate", label: "Completion", numeric: true },
            { key: "completed_rides", label: "Completed", numeric: true },
            { key: "total_rides", label: "Total", numeric: true },
          ]}
          rows={completion.map((point) => ({
            label: point.label,
            rate: `${point.completion_rate.toFixed(1)}%`,
            completed_rides: point.completed_rides,
            total_rides: point.total_rides,
          }))}
          isLoading={rideStatsQuery.isLoading}
          isRefreshing={rideStatsQuery.isFetching && !rideStatsQuery.isLoading}
          error={rideStatsQuery.error ? unwrapError(rideStatsQuery.error) : null}
          isEmpty={!completion.length}
          emptyLabel="No rides in this range to compute a rate from."
        >
          <TrendChart
            data={completion.map((point) => ({
              label: point.label,
              completion_rate: Number(point.completion_rate.toFixed(1)),
            }))}
            xKey="label"
            series={[
              { key: "completion_rate", label: "Completion rate", color: SERIES.one, fill: true },
            ]}
            yDomain={[0, 100]}
            valueFormatter={(value) => `${value}%`}
          />
        </ChartCard>
      </div>
    </div>
  );
}
