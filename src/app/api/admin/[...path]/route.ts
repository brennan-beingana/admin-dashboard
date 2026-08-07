import { backendApiBaseUrl, adminApiPrefix } from "@/lib/config";

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

  const upstreamResponse = await fetch(upstreamUrl, init);
  const text = await upstreamResponse.text();

  return new Response(text, {
    status: upstreamResponse.status,
    headers: {
      "content-type": upstreamResponse.headers.get("content-type") ?? "application/json",
    },
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
