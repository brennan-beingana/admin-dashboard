import { StatusPill } from "@/components/status-pill";
import type { Ride } from "@/lib/types";

type Props = {
  rides: Ride[];
  isLoading?: boolean;
  emptyLabel?: string;
};

export function RidesTable({ rides, isLoading, emptyLabel = "No rides found." }: Props) {
  return (
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
            <tr key={`${ride.id}-${ride.created_at}-${index}`} className="border-t border-border">
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
                {isLoading ? "Loading rides..." : emptyLabel}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
