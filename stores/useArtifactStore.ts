import { create } from "zustand";

export interface Artifact {
  id: string;
  type: "html" | "react" | "code" | "ts_app";
  title?: string;
  code: string;
  language?: string;
  revision?: number;
  meta?: Record<string, any>;
}

 export interface UrlArtifact {
  id: string;
  type: "url";
  title?: string;
  url: string;
 }

export interface FileArtifact {
  id: string;
  type: "file";
  title?: string;
  file_id: string;
  container_id?: string;
  filename?: string;
  mime_type: string;
  url: string;
}

export type AnyArtifact = Artifact | UrlArtifact | FileArtifact;

interface ArtifactStore {
  currentArtifact: AnyArtifact | null;
  artifactHistory: AnyArtifact[];
  setCurrentArtifact: (artifact: AnyArtifact | null) => void;
  setArtifacts: (payload: {
    currentArtifact: AnyArtifact | null;
    artifactHistory: AnyArtifact[];
  }) => void;
  addArtifact: (artifact: AnyArtifact) => void;
  upsertArtifact: (
    artifact: AnyArtifact,
    options?: { onlyIfExists?: boolean }
  ) => void;
  clearArtifacts: () => void;
}

const useArtifactStore = create<ArtifactStore>((set) => ({
  currentArtifact: null,
  artifactHistory: [],
  setCurrentArtifact: (artifact) => set({ currentArtifact: artifact }),
  setArtifacts: ({ currentArtifact, artifactHistory }) =>
    set({
      currentArtifact,
      artifactHistory: Array.isArray(artifactHistory) ? artifactHistory : [],
    }),
  addArtifact: (artifact) =>
    set((state) => ({
      currentArtifact: artifact,
      artifactHistory: [...state.artifactHistory, artifact],
    })),
  upsertArtifact: (artifact, options) =>
    set((state) => {
      const onlyIfExists = Boolean(options?.onlyIfExists);
      const currentId = state.currentArtifact?.id;
      const exists =
        state.artifactHistory.some((a) => a.id === artifact.id) ||
        (typeof currentId === "string" && currentId === artifact.id);

      if (onlyIfExists && !exists) {
        return state;
      }

      const nextHistory = (() => {
        const idx = state.artifactHistory.findIndex((a) => a.id === artifact.id);
        if (idx === -1) return [...state.artifactHistory, artifact];
        const copy = [...state.artifactHistory];
        copy[idx] = artifact;
        return copy;
      })();

      const nextCurrent =
        state.currentArtifact && state.currentArtifact.id === artifact.id
          ? artifact
          : state.currentArtifact;

      return {
        currentArtifact: nextCurrent,
        artifactHistory: nextHistory,
      };
    }),
  clearArtifacts: () =>
    set({ currentArtifact: null, artifactHistory: [] }),
}));

export default useArtifactStore;
