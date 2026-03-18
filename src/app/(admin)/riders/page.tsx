"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRider, deleteRider, getRiders, getRiderStats, unwrapError } from "@/lib/api";

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
  });

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

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Riders</h1>
        <p className="text-sm text-foreground/70">Create, view, and remove rider accounts.</p>
      </header>

      <form onSubmit={onCreateRider} className="rounded-lg border border-black/10 p-4">
        <h2 className="text-lg font-semibold">Create Rider</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name"
            className="rounded-md border border-black/15 px-3 py-2"
          />
          <input
            required
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="Phone number"
            className="rounded-md border border-black/15 px-3 py-2"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email (optional)"
            className="rounded-md border border-black/15 px-3 py-2"
          />
          <input
            required
            value={licensePlate}
            onChange={(event) => setLicensePlate(event.target.value)}
            placeholder="License plate"
            className="rounded-md border border-black/15 px-3 py-2"
          />
          <input
            value={vehicleType}
            onChange={(event) => setVehicleType(event.target.value)}
            placeholder="Vehicle type"
            className="rounded-md border border-black/15 px-3 py-2"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-60"
          >
            {createMutation.isPending ? "Creating..." : "Create Rider"}
          </button>
        </div>
      </form>

      <section className="rounded-lg border border-black/10 p-4">
        <h2 className="text-lg font-semibold">Rider Stats</h2>
        {!selectedRiderId ? (
          <p className="mt-2 text-sm text-foreground/70">
            Select a rider from the table below to view their statistics.
          </p>
        ) : riderStatsQuery.isLoading ? (
          <p className="mt-2 text-sm text-foreground/70">Loading stats...</p>
        ) : riderStatsQuery.error ? (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {unwrapError(riderStatsQuery.error)}
          </p>
        ) : riderStatsQuery.data ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-black/10 p-3">
              <p className="text-xs text-foreground/70">Total Rides</p>
              <p className="text-2xl font-semibold">{riderStatsQuery.data.total_rides}</p>
            </div>
            <div className="rounded-md border border-black/10 p-3">
              <p className="text-xs text-foreground/70">Completed</p>
              <p className="text-2xl font-semibold">{riderStatsQuery.data.completed_rides}</p>
            </div>
            <div className="rounded-md border border-black/10 p-3">
              <p className="text-xs text-foreground/70">Cancelled</p>
              <p className="text-2xl font-semibold">{riderStatsQuery.data.cancelled_rides}</p>
            </div>
            <div className="rounded-md border border-black/10 p-3">
              <p className="text-xs text-foreground/70">Distance (km)</p>
              <p className="text-2xl font-semibold">{Number(riderStatsQuery.data.total_distance_km).toFixed(2)}</p>
            </div>
            <div className="rounded-md border border-black/10 p-3">
              <p className="text-xs text-foreground/70">Ride Time (hrs)</p>
              <p className="text-2xl font-semibold">{(riderStatsQuery.data.total_ride_time_seconds / 3600).toFixed(1)}</p>
            </div>
            <div className="rounded-md border border-black/10 p-3">
              <p className="text-xs text-foreground/70">Avg Rating</p>
              <p className="text-2xl font-semibold">{riderStatsQuery.data.avg_rating.toFixed(2)}</p>
            </div>
            <div className="rounded-md border border-black/10 p-3">
              <p className="text-xs text-foreground/70">Total Ratings</p>
              <p className="text-2xl font-semibold">{riderStatsQuery.data.total_ratings}</p>
            </div>
            <div className="rounded-md border border-black/10 p-3">
              <p className="text-xs text-foreground/70">Completion Rate</p>
              <p className="text-2xl font-semibold">
                {riderStatsQuery.data.total_rides > 0
                  ? ((riderStatsQuery.data.completed_rides / riderStatsQuery.data.total_rides) * 100).toFixed(1)
                  : "0"}
                %
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {ridersQuery.error || actionError ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError ?? unwrapError(ridersQuery.error)}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-black/10">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Vehicle</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Avg Rating</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {riders.map((rider) => (
              <tr
                key={rider.id}
                onClick={() => setSelectedRiderId(rider.id)}
                className={`border-t border-black/10 cursor-pointer ${
                  selectedRiderId === rider.id ? "bg-blue-50" : "hover:bg-black/2"
                }`}
              >
                <td className="px-3 py-2">{rider.name}</td>
                <td className="px-3 py-2">{rider.phone}</td>
                <td className="px-3 py-2">{rider.vehicle_plate}</td>
                <td className="px-3 py-2">{rider.status}</td>
                <td className="px-3 py-2">{rider.avg_rating ?? 0}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(rider.id);
                    }}
                    className="rounded-md border border-black/15 px-2 py-1 hover:bg-black/5"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!riders.length ? (
              <tr>
                <td className="px-3 py-4 text-center text-foreground/70" colSpan={6}>
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
          className="rounded-md border border-black/15 px-3 py-2 disabled:opacity-60"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setOffset((current) => current + PAGE_SIZE)}
          disabled={riders.length < PAGE_SIZE}
          className="rounded-md border border-black/15 px-3 py-2 disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </section>
  );
}
