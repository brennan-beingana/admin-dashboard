import { AxiosError } from "axios";
import { http } from "@/lib/http";
import { transformResponse } from "@/lib/transform";
import type {
  AdminStats,
  ApiError,
  ChargingStation,
  ChargingStationsResponse,
  CreateOrUpdateStationRequest,
  CreateRiderRequest,
  RideStatsResponse,
  RiderStats,
  RidesResponse,
  RidersResponse,
  UsersResponse,
  VerifyRiderRequest,
} from "@/lib/types";

export type PageParams = {
  limit: number;
  offset: number;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

function unwrapError(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.error) {
      return data.details ? `${data.error}: ${data.details}` : data.error;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed";
}

export async function loginAdmin(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>("/login", payload);
  return data;
}

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await http.get<AdminStats>("/stats");
  return transformResponse<AdminStats>(data);
}

export async function getRideStats(startDate?: string, endDate?: string): Promise<RideStatsResponse> {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  const query = params.toString();
  const path = query ? `/stats/rides?${query}` : "/stats/rides";
  const { data } = await http.get<RideStatsResponse>(path);
  return transformResponse<RideStatsResponse>(data);
}

export async function getRiders({ limit, offset }: PageParams): Promise<RidersResponse> {
  const { data } = await http.get<RidersResponse>(`/riders?limit=${limit}&offset=${offset}`);
  return transformResponse<RidersResponse>(data);
}

export async function createRider(payload: CreateRiderRequest): Promise<void> {
  await http.post("/riders", payload);
}

export async function deleteRider(riderId: string): Promise<void> {
  await http.delete(`/riders/${riderId}`);
}

export async function verifyRider(
  riderId: string,
  payload: VerifyRiderRequest,
): Promise<void> {
  await http.patch(`/riders/${riderId}/verify`, payload);
}

export async function getRiderStats(riderId: string): Promise<RiderStats> {
  const { data } = await http.get<RiderStats>(`/riders/${riderId}/stats`);
  return transformResponse<RiderStats>(data);
}

export async function getUsers({ limit, offset }: PageParams): Promise<UsersResponse> {
  const { data } = await http.get<UsersResponse>(`/users?limit=${limit}&offset=${offset}`);
  return transformResponse<UsersResponse>(data);
}

export async function deleteUser(userId: string): Promise<void> {
  await http.delete(`/users/${userId}`);
}

export async function getRides({ limit, offset }: PageParams): Promise<RidesResponse> {
  const { data } = await http.get<RidesResponse>(`/rides?limit=${limit}&offset=${offset}`);
  return transformResponse<RidesResponse>(data);
}

export async function getChargingStations({
  limit,
  offset,
}: PageParams): Promise<ChargingStationsResponse> {
  const { data } = await http.get<ChargingStationsResponse>(
    `/charging_stations?limit=${limit}&offset=${offset}`,
  );
  return transformResponse<ChargingStationsResponse>(data);
}

export async function createChargingStation(payload: CreateOrUpdateStationRequest): Promise<void> {
  await http.post("/charging_stations", payload);
}

export async function updateChargingStation(
  id: string,
  payload: CreateOrUpdateStationRequest,
): Promise<ChargingStation> {
  const { data } = await http.put<ChargingStation>(`/charging_stations/${id}`, payload);
  return transformResponse<ChargingStation>(data);
}

export async function deleteChargingStation(id: string): Promise<void> {
  await http.delete(`/charging_stations/${id}`);
}

export { unwrapError };
