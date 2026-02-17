import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface CommandMcpServerConfig {
  id: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  disabledTools?: string[];
}

export interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema?: Record<string, any>;
}

export interface McpServerInstance {
  id: string;
  client: Client;
  transport: StdioClientTransport;
  tools: McpToolDefinition[];
  config: CommandMcpServerConfig;
}

class McpClientManager {
  private servers: Map<string, McpServerInstance> = new Map();
  private connecting: Map<string, Promise<McpServerInstance>> = new Map();

  async connectServer(config: CommandMcpServerConfig): Promise<McpServerInstance> {
    if (config.disabled) {
      throw new Error(`Server ${config.id} is disabled`);
    }

    // Return existing connection if available
    const existing = this.servers.get(config.id);
    if (existing) {
      return existing;
    }

    // Return pending connection if one is in progress
    const pending = this.connecting.get(config.id);
    if (pending) {
      return pending;
    }

    // Start new connection
    const connectionPromise = this._doConnect(config);
    this.connecting.set(config.id, connectionPromise);

    try {
      const instance = await connectionPromise;
      this.servers.set(config.id, instance);
      return instance;
    } finally {
      this.connecting.delete(config.id);
    }
  }

  private async _doConnect(config: CommandMcpServerConfig): Promise<McpServerInstance> {
    console.log(`[MCP] Connecting to command-based server: ${config.id}`);
    console.log(`[MCP] Command: ${config.command} ${config.args.join(" ")}`);

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: {
        ...process.env,
        ...config.env,
      } as Record<string, string>,
    });

    const client = new Client(
      {
        name: "openai-responses-app",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);

    // List available tools
    let tools: McpToolDefinition[] = [];
    try {
      const response = await client.listTools();
      tools = (response.tools || []).map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      // Filter out disabled tools
      if (config.disabledTools && config.disabledTools.length > 0) {
        const disabledSet = new Set(config.disabledTools);
        tools = tools.filter((t) => !disabledSet.has(t.name));
      }

      console.log(
        `[MCP] Connected to ${config.id} with tools:`,
        tools.map((t) => t.name)
      );
    } catch (e) {
      console.error(`[MCP] Failed to list tools for ${config.id}:`, e);
    }

    return {
      id: config.id,
      client,
      transport,
      tools,
      config,
    };
  }

  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, any>
  ): Promise<any> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not connected`);
    }

    console.log(`[MCP] Calling tool ${toolName} on server ${serverId}`);

    const result = await server.client.callTool({
      name: toolName,
      arguments: args,
    });

    return result;
  }

  async listTools(serverId: string): Promise<McpToolDefinition[]> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not connected`);
    }
    return server.tools;
  }

  async disconnectServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (server) {
      console.log(`[MCP] Disconnecting server: ${serverId}`);
      try {
        await server.transport.close();
      } catch (e) {
        console.error(`[MCP] Error closing transport for ${serverId}:`, e);
      }
      this.servers.delete(serverId);
    }
  }

  async disconnectAll(): Promise<void> {
    const serverIds = Array.from(this.servers.keys());
    await Promise.all(serverIds.map((id) => this.disconnectServer(id)));
  }

  getConnectedServers(): string[] {
    return Array.from(this.servers.keys());
  }

  isConnected(serverId: string): boolean {
    return this.servers.has(serverId);
  }

  getServerTools(serverId: string): McpToolDefinition[] | null {
    const server = this.servers.get(serverId);
    return server ? server.tools : null;
  }

  getAllTools(): Array<{ serverId: string; tool: McpToolDefinition }> {
    const allTools: Array<{ serverId: string; tool: McpToolDefinition }> = [];
    for (const [serverId, server] of this.servers) {
      for (const tool of server.tools) {
        allTools.push({ serverId, tool });
      }
    }
    return allTools;
  }
}

// Singleton instance
export const mcpClientManager = new McpClientManager();
