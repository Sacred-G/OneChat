import "server-only";

export const dynamic = "force-dynamic";

const DEFAULT_AGENT_URL = process.env.LOCAL_AGENT_URL || "http://127.0.0.1:4001";
const TOKEN = process.env.LOCAL_AGENT_TOKEN || "";

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function proxy(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (process.env.NODE_ENV === "production") {
    return json(404, { ok: false, error: "local agent proxy disabled in production" });
  }

  const { path } = await ctx.params;
  const url = new URL(request.url);
  const overrideUrl = request.headers.get("x-local-agent-url") || "";
  const baseUrl = overrideUrl.trim() || DEFAULT_AGENT_URL;
  
  // Check if this is a health check or fs list request and handle gracefully
  const pathStr = (path || []).join("/");
  if (pathStr.includes("health") || pathStr.includes("fs/list")) {
    try {
      // Quick check if the server is running
      const healthCheck = await fetch(`${baseUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      if (!healthCheck.ok) {
        throw new Error("Local agent not healthy");
      }
    } catch (e) {
      return json(503, { 
        ok: false, 
        error: "Local agent server not running",
        details: "Start the local agent server or disable the local agent feature"
      });
    }
  }

  const target = new URL(baseUrl);
  target.pathname = "/" + (path || []).join("/");
  target.search = url.search;

  const headers: Record<string, string> = {};
  if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;

  // forward JSON body as-is
  const init: RequestInit = {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
  };

  if (init.body !== undefined) {
    headers["Content-Type"] = request.headers.get("content-type") || "application/json";
  }

  try {
    const res = await fetch(target.toString(), init);
    const text = await res.text();

    // Attempt to preserve JSON; otherwise wrap
    try {
      const data = text ? JSON.parse(text) : null;
      return json(res.status, data ?? { ok: res.ok });
    } catch {
      return json(res.status, { ok: res.ok, error: text || "Unknown error" });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Proxy failed";
    return json(502, { ok: false, error: msg });
  }
}

export async function GET(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, ctx);
}

export async function POST(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, ctx);
}
