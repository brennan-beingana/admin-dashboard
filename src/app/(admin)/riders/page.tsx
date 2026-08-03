"use client";

import { FormEvent, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRider,
  deleteRider,
  getRiders,
  getRiderStats,
  unwrapError,
  verifyRider,
} from "@/lib/api";
import { StatusPill } from "@/components/status-pill";
import { RiderVerificationCard } from "@/components/rider-verification-card";
import type { MapMarker } from "@/components/location-map";
import { parseLatLon } from "@/lib/geo";

// Google Maps needs the browser `window`, so load the map client-side only.
const LocationMap = dynamic(() => import("@/components/location-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-[16px] border border-border bg-brand-tint-soft text-sm text-[var(--text-secondary)]">
      Loading map...
    </div>
  ),
});

const PAGE_SIZE = 20;

export default function RidersPage() {
  const [offset, setOffset] = useState(0);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("motorcycle");
  const [actionError, setActionError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const ridersQuery = useQuery({
    queryKey: ["riders", PAGE_SIZE, offset],
    queryFn: () => getRiders({ limit: PAGE_SIZE, offset }),
  });

  const riderStatsQuery = useQuery({
    queryKey: ["rider-stats", selectedRiderId],
    queryFn: () => getRiderStats(selectedRiderId!),
    enabled: !!selectedRiderId,
    // The backend rider-stats route is not always registered; don't retry 404s.
    retry: false,
  });

  // Wire-up fix: treat a missing rider-stats endpoint as "not available yet"
  // instead of surfacing it as a hard error.
  const statsUnavailable =
    riderStatsQuery.error instanceof AxiosError &&
    riderStatsQuery.error.response?.status === 404;

  const createMutation = useMutation({
    mutationFn: createRider,
    onSuccess: async () => {
      setFullName("");
      setPhoneNumber("");
      setEmail("");
      setLicensePlate("");
      setVehicleType("motorcycle");
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["riders"] });
    },
    onError: (error) => {
      setActionError(unwrapError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRider,
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["riders"] });
    },
    onError: (error) => {
      setActionError(unwrapError(error));
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({
      riderId,
      status,
      note,
    }: {
      riderId: string;
      status: "verified" | "rejected";
      note: string;
    }) => verifyRider(riderId, { status, note: note || undefined }),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["riders"] });
    },
    onError: (error) => {
      setActionError(unwrapError(error));
    },
  });

  async function onCreateRider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);

    createMutation.mutate({
      full_name: fullName,
      phone_number: phoneNumber,
      email: email || undefined,
      license_plate: licensePlate,
      vehicle_type: vehicleType,
      username: fullName,
    });
  }

  const riders = ridersQuery.data?.riders ?? [];
  const pendingRiders = useMemo(
    () => riders.filter((rider) => rider.verification_status === "pending"),
    [riders],
  );

  const riderMarkers = useMemo<MapMarker[]>(() => {
    return riders.flatMap((rider) => {
      const coords = parseLatLon(rider.current_location);
      if (!coords) return [];
      return [
        {
          id: rider.id,
          lat: coords.lat,
          lon: coords.lon,
          title: rider.name,
          subtitle: [rider.vehicle_plate, rider.last_seen ? `Last seen ${rider.last_seen}` : null]
            .filter(Boolean)
            .join(" • "),
          // Highlight the selected rider in the brand green; others muted.
          tone: selectedRiderId === rider.id ? "#7AC143" : "#9AA3A0",
        },
      ];
    });
  }, [riders, selectedRiderId]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Riders</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Create, view, and remove rider accounts.
        </p>
      </header>

      <form onSubmit={onCreateRider} className="card p-5">
        <h2 className="text-lg font-semibold">Create Rider</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name"
            className="field"
          />
          <input
            required
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="Phone number"
            className="field"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email (optional)"
            className="field"
          />
          <input
            required
            value={licensePlate}
            onChange={(event) => setLicensePlate(event.target.value)}
            placeholder="License plate"
            className="field"
          />
          <input
            value={vehicleType}
            onChange={(event) => setVehicleType(event.target.value)}
            placeholder="Vehicle type"
            className="field"
          />
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            {createMutation.isPending ? "Creating..." : "Create Rider"}
          </button>
        </div>
      </form>

      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Account Management</h2>
          <span className="text-xs text-[var(--text-secondary)]">
            {pendingRiders.length} awaiting verification
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Review each rider&apos;s KYC submission and approve or reject them. Riders can sign in
          but stay gated on a &ldquo;pending verification&rdquo; screen until approved.
        </p>
        {pendingRiders.length ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {pendingRiders.map((rider) => (
              <RiderVerificationCard
                key={rider.id}
                rider={rider}
                isPending={verifyMutation.isPending}
                onVerify={(riderId, status, note) =>
                  verifyMutation.mutate({ riderId, status, note })
                }
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-[12px] border border-border bg-brand-tint-soft p-3 text-sm text-[var(--text-secondary)]">
            No riders are awaiting verification on this page.
          </p>
        )}
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Rider Stats</h2>
        {!selectedRiderId ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Select a rider from the table below to view their statistics.
          </p>
        ) : riderStatsQuery.isLoading ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Loading stats...</p>
        ) : statsUnavailable ? (
          <p className="mt-3 rounded-[12px] border border-border bg-brand-tint-soft p-3 text-sm text-[var(--text-secondary)]">
            Rider stats are not available from the backend yet (endpoint not
            registered). Aggregate metrics are on the Dashboard.
          </p>
        ) : riderStatsQuery.error ? (
          <p className="mt-3 alert-error">{unwrapError(riderStatsQuery.error)}</p>
        ) : riderStatsQuery.data ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Rides", value: riderStatsQuery.data.total_rides },
              { label: "Completed", value: riderStatsQuery.data.completed_rides },
              { label: "Cancelled", value: riderStatsQuery.data.cancelled_rides },
              {
                label: "Distance (km)",
                value: Number(riderStatsQuery.data.total_distance_km).toFixed(2),
              },
              {
                label: "Ride Time (hrs)",
                value: (riderStatsQuery.data.total_ride_time_seconds / 3600).toFixed(1),
              },
              { label: "Avg Rating", value: riderStatsQuery.data.avg_rating.toFixed(2) },
              { label: "Total Ratings", value: riderStatsQuery.data.total_ratings },
              {
                label: "Completion Rate",
                value: `${
                  riderStatsQuery.data.total_rides > 0
                    ? (
                        (riderStatsQuery.data.completed_rides /
                          riderStatsQuery.data.total_rides) *
                        100
                      ).toFixed(1)
                    : "0"
                }%`,
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[12px] border border-border p-3">
                <p className="text-xs text-[var(--text-secondary)]">{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Rider Locations</h2>
          <span className="text-xs text-[var(--text-secondary)]">
            {riderMarkers.length} of {riders.length} with a known location
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Last reported position of riders on this page. Only riders whose app has shared a
          location appear here.
        </p>
        <div className="mt-4">
          <LocationMap
            markers={riderMarkers}
            emptyLabel="No riders on this page have reported a location yet."
          />
        </div>
      </section>

      {ridersQuery.error || actionError ? (
        <p className="alert-error">{actionError ?? unwrapError(ridersQuery.error)}</p>
      ) : null}

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-tint text-left text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Vehicle</th>
              <th className="px-4 py-3 font-semibold">Verification</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Avg Rating</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {riders.map((rider) => (
              <tr
                key={rider.id}
                onClick={() => setSelectedRiderId(rider.id)}
                className={`cursor-pointer border-t border-border transition ${
                  selectedRiderId === rider.id ? "bg-brand-tint-soft" : "hover:bg-brand-tint-soft"
                }`}
              >
                <td className="px-4 py-3 font-medium">{rider.name}</td>
                <td className="px-4 py-3">{rider.phone}</td>
                <td className="px-4 py-3">{rider.vehicle_plate}</td>
                <td className="px-4 py-3">
                  <StatusPill status={rider.verification_status} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={rider.status} />
                </td>
                <td className="px-4 py-3">{rider.avg_rating ?? 0}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(rider.id);
                    }}
                    className="btn-danger text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!riders.length ? (
              <tr>
                <td className="px-4 py-6 text-center text-[var(--text-secondary)]" colSpan={7}>
                  No riders found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
          disabled={offset === 0}
          className="btn-outline text-sm"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setOffset((current) => current + PAGE_SIZE)}
          disabled={riders.length < PAGE_SIZE}
          className="btn-outline text-sm"
        >
          Next
        </button>
      </div>
    </section>
  );
}
