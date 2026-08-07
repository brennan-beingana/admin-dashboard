/**
 * Ride statuses split into the two views that matter operationally: trips a
 * dispatcher can still act on, and trips that are already settled.
 * Mirrors the `ride_status` enum in the API's migrations.
 */
export const LIVE_RIDE_STATUSES = ["pending", "accepted", "in_progress"];
export const CLOSED_RIDE_STATUSES = ["completed", "cancelled", "canceled"];

export function isLiveRide(status: string): boolean {
  return LIVE_RIDE_STATUSES.includes(status?.toLowerCase());
}
