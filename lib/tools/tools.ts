import "server-only";

import { toolsList } from "../../config/tools-list";
import { ToolsState, WebSearchConfig } from "@/stores/useToolsStore";
import { getFreshAccessToken } from "@/lib/connectors-auth";
import { getFreshMsAccessToken } from "@/lib/microsoft-auth";
import {
  getGoogleConnectorTools,
  getComposioMetaTools,
  getMicrosoftConnectorTools,
} from "./connectors";
import { mcpClientManager } from "@/lib/mcp/mcp-client-manager";
import { registerMcpTool } from "./tools-handling";

interface WebSearchTool extends WebSearchConfig {
  type: "web_search";
}

 const sanitizeJsonSchema = (schema: any) => {
   if (!schema || typeof schema !== "object") return;
   if (Array.isArray(schema)) {
     for (const item of schema) sanitizeJsonSchema(item);
     return;
   }

   if (schema.type === "array" && schema.items === undefined) {
     schema.items = {};
   }

   for (const key of Object.keys(schema)) {
     sanitizeJsonSchema(schema[key]);
   }
 };

export const getTools = async (toolsState: ToolsState) => {
  const {
    webSearchEnabled,
    fileSearchEnabled,
    functionsEnabled,
    codeInterpreterEnabled,
    videoGenerationEnabled,
    vectorStore,
    webSearchConfig,
    mcpEnabled,
    mcpConfigs,
    commandMcpConfigs,
    connectors,
    googleIntegrationEnabled,
    composioConnectorsEnabled,
    disabledFunctions,
    localAgentEnabled,
  } = toolsState;

  const disabled = Array.isArray(disabledFunctions) ? disabledFunctions : [];

  const mcpGloballyDisabled = process.env.DISABLE_MCP_TOOLS === "true";

  const tools = [];

  if (webSearchEnabled) {
    const webSearchTool: WebSearchTool = {
      type: "web_search",
    };
    if (
      webSearchConfig.user_location &&
      (webSearchConfig.user_location.country !== "" ||
        webSearchConfig.user_location.region !== "" ||
        webSearchConfig.user_location.city !== "")
    ) {
      webSearchTool.user_location = webSearchConfig.user_location;
    }

    tools.push(webSearchTool);
  }

  if (fileSearchEnabled) {
    if (vectorStore?.id) {
      const fileSearchTool = {
        type: "file_search",
        vector_store_ids: [vectorStore.id],
      };
      tools.push(fileSearchTool);
    }
  }

  if (codeInterpreterEnabled) {
    tools.push({ type: "code_interpreter", container: { type: "auto" } });
  }

  if (functionsEnabled) {
    tools.push(
      ...toolsList
        .filter((tool) => {
          // Local agent tools are only available when explicitly enabled.
          if (
            (tool.name === "local_list_dir" ||
              tool.name === "local_read_file" ||
              tool.name === "local_write_file" ||
              tool.name === "local_run_command") &&
            !localAgentEnabled
          ) {
            return false;
          }
          // Only include video generation tool when enabled
          if (tool.name === "generate_video") {
            return videoGenerationEnabled;
          }
          // Skip individually disabled functions
          if (disabled.includes(tool.name)) {
            return false;
          }
          return true;
        })
        .map((tool) => {
          const required = Array.isArray((tool as any).required)
            ? (tool as any).required
            : Object.keys(tool.parameters);
          const strict = typeof (tool as any).strict === "boolean" ? (tool as any).strict : true;
          return {
            type: "function",
            name: tool.name,
            description: tool.description,
            parameters: {
              type: "object",
              properties: { ...tool.parameters },
              required,
              additionalProperties: false,
            },
            strict,
          };
        })
    );
  }

  if (!mcpGloballyDisabled && mcpEnabled && mcpConfigs.length > 0) {
    // Add tools for all enabled MCP servers
    mcpConfigs
      .filter(
        (config) =>
          config.enabled &&
          config.server_url &&
          config.server_label &&
          /^https?:\/\//i.test(config.server_url)
      )
      .forEach(config => {
        console.log('MCP Server Config:', {
          original_label: config.server_label,
          server_url: config.server_url,
          enabled: config.enabled
        });
        
        const mcpTool: any = {
          type: "mcp",
          server_label: config.server_label,
          server_url: config.server_url,
        };

        if (config.headers && typeof config.headers === "object") {
          mcpTool.headers = config.headers;
        }
        
        if (config.skip_approval) {
          mcpTool.require_approval = "never";
        }
        if (config.allowed_tools.trim()) {
          mcpTool.allowed_tools = config.allowed_tools
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
        }
        tools.push(mcpTool);
      });
  }

  // Handle command-based MCP servers
  if (!mcpGloballyDisabled && mcpEnabled && commandMcpConfigs && commandMcpConfigs.length > 0) {
    const enabledCommandServers = commandMcpConfigs.filter((c) => !c.disabled);
    const commandToolsResults = await Promise.allSettled(
      enabledCommandServers.map(async (config) => {
        try {
          console.log(`[MCP] Connecting to command-based server: ${config.id}`);
          const instance = await mcpClientManager.connectServer(config);
          
          const normalizedServerId = config.id.replace(/[^a-zA-Z0-9_]/g, "_");
          const normalizedTools = instance.tools.map((mcpTool) => {
            // Create a unique tool name: mcp_<server_id>_<tool_name>
            const toolName = `mcp_${normalizedServerId}_${mcpTool.name.replace(/[^a-zA-Z0-9_]/g, "_")}`;
            
            // Build parameters from inputSchema
            const inputSchema = mcpTool.inputSchema
              ? JSON.parse(JSON.stringify(mcpTool.inputSchema))
              : {};
            sanitizeJsonSchema(inputSchema);
            const properties = inputSchema.properties || {};
            const required = inputSchema.required || [];
            
            // Add server_id and original tool_name as hidden context
            const wrappedProperties: Record<string, any> = {
              ...properties,
            };
            
            const functionTool = {
              type: "function",
              name: toolName,
              description: `[MCP:${config.id}] ${mcpTool.description || mcpTool.name}`,
              parameters: {
                type: "object",
                properties: wrappedProperties,
                required: required,
                additionalProperties: false,
              },
              strict: false, // MCP tools may have dynamic schemas
              // Store metadata for tool handling
              _mcp_server_id: config.id,
              _mcp_tool_name: mcpTool.name,
            };

            registerMcpTool(toolName, config.id, mcpTool.name);
            return functionTool;
          });
          
          return normalizedTools;
        } catch (e) {
          console.error(`[MCP] Failed to connect to command-based server ${config.id}:`, e);
          return [];
        }
      })
    );

    for (const result of commandToolsResults) {
      if (result.status === "rejected") {
        continue;
      }

      for (const tool of result.value) {
        tools.push(tool);
      }
    }
  }

  const googleEnabled = Boolean(connectors?.google?.enabled ?? googleIntegrationEnabled);
  const outlookEnabled = Boolean(connectors?.outlook?.enabled ?? false);
  const composioEnabled = Boolean(connectors?.composio?.enabled ?? composioConnectorsEnabled);

  const googleApproval = (connectors?.google?.requireApproval ?? "never") as "always" | "never";
  const outlookApproval = (connectors?.outlook?.requireApproval ?? "never") as "always" | "never";
  const composioApproval = (connectors?.composio?.requireApproval ?? "never") as "always" | "never";

  const [googleTools, outlookTools, composioTools] = await Promise.all([
    googleEnabled
      ? (async () => {
          try {
            const { accessToken } = await getFreshAccessToken();
            if (!accessToken) return [];
            return getGoogleConnectorTools(accessToken, googleApproval);
          } catch {
            return [];
          }
        })()
      : Promise.resolve([] as any[]),
    outlookEnabled
      ? (async () => {
          try {
            const { accessToken } = await getFreshMsAccessToken();
            if (!accessToken) return [];
            return getMicrosoftConnectorTools(accessToken, outlookApproval);
          } catch {
            return [];
          }
        })()
      : Promise.resolve([] as any[]),
    composioEnabled
      ? (async () => {
          try {
            const selectedToolkits = (connectors as any)?.composioSelectedToolkits || [];
            return getComposioMetaTools(
              selectedToolkits,
              undefined,
              composioApproval
            );
          } catch {
            return [];
          }
        })()
      : Promise.resolve([] as any[]),
  ]);

  if (googleTools.length > 0) {
    tools.push(...googleTools);
  }
  if (outlookTools.length > 0) {
    tools.push(...outlookTools);
  }
  if (composioTools.length > 0) {
    tools.push(...composioTools);
  }

  return tools;
};
