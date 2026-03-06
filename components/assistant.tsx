"use client";
import React, { useEffect } from "react";
import Chat from "./chat";
import useConversationStore from "@/stores/useConversationStore";
import {
  FunctionApprovalAction,
  handleFunctionApprovalResponse,
  Item,
  processMessages,
} from "@/lib/assistant";
import useToolsStore from "@/stores/useToolsStore";
import useWorkspaceStore from "@/stores/useWorkspaceStore";
import useArtifactStore from "@/stores/useArtifactStore";

let memoryFetchInFlight: Promise<void> | null = null;
let memorySaveInFlight: Promise<void> | null = null;

interface AssistantProps {
  voiceModeEnabled?: boolean;
  showVoiceAgent?: boolean;
  setShowVoiceAgent?: (show: boolean) => void;
}

export default function Assistant({
  voiceModeEnabled = false,
  showVoiceAgent = false,
  setShowVoiceAgent,
}: AssistantProps = {}) {
  const {
    chatMessages,
    addConversationItem,
    addChatMessage,
    setAssistantLoading,
    setActiveConversationId,
    setMemoryContext,
    setMemoriesFetched,
  } = useConversationStore();
  const externalSendHandlerRef = React.useRef<(message: string, imageData?: string) => Promise<void>>();

  // Fetch user memories from previous conversations and inject into context
  const fetchAndSetMemories = async () => {
    try {
      const res = await fetch("/api/memories?limit=20");
      if (!res.ok) return;
      const data = await res.json();
      const memories = Array.isArray(data?.memories) ? data.memories : [];
      if (memories.length === 0) {
        setMemoriesFetched(true);
        return;
      }

      // Format memories into a context string
      const contextParts = memories.map((m: any, i: number) => {
        const lines: string[] = [];
        if (m.summary) lines.push(`Summary: ${m.summary}`);
        if (Array.isArray(m.keyFacts) && m.keyFacts.length > 0) {
          lines.push(`Key facts: ${m.keyFacts.join("; ")}`);
        }
        if (m.createdAt) {
          const d = new Date(m.createdAt);
          lines.push(`From: ${d.toLocaleDateString()}`);
        }
        return `[Memory ${i + 1}]\n${lines.join("\n")}`;
      });

      const contextString = contextParts.join("\n\n");
      setMemoryContext(contextString);
      setMemoriesFetched(true);
    } catch (err) {
      console.error("Failed to fetch memories:", err);
      setMemoriesFetched(true);
    }
  };

  // Extract memories from the current conversation and save them
  const extractAndSaveMemories = async () => {
    try {
      const { chatMessages, activeConversationId } =
        useConversationStore.getState();

      // Only extract if there are meaningful messages (at least 1 user + 1 assistant)
      const userMessages = chatMessages.filter(
        (m: any) => m?.type === "message" && m?.role === "user"
      );
      const assistantMessages = chatMessages.filter(
        (m: any) => m?.type === "message" && m?.role === "assistant"
      );
      if (userMessages.length === 0 || assistantMessages.length === 0) return;

      // Build simplified messages array for the extraction API
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

      if (simplifiedMessages.length < 2) return;

      await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId || "",
          messages: simplifiedMessages,
        }),
      });
    } catch (err) {
      console.error("Failed to extract memories:", err);
    }
  };

  const scheduleMemoryExtraction = () => {
    if (memorySaveInFlight) return;
    const next = extractAndSaveMemories()
      .catch(() => {
        // Ignore extraction failures so response timing stays fast.
      })
      .finally(() => {
        if (memorySaveInFlight === next) {
          memorySaveInFlight = null;
        }
      });
    memorySaveInFlight = next;
    void memorySaveInFlight;
  };

  const persistConversation = async () => {
    try {
      const { chatMessages, conversationItems, selectedSkill, activeConversationId } =
        useConversationStore.getState();
      const { currentArtifact, artifactHistory } = useArtifactStore.getState();

      const firstUserMessage = chatMessages.find(
        (m: any) => m?.type === "message" && m?.role === "user" && m?.content?.[0]?.text
      ) as any;
      const title =
        typeof firstUserMessage?.content?.[0]?.text === "string"
          ? String(firstUserMessage.content[0].text).slice(0, 60)
          : undefined;

      const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeConversationId,
          title,
          ...(workspaceId ? { workspaceId } : {}),
          state: {
            chatMessages,
            conversationItems,
            selectedSkill,
            currentArtifact,
            artifactHistory,
          },
        }),
      });

      const data = await res.json().catch(() => null);
      const returnedId = typeof data?.id === "string" ? data.id : null;
      if (!activeConversationId && returnedId) {
        setActiveConversationId(returnedId);
        try {
          localStorage.setItem("activeConversationId", returnedId);
        } catch {
          // ignore storage failures
        }
      }
    } catch {
      // ignore save failures
    }
  };

  const handleFunctionApproval = async (
    action: FunctionApprovalAction,
    id: string
  ) => {
    try {
      await handleFunctionApprovalResponse(action, id);
      await persistConversation();
    } catch (error) {
      console.error("Error sending function approval response:", error);
    }
  };

  const handleSendMessage = async (message: string, imageData?: string) => {
    if (!message.trim() && !imageData) return;

    // Fetch memories on the first user message of a new conversation
    const { memoriesFetched } = useConversationStore.getState();
    if (!memoriesFetched) {
      if (!memoryFetchInFlight) {
        memoryFetchInFlight = fetchAndSetMemories()
          .catch(() => {
            // Ignore memory fetch failures so message send stays fast.
          })
          .finally(() => {
            memoryFetchInFlight = null;
          });
      }
      void memoryFetchInFlight;
    }

    // Trim history to keep the UI lightweight and avoid browser slowdowns
    try {
      useConversationStore.getState().trimHistory(200);
    } catch {
      // ignore
    }

    const content: any[] = [{ type: "input_text", text: message.trim() }];

    // Add image if provided
    if (imageData) {
      content.push({
        type: "input_image",
        image: imageData,
        detail: "high"
      });
    }

    const userItem: Item = {
      type: "message",
      role: "user",
      content,
    };

    try {
      setAssistantLoading(true);
      addConversationItem(userItem); // Send the full item with image content
      addChatMessage(userItem);
      await persistConversation();

      const { provider, apipieImageModel } = useToolsStore.getState();
      const trimmed = message.trim();

      if (provider === "apipie" && trimmed.startsWith("/bgremove")) {
        const prompt = trimmed.replace(/^\/bgremove\s*/i, "").trim() || "Remove the background. Output a transparent PNG.";

        const directImage = typeof imageData === "string" && imageData ? imageData : null;
        const lastImageFromHistory = (() => {
          try {
            const { chatMessages } = useConversationStore.getState();
            for (let i = chatMessages.length - 1; i >= 0; i--) {
              const m: any = chatMessages[i];
              if (m?.type !== "message" || m?.role !== "user" || !Array.isArray(m?.content)) continue;
              const img = m.content.find((c: any) => c?.type === "input_image" && typeof c?.image === "string");
              if (img?.image) return img.image as string;
            }
          } catch {
            // ignore
          }
          return null;
        })();

        const image = directImage || lastImageFromHistory;
        if (!image) {
          const assistantItem: Item = {
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: "Please upload an image, then send /bgremove." } as any],
          };
          addConversationItem(assistantItem);
          addChatMessage(assistantItem);
          setAssistantLoading(false);
          await persistConversation();
          scheduleMemoryExtraction();
          return;
        }

        const res = await fetch("/api/apipie/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            model: "remove-background",
            image,
            response_format: "url",
          }),
        });

        const data = await res.json().catch(() => null);
        const url = typeof data?.url === "string" ? data.url : null;
        const dataUrl = typeof data?.dataUrl === "string" ? data.dataUrl : null;
        const errorMessage = typeof data?.error === "string" ? data.error : null;

        const out = url || dataUrl;
        const assistantText = out
          ? `![background removed](${out})`
          : errorMessage || "Background removal failed.";

        const assistantItem: Item = {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: assistantText } as any],
        };

        addConversationItem(assistantItem);
        addChatMessage(assistantItem);
        setAssistantLoading(false);
        await persistConversation();
        scheduleMemoryExtraction();
        return;
      }

      if (provider === "apipie" && trimmed.startsWith("/image")) {
        const prompt = trimmed.replace(/^\/image\s*/i, "").trim();
        if (!prompt) {
        const assistantItem: Item = {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "Please provide a prompt after /image." } as any],
        };
        addConversationItem(assistantItem);
        addChatMessage(assistantItem);
        setAssistantLoading(false);
        await persistConversation();
        scheduleMemoryExtraction();
        return;
      }

        const value = apipieImageModel || "dall-e-3";
        const [maybeProvider, maybeModel] = value.includes("::")
          ? value.split("::")
          : ["", value];
        const providerParam = maybeProvider && maybeModel ? maybeProvider : undefined;
        const modelParam = maybeProvider && maybeModel ? maybeModel : value;

        const res = await fetch("/api/apipie/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            model: modelParam,
            ...(providerParam ? { provider: providerParam } : {}),
          }),
        });

        const data = await res.json().catch(() => null);
        const url = typeof data?.url === "string" ? data.url : null;
        const errorMessage = typeof data?.error === "string" ? data.error : null;

        const assistantText = url
          ? `![generated image](${url})`
          : errorMessage || "Image generation failed.";

        const assistantItem: Item = {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: assistantText } as any],
        };

        addConversationItem(assistantItem);
        addChatMessage(assistantItem);
        setAssistantLoading(false);
        await persistConversation();
        scheduleMemoryExtraction();
        return;
      }

      await processMessages();
      scheduleMemoryExtraction();
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Something went wrong while processing your message. Please try again.";
      const assistantItem: Item = {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: errorMessage } as any],
      };
      addConversationItem(assistantItem);
      addChatMessage(assistantItem);
      setAssistantLoading(false);
      await persistConversation();
    }
  };

  const handleApprovalResponse = async (
    approve: boolean,
    id: string
  ) => {
    const approvalItem = {
      type: "mcp_approval_response",
      approve,
      approval_request_id: id,
    } as any;
    try {
      addConversationItem(approvalItem);
      await persistConversation();
      await processMessages();
    } catch (error) {
      console.error("Error sending approval response:", error);
      setAssistantLoading(false);
    }
  };
  externalSendHandlerRef.current = handleSendMessage;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onExternalSend = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string; imageData?: string }>;
      const message = typeof customEvent.detail?.message === "string" ? customEvent.detail.message : "";
      const imageData = typeof customEvent.detail?.imageData === "string" ? customEvent.detail.imageData : undefined;
      if (!message.trim() && !imageData) return;
      void externalSendHandlerRef.current?.(message, imageData);
    };

    window.addEventListener("onechat-send-message", onExternalSend as EventListener);
    return () => {
      window.removeEventListener("onechat-send-message", onExternalSend as EventListener);
    };
  }, []);

  return (
    <div className="h-full w-full">
      <Chat
        items={chatMessages}
        onSendMessage={handleSendMessage}
        onApprovalResponse={handleApprovalResponse}
        onFunctionApprovalResponse={handleFunctionApproval}
        voiceModeEnabled={voiceModeEnabled}
        showVoiceAgent={showVoiceAgent}
        setShowVoiceAgent={setShowVoiceAgent}
      />
    </div>
  );
}
