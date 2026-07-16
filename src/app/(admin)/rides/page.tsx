"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRides, unwrapError } from "@/lib/api";
import { StatusPill } from "@/components/status-pill";

const PAGE_SIZE = 20;

export default function RidesPage() {
  const [offset, setOffset] = useState(0);

  const ridesQuery = useQuery({
    queryKey: ["rides", PAGE_SIZE, offset],
    queryFn: () => getRides({ limit: PAGE_SIZE, offset }),
  });

  const rides = ridesQuery.data?.rides ?? [];

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Rides</h1>
        <p className="text-sm text-[var(--text-secondary)]">All rides across the platform.</p>
      </header>

      {ridesQuery.error ? <p className="alert-error">{unwrapError(ridesQuery.error)}</p> : null}

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-tint text-left text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Origin</th>
              <th className="px-4 py-3 font-semibold">Destination</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Distance (km)</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {rides.map((ride, index) => (
              <tr
                key={`${ride.id}-${ride.created_at}-${index}`}
                className="border-t border-border"
              >
                <td className="px-4 py-3 font-medium">{ride.origin_name}</td>
                <td className="px-4 py-3">{ride.destination_name}</td>
                <td className="px-4 py-3">
                  <StatusPill status={ride.status} />
                </td>
                <td className="px-4 py-3">{ride.distance_km}</td>
                <td className="px-4 py-3">{ride.price}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {new Date(ride.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!rides.length ? (
              <tr>
                <td className="px-4 py-6 text-center text-[var(--text-secondary)]" colSpan={6}>
                  No rides found.
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
          disabled={rides.length < PAGE_SIZE}
          className="btn-outline text-sm"
        >
          Next
        </button>
      </div>
    </section>
  );
}
