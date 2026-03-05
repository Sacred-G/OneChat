import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CustomAgent {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
  color: string;
  model?: string;
  preferredProvider?: "openai" | "apipie" | "ollama" | "none";
  temperature?: number;
  webSearchEnabled?: boolean;
  codeInterpreterEnabled?: boolean;
  fileSearchEnabled?: boolean;
  vectorStoreId?: string;
  vectorStoreName?: string;
  createdAt: number;
  updatedAt: number;
}

interface AgentState {
  agents: CustomAgent[];
  selectedAgentId: string | null;

  addAgent: (agent: Omit<CustomAgent, "id" | "createdAt" | "updatedAt">) => CustomAgent;
  updateAgent: (id: string, updates: Partial<Omit<CustomAgent, "id" | "createdAt">>) => void;
  deleteAgent: (id: string) => void;
  setSelectedAgentId: (id: string | null) => void;
  getSelectedAgent: () => CustomAgent | null;
}

const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],
      selectedAgentId: null,

      addAgent: (agentData) => {
        const now = Date.now();
        const agent: CustomAgent = {
          ...agentData,
          id: `agent-${now}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ agents: [...state.agents, agent] }));
        return agent;
      },

      updateAgent: (id, updates) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: Date.now() } : a
          ),
        }));
      },

      deleteAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
          selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId,
        }));
      },

      setSelectedAgentId: (id) => set({ selectedAgentId: id }),

      getSelectedAgent: () => {
        const { agents, selectedAgentId } = get();
        if (!selectedAgentId) return null;
        return agents.find((a) => a.id === selectedAgentId) ?? null;
      },
    }),
    {
      name: "agent-store",
      partialize: (state) => ({
        agents: state.agents,
        selectedAgentId: state.selectedAgentId,
      }),
    }
  )
);

export default useAgentStore;
