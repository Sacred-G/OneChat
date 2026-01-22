import "server-only";

export const dynamic = "force-dynamic";

import { readFile } from "fs/promises";
import path from "path";

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type McpConfigFile = {
  server_label?: unknown;
  server_url?: unknown;
  allowed_tools?: unknown;
  skip_approval?: unknown;
};

export async function GET() {
  const filePath = path.join(process.cwd(), "mcp_config.json");

  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return json(404, { ok: false, error: "mcp_config.json not found" });
  }

  let parsed: McpConfigFile;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return json(400, {
      ok: false,
      error: e instanceof Error ? e.message : "Invalid JSON",
    });
  }

  const server_label = typeof parsed.server_label === "string" ? parsed.server_label : "";
  const server_url = typeof parsed.server_url === "string" ? parsed.server_url : "";

  const allowed_tools = Array.isArray(parsed.allowed_tools)
    ? parsed.allowed_tools.filter((t) => typeof t === "string")
    : typeof parsed.allowed_tools === "string"
      ? parsed.allowed_tools
      : "";

  const skip_approval = typeof parsed.skip_approval === "boolean" ? parsed.skip_approval : false;

  return json(200, {
    ok: true,
    config: {
      server_label,
      server_url,
      allowed_tools,
      skip_approval,
    },
  });
}
