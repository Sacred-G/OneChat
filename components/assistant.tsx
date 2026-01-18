"use client";
import React from "react";
import Chat from "./chat";
import useConversationStore from "@/stores/useConversationStore";
import { Item, processMessages } from "@/lib/assistant";

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
