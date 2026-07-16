"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAdminStats, getRideStats, unwrapError } from "@/lib/api";

const BRAND = "#7ac143";
const BRAND_DARK = "#5a9e2f";

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
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Platform overview and ride performance trends.
        </p>
      </header>

      {statsQuery.error ? <p className="alert-error">{unwrapError(statsQuery.error)}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Ride Stats</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Daily rides and completed rides by date range.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
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
        </div>

        {rideStatsQuery.error ? (
          <p className="alert-error">{unwrapError(rideStatsQuery.error)}</p>
        ) : null}

        <div className="h-72 w-full">
          <ResponsiveContainer>
            <LineChart data={rideStatsQuery.data?.stats ?? []}>
              <CartesianGrid stroke="#e6e8e1" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e6e8e1",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                }}
              />
              <Line
                type="monotone"
                dataKey="total_rides"
                name="Total rides"
                stroke={BRAND}
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="completed_rides"
                name="Completed"
                stroke={BRAND_DARK}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </section>
  );
}
