"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { getRiders, unwrapError } from "@/lib/api";
import { StatusPill } from "@/components/status-pill";
import type { MapMarker } from "@/components/location-map";
import { parseLatLon } from "@/lib/geo";
import { WINDOW_SIZE } from "@/lib/paging";

// Google Maps needs the browser `window`, so load the map client-side only.
const LocationMap = dynamic(() => import("@/components/location-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[620px] w-full items-center justify-center rounded-[16px] border border-border bg-brand-tint-soft text-sm text-[var(--text-secondary)]">
      Loading map...
    </div>
  ),
});

const STATUS_FILTERS = ["all", "available", "busy", "offline"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function RiderMapPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

  const ridersQuery = useQuery({
    queryKey: ["riders", WINDOW_SIZE, 0],
    queryFn: () => getRiders({ limit: WINDOW_SIZE, offset: 0 }),
    // Positions go stale quickly; the API has no push channel for admins yet.
    refetchInterval: 30_000,
  });

  const riders = useMemo(() => ridersQuery.data?.riders ?? [], [ridersQuery.data]);

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? riders
        : riders.filter((rider) => (rider.status ?? "").toLowerCase() === statusFilter),
    [riders, statusFilter],
  );

  const located = useMemo(
    () =>
      filtered.flatMap((rider) => {
        const coords = parseLatLon(rider.current_location);
        return coords ? [{ rider, coords }] : [];
      }),
    [filtered],
  );

  const markers = useMemo<MapMarker[]>(
    () =>
      located.map(({ rider, coords }) => ({
        id: rider.id,
        lat: coords.lat,
        lon: coords.lon,
        title: rider.name,
        subtitle: [rider.vehicle_plate, rider.last_seen ? `Last seen ${rider.last_seen}` : null]
          .filter(Boolean)
          .join(" • "),
        // Highlight the selected rider in the brand green; others muted.
        tone: selectedRiderId === rider.id ? "#7AC143" : "#9AA3A0",
      })),
    [located, selectedRiderId],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="field"
        >
          {STATUS_FILTERS.map((value) => (
            <option key={value} value={value}>
              {value === "all" ? "All rider states" : value}
            </option>
          ))}
        </select>
        <span className="text-xs text-[var(--text-secondary)]">
          {located.length} of {filtered.length} riders have reported a position
        </span>
        <span className="ml-auto text-xs text-[var(--text-tertiary)]">
          Last-reported positions, refreshed every 30s
        </span>
      </div>

      {ridersQuery.error ? <p className="alert-error">{unwrapError(ridersQuery.error)}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <LocationMap
          markers={markers}
          className="h-[620px] w-full overflow-hidden rounded-[16px] border border-border"
          emptyLabel="No riders in this view have reported a location yet."
        />

        <div className="card max-h-[620px] overflow-y-auto p-2">
          {located.length ? (
            <ul className="space-y-1">
              {located.map(({ rider }) => (
                <li key={rider.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRiderId(rider.id)}
                    className={`w-full rounded-[12px] px-3 py-2 text-left transition ${
                      selectedRiderId === rider.id
                        ? "bg-brand-tint"
                        : "hover:bg-brand-tint-soft"
                    }`}
                  >
                    <span className="block text-sm font-medium">{rider.name}</span>
                    <span className="mt-1 flex items-center gap-2">
                      <StatusPill status={rider.status} />
                      <span className="text-xs text-[var(--text-secondary)]">
                        {rider.vehicle_plate}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-3 text-sm text-[var(--text-secondary)]">
              No positioned riders to list.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
