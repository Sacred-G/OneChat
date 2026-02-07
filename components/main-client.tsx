"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AudioLines, Film, Images, ImagePlus, LayoutGrid, Mic, Moon, PanelLeft, Plus, Settings, Star, Sun, X } from "lucide-react";

import Assistant from "@/components/assistant";
import ConversationHistory from "@/components/conversation-history";
import useArtifactStore from "@/stores/useArtifactStore";
import useConversationStore from "@/stores/useConversationStore";
import useThemeStore from "@/stores/useThemeStore";
import useToolsStore from "@/stores/useToolsStore";
import { Item } from "@/lib/assistant";

const ToolsPanel = dynamic(() => import("@/components/tools-panel"), { ssr: false });
const ArtifactViewer = dynamic(() => import("@/components/artifact-viewer"), { ssr: false });
const VoiceAgent = dynamic(() => import("@/components/voice-agent"), { ssr: false });
const ImagesLibrary = dynamic(() => import("@/components/images-library"), { ssr: false });
const AppsGallery = dynamic(() => import("@/components/apps-gallery"), { ssr: false });

export default function MainClient() {
  const [showTools, setShowTools] = useState(false);
  const [showImagesLibrary, setShowImagesLibrary] = useState(false);
  const [showAppsGallery, setShowAppsGallery] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const {
    resetConversation,
    addChatMessage,
    setChatMessages,
    setConversationItems,
    setSelectedSkill,
    setAssistantLoading,
    setActiveConversationId,
  } = useConversationStore();
  const { currentArtifact, setCurrentArtifact } = useArtifactStore();
  const { theme, toggleTheme } = useThemeStore();
  const {
    voiceModeEnabled,
    selectedProjectId,
    setSelectedProjectId,
    setVectorStore,
    hydrateMcpConfigFromFile,
    provider,
    setProvider,
    apipieModel,
    setApipieModel,
    apipieImageModel,
    setApipieImageModel,
    apipieFavoriteModels,
    toggleApipieFavoriteModel,
    apipieFavoriteImageModels,
    toggleApipieFavoriteImageModel,
  } = useToolsStore();
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);
  const [apipieModels, setApipieModels] = useState<string[]>([]);
  const [isLoadingApipieModels, setIsLoadingApipieModels] = useState(false);
  const [apipieImageModels, setApipieImageModels] = useState<string[]>([]);
  const [isLoadingApipieImageModels, setIsLoadingApipieImageModels] = useState(false);
  const [projects, setProjects] = useState<
    Array<{ id: string; name: string; vectorStoreId?: string; vectorStoreName?: string }>
  >([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    hydrateMcpConfigFromFile();
  }, [hydrateMcpConfigFromFile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingProjects(true);
      try {
        const res = await fetch("/api/projects?list=1");
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data?.projects) ? data.projects : [];
        if (!cancelled) {
          setProjects(
            list
              .filter((p: any) => typeof p?.id === "string" && typeof p?.name === "string")
              .map((p: any) => ({
                id: String(p.id),
                name: String(p.name),
                vectorStoreId: typeof p?.vectorStoreId === "string" ? p.vectorStoreId : "",
                vectorStoreName: typeof p?.vectorStoreName === "string" ? p.vectorStoreName : "",
              }))
          );
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsLoadingProjects(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!selectedProjectId) {
      setVectorStore({ id: "", name: "" } as any);
      return;
    }
    let cancelled = false;
    fetch(`/api/projects?id=${encodeURIComponent(selectedProjectId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const p = d?.project;
        const vsId = typeof p?.vectorStoreId === "string" ? p.vectorStoreId : "";
        const vsName = typeof p?.vectorStoreName === "string" ? p.vectorStoreName : "";
        if (vsId) {
          setVectorStore({ id: vsId, name: vsName || "Project store" } as any);
        } else {
          setVectorStore({ id: "", name: "" } as any);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, setVectorStore]);

  const handleCreateProject = async () => {
    if (typeof window === "undefined") return;
    const name = window.prompt("Project name?");
    if (!name || !name.trim()) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      const id = typeof data?.id === "string" ? data.id : "";
      const listRes = await fetch("/api/projects?list=1");
      if (listRes.ok) {
        const listData = await listRes.json().catch(() => null);
        const list = Array.isArray(listData?.projects) ? listData.projects : [];
        setProjects(
          list
            .filter((p: any) => typeof p?.id === "string" && typeof p?.name === "string")
            .map((p: any) => ({
              id: String(p.id),
              name: String(p.name),
              vectorStoreId: typeof p?.vectorStoreId === "string" ? p.vectorStoreId : "",
              vectorStoreName: typeof p?.vectorStoreName === "string" ? p.vectorStoreName : "",
            }))
        );
      }
      if (id) setSelectedProjectId(id);
    } catch {
      // ignore
    }
  };

  const favoriteApipieModels = (() => {
    const fav = new Set(apipieFavoriteModels || []);
    return (apipieModels || []).filter((m) => fav.has(m));
  })();

  const nonFavoriteApipieModels = (() => {
    const fav = new Set(apipieFavoriteModels || []);
    return (apipieModels || []).filter((m) => !fav.has(m));
  })();

  const favoriteApipieImageModels = (() => {
    const fav = new Set(apipieFavoriteImageModels || []);
    return (apipieImageModels || []).filter((m) => fav.has(m));
  })();

  const nonFavoriteApipieImageModels = (() => {
    const fav = new Set(apipieFavoriteImageModels || []);
    return (apipieImageModels || []).filter((m) => !fav.has(m));
  })();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isConnected = new URLSearchParams(window.location.search).get("connected");
    if (isConnected === "1") {
      resetConversation();
      router.replace("/", { scroll: false });
    }
  }, [router, resetConversation]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isConnected = new URLSearchParams(window.location.search).get("connected");
    if (isConnected === "1") return;

    const load = async () => {
      try {
        let id: string | null = null;
        try {
          id = localStorage.getItem("activeConversationId");
        } catch {
          // ignore storage failures
        }

        if (id && id.trim().length > 0) {
          setActiveConversationId(id);
        }

        const res = await fetch(
          id && id.trim().length > 0
            ? `/api/conversation?id=${encodeURIComponent(id)}`
            : "/api/conversation"
        );
        if (!res.ok) return;
        const data = await res.json();
        const state = data?.state;
        if (!state) return;

        if (Array.isArray(state.chatMessages)) {
          setChatMessages(state.chatMessages);
        }
        if (Array.isArray(state.conversationItems)) {
          setConversationItems(state.conversationItems);
        }
        if (typeof state.selectedSkill === "string" || state.selectedSkill === null) {
          setSelectedSkill(state.selectedSkill);
        }
        setAssistantLoading(false);
      } catch {
        // ignore load failures
      }
    };

    load();
  }, [setAssistantLoading, setChatMessages, setConversationItems, setSelectedSkill, setActiveConversationId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (provider !== "apipie") return;

    let cancelled = false;
    const loadModels = async () => {
      setIsLoadingApipieModels(true);
      try {
        const res = await fetch("/api/apipie/models?type=llm&enabled=1");
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data?.data) ? data.data : [];

        const models = Array.from(
          new Set(
            list
              .map((m: any) => {
                const model =
                  typeof m?.model === "string"
                    ? m.model
                    : typeof m?.id === "string"
                      ? m.id
                      : typeof m?.name === "string"
                        ? m.name
                        : "";
                const provider = typeof m?.provider === "string" ? m.provider : "";
                if (provider && model) return `${provider}::${model}`;
                return model;
              })
              .filter((x: any) => typeof x === "string" && x.trim().length > 0)
          )
        ) as string[];

        if (!cancelled) {
          setApipieModels(models);
          if (models.length > 0 && (!apipieModel || !models.includes(apipieModel))) {
            setApipieModel(models[0]);
          }
        }
      } catch {
        // ignore failures
      } finally {
        if (!cancelled) setIsLoadingApipieModels(false);
      }
    };

    loadModels();
    return () => {
      cancelled = true;
    };
  }, [provider, apipieModel, setApipieModel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (provider !== "apipie") return;

    let cancelled = false;
    const loadImageModels = async () => {
      setIsLoadingApipieImageModels(true);
      try {
        const res = await fetch("/api/apipie/models?type=image&enabled=1");
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data?.data) ? data.data : [];

        const models = Array.from(
          new Set(
            list
              .map((m: any) =>
                typeof m?.model === "string"
                  ? m.model
                  : typeof m?.id === "string"
                    ? m.id
                    : typeof m?.name === "string"
                      ? m.name
                      : null
              )
              .filter((x: any) => typeof x === "string" && x.trim().length > 0)
          )
        ) as string[];

        if (!cancelled) {
          setApipieImageModels(models);
          if (models.length > 0 && (!apipieImageModel || !models.includes(apipieImageModel))) {
            setApipieImageModel(models[0]);
          }
        }
      } catch {
        // ignore failures
      } finally {
        if (!cancelled) setIsLoadingApipieImageModels(false);
      }
    };

    loadImageModels();
    return () => {
      cancelled = true;
    };
  }, [provider, apipieImageModel, setApipieImageModel]);

  const handleNewConversation = () => {
    try {
      const { chatMessages, conversationItems, selectedSkill, activeConversationId } =
        useConversationStore.getState();

      const firstUserMessage = chatMessages.find(
        (m: any) => m?.type === "message" && m?.role === "user" && m?.content?.[0]?.text
      ) as any;
      const title =
        typeof firstUserMessage?.content?.[0]?.text === "string"
          ? String(firstUserMessage.content[0].text).slice(0, 60)
          : undefined;

      fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeConversationId,
          title,
          state: {
            chatMessages,
            conversationItems,
            selectedSkill,
          },
        }),
      }).catch(() => {});
    } catch {
      // ignore save failures
    }

    setActiveConversationId(null);
    try {
      localStorage.removeItem("activeConversationId");
    } catch {
      // ignore storage failures
    }
    resetConversation();
    setShowTools(false);
  };

  return (
  <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
    <div
      onMouseLeave={() => setSidebarCollapsed(true)}
      className={`hidden shrink-0 md:flex md:flex-col transition-[width] duration-200 ${
        sidebarCollapsed ? "w-0 overflow-hidden" : "w-72"
      } ${theme === "dark" ? "bg-[#141414]" : "bg-[#f7f7f8]"}`}
    >
      <div
        className={`flex items-center justify-between px-3 py-3 border-b ${
          theme === "dark" ? "border-white/10" : "border-black/10"
        }`}
      >
        <button
          onClick={handleNewConversation}
          className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            theme === "dark"
              ? "bg-[#10a37f] hover:bg-[#0e9070] text-white"
              : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
          }`}
        >
          <Plus size={16} />
          <span className="text-sm font-medium">New chat</span>
        </button>
        <button
          onClick={() => setShowTools(!showTools)}
          className={`p-2 rounded-lg transition-colors ml-2 ${
            theme === "dark" ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600"
          }`}
          title="Settings"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={() => setSidebarCollapsed(true)}
          className={`p-2 rounded-lg transition-colors ml-1 ${
            theme === "dark" ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600"
          }`}
          title="Hide sidebar"
        >
          <X size={16} />
        </button>
      </div>
      <ConversationHistory onNewConversation={handleNewConversation} />
    </div>

    {sidebarCollapsed && (
      <div
        className="hidden md:block fixed left-0 top-0 h-full w-2 z-50"
        onMouseEnter={() => setSidebarCollapsed(false)}
      />
    )}

    <div
      className={`flex-1 flex flex-col min-h-0 ${currentArtifact ? "md:w-1/2" : "w-full"} transition-all bg-background`}
    >
      <div
        className={`sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b ${
          theme === "dark" ? "border-white/10 bg-background" : "border-black/10 bg-background"
        }`}
      >
        <h1
          className={`text-sm font-semibold tracking-tight ${theme === "dark" ? "text-white" : "text-gray-900"}`}
        >
          OneChatAI
        </h1>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            className={`hidden md:inline-flex p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            <PanelLeft size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={() => setShowImagesLibrary(true)}
            className={`hidden md:inline-flex p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="Images"
          >
            <Images size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={() => setShowAppsGallery(true)}
            className={`hidden md:inline-flex p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="Gallery"
          >
            <LayoutGrid size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={() => router.push("/veo-video")}
            className={`hidden md:inline-flex p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="Veo video"
          >
            <Film size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={() => router.push("/tts-audio")}
            className={`hidden md:inline-flex p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="TTS audio"
          >
            <AudioLines size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={() => router.push("/imagen")}
            className={`hidden md:inline-flex p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="Imagen"
          >
            <ImagePlus size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={() => router.push("/nano-banana")}
            className={`hidden md:inline-flex p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="Nano Banana"
          >
            <Images size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={() => setShowTools(true)}
            className={`hidden md:inline-flex p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="Settings"
          >
            <Settings size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <div className="flex min-w-0 items-center gap-1">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={`h-9 w-20 max-w-[35vw] rounded-md border px-1 text-xs outline-none sm:w-32 sm:max-w-[45vw] sm:px-2 sm:text-sm ${
                theme === "dark"
                  ? "bg-transparent border-white/10 text-white"
                  : "bg-white border-black/10 text-gray-900"
              }`}
              title="Project"
            >
              <option value="">No project</option>
              {(projects || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCreateProject}
              className={`h-9 px-2 rounded-md border text-sm ${
                theme === "dark"
                  ? "bg-transparent border-white/10 text-white hover:bg-white/5"
                  : "bg-white border-black/10 text-gray-900 hover:bg-gray-50"
              }`}
              title="Create project"
              disabled={isLoadingProjects}
            >
              +
            </button>
          </div>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
            className={`h-9 w-16 rounded-md border px-1 text-xs outline-none sm:w-24 sm:px-2 sm:text-sm ${
              theme === "dark"
                ? "bg-transparent border-white/10 text-white"
                : "bg-white border-black/10 text-gray-900"
            }`}
            title="Provider"
          >
            <option value="openai">OpenAI</option>
            <option value="apipie">apipie.ai</option>
          </select>

          {provider === "apipie" && (
            <div className="flex items-center gap-1">
              <select
                value={apipieModel}
                onChange={(e) => setApipieModel(e.target.value)}
                className={`h-9 max-w-[120px] sm:max-w-[160px] rounded-md border px-1 text-xs outline-none sm:px-2 sm:text-sm ${
                  theme === "dark"
                    ? "bg-transparent border-white/10 text-white"
                    : "bg-white border-black/10 text-gray-900"
                }`}
                title="Model"
                disabled={isLoadingApipieModels || apipieModels.length === 0}
              >
                {isLoadingApipieModels ? (
                  <option value={apipieModel}>Loading models…</option>
                ) : apipieModels.length === 0 ? (
                  <option value={apipieModel}>No models</option>
                ) : (
                  <>
                    {favoriteApipieModels.length > 0 && (
                      <optgroup label="Favorites">
                        {favoriteApipieModels.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="All models">
                      {nonFavoriteApipieModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}
              </select>
              <button
                type="button"
                onClick={() => toggleApipieFavoriteModel(apipieModel)}
                className={`h-9 w-9 inline-flex items-center justify-center rounded-md border transition-colors ${
                  theme === "dark" ? "border-white/10 hover:bg-white/10" : "border-black/10 hover:bg-black/5"
                }`}
                title={(apipieFavoriteModels || []).includes(apipieModel) ? "Unfavorite" : "Favorite"}
              >
                <Star
                  size={16}
                  fill={(apipieFavoriteModels || []).includes(apipieModel) ? "currentColor" : "none"}
                  className={
                    (apipieFavoriteModels || []).includes(apipieModel)
                      ? "text-yellow-400"
                      : theme === "dark"
                        ? "text-gray-400"
                        : "text-gray-600"
                  }
                />
              </button>
            </div>
          )}

          {provider === "apipie" && (
            <div className="flex items-center gap-1">
              <select
                value={apipieImageModel}
                onChange={(e) => setApipieImageModel(e.target.value)}
                className={`h-9 max-w-[120px] sm:max-w-[160px] rounded-md border px-1 text-xs outline-none sm:px-2 sm:text-sm ${
                  theme === "dark"
                    ? "bg-transparent border-white/10 text-white"
                    : "bg-white border-black/10 text-gray-900"
                }`}
                title="Image model"
                disabled={isLoadingApipieImageModels || apipieImageModels.length === 0}
              >
                {isLoadingApipieImageModels ? (
                  <option value={apipieImageModel}>Loading image models…</option>
                ) : apipieImageModels.length === 0 ? (
                  <option value={apipieImageModel}>No image models</option>
                ) : (
                  <>
                    {favoriteApipieImageModels.length > 0 && (
                      <optgroup label="Favorites">
                        {favoriteApipieImageModels.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="All image models">
                      {nonFavoriteApipieImageModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}
              </select>
              <button
                type="button"
                onClick={() => toggleApipieFavoriteImageModel(apipieImageModel)}
                className={`h-9 w-9 inline-flex items-center justify-center rounded-md border transition-colors ${
                  theme === "dark" ? "border-white/10 hover:bg-white/10" : "border-black/10 hover:bg-black/5"
                }`}
                title={(apipieFavoriteImageModels || []).includes(apipieImageModel) ? "Unfavorite" : "Favorite"}
              >
                <Star
                  size={16}
                  fill={(apipieFavoriteImageModels || []).includes(apipieImageModel) ? "currentColor" : "none"}
                  className={
                    (apipieFavoriteImageModels || []).includes(apipieImageModel)
                      ? "text-yellow-400"
                      : theme === "dark"
                        ? "text-gray-400"
                        : "text-gray-600"
                  }
                />
              </button>
            </div>
          )}
          <button
            onClick={() => setShowTools(true)}
            className={`p-2 rounded-lg transition-colors md:hidden ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="Settings"
          >
            <Settings size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={() => setShowImagesLibrary(true)}
            className={`p-2 rounded-lg transition-colors md:hidden ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="Images"
          >
            <Images size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={() => setShowAppsGallery(true)}
            className={`p-2 rounded-lg transition-colors md:hidden ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="Gallery"
          >
            <LayoutGrid size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={() => router.push("/veo-video")}
            className={`p-2 rounded-lg transition-colors md:hidden ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="Veo video"
          >
            <Film size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={() => router.push("/tts-audio")}
            className={`p-2 rounded-lg transition-colors md:hidden ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="TTS audio"
          >
            <AudioLines size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={() => router.push("/imagen")}
            className={`p-2 rounded-lg transition-colors md:hidden ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="Imagen"
          >
            <ImagePlus size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={() => router.push("/nano-banana")}
            className={`p-2 rounded-lg transition-colors md:hidden ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title="Nano Banana"
          >
            <Images size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
            }`}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun size={20} className="text-gray-400" /> : <Moon size={20} className="text-gray-600" />}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Assistant
          voiceModeEnabled={voiceModeEnabled}
          showVoiceAgent={showVoiceAgent}
          setShowVoiceAgent={setShowVoiceAgent}
        />
      </div>
    </div>

    {currentArtifact && (
      <div
        className={`hidden md:block md:w-1/2 border-l ${
          theme === "dark" ? "border-white/10" : "border-stone-200"
        }`}
      >
        <ArtifactViewer artifact={currentArtifact} onClose={() => setCurrentArtifact(null)} />
      </div>
    )}

    {showTools && !currentArtifact && (
      <div
        className={`hidden md:block w-[350px] border-r overflow-y-auto absolute left-0 top-0 h-full z-40 ${
          theme === "dark" ? "border-white/10 bg-[#141414]" : "border-stone-200 bg-white"
        }`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-stone-900"}`}>
              Settings
            </h2>
            <button
              onClick={() => setShowTools(false)}
              className={`p-1 rounded transition-colors ${
                theme === "dark" ? "hover:bg-white/10" : "hover:bg-stone-100"
              }`}
            >
              <X size={20} className={theme === "dark" ? "text-stone-400" : "text-stone-600"} />
            </button>
          </div>
          <ToolsPanel />
        </div>
      </div>
    )}

    {showImagesLibrary && (
      <div className="fixed inset-0 z-50 flex bg-black bg-opacity-30">
        <div
          className={
            "w-full max-w-3xl h-full overflow-y-auto border-l ml-auto " +
            (theme === "dark" ? "border-white/10 bg-[#141414]" : "border-stone-200 bg-white")
          }
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-stone-900"}`}
              >
                Images
              </h2>
              <button
                onClick={() => setShowImagesLibrary(false)}
                className={`p-1 rounded transition-colors ${
                  theme === "dark" ? "hover:bg-white/10" : "hover:bg-stone-100"
                }`}
              >
                <X size={20} className={theme === "dark" ? "text-stone-400" : "text-stone-600"} />
              </button>
            </div>
            <ImagesLibrary />
          </div>
        </div>
      </div>
    )}

    {showAppsGallery && <AppsGallery onClose={() => setShowAppsGallery(false)} />}

    {showTools && (
      <div className="fixed inset-0 z-50 flex bg-black bg-opacity-30 md:hidden">
        <div className={`w-full max-w-md h-full overflow-y-auto ${theme === "dark" ? "bg-[#141414]" : "bg-white"}`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-stone-900"}`}>
                Settings
              </h2>
              <button
                onClick={() => setShowTools(false)}
                className={`p-1 rounded transition-colors ${
                  theme === "dark" ? "hover:bg-white/10" : "hover:bg-stone-100"
                }`}
              >
                <X size={24} className={theme === "dark" ? "text-stone-400" : "text-stone-600"} />
              </button>
            </div>
            <ToolsPanel />
          </div>
        </div>
      </div>
    )}

    {currentArtifact && (
      <div className="fixed inset-0 z-50 bg-white md:hidden">
        <ArtifactViewer artifact={currentArtifact} onClose={() => setCurrentArtifact(null)} />
      </div>
    )}

      {showVoiceAgent && voiceModeEnabled && (
        <div className={`hidden md:block w-[400px] border-l ${theme === "dark" ? "border-stone-700" : "border-stone-200"}`}>
          <VoiceAgent
            onClose={() => setShowVoiceAgent(false)}
            onTranscript={(item: Item) => addChatMessage(item)}
          />
        </div>
      )}

      {showVoiceAgent && voiceModeEnabled && (
        <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
          <div className={`h-[50vh] rounded-t-xl shadow-2xl ${theme === "dark" ? "bg-[#212121]" : "bg-white"}`}>
            <VoiceAgent
              onClose={() => setShowVoiceAgent(false)}
              onTranscript={(item: Item) => addChatMessage(item)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
