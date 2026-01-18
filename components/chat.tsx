"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import ToolCall from "./tool-call";
import Message from "./message";
import Annotations from "./annotations";
import McpToolsList from "./mcp-tools-list";
import McpApproval from "./mcp-approval";
import { Item, McpApprovalRequestItem } from "@/lib/assistant";
import LoadingMessage from "./loading-message";
import useConversationStore from "@/stores/useConversationStore";
import useThemeStore from "@/stores/useThemeStore";
import ScreenCapture from "./screen-capture";

interface ChatProps {
  items: Item[];
  onSendMessage: (message: string, imageData?: string) => void;
  onApprovalResponse: (approve: boolean, id: string) => void;
}

const Chat: React.FC<ChatProps> = ({
  items,
  onSendMessage,
  onApprovalResponse,
}) => {
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const [inputMessageText, setinputMessageText] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [availableSkills, setAvailableSkills] = useState<
    Array<{ name: string; description: string }>
  >([]);
  // This state is used to provide better user experience for non-English IMEs such as Japanese
  const [isComposing, setIsComposing] = useState(false);
  const { isAssistantLoading, selectedSkill, setSelectedSkill } = useConversationStore();
  const { theme } = useThemeStore();

  const handleScreenCapture = (imageData: string) => {
    setCapturedImage(imageData);
    // Optionally auto-send or let user add context
    if (!inputMessageText) {
      setinputMessageText("What do you see in this screenshot?");
    }
  };

  const handleSendWithImage = useCallback(() => {
    if (capturedImage) {
      // Send message with full image data
      onSendMessage(inputMessageText, capturedImage);
      setinputMessageText("");
      setCapturedImage(null);
    } else {
      onSendMessage(inputMessageText);
      setinputMessageText("");
    }
  }, [capturedImage, inputMessageText, onSendMessage]);

  const scrollToBottom = () => {
    itemsEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey && !isComposing) {
        event.preventDefault();
        handleSendWithImage();
      }
    },
    [handleSendWithImage, isComposing]
  );

  useEffect(() => {
    scrollToBottom();
  }, [items]);

  useEffect(() => {
    fetch("/api/skills/list")
      .then((r) => r.json())
      .then((d) => {
        const skills = Array.isArray(d?.skills) ? d.skills : [];
        setAvailableSkills(
          skills
            .filter((s: any) => typeof s?.name === "string")
            .map((s: any) => ({
              name: s.name,
              description: typeof s?.description === "string" ? s.description : "",
            }))
        );
      })
      .catch(() => setAvailableSkills([]));
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4">
          <div className="py-8 space-y-6">
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {item.type === "tool_call" ? (
                  <ToolCall toolCall={item} />
                ) : item.type === "message" ? (
                  <div className="flex flex-col gap-2">
                    <Message message={item} />
                    {item.content &&
                      item.content[0].annotations &&
                      item.content[0].annotations.length > 0 && (
                        <Annotations
                          annotations={item.content[0].annotations}
                        />
                      )}
                  </div>
                ) : item.type === "mcp_list_tools" ? (
                  <McpToolsList item={item} />
                ) : item.type === "mcp_approval_request" ? (
                  <McpApproval
                    item={item as McpApprovalRequestItem}
                    onRespond={onApprovalResponse}
                  />
                ) : null}
              </React.Fragment>
            ))}
            {isAssistantLoading && <LoadingMessage />}
            <div ref={itemsEndRef} />
          </div>
        </div>
      </div>

      {/* Input area */}
      <div
        className={`sticky bottom-0 border-t ${
          theme === "dark"
            ? "border-white/10 bg-[#0b0f19]/90"
            : "border-black/10 bg-white/90"
        } backdrop-blur`}
      >
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          {/* Screen capture preview */}
          {capturedImage && (
            <div className="mb-3 relative">
              <div className="relative h-48 w-full">
                <Image
                  src={capturedImage}
                  alt="Screen capture"
                  fill
                  sizes="100vw"
                  unoptimized
                  className="rounded-lg border border-gray-300 object-contain"
                />
              </div>
              <button
                onClick={() => setCapturedImage(null)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          )}
          
          <div
            className={`flex w-full flex-col gap-1.5 rounded-[26px] p-1.5 transition-colors border shadow-sm focus-within:shadow-md ${
              theme === "dark"
                ? "bg-[#1a1f2e] border-white/10 focus-within:border-white/20"
                : "bg-white border-black/10 focus-within:border-black/20"
            }`}
          >
            {/* Screen capture button row */}
            <div className="flex items-center gap-2 px-3 pt-2">
              <ScreenCapture onCapture={handleScreenCapture} />
              <select
                value={selectedSkill ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedSkill(v ? v : null);
                }}
                className={`h-9 rounded-md border px-2 text-sm outline-none ${
                  theme === "dark"
                    ? "bg-transparent border-white/10 text-white"
                    : "bg-white border-black/10 text-gray-900"
                }`}
              >
                <option value="">Skill: Default</option>
                {availableSkills.map((s) => (
                  <option key={s.name} value={s.name}>
                    {`Skill: ${s.name}`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end gap-2 px-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <textarea
                  id="prompt-textarea"
                  tabIndex={0}
                  dir="auto"
                  rows={1}
                  placeholder="Message ChatGPT"
                  className={`max-h-52 resize-none border-0 focus:outline-none text-base bg-transparent px-0 py-3 ${
                    theme === 'dark' 
                      ? 'text-white placeholder:text-gray-400' 
                      : 'text-gray-900 placeholder:text-gray-400'
                  }`}
                  value={inputMessageText}
                  onChange={(e) => setinputMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  style={{
                    height: 'auto',
                    minHeight: '24px',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
              </div>
              <button
                disabled={!inputMessageText.trim()}
                data-testid="send-button"
                className={`mb-1 flex size-8 items-center justify-center rounded-full transition-colors hover:opacity-70 focus-visible:outline-none disabled:hover:opacity-100 ${
                  theme === 'dark' 
                    ? 'bg-white text-black disabled:bg-[#343541] disabled:text-gray-500' 
                    : 'bg-black text-white disabled:bg-gray-200 disabled:text-gray-400'
                }`}
                onClick={() => {
                  handleSendWithImage();
                  const textarea = document.getElementById('prompt-textarea') as HTMLTextAreaElement;
                  if (textarea) {
                    textarea.style.height = 'auto';
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 32 32"
                  className="icon-2xl"
                >
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M15.192 8.906a1.143 1.143 0 0 1 1.616 0l5.143 5.143a1.143 1.143 0 0 1-1.616 1.616l-3.192-3.192v9.813a1.143 1.143 0 0 1-2.286 0v-9.813l-3.192 3.192a1.143 1.143 0 1 1-1.616-1.616z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
          <p className={`text-xs text-center mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
            ChatGPT can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
