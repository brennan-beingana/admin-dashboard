"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { getRiders, getRiderStats, unwrapError } from "@/lib/api";
import { StatusPill } from "@/components/status-pill";
import { RiderDetailCard } from "@/components/rider-detail-card";
import { TableToolbar } from "@/components/table-toolbar";
import type { MapMarker } from "@/components/location-map";
import { parseLatLon } from "@/lib/geo";
import { WINDOW_SIZE } from "@/lib/paging";
import { matchesSearch } from "@/lib/table-filter";

// Google Maps needs the browser `window`, so load the map client-side only.
const LocationMap = dynamic(() => import("@/components/location-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[620px] w-full items-center justify-center rounded-[16px] border border-border bg-brand-tint-soft text-sm text-[var(--text-secondary)]">
      Loading map...
    </div>
  ),
});

const STATUS_FILTERS = [
  { value: "all", label: "All rider states" },
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "offline", label: "Offline" },
] as const;

const SELECTED_TONE = "#7AC143";
const MUTED_TONE = "#9AA3A0";

export default function RiderMapPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

  const ridersQuery = useQuery({
    queryKey: ["riders", WINDOW_SIZE, 0],
    queryFn: () => getRiders({ limit: WINDOW_SIZE, offset: 0 }),
    // Positions go stale quickly; the API has no push channel for admins yet.
    refetchInterval: 30_000,
  });

  // Only fetched once a pin is actually opened — the list view needs none of it.
  const riderStatsQuery = useQuery({
    queryKey: ["rider-stats", selectedRiderId],
    queryFn: () => getRiderStats(selectedRiderId!),
    enabled: !!selectedRiderId,
    retry: false,
  });

  const statsUnavailable =
    riderStatsQuery.error instanceof AxiosError &&
    riderStatsQuery.error.response?.status === 404;

  const riders = useMemo(() => ridersQuery.data?.riders ?? [], [ridersQuery.data]);

  const filtered = useMemo(
    () =>
      riders.filter((rider) => {
        if (statusFilter !== "all" && (rider.status ?? "").toLowerCase() !== statusFilter) {
          return false;
        }
        return matchesSearch(
          rider,
          [(r) => r.name, (r) => r.phone, (r) => r.vehicle_plate, (r) => r.bike_name],
          search,
        );
      }),
    [riders, statusFilter, search],
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
        subtitle: rider.vehicle_plate,
        // Colour follows selection state, which is UI, not series identity.
        tone: selectedRiderId === rider.id ? SELECTED_TONE : MUTED_TONE,
      })),
    [located, selectedRiderId],
  );

  const selected = useMemo(
    () => located.find(({ rider }) => rider.id === selectedRiderId) ?? null,
    [located, selectedRiderId],
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setSelectedRiderId(null);
        }}
        searchPlaceholder="Search name, phone, plate, or bike"
        filters={[
          {
            id: "rider-map-status",
            label: "Rider state",
            value: statusFilter,
            options: STATUS_FILTERS,
            onChange: (value) => {
              setStatusFilter(value);
              setSelectedRiderId(null);
            },
          },
        ]}
        summary={`${located.length} of ${filtered.length} riders have reported a position`}
        actions={
          <span className="text-xs text-[var(--text-tertiary)]">
            Last-reported positions, refreshed every 30s
          </span>
        }
      />

      {ridersQuery.error ? <p className="alert-error">{unwrapError(ridersQuery.error)}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        {/* Relative so the detail card can sit over the map rather than in a
            Google InfoWindow, which the dashboard's styles cannot reach into. */}
        <div className="relative">
          <LocationMap
            markers={markers}
            selectedId={selectedRiderId}
            onMarkerSelect={setSelectedRiderId}
            className="h-[620px] w-full overflow-hidden rounded-[16px] border border-border"
            emptyLabel="No riders in this view have reported a location yet."
          />

          {selected ? (
            <RiderDetailCard
              rider={selected.rider}
              coords={selected.coords}
              stats={riderStatsQuery.data}
              statsLoading={riderStatsQuery.isLoading}
              statsUnavailable={statsUnavailable}
              onClose={() => setSelectedRiderId(null)}
            />
          ) : null}
        </div>

        <div className="card max-h-[620px] overflow-y-auto p-2">
          {located.length ? (
            <ul className="space-y-1">
              {located.map(({ rider }) => (
                <li key={rider.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRiderId(rider.id)}
                    aria-pressed={selectedRiderId === rider.id}
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
