"use client";

import { FormEvent, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRider,
  deleteRider,
  getRiders,
  getRiderStats,
  unwrapError,
} from "@/lib/api";
import { StatusPill } from "@/components/status-pill";
import { TableToolbar } from "@/components/table-toolbar";
import { matchesSearch } from "@/lib/table-filter";
import { PAGE_SIZE, WINDOW_SIZE } from "@/lib/paging";

const VERIFICATION_FILTERS = ["all", "pending", "verified", "rejected"] as const;
type VerificationFilter = (typeof VERIFICATION_FILTERS)[number];

const VERIFICATION_OPTIONS = VERIFICATION_FILTERS.map((value) => ({
  value,
  label: value === "all" ? "All verification states" : value,
}));

const STATUS_OPTIONS = [
  { value: "all", label: "All rider states" },
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "offline", label: "Offline" },
];

export default function RiderListPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [verification, setVerification] = useState<VerificationFilter>("all");
  const [status, setStatus] = useState<string>("all");
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("motorcycle");

  const queryClient = useQueryClient();

  // Narrowing the result set can leave the current page past the end, so every
  // filter change restarts at page one.
  function applyFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(0);
    };
  }

  const onSearchChange = applyFilter(setSearch);
  const onVerificationChange = applyFilter(setVerification);
  const onStatusChange = applyFilter(setStatus);

  // Same key as the section layout, so the tab switch is a cache hit. Filtering
  // and paging happen client-side over this window until the API supports them.
  const ridersQuery = useQuery({
    queryKey: ["riders", WINDOW_SIZE, 0],
    queryFn: () => getRiders({ limit: WINDOW_SIZE, offset: 0 }),
  });

  const riderStatsQuery = useQuery({
    queryKey: ["rider-stats", selectedRiderId],
    queryFn: () => getRiderStats(selectedRiderId!),
    enabled: !!selectedRiderId,
    // The backend rider-stats route is not always registered; don't retry 404s.
    retry: false,
  });

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
      setShowCreate(false);
      await queryClient.invalidateQueries({ queryKey: ["riders"] });
    },
    onError: (error) => setActionError(unwrapError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRider,
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["riders"] });
    },
    onError: (error) => setActionError(unwrapError(error)),
  });

  function onCreateRider(event: FormEvent<HTMLFormElement>) {
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

  const riders = useMemo(() => ridersQuery.data?.riders ?? [], [ridersQuery.data]);

  const filtered = useMemo(
    () =>
      riders.filter((rider) => {
        if (verification !== "all" && rider.verification_status !== verification) return false;
        if (status !== "all" && (rider.status ?? "").toLowerCase() !== status) return false;
        return matchesSearch(
          rider,
          [
            (r) => r.name,
            (r) => r.phone,
            (r) => r.vehicle_plate,
            (r) => r.email,
            (r) => r.bike_name,
            (r) => r.nin,
          ],
          search,
        );
      }),
    [riders, search, verification, status],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <TableToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search name, phone, plate, bike, or NIN"
        filters={[
          {
            id: "riders-verification",
            label: "Verification state",
            value: verification,
            options: VERIFICATION_OPTIONS,
            onChange: (value) => onVerificationChange(value as VerificationFilter),
          },
          {
            id: "riders-status",
            label: "Rider state",
            value: status,
            options: STATUS_OPTIONS,
            onChange: onStatusChange,
          },
        ]}
        summary={`${filtered.length} of ${riders.length} riders`}
        actions={
          <button
            type="button"
            onClick={() => setShowCreate((open) => !open)}
            className="btn-primary text-sm"
          >
            {showCreate ? "Cancel" : "+ New Rider"}
          </button>
        }
      />

      {showCreate ? (
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
      ) : null}

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
            {visible.map((rider) => (
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
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteMutation.mutate(rider.id);
                    }}
                    className="btn-danger text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!visible.length ? (
              <tr>
                <td className="px-4 py-6 text-center text-[var(--text-secondary)]" colSpan={7}>
                  {ridersQuery.isLoading ? "Loading riders..." : "No riders match these filters."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(0, current - 1))}
          disabled={safePage === 0}
          className="btn-outline text-sm"
        >
          Previous
        </button>
        <span className="text-xs text-[var(--text-secondary)]">
          Page {safePage + 1} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
          disabled={safePage >= pageCount - 1}
          className="btn-outline text-sm"
        >
          Next
        </button>
        {riders.length >= WINDOW_SIZE ? (
          <span className="text-xs text-[var(--text-tertiary)]">
            Showing the first {WINDOW_SIZE} riders — server-side search is not available yet.
          </span>
        ) : null}
      </div>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Rider Stats</h2>
        {!selectedRiderId ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Select a rider from the table to view their statistics.
          </p>
        ) : riderStatsQuery.isLoading ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Loading stats...</p>
        ) : statsUnavailable ? (
          <p className="mt-3 rounded-[12px] border border-border bg-brand-tint-soft p-3 text-sm text-[var(--text-secondary)]">
            Rider stats are not available from the backend yet (endpoint not registered).
            Aggregate metrics are on the Dashboard.
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
    </div>
  );
}
