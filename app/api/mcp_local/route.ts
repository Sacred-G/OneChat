import "server-only";

export const dynamic = "force-dynamic";

import { mcpClientManager, CommandMcpServerConfig } from "@/lib/mcp/mcp-client-manager";
import { readFile } from "fs/promises";
import path from "path";

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface McpConfigFile {
  mcpServers?: Record<string, any>;
  mcpDisabled?: boolean;
  disabled?: boolean;
}

function normalizeServerId(id: string): string {
  return String(id)
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function resolveConfigByServerId(
  enabledConfigs: CommandMcpServerConfig[],
  serverId: string
): { config: CommandMcpServerConfig | null; error?: string } {
  const exact = enabledConfigs.find((c) => c.id === serverId);
  if (exact) return { config: exact };

  const wanted = normalizeServerId(serverId);
  const candidates = enabledConfigs.filter((c) => normalizeServerId(c.id) === wanted);
  if (candidates.length === 1) return { config: candidates[0] };

  const prefixCandidates = enabledConfigs.filter((c) => {
    const normalized = normalizeServerId(c.id);
    return normalized === wanted || normalized.startsWith(`${wanted}_`);
  });
  if (prefixCandidates.length === 1) return { config: prefixCandidates[0] };
  if (prefixCandidates.length > 1) {
    return {
      config: null,
      error: `Ambiguous server_id '${serverId}'. Matches: ${prefixCandidates.map((c) => c.id).join(", ")}`,
    };
  }

  return { config: null };
}

async function loadCommandServersFromConfig(): Promise<CommandMcpServerConfig[]> {
  if (process.env.DISABLE_MCP_TOOLS === "true") {
    return [];
  }

  const filePath = path.join(process.cwd(), "mcp_config.json");

  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return [];
  }

  let parsed: McpConfigFile;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if ((parsed as any)?.mcpDisabled === true || (parsed as any)?.disabled === true) {
    return [];
  }

  if (!parsed.mcpServers || typeof parsed.mcpServers !== "object") {
    return [];
  }

  const commandServers: CommandMcpServerConfig[] = [];

  for (const [id, server] of Object.entries(parsed.mcpServers)) {
    if (!server || typeof server !== "object") continue;
    
    // Only process command-based servers (those with 'command' field, not 'serverUrl')
    if (typeof server.command !== "string") continue;
    if (server.serverUrl) continue; // Skip HTTP-based servers
    
    commandServers.push({
      id,
      command: server.command,
      args: Array.isArray(server.args) ? server.args : [],
      env: server.env && typeof server.env === "object" ? server.env : undefined,
      disabled: server.disabled === true,
      disabledTools: Array.isArray(server.disabledTools) ? server.disabledTools : undefined,
    });
  }

  return commandServers;
}

// GET /api/mcp_local - List all command-based servers and their tools
export async function GET(request: Request) {
  const url = new URL(request.url);
  const serverId = url.searchParams.get("server_id");

  try {
    const configs = await loadCommandServersFromConfig();
    const enabledConfigs = configs.filter((c) => !c.disabled);

    if (serverId) {
      // Get tools for a specific server
      const resolved = resolveConfigByServerId(enabledConfigs, serverId);
      if (resolved.error) {
        return json(400, { ok: false, error: resolved.error });
      }
      const config = resolved.config;
      if (!config) {
        return json(404, { ok: false, error: `Server ${serverId} not found or disabled` });
      }

      // Connect if not already connected
      const instance = await mcpClientManager.connectServer(config);
      
      return json(200, {
        ok: true,
        server_id: serverId,
        tools: instance.tools,
      });
    }

    // List all available command-based servers
    const servers = enabledConfigs.map((config) => ({
      id: config.id,
      command: config.command,
      args: config.args,
      connected: mcpClientManager.isConnected(config.id),
      tools: mcpClientManager.getServerTools(config.id) || [],
    }));

    return json(200, {
      ok: true,
      servers,
    });
  } catch (e) {
    console.error("[MCP Local] Error:", e);
    return json(500, {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}

// POST /api/mcp_local - Connect to a server or call a tool
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, server_id, tool_name, arguments: toolArgs } = body;

    const configs = await loadCommandServersFromConfig();
    const enabledConfigs = configs.filter((c) => !c.disabled);

    if (action === "connect") {
      // Connect to a specific server
      if (!server_id) {
        return json(400, { ok: false, error: "Missing server_id" });
      }

      const resolved = resolveConfigByServerId(enabledConfigs, server_id);
      if (resolved.error) {
        return json(400, { ok: false, error: resolved.error });
      }
      const config = resolved.config;
      if (!config) {
        return json(404, { ok: false, error: `Server ${server_id} not found or disabled` });
      }

      const instance = await mcpClientManager.connectServer(config);
      
      return json(200, {
        ok: true,
        server_id,
        tools: instance.tools,
      });
    }

    if (action === "connect_all") {
      // Connect to all enabled command-based servers
      const results: Array<{ id: string; success: boolean; tools?: any[]; error?: string }> = [];

      for (const config of enabledConfigs) {
        try {
          const instance = await mcpClientManager.connectServer(config);
          results.push({
            id: config.id,
            success: true,
            tools: instance.tools,
          });
        } catch (e) {
          results.push({
            id: config.id,
            success: false,
            error: e instanceof Error ? e.message : "Connection failed",
          });
        }
      }

      return json(200, {
        ok: true,
        results,
      });
    }

    if (action === "call_tool") {
      // Call a tool on a specific server
      if (!server_id) {
        return json(400, { ok: false, error: "Missing server_id" });
      }
      if (!tool_name) {
        return json(400, { ok: false, error: "Missing tool_name" });
      }

      const resolved = resolveConfigByServerId(enabledConfigs, server_id);
      if (resolved.error) {
        return json(400, { ok: false, error: resolved.error });
      }
      const config = resolved.config;
      if (!config) {
        return json(404, { ok: false, error: `Server ${server_id} not found or disabled` });
      }

      const resolvedServerId = config.id;

      // Ensure server is connected
      if (!mcpClientManager.isConnected(resolvedServerId)) {
        await mcpClientManager.connectServer(config);
      }

      const result = await mcpClientManager.callTool(
        resolvedServerId,
        tool_name,
        toolArgs || {}
      );

      return json(200, {
        ok: true,
        server_id: resolvedServerId,
        tool_name,
        result,
      });
    }

    if (action === "disconnect") {
      if (!server_id) {
        return json(400, { ok: false, error: "Missing server_id" });
      }

      await mcpClientManager.disconnectServer(server_id);
      
      return json(200, {
        ok: true,
        server_id,
        disconnected: true,
      });
    }

    if (action === "disconnect_all") {
      await mcpClientManager.disconnectAll();
      
      return json(200, {
        ok: true,
        disconnected: true,
      });
    }

    if (action === "list_all_tools") {
      // Connect to all servers and return all tools
      for (const config of enabledConfigs) {
        if (!mcpClientManager.isConnected(config.id)) {
          try {
            await mcpClientManager.connectServer(config);
          } catch (e) {
            console.error(`[MCP Local] Failed to connect ${config.id}:`, e);
          }
        }
      }

      const allTools = mcpClientManager.getAllTools();
      
      return json(200, {
        ok: true,
        tools: allTools,
      });
    }

    return json(400, { ok: false, error: `Unknown action: ${action}` });
  } catch (e) {
    console.error("[MCP Local] Error:", e);
    return json(500, {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
