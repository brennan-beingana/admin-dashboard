// Falls back to the droplet, not the retired Render stack — an unset env var
// used to silently point the dashboard at pre-KYC code that 404s on the
// verification routes. Production overrides this with the compose-internal
// `http://api:8080` via .env.dashboard.
export const backendApiBaseUrl =
  process.env.BACKEND_API_BASE_URL ?? "https://46-101-193-155.sslip.io";

export const adminApiPrefix = "/v1/admin";
export const localApiPrefix = "/api/admin";
