"use client";
import Assistant from "@/components/assistant";
import ToolsPanel from "@/components/tools-panel";
import ArtifactViewer from "@/components/artifact-viewer";
import VoiceAgent from "@/components/voice-agent";
import ConversationHistory from "@/components/conversation-history";
import { X, Settings, Sun, Moon, Mic, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useConversationStore from "@/stores/useConversationStore";
import { Item } from "@/lib/assistant";
import useArtifactStore from "@/stores/useArtifactStore";
import useThemeStore from "@/stores/useThemeStore";
import useToolsStore from "@/stores/useToolsStore";

export default function Main() {
  const [showTools, setShowTools] = useState(false);
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
  const { voiceModeEnabled } = useToolsStore();
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);

  // After OAuth redirect, reinitialize the conversation so the next turn
  // uses the connector-enabled server configuration immediately
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
  }, [setAssistantLoading, setChatMessages, setConversationItems, setSelectedSkill]);

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
    <div className={`flex h-screen w-full ${theme === "dark" ? "bg-[#0b0f19]" : "bg-white"}`}>
      {/* Left sidebar - ChatGPT style */}
      <div
        className={`hidden w-72 shrink-0 md:flex md:flex-col ${
          theme === "dark" ? "bg-[#171717]" : "bg-[#f7f7f8]"
        }`}
      >
        <div
          className={`flex items-center justify-between px-3 py-3 border-b ${
            theme === "dark" ? "border-white/10" : "border-black/10"
          }`}
        >
          <button
            onClick={handleNewConversation}
            className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-[#10a37f] hover:bg-[#0e9070] text-white' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
          >
            <Plus size={16} />
            <span className="text-sm font-medium">New chat</span>
          </button>
          <button
            onClick={() => setShowTools(!showTools)}
            className={`p-2 rounded-lg transition-colors ml-2 ${
              theme === 'dark' 
                ? 'hover:bg-[#2d2d30] text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
        <ConversationHistory onNewConversation={handleNewConversation} />
      </div>

      {/* Main chat area */}
      <div
        className={`flex-1 flex flex-col ${
          currentArtifact ? "md:w-1/2" : "w-full"
        } transition-all ${theme === "dark" ? "bg-[#0b0f19]" : "bg-white"}`}
      >
        <div
          className={`sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b backdrop-blur ${
            theme === "dark"
              ? "border-white/10 bg-[#0b0f19]/80"
              : "border-black/10 bg-white/80"
          }`}
        >
          <h1
            className={`text-sm font-semibold tracking-tight ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            ChatGPT
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTools(true)}
              className={`p-2 rounded-lg transition-colors md:hidden ${
                theme === "dark" ? "hover:bg-[#2d2d30]" : "hover:bg-gray-100"
              }`}
              title="Settings"
            >
              <Settings size={20} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
            </button>
            {voiceModeEnabled && (
              <button
                onClick={() => setShowVoiceAgent(!showVoiceAgent)}
                className={`p-2 rounded-lg transition-colors ${showVoiceAgent ? 'bg-green-500 hover:bg-green-600' : theme === 'dark' ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'}`}
                title="Voice Mode"
              >
                <Mic size={20} className={showVoiceAgent ? 'text-white' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            )}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'}`}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <Sun size={20} className="text-gray-400" />
              ) : (
                <Moon size={20} className="text-gray-600" />
              )}
            </button>
          </div>
        </div>
        <Assistant />
      </div>

      {/* Artifact viewer - shows when artifact is present */}
      {currentArtifact && (
        <div className={`hidden md:block md:w-1/2 border-l ${theme === 'dark' ? 'border-stone-700' : 'border-stone-200'}`}>
          <ArtifactViewer
            artifact={currentArtifact}
            onClose={() => setCurrentArtifact(null)}
          />
        </div>
      )}

      {/* Tools panel - desktop (overlay on left sidebar) */}
      {showTools && !currentArtifact && (
        <div className={`hidden md:block w-[350px] border-r overflow-y-auto absolute left-0 top-0 h-full z-40 ${theme === 'dark' ? 'border-stone-700 bg-[#212121]' : 'border-stone-200 bg-white'}`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>Settings</h2>
              <button
                onClick={() => setShowTools(false)}
                className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-stone-700' : 'hover:bg-stone-100'}`}
              >
                <X size={20} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
              </button>
            </div>
            <ToolsPanel />
          </div>
        </div>
      )}

      {/* Mobile tools panel (overlay from left) */}
      {showTools && (
        <div className="fixed inset-0 z-50 flex bg-black bg-opacity-30 md:hidden">
          <div className={`w-full max-w-md h-full overflow-y-auto ${theme === 'dark' ? 'bg-[#212121]' : 'bg-white'}`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>Settings</h2>
                <button
                  onClick={() => setShowTools(false)}
                  className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-stone-700' : 'hover:bg-stone-100'}`}
                >
                  <X size={24} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
                </button>
              </div>
              <ToolsPanel />
            </div>
          </div>
        </div>
      )}

      {/* Mobile artifact viewer */}
      {currentArtifact && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <ArtifactViewer
            artifact={currentArtifact}
            onClose={() => setCurrentArtifact(null)}
          />
        </div>
      )}

      {/* Voice Agent panel - inline side panel */}
      {showVoiceAgent && voiceModeEnabled && (
        <div className={`hidden md:block w-[400px] border-l ${theme === 'dark' ? 'border-stone-700' : 'border-stone-200'}`}>
          <VoiceAgent 
            onClose={() => setShowVoiceAgent(false)} 
            onTranscript={(item: Item) => addChatMessage(item)}
          />
        </div>
      )}

      {/* Voice Agent mobile - bottom sheet style */}
      {showVoiceAgent && voiceModeEnabled && (
        <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
          <div className={`h-[50vh] rounded-t-xl shadow-2xl ${theme === 'dark' ? 'bg-[#212121]' : 'bg-white'}`}>
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
