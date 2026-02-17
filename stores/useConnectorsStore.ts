import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ApprovalMode = "always" | "never";

export type ConnectorsConfig = {
  google: {
    enabled: boolean;
    requireApproval: ApprovalMode;
  };
  outlook: {
    enabled: boolean;
    requireApproval: ApprovalMode;
  };
  composio: {
    enabled: boolean;
    requireApproval: ApprovalMode;
  };
};

interface StoreState {
  connectors: ConnectorsConfig;
  composioSelectedToolkits: string[];
  setConnectorEnabled: (key: keyof ConnectorsConfig, enabled: boolean) => void;
  setConnectorApprovalMode: (key: keyof ConnectorsConfig, mode: ApprovalMode) => void;
  setComposioSelectedToolkits: (slugs: string[]) => void;
  addComposioToolkit: (slug: string) => void;
  removeComposioToolkit: (slug: string) => void;
  toggleComposioToolkit: (slug: string) => void;
}

const useConnectorsStore = create<StoreState>()(
  persist(
    (set) => ({
      connectors: {
        google: { enabled: false, requireApproval: "never" },
        outlook: { enabled: false, requireApproval: "never" },
        composio: { enabled: false, requireApproval: "never" },
      },
      composioSelectedToolkits: [],
      setConnectorEnabled: (key, enabled) =>
        set((state) => ({
          connectors: {
            ...state.connectors,
            [key]: { ...state.connectors[key], enabled },
          },
        })),
      setConnectorApprovalMode: (key, mode) =>
        set((state) => ({
          connectors: {
            ...state.connectors,
            [key]: { ...state.connectors[key], requireApproval: mode },
          },
        })),
      setComposioSelectedToolkits: (slugs) =>
        set({ composioSelectedToolkits: slugs }),
      addComposioToolkit: (slug) =>
        set((state) => ({
          composioSelectedToolkits: state.composioSelectedToolkits.includes(slug)
            ? state.composioSelectedToolkits
            : [...state.composioSelectedToolkits, slug],
        })),
      removeComposioToolkit: (slug) =>
        set((state) => ({
          composioSelectedToolkits: state.composioSelectedToolkits.filter(
            (s) => s !== slug
          ),
        })),
      toggleComposioToolkit: (slug) =>
        set((state) => ({
          composioSelectedToolkits: state.composioSelectedToolkits.includes(slug)
            ? state.composioSelectedToolkits.filter((s) => s !== slug)
            : [...state.composioSelectedToolkits, slug],
        })),
    }),
    {
      name: "connectors-store",
      version: 1,
    }
  )
);

export default useConnectorsStore;
