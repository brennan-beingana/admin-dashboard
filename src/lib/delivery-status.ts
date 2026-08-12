/**
 * Delivery statuses split the same way rides are: parcels a dispatcher can
 * still act on, and parcels that are already settled.
 * Mirrors the `delivery_status` enum in the API's migrations.
 */
export const LIVE_DELIVERY_STATUSES = ["pending", "accepted", "picked_up", "in_transit"];
export const CLOSED_DELIVERY_STATUSES = ["delivered", "cancelled", "canceled"];

export function isLiveDelivery(status: string): boolean {
  return LIVE_DELIVERY_STATUSES.includes(status?.toLowerCase());
}

const PACKAGE_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export function packageLabel(size: string): string {
  return PACKAGE_LABELS[size?.toLowerCase()] ?? size;
}
