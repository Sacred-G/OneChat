"use client";
import React from "react";
import Chat from "./chat";
import useConversationStore from "@/stores/useConversationStore";
import { Item, processMessages } from "@/lib/assistant";
import useToolsStore from "@/stores/useToolsStore";

export default function Assistant() {
  const {
    chatMessages,
    addConversationItem,
    addChatMessage,
    setAssistantLoading,
    setActiveConversationId,
  } = useConversationStore();

  const persistConversation = async () => {
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

      const res = await fetch("/api/conversation", {
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

  const handleSendMessage = async (message: string, imageData?: string) => {
    if (!message.trim() && !imageData) return;

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
        return;
      }

      await processMessages();
    } catch (error) {
      console.error("Error processing message:", error);
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
    }
  };

  return (
    <div className="h-full w-full">
      <Chat
        items={chatMessages}
        onSendMessage={handleSendMessage}
        onApprovalResponse={handleApprovalResponse}
      />
    </div>
  );
}
