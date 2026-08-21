import { backendApiBaseUrl, adminApiPrefix } from "@/lib/config";
import type { ApiError } from "@/lib/types";

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

async function proxy(req: Request, params: { path: string[] }) {
  const requestUrl = new URL(req.url);
  const routePath = params.path.join("/");
  const upstreamUrl = new URL(`${adminApiPrefix}/${routePath}`, backendApiBaseUrl);
  requestUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value);
  });

  const headers = new Headers();
  const authHeader = req.headers.get("authorization");
  const contentType = req.headers.get("content-type");

  if (authHeader) {
    headers.set("authorization", authHeader);
  }

  if (contentType) {
    headers.set("content-type", contentType);
  }

  const method = req.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };

  if (!METHODS_WITHOUT_BODY.has(method)) {
    const bodyText = await req.text();
    if (bodyText.length > 0) {
      init.body = bodyText;
    }
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, init);
  } catch (cause) {
    // Unreachable host — DNS failure, refused connection, bad TLS. Name the
    // host, because the whole point is to make a misconfigured backend obvious.
    return backendError(
      502,
      `Cannot reach the backend at ${upstreamUrl.origin}`,
      cause instanceof Error ? cause.message : String(cause),
    );
  }

  const text = await upstreamResponse.text();
  const upstreamContentType = upstreamResponse.headers.get("content-type") ?? "";

  // The API only ever speaks JSON. Anything else means we are not talking to it
  // — we are talking to whatever is squatting on that hostname. Passing that
  // through verbatim is how a retired Render backend's HTML "Service Suspended"
  // page reached the browser as a bare 503 on every admin call, with nothing
  // naming the real culprit. Convert it into an error that says where it came from.
  if (!upstreamContentType.includes("application/json")) {
    return backendError(
      upstreamResponse.status === 200 ? 502 : upstreamResponse.status,
      `Backend at ${upstreamUrl.origin} did not return JSON`,
      `${upstreamResponse.status} ${upstreamResponse.statusText} (content-type: ${
        upstreamContentType || "none"
      })`,
    );
  }

  return new Response(text, {
    status: upstreamResponse.status,
    headers: { "content-type": upstreamContentType },
  });
}

function backendError(status: number, error: string, details: string) {
  console.error(`[admin-proxy] ${error} — ${details}`);
  return new Response(JSON.stringify({ error, details } satisfies ApiError), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(req: Request, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxy(req, params);
}

export async function POST(req: Request, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxy(req, params);
}

export async function PUT(req: Request, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxy(req, params);
}

export async function PATCH(req: Request, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxy(req, params);
}

export async function DELETE(req: Request, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxy(req, params);
}
