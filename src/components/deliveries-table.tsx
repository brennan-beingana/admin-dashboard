import { StatusPill } from "@/components/status-pill";
import { packageLabel } from "@/lib/delivery-status";
import type { Delivery } from "@/lib/types";

type Props = {
  deliveries: Delivery[];
  isLoading?: boolean;
  emptyLabel?: string;
};

export function DeliveriesTable({
  deliveries,
  isLoading,
  emptyLabel = "No deliveries found.",
}: Props) {
  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-brand-tint text-left text-[var(--text-secondary)]">
          <tr>
            <th className="px-4 py-3 font-semibold">Pickup</th>
            <th className="px-4 py-3 font-semibold">Dropoff</th>
            <th className="px-4 py-3 font-semibold">Recipient</th>
            <th className="px-4 py-3 font-semibold">Package</th>
            <th className="px-4 py-3 font-semibold">Courier</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Distance (km)</th>
            <th className="px-4 py-3 font-semibold">Price</th>
            <th className="px-4 py-3 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((delivery) => (
            <tr key={delivery.id} className="border-t border-border">
              <td className="px-4 py-3 font-medium">{delivery.pickup_address || "—"}</td>
              <td className="px-4 py-3">{delivery.dropoff_address || "—"}</td>
              <td className="px-4 py-3">
                <div>{delivery.recipient_name}</div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {delivery.recipient_phone}
                </div>
              </td>
              <td className="px-4 py-3">{packageLabel(delivery.package_size)}</td>
              <td className="px-4 py-3">
                {delivery.courier_name ? (
                  <div>
                    <div>{delivery.courier_name}</div>
                    {delivery.vehicle_plate ? (
                      <div className="text-xs text-[var(--text-secondary)]">
                        {delivery.vehicle_plate}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-[var(--text-tertiary)]">Unassigned</span>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusPill status={delivery.status} />
              </td>
              <td className="px-4 py-3">{delivery.distance_km.toFixed(2)}</td>
              <td className="px-4 py-3">{delivery.price.toFixed(2)}</td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">
                {new Date(delivery.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
          {!deliveries.length ? (
            <tr>
              <td className="px-4 py-6 text-center text-[var(--text-secondary)]" colSpan={9}>
                {isLoading ? "Loading deliveries..." : emptyLabel}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
