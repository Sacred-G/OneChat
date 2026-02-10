import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  agents: any[];
  selectedAgentId: string | null;
  selectedProjectId: string;
  toolSettings: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface WorkspaceState {
  activeWorkspaceId: string | null;
  workspaces: Workspace[];
  isLoading: boolean;

  setActiveWorkspaceId: (id: string | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setIsLoading: (loading: boolean) => void;
  getActiveWorkspace: () => Workspace | null;
}

const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      activeWorkspaceId: null,
      workspaces: [],
      isLoading: false,

      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      setIsLoading: (loading) => set({ isLoading: loading }),

      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        if (!activeWorkspaceId) return null;
        return workspaces.find((w) => w.id === activeWorkspaceId) ?? null;
      },
    }),
    {
      name: "workspace-store",
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    }
  )
);

export default useWorkspaceStore;
