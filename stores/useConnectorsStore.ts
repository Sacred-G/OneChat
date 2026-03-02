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
        set((state) => ({
          composioSelectedToolkits: slugs,
          connectors: {
            ...state.connectors,
            composio: { ...state.connectors.composio, enabled: slugs.length > 0 },
          },
        })),
      addComposioToolkit: (slug) =>
        set((state) => {
          const next = state.composioSelectedToolkits.includes(slug)
            ? state.composioSelectedToolkits
            : [...state.composioSelectedToolkits, slug];
          return {
            composioSelectedToolkits: next,
            connectors: {
              ...state.connectors,
              composio: { ...state.connectors.composio, enabled: next.length > 0 },
            },
          };
        }),
      removeComposioToolkit: (slug) =>
        set((state) => {
          const next = state.composioSelectedToolkits.filter((s) => s !== slug);
          return {
            composioSelectedToolkits: next,
            connectors: {
              ...state.connectors,
              composio: { ...state.connectors.composio, enabled: next.length > 0 },
            },
          };
        }),
      toggleComposioToolkit: (slug) =>
        set((state) => {
          const next = state.composioSelectedToolkits.includes(slug)
            ? state.composioSelectedToolkits.filter((s) => s !== slug)
            : [...state.composioSelectedToolkits, slug];
          return {
            composioSelectedToolkits: next,
            connectors: {
              ...state.connectors,
              composio: { ...state.connectors.composio, enabled: next.length > 0 },
            },
          };
        }),
    }),
    {
      name: "connectors-store",
      version: 1,
    }
  )
);

export default useConnectorsStore;
