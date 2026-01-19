import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultVectorStore } from "@/config/constants";

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
  server_label: string;
  server_url: string;
  allowed_tools: string;
  skip_approval: boolean;
};

export interface ToolsState {
  webSearchEnabled: boolean;
  fileSearchEnabled: boolean;
  functionsEnabled: boolean;
  codeInterpreterEnabled: boolean;
  vectorStore: VectorStore;
  selectedProjectId?: string;
  webSearchConfig: WebSearchConfig;
  mcpEnabled: boolean;
  mcpConfig: McpConfig;
  googleIntegrationEnabled: boolean;
  geminiImageEnabled: boolean;
  voiceModeEnabled: boolean;
  provider: "openai" | "apipie";
  apipieModel: string;
  apipieImageModel: string;
  apipieFavoriteModels: string[];
  apipieFavoriteImageModels: string[];
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
  mcpConfig: McpConfig;
  setMcpConfig: (config: McpConfig) => void;
  voiceModeEnabled: boolean;
  setVoiceModeEnabled: (enabled: boolean) => void;
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
      mcpConfig: {
        server_label: "",
        server_url: "",
        allowed_tools: "",
        skip_approval: true,
      },
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
      geminiImageEnabled: false,
      setGeminiImageEnabled: (enabled) => {
        set({ geminiImageEnabled: enabled });
      },
      mcpEnabled: false,
      setMcpEnabled: (enabled) => {
        set({ mcpEnabled: enabled });
      },
      codeInterpreterEnabled: false,
      setCodeInterpreterEnabled: (enabled) => {
        set({ codeInterpreterEnabled: enabled });
      },
      setVectorStore: (store) => set({ vectorStore: store }),
      setWebSearchConfig: (config) => set({ webSearchConfig: config }),
      setMcpConfig: (config) => set({ mcpConfig: config }),
      voiceModeEnabled: false,
      setVoiceModeEnabled: (enabled) => {
        set({ voiceModeEnabled: enabled });
      },
    }),
    {
      name: "tools-store",
    }
  )
);

export default useToolsStore;
