import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultVectorStore } from "@/config/constants";
import { toolsList } from "@/config/tools-list";
import type { ConnectorsConfig } from "@/stores/useConnectorsStore";

type File = {
  id: string;
  name: string;
  content: string;
};

type VectorStore = {
  id: string;
  name: string;
  files?: File[];
};

export type WebSearchConfig = {
  user_location?: {
    type: "approximate";
    country?: string;
    city?: string;
    region?: string;
  };
};

export type McpConfig = {
  id: string; // Unique identifier for each server
  server_label: string;
  server_url: string;
  headers?: Record<string, string>;
  allowed_tools: string;
  skip_approval: boolean;
  enabled: boolean; // Enable/disable individual servers
};

export type CommandMcpConfig = {
  id: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled: boolean;
  disabledTools?: string[];
};

export type VoiceOption = "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse";

export interface ToolsState {
  webSearchEnabled: boolean;
  fileSearchEnabled: boolean;
  functionsEnabled: boolean;
  codeInterpreterEnabled: boolean;
  vectorStore: VectorStore;
  selectedProjectId?: string;
  webSearchConfig: WebSearchConfig;
  mcpEnabled: boolean;
  mcpConfigs: McpConfig[];
  commandMcpConfigs: CommandMcpConfig[];
  localAgentEnabled: boolean;
  localAgentUrl: string;
  localAgentCwd: string;
  approvedFunctionTools: string[];
  connectors?: ConnectorsConfig;
  googleIntegrationEnabled: boolean;
  linkedinIntegrationEnabled: boolean;
  geminiImageEnabled: boolean;
  voiceModeEnabled: boolean;
  selectedVoice: VoiceOption;
  videoGenerationEnabled: boolean;
  disabledFunctions: string[];
  provider: "openai" | "apipie";
  apipieModel: string;
  apipieImageModel: string;
  apipieFavoriteModels: string[];
  apipieFavoriteImageModels: string[];
  composioConnectorsEnabled: boolean;
}

interface StoreState {
  fileSearchEnabled: boolean;
  previousFileSearchEnabled: boolean;
  setFileSearchEnabled: (enabled: boolean) => void;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
  functionsEnabled: boolean;
  previousFunctionsEnabled: boolean;
  setFunctionsEnabled: (enabled: boolean) => void;
  googleIntegrationEnabled: boolean;
  setGoogleIntegrationEnabled: (enabled: boolean) => void;
  linkedinIntegrationEnabled: boolean;
  setLinkedinIntegrationEnabled: (enabled: boolean) => void;
  geminiImageEnabled: boolean;
  setGeminiImageEnabled: (enabled: boolean) => void;
  codeInterpreterEnabled: boolean;
  setCodeInterpreterEnabled: (enabled: boolean) => void;
  vectorStore: VectorStore | null;
  setVectorStore: (store: VectorStore) => void;
  selectedProjectId: string;
  setSelectedProjectId: (projectId: string) => void;
  webSearchConfig: WebSearchConfig;
  setWebSearchConfig: (config: WebSearchConfig) => void;
  mcpEnabled: boolean;
  setMcpEnabled: (enabled: boolean) => void;
  mcpConfigs: McpConfig[];
  setMcpConfigs: (configs: McpConfig[]) => void;
  addMcpConfig: (config: Omit<McpConfig, 'id'>) => void;
  updateMcpConfig: (id: string, config: Partial<McpConfig>) => void;
  removeMcpConfig: (id: string) => void;
  toggleMcpConfig: (id: string) => void;
  hydrateMcpConfigFromFile: () => Promise<void>;
  commandMcpConfigs: CommandMcpConfig[];
  setCommandMcpConfigs: (configs: CommandMcpConfig[]) => void;
  toggleCommandMcpConfig: (id: string) => void;
  disableAllCommandMcpConfigs: () => void;
  enableAllCommandMcpConfigs: () => void;
  voiceModeEnabled: boolean;
  setVoiceModeEnabled: (enabled: boolean) => void;
  selectedVoice: VoiceOption;
  setSelectedVoice: (voice: VoiceOption) => void;
  videoGenerationEnabled: boolean;
  setVideoGenerationEnabled: (enabled: boolean) => void;
  localAgentEnabled: boolean;
  setLocalAgentEnabled: (enabled: boolean) => void;
  localAgentUrl: string;
  setLocalAgentUrl: (url: string) => void;
  localAgentCwd: string;
  setLocalAgentCwd: (cwd: string) => void;
  approvedFunctionTools: string[];
  approveFunctionTool: (name: string) => void;
  provider: "openai" | "apipie";
  setProvider: (provider: "openai" | "apipie") => void;
  apipieModel: string;
  setApipieModel: (model: string) => void;
  apipieImageModel: string;
  setApipieImageModel: (model: string) => void;
  apipieFavoriteModels: string[];
  toggleApipieFavoriteModel: (model: string) => void;
  apipieFavoriteImageModels: string[];
  toggleApipieFavoriteImageModel: (model: string) => void;
  disabledFunctions: string[];
  toggleFunction: (name: string) => void;
  enableAllFunctions: () => void;
  disableAllFunctions: () => void;
  composioConnectorsEnabled: boolean;
  setComposioConnectorsEnabled: (enabled: boolean) => void;
}

