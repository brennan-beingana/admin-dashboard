"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRiders, unwrapError } from "@/lib/api";
import { ChartCard } from "@/components/charts/chart-card";
import { DonutChart } from "@/components/charts/donut-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { SERIES } from "@/components/charts/chart-theme";
import { toGrowthSeries, toRiderActivitySlices } from "@/lib/analytics";
import { WINDOW_SIZE } from "@/lib/paging";

export default function RiderAnalyticsPage() {
  // Same key as the section layout and the other tabs, so this is a cache hit.
  const ridersQuery = useQuery({
    queryKey: ["riders", WINDOW_SIZE, 0],
    queryFn: () => getRiders({ limit: WINDOW_SIZE, offset: 0 }),
  });

  const riders = useMemo(() => ridersQuery.data?.riders ?? [], [ridersQuery.data]);

  const activitySlices = useMemo(() => toRiderActivitySlices(riders), [riders]);
  const activityTotal = activitySlices.reduce((sum, slice) => sum + slice.value, 0);

  const growth = useMemo(
    () => toGrowthSeries(riders.map((rider) => rider.created_at)),
    [riders],
  );

  const error = ridersQuery.error ? unwrapError(ridersQuery.error) : null;
  const isRefreshing = ridersQuery.isFetching && !ridersQuery.isLoading;
  const windowed = riders.length >= WINDOW_SIZE;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Rider activity status"
          description="Where every rider stands right now."
          columns={[
            { key: "label", label: "Status" },
            { key: "value", label: "Riders", numeric: true },
            { key: "share", label: "Share", numeric: true },
          ]}
          rows={activitySlices.map((slice) => ({
            label: slice.label,
            value: slice.value,
            share: `${activityTotal ? ((slice.value / activityTotal) * 100).toFixed(1) : "0.0"}%`,
          }))}
          isLoading={ridersQuery.isLoading}
          isRefreshing={isRefreshing}
          error={error}
          isEmpty={!activitySlices.length}
          emptyLabel="No riders registered yet."
        >
          <DonutChart
            slices={activitySlices}
            centerValue={activityTotal.toLocaleString()}
            centerLabel="riders"
          />
        </ChartCard>

        <ChartCard
          title="Rider growth"
          description={
            windowed
              ? `Cumulative registrations across the ${WINDOW_SIZE} riders loaded — the API has no growth endpoint, so earlier sign-ups are not counted.`
              : "Cumulative registrations, counted from every rider's join date."
          }
          columns={[
            { key: "label", label: "Day" },
            { key: "added", label: "Joined", numeric: true },
            { key: "cumulative", label: "Total", numeric: true },
          ]}
          rows={growth.map((point) => ({
            label: point.label,
            added: point.added,
            cumulative: point.cumulative,
          }))}
          isLoading={ridersQuery.isLoading}
          isRefreshing={isRefreshing}
          error={error}
          isEmpty={!growth.length}
          emptyLabel="No rider join dates to plot."
        >
          <TrendChart
            data={growth.map((point) => ({ ts: point.ts, cumulative: point.cumulative }))}
            xKey="ts"
            xType="time"
            series={[{ key: "cumulative", label: "Total riders", color: SERIES.one, fill: true }]}
          />
        </ChartCard>
      </div>
    </div>
  );
}
