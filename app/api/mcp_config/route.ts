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

type McpConfigFile = any;

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

  // Return the config as-is - the frontend will handle both single and array formats
  return json(200, {
    ok: true,
    config: parsed,
  });
}
