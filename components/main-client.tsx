"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Moon, PanelLeft, Plus, Settings, Star, Sun, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

import Assistant from "@/components/assistant";
import ConversationHistory from "@/components/conversation-history";
import WorkspaceSwitcher from "@/components/workspace-switcher";
import useArtifactStore from "@/stores/useArtifactStore";
import useConversationStore from "@/stores/useConversationStore";
import useThemeStore from "@/stores/useThemeStore";
import useToolsStore from "@/stores/useToolsStore";
import useWorkspaceStore from "@/stores/useWorkspaceStore";
import useAgentStore from "@/stores/useAgentStore";
import { Item } from "@/lib/assistant";
import UserMenu from "@/components/user-menu";

const ToolsPanel = dynamic(() => import("@/components/tools-panel"), { ssr: false });
const ArtifactViewer = dynamic(() => import("@/components/artifact-viewer"), { ssr: false });
const VoiceAgent = dynamic(() => import("@/components/voice-agent"), { ssr: false });
const ImagesLibrary = dynamic(() => import("@/components/images-library"), { ssr: false });
const AppsGallery = dynamic(() => import("@/components/apps-gallery"), { ssr: false });
const TerminalPanel = dynamic(() => import("@/components/terminal-panel"), { ssr: false });

export default function MainClient() {
  const [showTools, setShowTools] = useState(false);
  const [showImagesLibrary, setShowImagesLibrary] = useState(false);
  const [showAppsGallery, setShowAppsGallery] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
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
    trimHistory,
  } = useConversationStore();
  const { currentArtifact, setCurrentArtifact } = useArtifactStore();
  const { theme, toggleTheme } = useThemeStore();
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const splitRatioRef = useRef(0.5);
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
    try {
      const raw = localStorage.getItem("onechat_split_ratio");
      const v = raw ? Number(raw) : NaN;
      if (!Number.isFinite(v)) return;
      setSplitRatio(Math.min(0.75, Math.max(0.25, v)));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    splitRatioRef.current = splitRatio;
  }, [splitRatio]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    hydrateMcpConfigFromFile();
    // Trim history aggressively on startup to prevent freeze
    try {
      trimHistory(100);
    } catch {
      // ignore
    }
  }, [hydrateMcpConfigFromFile, trimHistory]);

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

  const beginResize = (e: React.MouseEvent) => {
    if (typeof window === "undefined") return;
    if (!splitContainerRef.current) return;
    e.preventDefault();

    const el = splitContainerRef.current;
    const rect = el.getBoundingClientRect();

    const onMove = (ev: MouseEvent) => {
      const x = ev.clientX;
      const next = (x - rect.left) / rect.width;
      const clamped = Math.min(0.75, Math.max(0.25, next));
      splitRatioRef.current = clamped;
      setSplitRatio(clamped);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      try {
        localStorage.setItem("onechat_split_ratio", String(splitRatioRef.current));
      } catch {
        // ignore
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

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

  const saveCurrentWorkspaceState = async (wsId: string | null) => {
    if (!wsId) return;
    try {
      const agents = useAgentStore.getState().agents;
      const selectedAgentId = useAgentStore.getState().selectedAgentId;
      const ws = useWorkspaceStore.getState().workspaces.find((w) => w.id === wsId);
      if (!ws) return;
      await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: wsId,
          name: ws.name,
          icon: ws.icon,
          color: ws.color,
          agents,
          selectedAgentId,
          selectedProjectId,
          toolSettings: {
            provider,
            apipieModel,
            apipieImageModel,
          },
        }),
      });
    } catch {
      // ignore
    }
  };

  const loadWorkspaceState = async (wsId: string | null) => {
    if (!wsId) {
      // Switching to default workspace — restore from localStorage defaults
      useAgentStore.getState().setSelectedAgentId(null);
      return;
    }
    try {
      const res = await fetch(`/api/workspaces?id=${encodeURIComponent(wsId)}`);
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      const ws = data?.workspace;
      if (!ws) return;

      // Restore agents
      if (Array.isArray(ws.agents)) {
        useAgentStore.setState({ agents: ws.agents, selectedAgentId: ws.selectedAgentId ?? null });
      }

      // Restore selected project
      if (typeof ws.selectedProjectId === "string") {
        setSelectedProjectId(ws.selectedProjectId);
      }

      // Restore tool settings
      if (ws.toolSettings && typeof ws.toolSettings === "object") {
        if (ws.toolSettings.provider) setProvider(ws.toolSettings.provider);
        if (ws.toolSettings.apipieModel) setApipieModel(ws.toolSettings.apipieModel);
        if (ws.toolSettings.apipieImageModel) setApipieImageModel(ws.toolSettings.apipieImageModel);
      }
    } catch {
      // ignore
    }
  };

  const handleWorkspaceSwitch = async (newWorkspaceId: string | null) => {
    // 1. Save current conversation
    try {
      const { chatMessages, conversationItems, selectedSkill, activeConversationId } =
        useConversationStore.getState();
      const currentWsId = useWorkspaceStore.getState().activeWorkspaceId;

      if (activeConversationId) {
        const firstUserMessage = chatMessages.find(
          (m: any) => m?.type === "message" && m?.role === "user" && m?.content?.[0]?.text
        ) as any;
        const title =
          typeof firstUserMessage?.content?.[0]?.text === "string"
            ? String(firstUserMessage.content[0].text).slice(0, 60)
            : undefined;

        await fetch("/api/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeConversationId,
            title,
            ...(currentWsId ? { workspaceId: currentWsId } : {}),
            state: { chatMessages, conversationItems, selectedSkill },
          }),
        }).catch(() => {});
      }

      // Extract memories from the ending conversation (fire-and-forget)
      const userMsgs = chatMessages.filter(
        (m: any) => m?.type === "message" && m?.role === "user"
      );
      const assistantMsgs = chatMessages.filter(
        (m: any) => m?.type === "message" && m?.role === "assistant"
      );
      if (userMsgs.length > 0 && assistantMsgs.length > 0) {
        const simplifiedMessages = chatMessages
          .filter((m: any) => m?.type === "message" && (m?.role === "user" || m?.role === "assistant"))
          .map((m: any) => ({
            role: m.role,
            content: Array.isArray(m.content)
              ? m.content
                  .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
                  .filter(Boolean)
                  .join("\n")
              : "",
          }))
          .filter((m: any) => m.content.length > 0);

        if (simplifiedMessages.length >= 2) {
          fetch("/api/memories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId: activeConversationId || "",
              messages: simplifiedMessages,
            }),
          }).catch(() => {});
        }
      }

      // 2. Save current workspace state (agents, settings)
      await saveCurrentWorkspaceState(currentWsId);
    } catch {
      // ignore
    }

    // 3. Reset conversation
    setActiveConversationId(null);
    try { localStorage.removeItem("activeConversationId"); } catch {}
    resetConversation();

    // 4. Load new workspace state
    await loadWorkspaceState(newWorkspaceId);
  };

  // Load active workspace state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const wsId = useWorkspaceStore.getState().activeWorkspaceId;
    if (wsId) {
      loadWorkspaceState(wsId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewConversation = () => {
    try {
      const { chatMessages, conversationItems, selectedSkill, activeConversationId } =
        useConversationStore.getState();
      const wsId = useWorkspaceStore.getState().activeWorkspaceId;

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
          ...(wsId ? { workspaceId: wsId } : {}),
          state: {
            chatMessages,
            conversationItems,
            selectedSkill,
          },
        }),
      }).catch(() => {});

      // Extract memories from the ending conversation (fire-and-forget)
      const userMsgs = chatMessages.filter(
        (m: any) => m?.type === "message" && m?.role === "user"
      );
      const assistantMsgs = chatMessages.filter(
        (m: any) => m?.type === "message" && m?.role === "assistant"
      );
      if (userMsgs.length > 0 && assistantMsgs.length > 0) {
        const simplifiedMessages = chatMessages
          .filter((m: any) => m?.type === "message" && (m?.role === "user" || m?.role === "assistant"))
          .map((m: any) => ({
            role: m.role,
            content: Array.isArray(m.content)
              ? m.content
                  .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
                  .filter(Boolean)
                  .join("\n")
              : "",
          }))
          .filter((m: any) => m.content.length > 0);

        if (simplifiedMessages.length >= 2) {
          fetch("/api/memories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId: activeConversationId || "",
              messages: simplifiedMessages,
            }),
          }).catch(() => {});
        }
      }
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
  <div className="flex h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
    <div
      onMouseLeave={() => setSidebarCollapsed(true)}
      className={`hidden shrink-0 md:flex md:flex-col transition-[width] duration-200 ${
        sidebarCollapsed ? "w-0 overflow-hidden" : "w-72"
      } ${theme === "dark" ? "bg-[#141414]" : "bg-[#e8eef2]"}`}
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
              : "bg-[#3b82f6] text-white hover:bg-[#2563eb]"
          }`}
        >
          <Plus size={16} />
          <span className="text-sm font-medium">New chat</span>
        </button>
        <button
          onClick={() => setShowTools(!showTools)}
          className={`p-2 rounded-lg transition-colors ml-2 ${
            theme === "dark" ? "hover:bg-white/5 text-gray-700" : "hover:bg-gray-100 text-gray-600"
          }`}
          title="Settings"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={() => setSidebarCollapsed(true)}
          className={`p-2 rounded-lg transition-colors ml-1 ${
            theme === "dark" ? "hover:bg-white/5 text-gray-800" : "hover:bg-gray-100 text-gray-600"
          }`}
          title="Hide sidebar"
        >
          <X size={16} />
        </button>
      </div>
      <div className={`px-2 py-2 border-b ${theme === "dark" ? "border-white/10" : "border-black/10"}`}>
        <WorkspaceSwitcher onSwitch={handleWorkspaceSwitch} />
      </div>
      <ConversationHistory onNewConversation={handleNewConversation} />
    </div>

    {sidebarCollapsed && (
      <div
        className="hidden md:block fixed left-0 top-0 h-full w-2 z-50"
        onMouseEnter={() => setSidebarCollapsed(false)}
      />
    )}

    <div ref={splitContainerRef} className="flex-1 flex min-h-0 bg-background">
      <div
        className="flex flex-col min-h-0 overflow-hidden transition-all bg-background"
        style={{ flex: currentArtifact ? splitRatio : 1, minWidth: 0 }}
      >
        <div
          className={`shrink-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b ${
            theme === "dark"
              ? "border-white/10 bg-[#0a0a0a]/80"
              : "border-black/10 bg-white/80"
          }`}
        >
          {/* Left: sidebar toggle + title */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className={`hidden md:inline-flex p-2 rounded-lg transition-colors ${
                theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
              }`}
              title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            >
              <PanelLeft size={18} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
            </button>
            <h1 className={`text-sm font-semibold tracking-tight ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              OneChatAI
            </h1>
          </div>

          {/* Center: provider + model selectors */}
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 items-center gap-1">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={`h-8 w-20 max-w-[30vw] rounded-md border px-1 text-xs outline-none sm:w-28 sm:px-2 ${
                  theme === "dark"
                    ? "bg-transparent border-white/10 text-white"
                    : "bg-white border-black/10 text-gray-900"
                }`}
                title="Project"
              >
                <option value="">No project</option>
                {(projects || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleCreateProject}
                className={`h-8 px-1.5 rounded-md border text-xs ${
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
              className={`h-8 w-16 rounded-md border px-1 text-xs outline-none sm:w-24 sm:px-2 sm:text-sm ${
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
                  className={`h-8 max-w-[120px] sm:max-w-[160px] rounded-md border px-1 text-xs outline-none sm:px-2 sm:text-sm ${
                    theme === "dark"
                      ? "bg-transparent border-white/10 text-white"
                      : "bg-white border-black/10 text-gray-900"
                  }`}
                  title="Model"
                  disabled={isLoadingApipieModels || apipieModels.length === 0}
                >
                  {isLoadingApipieModels ? (
                    <option value={apipieModel}>Loading…</option>
                  ) : apipieModels.length === 0 ? (
                    <option value={apipieModel}>No models</option>
                  ) : (
                    <>
                      {favoriteApipieModels.length > 0 && (
                        <optgroup label="Favorites">
                          {favoriteApipieModels.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="All models">
                        {nonFavoriteApipieModels.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </optgroup>
                    </>
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => toggleApipieFavoriteModel(apipieModel)}
                  className={`h-8 w-8 inline-flex items-center justify-center rounded-md border transition-colors ${
                    theme === "dark" ? "border-white/10 hover:bg-white/10" : "border-black/10 hover:bg-black/5"
                  }`}
                  title={(apipieFavoriteModels || []).includes(apipieModel) ? "Unfavorite" : "Favorite"}
                >
                  <Star
                    size={14}
                    fill={(apipieFavoriteModels || []).includes(apipieModel) ? "currentColor" : "none"}
                    className={(apipieFavoriteModels || []).includes(apipieModel) ? "text-yellow-400" : theme === "dark" ? "text-gray-400" : "text-gray-600"}
                  />
                </button>
              </div>
            )}

            {provider === "apipie" && (
              <div className="hidden sm:flex items-center gap-1">
                <select
                  value={apipieImageModel}
                  onChange={(e) => setApipieImageModel(e.target.value)}
                  className={`h-8 max-w-[120px] sm:max-w-[160px] rounded-md border px-1 text-xs outline-none sm:px-2 sm:text-sm ${
                    theme === "dark"
                      ? "bg-transparent border-white/10 text-white"
                      : "bg-white border-black/10 text-gray-900"
                  }`}
                  title="Image model"
                  disabled={isLoadingApipieImageModels || apipieImageModels.length === 0}
                >
                  {isLoadingApipieImageModels ? (
                    <option value={apipieImageModel}>Loading…</option>
                  ) : apipieImageModels.length === 0 ? (
                    <option value={apipieImageModel}>No image models</option>
                  ) : (
                    <>
                      {favoriteApipieImageModels.length > 0 && (
                        <optgroup label="Favorites">
                          {favoriteApipieImageModels.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="All image models">
                        {nonFavoriteApipieImageModels.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </optgroup>
                    </>
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => toggleApipieFavoriteImageModel(apipieImageModel)}
                  className={`h-8 w-8 inline-flex items-center justify-center rounded-md border transition-colors ${
                    theme === "dark" ? "border-white/10 hover:bg-white/10" : "border-black/10 hover:bg-black/5"
                  }`}
                  title={(apipieFavoriteImageModels || []).includes(apipieImageModel) ? "Unfavorite" : "Favorite"}
                >
                  <Star
                    size={14}
                    fill={(apipieFavoriteImageModels || []).includes(apipieImageModel) ? "currentColor" : "none"}
                    className={(apipieFavoriteImageModels || []).includes(apipieImageModel) ? "text-yellow-400" : theme === "dark" ? "text-gray-400" : "text-gray-600"}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Right: settings + more menu + theme */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowTools(true)}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
              }`}
              title="Settings"
            >
              <Settings size={18} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                    theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
                  }`}
                  title="More features"
                >
                  <ChevronDown size={18} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
                </button>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="end" className="w-56 p-1">
                <div className="space-y-1">
                  <div className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                    Media
                  </div>
                  <button onClick={() => setShowImagesLibrary(true)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}>
                    Images Library
                  </button>
                  <button onClick={() => router.push("/imagen")} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}>
                    Imagen
                  </button>
                  <button onClick={() => router.push("/sora-video")} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}>
                    Sora Video
                  </button>
                  <button onClick={() => router.push("/veo-video")} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}>
                    Veo Video
                  </button>
                  <button onClick={() => router.push("/tts-audio")} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}>
                    Text to Speech
                  </button>
                  <button onClick={() => router.push("/nano-banana")} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}>
                    Nano Banana
                  </button>

                  <div className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                    Integrations
                  </div>
                  <button onClick={() => router.push("/email")} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}>
                    Email
                  </button>
                  <button onClick={() => router.push("/calendar")} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}>
                    Calendar
                  </button>
                  <button onClick={() => window.open("/connectors", "_blank")} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}>
                    Connectors
                  </button>

                  <div className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                    Tools
                  </div>
                  <button onClick={() => setShowTerminal(true)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}>
                    Terminal
                  </button>
                  <button onClick={() => setShowAppsGallery(true)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}>
                    Apps Gallery
                  </button>
                  <button onClick={() => window.open("https://viben-peach.vercel.app/", "_blank")} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}>
                    Viben
                  </button>
                  <button onClick={() => window.open("http://sbouldin.com:8443", "_blank")} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}>
                    Sbouldin
                  </button>

                  <div className={`border-t ${theme === "dark" ? "border-white/10" : "border-black/10"}`} />
                  <button
                    onClick={() => { try { resetConversation(); } catch {} }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === "dark" ? "hover:bg-white/10 text-red-400" : "hover:bg-gray-100 text-red-500"}`}
                  >
                    Clear Chat
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            <UserMenu />

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
              }`}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun size={18} className="text-gray-400" /> : <Moon size={18} className="text-gray-600" />}
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 h-full">
          <Assistant
            voiceModeEnabled={voiceModeEnabled}
            showVoiceAgent={showVoiceAgent}
            setShowVoiceAgent={setShowVoiceAgent}
          />
        </div>
      </div>

      {currentArtifact && (
        <>
          <div
            className={`hidden md:block w-1.5 cursor-col-resize ${
              theme === "dark" ? "bg-white/10 hover:bg-white/20" : "bg-black/10 hover:bg-black/20"
            }`}
            onMouseDown={beginResize}
            title="Drag to resize"
          />
          <div
            className={`hidden md:block min-h-0 border-l ${
              theme === "dark" ? "border-white/10" : "border-stone-200"
            }`}
            style={{ flex: 1 - splitRatio, minWidth: 0 }}
          >
            <ArtifactViewer artifact={currentArtifact} onClose={() => setCurrentArtifact(null)} />
          </div>
        </>
      )}
    </div>

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

    {showTerminal && (
      <div className="fixed inset-0 z-50 flex bg-black bg-opacity-30">
        <div
          className={
            "w-full max-w-3xl h-full overflow-hidden border-l ml-auto " +
            (theme === "dark" ? "border-white/10 bg-[#141414]" : "border-stone-200 bg-white")
          }
        >
          <TerminalPanel onClose={() => setShowTerminal(false)} />
        </div>
      </div>
    )}

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