const useToolsStore = create<StoreState>()(
  persist(
    (set) => ({
      vectorStore: defaultVectorStore.id !== "" ? defaultVectorStore : null,
      selectedProjectId: "",
      setSelectedProjectId: (projectId) => set({ selectedProjectId: projectId }),
      webSearchConfig: {
        user_location: {
          type: "approximate",
          country: "",
          city: "",
          region: "",
        },
      },
      mcpConfigs: [],
      commandMcpConfigs: [],
      setCommandMcpConfigs: (configs) => set({ commandMcpConfigs: configs }),
      toggleCommandMcpConfig: (id) => set((state) => ({
        commandMcpConfigs: state.commandMcpConfigs.map(config =>
          config.id === id ? { ...config, disabled: !config.disabled } : config
        )
      })),
      disableAllCommandMcpConfigs: () => set((state) => ({
        commandMcpConfigs: state.commandMcpConfigs.map(config => ({ ...config, disabled: true }))
      })),
      enableAllCommandMcpConfigs: () => set((state) => ({
        commandMcpConfigs: state.commandMcpConfigs.map(config => ({ ...config, disabled: false }))
      })),
      provider: "openai",
      setProvider: (provider) => {
        set({ provider });
      },
      apipieModel: "gpt-3.5-turbo",
      setApipieModel: (model) => {
        set({ apipieModel: model });
      },
      apipieImageModel: "dall-e-3",
      setApipieImageModel: (model) => {
        set({ apipieImageModel: model });
      },
      apipieFavoriteModels: [],
      toggleApipieFavoriteModel: (model) => {
        set((state) => {
          const next = new Set(state.apipieFavoriteModels || []);
          if (next.has(model)) next.delete(model);
          else next.add(model);
          return { apipieFavoriteModels: Array.from(next) };
        });
      },
      apipieFavoriteImageModels: [],
      toggleApipieFavoriteImageModel: (model) => {
        set((state) => {
          const next = new Set(state.apipieFavoriteImageModels || []);
          if (next.has(model)) next.delete(model);
          else next.add(model);
          return { apipieFavoriteImageModels: Array.from(next) };
        });
      },
      fileSearchEnabled: false,
      previousFileSearchEnabled: false,
      setFileSearchEnabled: (enabled) => {
        set({ fileSearchEnabled: enabled });
      },
      webSearchEnabled: false,
      setWebSearchEnabled: (enabled) => {
        set({ webSearchEnabled: enabled });
      },
      functionsEnabled: true,
      previousFunctionsEnabled: true,
      setFunctionsEnabled: (enabled) => {
        set({ functionsEnabled: enabled });
      },
      googleIntegrationEnabled: false,
      setGoogleIntegrationEnabled: (enabled) => {
        set({ googleIntegrationEnabled: enabled });
      },
      linkedinIntegrationEnabled: false,
      setLinkedinIntegrationEnabled: (enabled) => {
        set({ linkedinIntegrationEnabled: enabled });
      },
      geminiImageEnabled: false,
      setGeminiImageEnabled: (enabled) => {
        set({ geminiImageEnabled: enabled });
      },
      mcpEnabled: false,
      setMcpEnabled: (enabled) => {
        set({ mcpEnabled: enabled });
      },
      hydrateMcpConfigFromFile: async () => {
        try {
          if (process.env.DISABLE_MCP_TOOLS === "true") {
            set({ mcpConfigs: [], commandMcpConfigs: [], mcpEnabled: false });
            return;
          }

          const res = await fetch("/api/mcp_config");
          const data = await res.json().catch(() => null);
          if (!res.ok) return;
          const cfg = data?.config;
          if (!cfg || typeof cfg !== "object") return;

          if ((cfg as any).mcpDisabled === true || (cfg as any).disabled === true) {
            set({ mcpConfigs: [], commandMcpConfigs: [], mcpEnabled: false });
            return;
          }
          
          let configs: any[] = [];
          
          // Handle mcpServers object format (your format)
          if (cfg.mcpServers && typeof cfg.mcpServers === "object") {
            configs = Object.entries(cfg.mcpServers)
              .filter(([key, server]: [string, any]) => {
                if (!server || typeof server !== "object") return false;
                if (server.disabled === true) return false;
                
                if (!server.serverUrl) return false;
                if (typeof server.serverUrl !== "string") return false;
                const url = server.serverUrl.trim();
                if (!url) return false;
                return /^https?:\/\//i.test(url);
              })
              .map(([key, server]: [string, any]) => {
                // Sanitize server label to meet MCP requirements
                const sanitizedLabel = key
                  .toLowerCase()
                  .replace(/[^a-z0-9\-_]/g, '-')
                  .replace(/^-+|-+$/g, '')
                  .replace(/-+/g, '-')
                  .replace(/^[^a-z]/, 'mcp-');
                
                console.log('MCP Sanitization:', {
                  original_key: key,
                  sanitized_label: sanitizedLabel,
                  server_url: server.serverUrl || server.command
                });
                
                return {
                  id: key,
                  server_label: sanitizedLabel,
                  server_url: server.serverUrl,
                  headers:
                    server.headers && typeof server.headers === "object" ? server.headers : undefined,
                  allowed_tools: server.disabledTools ? server.disabledTools.join(",") : "",
                  skip_approval: true, // Auto-approve for command-based servers
                  enabled: !server.disabled,
                };
              });
          }
          // Handle array format (my original format)
          else if (Array.isArray(cfg)) {
            configs = cfg.filter(c => 
              c && typeof c === "object" && 
              typeof c.server_label === "string" && 
              typeof c.server_url === "string"
            ).map(c => ({
              ...c,
              id: c.id || crypto.randomUUID(),
              enabled: c.enabled !== false,
              skip_approval: c.skip_approval !== false,
            }));
          } 
          // Handle single server format (legacy)
          else if (typeof cfg === "object" && cfg.server_label) {
            const server_label = typeof cfg.server_label === "string" ? cfg.server_label : "";
            const server_url = typeof cfg.server_url === "string" ? cfg.server_url : "";
            const allowed_tools = typeof cfg.allowed_tools === "string" ? cfg.allowed_tools : "";
            const skip_approval = typeof cfg.skip_approval === "boolean" ? cfg.skip_approval : false;
            if (!server_label || !server_url) return;
            configs = [{
              id: crypto.randomUUID(),
              server_label,
              server_url,
              allowed_tools,
              skip_approval,
              enabled: true,
            }];
          }
          
          // Also parse command-based servers
          let commandConfigs: any[] = [];
          if (cfg.mcpServers && typeof cfg.mcpServers === "object") {
            commandConfigs = Object.entries(cfg.mcpServers)
              .filter(([key, server]: [string, any]) => {
                if (!server || typeof server !== "object") return false;
                // Only include command-based servers (those with 'command' field, not 'serverUrl')
                if (typeof server.command !== "string") return false;
                if (server.serverUrl) return false; // Skip HTTP-based servers
                return true;
              })
              .map(([key, server]: [string, any]) => ({
                id: key,
                command: server.command,
                args: Array.isArray(server.args) ? server.args : [],
                env: server.env && typeof server.env === "object" ? server.env : undefined,
                disabled: server.disabled === true,
                disabledTools: Array.isArray(server.disabledTools) ? server.disabledTools : undefined,
              }));
          }
          
          set({ mcpConfigs: configs, commandMcpConfigs: commandConfigs });
        } catch {
          // ignore
        }
      },
      setMcpConfigs: (configs) => set({ mcpConfigs: configs }),
      addMcpConfig: (config) => set((state) => ({
        mcpConfigs: [...state.mcpConfigs, { ...config, id: crypto.randomUUID(), enabled: true }]
      })),
      updateMcpConfig: (id, updates) => set((state) => ({
        mcpConfigs: state.mcpConfigs.map(config => 
          config.id === id ? { ...config, ...updates } : config
        )
      })),
      removeMcpConfig: (id) => set((state) => ({
        mcpConfigs: state.mcpConfigs.filter(config => config.id !== id)
      })),
      toggleMcpConfig: (id) => set((state) => ({
        mcpConfigs: state.mcpConfigs.map(config => 
          config.id === id ? { ...config, enabled: !config.enabled } : config
        )
      })),
      localAgentEnabled: false,
      setLocalAgentEnabled: (enabled) => {
        set({ localAgentEnabled: enabled });
      },
      localAgentUrl: "http://127.0.0.1:4001",
      setLocalAgentUrl: (url) => {
        set({ localAgentUrl: url });
      },
      localAgentCwd: "/",
      setLocalAgentCwd: (cwd) => {
        set({ localAgentCwd: cwd });
      },
      approvedFunctionTools: [],
      approveFunctionTool: (name) => {
        const tool = typeof name === "string" ? name.trim() : "";
        if (!tool) return;
        set((state) => {
          const current = Array.isArray(state.approvedFunctionTools)
            ? state.approvedFunctionTools
            : [];
          if (current.includes(tool)) return state;
          return { approvedFunctionTools: [...current, tool] };
        });
      },
      codeInterpreterEnabled: false,
      setCodeInterpreterEnabled: (enabled) => {
        set({ codeInterpreterEnabled: enabled });
      },
      setVectorStore: (store) => set({ vectorStore: store }),
      setWebSearchConfig: (config) => set({ webSearchConfig: config }),
      voiceModeEnabled: false,
      setVoiceModeEnabled: (enabled) => {
        set({ voiceModeEnabled: enabled });
      },
      selectedVoice: "shimmer",
      setSelectedVoice: (voice) => {
        set({ selectedVoice: voice });
      },
      videoGenerationEnabled: false,
      setVideoGenerationEnabled: (enabled) => {
        set({ videoGenerationEnabled: enabled });
      },
      disabledFunctions: [],
      toggleFunction: (name) => {
        const fn = typeof name === "string" ? name.trim() : "";
        if (!fn) return;
        set((state) => {
          const current = Array.isArray(state.disabledFunctions) ? state.disabledFunctions : [];
          if (current.includes(fn)) {
            return { disabledFunctions: current.filter((n) => n !== fn) };
          }
          return { disabledFunctions: [...current, fn] };
        });
      },
      enableAllFunctions: () => set({ disabledFunctions: [] }),
      disableAllFunctions: () => {
        set({ disabledFunctions: toolsList.map((t) => t.name) });
      },
      composioConnectorsEnabled: false,
      setComposioConnectorsEnabled: (enabled) => {
        set({ composioConnectorsEnabled: enabled });
      },
    }),
    {
      name: "tools-store",
      onRehydrateStorage: () => (state) => {
        // Always start with MCP disabled — user must opt in each session
        if (state) {
          state.mcpEnabled = false;
        }
      },
    }
  )
);

export default useToolsStore;
