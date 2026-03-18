"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRides, unwrapError } from "@/lib/api";

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
        <p className="text-sm text-foreground/70">All rides across the platform.</p>
      </header>

      {ridesQuery.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {unwrapError(ridesQuery.error)}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-black/10">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-3 py-2">Origin</th>
              <th className="px-3 py-2">Destination</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Distance (km)</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rides.map((ride, index) => (
              <tr key={`${ride.id}-${ride.created_at}-${index}`} className="border-t border-black/10">
                <td className="px-3 py-2">{ride.origin_name}</td>
                <td className="px-3 py-2">{ride.destination_name}</td>
                <td className="px-3 py-2">{ride.status}</td>
                <td className="px-3 py-2">{ride.distance_km}</td>
                <td className="px-3 py-2">{ride.price}</td>
                <td className="px-3 py-2">{new Date(ride.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!rides.length ? (
              <tr>
                <td className="px-3 py-4 text-center text-foreground/70" colSpan={6}>
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
          className="rounded-md border border-black/15 px-3 py-2 disabled:opacity-60"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setOffset((current) => current + PAGE_SIZE)}
          disabled={rides.length < PAGE_SIZE}
          className="rounded-md border border-black/15 px-3 py-2 disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </section>
  );
}
