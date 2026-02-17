import { functionsMap } from "../../config/functions";

type ToolName = string;

// Map to store MCP tool metadata (server_id -> tool_name -> original_name)
const mcpToolRegistry: Map<string, { serverId: string; toolName: string }> = new Map();

export const registerMcpTool = (wrappedName: string, serverId: string, originalToolName: string) => {
  mcpToolRegistry.set(wrappedName, { serverId, toolName: originalToolName });
};

// Helper to call MCP tools via API (works in both client and server contexts)
const callMcpToolViaApi = async (serverId: string, toolName: string, args: Record<string, any>) => {
  // Determine base URL for API calls
  // - In the browser, a relative URL is correct.
  // - On the server, prefer env-derived host/port to avoid hardcoding localhost:3000.
  const isBrowser = typeof window !== "undefined";
  const port = process.env.PORT || "3000";
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const baseUrl = isBrowser ? "" : (process.env.NEXTAUTH_URL || vercelUrl || `http://localhost:${port}`);

  const url = `${baseUrl}/api/mcp_local`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "call_tool",
      server_id: serverId,
      tool_name: toolName,
      arguments: args,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(
      `MCP tool call failed (status ${resp.status}) url=${url} server_id=${serverId} tool_name=${toolName}: ${errText}`
    );
  }

  let data: any;
  try {
    data = await resp.json();
  } catch {
    const text = await resp.text();
    throw new Error(
      `MCP tool call returned non-JSON response url=${url} server_id=${serverId} tool_name=${toolName}: ${text}`
    );
  }
  if (!data.ok) {
    throw new Error(
      `MCP tool call failed url=${url} server_id=${serverId} tool_name=${toolName}: ${data.error || "Unknown error"}`
    );
  }

  return data.result;
};

function normalizeMcpId(id: string): string {
  return String(id)
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function listMcpLocalServers(): Promise<Array<{ id: string }>> {
  const isBrowser = typeof window !== "undefined";
  const port = process.env.PORT || "3000";
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const baseUrl = isBrowser ? "" : (process.env.NEXTAUTH_URL || vercelUrl || `http://localhost:${port}`);
  const url = `${baseUrl}/api/mcp_local`;

  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) return [];
  const data = await resp.json().catch(() => null);
  if (!data || !data.ok || !Array.isArray(data.servers)) return [];
  return data.servers.filter((s: any) => s && typeof s.id === "string");
}

async function resolveWrappedMcpToolName(
  wrappedName: string
): Promise<{ serverId: string; toolName: string } | null> {
  // Expected: mcp_<normalized_server_id>_<normalized_tool_name>
  const parts = wrappedName.split("_").filter((p) => p.length > 0);
  if (parts.length < 3) return null;
  if (parts[0] !== "mcp") return null;

  const servers = await listMcpLocalServers();
  if (!servers.length) return null;

  const normalizedToActual = new Map<string, string>();
  for (const s of servers) normalizedToActual.set(normalizeMcpId(s.id), s.id);

  const tokens = parts.slice(1); // server + tool tokens
  let best: { serverId: string; toolName: string } | null = null;

  for (let i = 1; i < tokens.length; i++) {
    const serverCandidateNorm = tokens.slice(0, i).join("_");
    const actualServerId = normalizedToActual.get(serverCandidateNorm);
    if (!actualServerId) continue;
    const toolCandidate = tokens.slice(i).join("_");
    if (!toolCandidate) continue;
    best = { serverId: actualServerId, toolName: toolCandidate };
  }

  return best;
}

export const handleTool = async (toolName: ToolName, parameters: any) => {
  console.log("Handle tool", toolName, parameters);
  
  // Check if this is an MCP tool (starts with mcp_)
  if (toolName.startsWith("mcp_")) {
    // Try to find the tool in our registry
    const mcpInfo = mcpToolRegistry.get(toolName);
    
    if (mcpInfo) {
      console.log(`[MCP] Calling registered tool: ${mcpInfo.toolName} on server ${mcpInfo.serverId}`);
      try {
        const result = await callMcpToolViaApi(
          mcpInfo.serverId,
          mcpInfo.toolName,
          parameters
        );
        return result;
      } catch (e) {
        console.error(`[MCP] Tool call failed:`, e);
        throw e;
      }
    }
    
    // Fallback: parse server_id and tool_name from the tool name.
    // Use /api/mcp_local server list to resolve the longest matching server id prefix.
    const resolved = await resolveWrappedMcpToolName(toolName);
    if (resolved) {
      console.log(`[MCP] Calling resolved tool: ${resolved.toolName} on server ${resolved.serverId}`);
      try {
        const result = await callMcpToolViaApi(
          resolved.serverId,
          resolved.toolName,
          parameters
        );
        return result;
      } catch (e) {
        console.error(`[MCP] Tool call failed:`, e);
        throw e;
      }
    }
    
    throw new Error(`Unknown MCP tool: ${toolName}`);
  }
  
  // Handle regular function tools
  if (functionsMap[toolName]) {
    return await functionsMap[toolName](parameters);
  } else {
    throw new Error(`Unknown tool: ${toolName}`);
  }
};
