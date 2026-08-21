"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats, getRideStats, unwrapError } from "@/lib/api";
import { ChartCard } from "@/components/charts/chart-card";
import { TrendChart } from "@/components/charts/trend-chart";
import { SERIES } from "@/components/charts/chart-theme";
import { fillDailyRideStats, formatDayLabel, toDateInputString } from "@/lib/analytics";

export default function DashboardPage() {
  const today = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return toDateInputString(start);
  }, [today]);
  const defaultEnd = useMemo(() => toDateInputString(today), [today]);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
  });

  const rideStatsQuery = useQuery({
    queryKey: ["ride-stats", startDate, endDate],
    queryFn: () => getRideStats(startDate, endDate),
  });

  const volume = useMemo(
    () =>
      fillDailyRideStats(rideStatsQuery.data?.stats ?? [], startDate, endDate).map((stat) => ({
        label: formatDayLabel(stat.date),
        total_rides: stat.total_rides,
        completed_rides: stat.completed_rides,
      })),
    [rideStatsQuery.data, startDate, endDate],
  );

  const cards = [
    { label: "Total Users", value: statsQuery.data?.total_users ?? 0 },
    { label: "Total Riders", value: statsQuery.data?.total_riders ?? 0 },
    { label: "Total Rides", value: statsQuery.data?.total_rides ?? 0 },
    { label: "Pending Rides", value: statsQuery.data?.pending_rides ?? 0 },
    { label: "In Progress", value: statsQuery.data?.in_progress_rides ?? 0 },
    { label: "Completed Rides", value: statsQuery.data?.completed_rides ?? 0 },
    { label: "Online Riders", value: statsQuery.data?.online_riders ?? 0 },
    {
      label: "Average Rating",
      value: Number(statsQuery.data?.overall_avg_rating ?? 0).toFixed(2),
    },
  ];

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Platform overview and ride performance trends. Deeper breakdowns live under{" "}
          <Link href="/rides/analytics" className="text-brand-dark underline">
            Rides → Analytics
          </Link>{" "}
          and{" "}
          <Link href="/riders/analytics" className="text-brand-dark underline">
            Riders → Analytics
          </Link>
          .
        </p>
      </header>

      {statsQuery.error ? <p className="alert-error">{unwrapError(statsQuery.error)}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
            {/* Proportional figures: tabular-nums makes a large standalone
                number look loose, and nothing aligns vertically here. */}
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* The range control sits above the card it scopes rather than inside it,
          so it reads as a page filter and can grow to cover more charts. */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Start</span>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="field"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">End</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="field"
          />
        </label>
      </div>

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
        emptyLabel="No rides in this date range."
      >
        <TrendChart
          data={volume}
          xKey="label"
          series={[
            { key: "total_rides", label: "Total rides", color: SERIES.one, fill: true },
            { key: "completed_rides", label: "Completed", color: SERIES.two },
          ]}
          height={288}
        />
      </ChartCard>
    </section>
  );
}
