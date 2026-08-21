"use client";

import { StatusPill } from "@/components/status-pill";
import type { LatLon } from "@/lib/geo";
import type { Rider, RiderStats } from "@/lib/types";

type Props = {
  rider: Rider;
  coords: LatLon;
  stats?: RiderStats;
  statsLoading?: boolean;
  statsUnavailable?: boolean;
  onClose: () => void;
};

function relativeTime(timestamp?: string): string {
  if (!timestamp) return "Never";
  const parsed = new Date(timestamp.includes("T") ? timestamp : timestamp.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return timestamp;

  const seconds = Math.round((Date.now() - parsed.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

/**
 * Overlay shown when a rider's pin is clicked.
 *
 * Positioned over the map rather than in a Google InfoWindow: an InfoWindow is
 * rendered into the map's own DOM, where the dashboard's card styling and
 * scrolling do not reach, and this panel is too tall for one.
 */
export function RiderDetailCard({
  rider,
  coords,
  stats,
  statsLoading,
  statsUnavailable,
  onClose,
}: Props) {
  const registered = [
    { label: "Phone", value: rider.phone || "—" },
    { label: "Plate", value: rider.vehicle_plate || "—" },
    { label: "Vehicle", value: rider.vehicle_type || "—" },
    { label: "Bike", value: [rider.bike_name, rider.bike_model].filter(Boolean).join(" ") || "—" },
    { label: "NIN", value: rider.nin || "—" },
    { label: "Residence", value: rider.current_residence || "—" },
    {
      label: "Joined",
      value: rider.created_at ? rider.created_at.slice(0, 10) : "—",
    },
  ];

  return (
    <div className="absolute right-4 top-4 z-10 max-h-[calc(100%-2rem)] w-[20rem] overflow-y-auto rounded-[16px] border border-border bg-[var(--surface)] p-4 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{rider.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <StatusPill status={rider.status} />
            <StatusPill status={rider.verification_status} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close rider details"
          className="btn-outline px-2 py-1 text-xs"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 border-t border-border pt-2">
        <Row label="Last seen" value={relativeTime(rider.last_seen)} />
        <Row
          label="Last known location"
          value={
            <a
              href={`https://www.google.com/maps?q=${coords.lat},${coords.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tabular-nums text-brand-dark underline"
            >
              {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
            </a>
          }
        />
        <Row
          label="Distance ridden"
          value={
            statsUnavailable ? (
              <span className="text-[var(--text-tertiary)]">Unavailable</span>
            ) : statsLoading ? (
              <span className="text-[var(--text-tertiary)]">…</span>
            ) : (
              `${Number(stats?.total_distance_km ?? 0).toFixed(2)} km`
            )
          }
        />
        <Row
          label="Battery"
          value={
            <span
              className="text-[var(--text-tertiary)]"
              title="The API does not report bike battery level yet."
            >
              Not reported
            </span>
          }
        />
      </div>

      {!statsUnavailable ? (
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
          {[
            { label: "Rides", value: stats?.total_rides ?? 0 },
            { label: "Done", value: stats?.completed_rides ?? 0 },
            { label: "Cancelled", value: stats?.cancelled_rides ?? 0 },
          ].map((item) => (
            <div key={item.label} className="rounded-[12px] border border-border p-2 text-center">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                {item.label}
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {statsLoading ? "…" : item.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 border-t border-border pt-2">
        <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
          Registered details
        </p>
        {registered.map((item) => (
          <Row key={item.label} label={item.label} value={item.value} />
        ))}
        <Row
          label="Rating"
          value={
            rider.total_ratings
              ? `${Number(rider.avg_rating ?? 0).toFixed(2)} (${rider.total_ratings})`
              : "No ratings"
          }
        />
      </div>
    </div>
  );
}
