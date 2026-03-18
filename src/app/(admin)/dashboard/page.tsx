"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAdminStats, getRideStats, unwrapError } from "@/lib/api";

function toDateInputString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

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
        <p className="mt-1 text-sm text-foreground/70">Platform overview and ride performance trends.</p>
      </header>

      {statsQuery.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {unwrapError(statsQuery.error)}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-black/10 p-4">
            <p className="text-sm text-foreground/70">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-black/10 p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Ride Stats</h2>
            <p className="text-sm text-foreground/70">Daily rides and completed rides by date range.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="text-sm">
              <span className="mb-1 block">Start</span>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-md border border-black/15 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block">End</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-md border border-black/15 px-3 py-2"
              />
            </label>
          </div>
        </div>

        {rideStatsQuery.error ? (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {unwrapError(rideStatsQuery.error)}
          </p>
        ) : null}

        <div className="h-72 w-full">
          <ResponsiveContainer>
            <LineChart data={rideStatsQuery.data?.stats ?? []}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total_rides" stroke="currentColor" strokeWidth={2} />
              <Line type="monotone" dataKey="completed_rides" stroke="currentColor" strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </section>
  );
}
