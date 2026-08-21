export type ApiError = {
  error: string;
  details?: string;
};

export type AdminStats = {
  total_users: number;
  total_riders: number;
  total_rides: number;
  total_charging_stations: number;
  pending_rides: number;
  accepted_rides: number;
  in_progress_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  online_riders: number;
  overall_avg_rating: number;
  total_distance_km: number;
  total_ride_time_seconds: number;
};

export type DailyRideStat = {
  date: string;
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  total_revenue: number;
};

export type RideStatsResponse = {
  start_date: string;
  end_date: string;
  stats: DailyRideStat[];
};

export type Rider = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  firebase_uid?: string;
  vehicle_plate: string;
  vehicle_type: string;
  status: string;
  avg_rating: number;
  total_ratings: number;
  photo_url?: string;
  license_photo_url?: string;
  nin_photo_url?: string;
  // KYC + verification
  verification_status: "pending" | "verified" | "rejected";
  nin?: string;
  bike_name?: string;
  bike_model?: string;
  current_residence?: string;
  recommendation_letter_url?: string;
  verification_note?: string;
  verified_at?: string;
  current_location?: string;
  last_seen?: string;
  created_at: string;
  updated_at: string;
};

export type VerifyRiderRequest = {
  status: "verified" | "rejected";
  note?: string;
};

export type RidersResponse = {
  count: number;
  limit: number;
  offset: number;
  riders: Rider[];
};

export type RiderStats = {
  rider_id: string;
  rider_name: string;
  rider_phone: string;
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  total_distance_km: number;
  total_ride_time_seconds: number;
  avg_rating: number;
  total_ratings: number;
};

export type CreateRiderRequest = {
  full_name: string;
  phone_number: string;
  email?: string;
  license_plate: string;
  vehicle_type?: string;
  username?: string;
};

export type User = {
  id: string;
  firebase_uid?: string;
  phone: string;
  name: string;
  email?: string;
  created_at: string;
  updated_at: string;
};

export type UsersResponse = {
  users: User[];
};

export type Ride = {
  id: string;
  passenger_id: string;
  rider_id?: string;
  origin: string;
  destination: string;
  origin_name: string;
  destination_name: string;
  distance_km: string;
  status: string;
  price: string;
  eta_seconds: number;
  created_at: string;
  updated_at: string;
};

export type RidesResponse = {
  count: number;
  limit?: number;
  offset?: number;
  rides: Ride[];
};

export type Delivery = {
  id: string;
  sender_id: string;
  courier_id?: string;
  sender_name?: string;
  sender_phone?: string;
  courier_name?: string;
  vehicle_plate?: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_lat: number;
  pickup_lon: number;
  dropoff_lat: number;
  dropoff_lon: number;
  package_size: string;
  package_description: string;
  recipient_name: string;
  recipient_phone: string;
  status: string;
  distance_km: number;
  price: number;
  eta_seconds: number;
  created_at: string;
  updated_at: string;
};

export type DeliveriesResponse = {
  count: number;
  total?: number;
  limit?: number;
  offset?: number;
  deliveries: Delivery[];
};

// Mirrors `ListChargingStations` in ebike-api: the query selects
// `ST_X(location) AS longitude, ST_Y(location) AS latitude`, so coordinates
// arrive as two numbers. There is no `location` field — this type used to
// declare one, and because the response is cast at the boundary rather than
// validated, every read of it was silently `undefined`: no map markers, a blank
// Location column, and an edit form that came up empty.
// `location_string` is a nullable human label, not coordinates.
export type ChargingStation = {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  location_string?: string | null;
  capacity: number;
  meta?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ChargingStationsResponse = {
  count?: number;
  limit?: number;
  offset?: number;
  charging_stations: ChargingStation[];
};

export type CreateOrUpdateStationRequest = {
  name: string;
  lat: number;
  lon: number;
  capacity?: number;
  meta?: Record<string, unknown>;
};
