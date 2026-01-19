"use client";
import React, { useEffect, useState } from "react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import useConversationStore from "@/stores/useConversationStore";
import useThemeStore from "@/stores/useThemeStore";

interface ConversationHistoryProps {
  onNewConversation: () => void;
}

export default function ConversationHistory({ onNewConversation }: ConversationHistoryProps) {
  const {
    chatMessages,
    resetConversation,
    activeConversationId,
    setActiveConversationId,
    setChatMessages,
    setConversationItems,
    setSelectedSkill,
    setAssistantLoading,
  } = useConversationStore();
  const { theme } = useThemeStore();
  const [isClient, setIsClient] = useState(false);
  const [conversations, setConversations] = useState<
    Array<{ id: string; title: string | null; updatedAt?: string; createdAt?: string }>
  >([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    let cancelled = false;
    const loadList = async () => {
      setIsLoadingList(true);
      try {
        const res = await fetch("/api/conversation?list=1");
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data?.conversations) ? data.conversations : [];
        if (!cancelled) {
          setConversations(
            list
              .filter((c: any) => typeof c?.id === "string")
              .map((c: any) => ({
                id: c.id,
                title: typeof c?.title === "string" ? c.title : null,
                updatedAt: c.updatedAt,
                createdAt: c.createdAt,
              }))
          );
        }
      } catch {
        // ignore failures
      } finally {
        if (!cancelled) setIsLoadingList(false);
      }
    };
    loadList();
    return () => {
      cancelled = true;
    };
  }, [isClient, chatMessages.length]);

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear all conversation history?")) {
      try {
        await fetch("/api/conversation", { method: "DELETE" });
        setConversations([]);
        setActiveConversationId(null);
        try {
          localStorage.removeItem("activeConversationId");
        } catch {
          // ignore storage failures
        }
        resetConversation();
      } catch {
        // ignore failures
      }
    }
  };

  const handleSelectConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversation?id=${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
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
      setActiveConversationId(id);
      try {
        localStorage.setItem("activeConversationId", id);
      } catch {
        // ignore storage failures
      }
    } catch {
      // ignore failures
    }
  };

  const getCurrentConversationTitle = () => {
    if (chatMessages.length === 0) return "New Conversation";
    
    // Find first user message to use as title
    const firstUserMessage = chatMessages.find(
      (msg) => msg.type === "message" && msg.role === "user"
    );
    if (firstUserMessage?.type === "message" && firstUserMessage.content?.[0]?.text) {
      const title = firstUserMessage.content[0].text;
      return title.length > 30 ? title.substring(0, 30) + "..." : title;
    }
    
    return "New Conversation";
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {!isClient ? (
        // Loading placeholder to avoid SSR mismatch
        <div className="flex-1 flex items-center justify-center">
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            Loading...
          </div>
        </div>
      ) : (
        <>
          {/* Current conversation */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="py-2">
              <div className="px-3">
                <button
                  onClick={onNewConversation}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    theme === "dark"
                      ? "hover:bg-[#2d2d30] text-gray-100"
                      : "hover:bg-gray-100 text-gray-900"
                  }`}
                >
                  <Plus size={16} className={theme === "dark" ? "text-gray-400" : "text-gray-500"} />
                  <span className="text-sm font-medium">New chat</span>
                </button>
              </div>

              <div className="mt-2 px-3">
                <div className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                  Chats
                </div>

                {isLoadingList ? (
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    Loading...
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((c) => {
                      const isActive = c.id === activeConversationId;
                      return (
                        <button
                          key={c.id}
                          onClick={() => handleSelectConversation(c.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? theme === 'dark'
                                ? 'bg-white/10 text-white'
                                : 'bg-black/5 text-gray-900'
                              : theme === 'dark'
                                ? 'hover:bg-[#2d2d30] text-gray-100'
                                : 'hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <MessageSquare
                                size={16}
                                className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {c.title || (isActive ? getCurrentConversationTitle() : "New Conversation")}
                              </div>
                              <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                {c.id === activeConversationId ? `${chatMessages.length} messages` : c.id}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={handleClearHistory}
                  className={`mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-[#2d2d30] text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Trash2 size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                  <span className="text-sm">Clear all chats</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom section with model info */}
          <div className={`border-t ${theme === 'dark' ? 'border-[#2d2d30]' : 'border-[#e5e5e5]'} p-3`}>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              Custom GPT built by SBouldin
            </div>
          </div>
        </>
      )}
    </div>
  );
}
