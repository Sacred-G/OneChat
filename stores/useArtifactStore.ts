import { create } from "zustand";

export interface Artifact {
  id: string;
  type: "html" | "react" | "code";
  title?: string;
  code: string;
  language?: string;
}

interface ArtifactStore {
  currentArtifact: Artifact | null;
  artifactHistory: Artifact[];
  setCurrentArtifact: (artifact: Artifact | null) => void;
  addArtifact: (artifact: Artifact) => void;
  clearArtifacts: () => void;
}

const useArtifactStore = create<ArtifactStore>((set) => ({
  currentArtifact: null,
  artifactHistory: [],
  setCurrentArtifact: (artifact) => set({ currentArtifact: artifact }),
  addArtifact: (artifact) =>
    set((state) => ({
      currentArtifact: artifact,
      artifactHistory: [...state.artifactHistory, artifact],
    })),
  clearArtifacts: () =>
    set({ currentArtifact: null, artifactHistory: [] }),
}));

export default useArtifactStore;
