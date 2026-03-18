import axios from "axios";
import { localApiPrefix } from "@/lib/config";
import { clearAdminToken, getAdminToken } from "@/lib/storage";

export const http = axios.create({
  baseURL: localApiPrefix,
  timeout: 30000,
});

http.interceptors.request.use((config) => {
  const token = getAdminToken();

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAdminToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
