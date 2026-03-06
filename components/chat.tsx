"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import ToolCall from "./tool-call";
import Message from "./message";
import McpToolsList from "./mcp-tools-list";
import McpApproval from "./mcp-approval";
import FunctionApproval from "./function-approval";
import {
  FunctionApprovalAction,
  Item,
} from "@/lib/assistant";
import LoadingMessage from "./loading-message";
import useConversationStore from "@/stores/useConversationStore";
import useThemeStore from "@/stores/useThemeStore";
import ScreenCapture from "./screen-capture";
import useToolsStore from "@/stores/useToolsStore";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Plus, Paperclip, Mic, FileText, Loader2, X } from "lucide-react";
import AgentSelector from "./agent-selector";
import useAgentStore from "@/stores/useAgentStore";

const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.includes(",") ? result.split(",")[1] || "" : result;
      if (!base64) {
        reject(new Error("Could not read the selected file."));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

interface ChatProps {
  items: Item[];
  onSendMessage: (message: string, imageData?: string) => void;
  onApprovalResponse: (approve: boolean, id: string) => void;
  onFunctionApprovalResponse: (action: FunctionApprovalAction, id: string) => void;
  voiceModeEnabled?: boolean;
  showVoiceAgent?: boolean;
  setShowVoiceAgent?: (show: boolean) => void;
}

const Chat: React.FC<ChatProps> = ({
  items,
  onSendMessage,
  onApprovalResponse,
  onFunctionApprovalResponse,
  voiceModeEnabled = false,
  showVoiceAgent: _showVoiceAgent = false,
  setShowVoiceAgent,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputMessageText, setinputMessageText] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [availableSkills, setAvailableSkills] = useState<
    Array<{ name: string; description: string }>
  >([]);
  const [isNearBottom, setIsNearBottom] = useState(true);
  // This state is used to provide better user experience for non-English IMEs such as Japanese
  const [isComposing, setIsComposing] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [skillsPopoverOpen, setSkillsPopoverOpen] = useState(false);
  const { isAssistantLoading, selectedSkill, setSelectedSkill } = useConversationStore();
  const { theme } = useThemeStore();

  const handleScreenCapture = (imageData: string) => {
    setCapturedImage(imageData);
    // Optionally auto-send or let user add context
    if (!inputMessageText) {
      setinputMessageText("What do you see in this screenshot?");
    }
  };

  const handleUploadClick = () => {
    setUploadStatus(null);
    fileInputRef.current?.click();
  };

  const handleUploadFile = async (file: File) => {
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".heic", ".heif"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const isImage = file.type.startsWith("image/") || imageExts.includes(ext);

    if (isImage) {
      setUploadStatus(null);
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : null;
        if (result) {
          setCapturedImage(result);
          if (!inputMessageText) {
            setinputMessageText("What do you see in this image?");
          }
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // Document upload → vector store
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setUploadStatus({
        type: "error",
        message: "This file is too large. Please upload a document smaller than 20 MB.",
      });
      return;
    }

    const selectedAgent = useAgentStore.getState().getSelectedAgent();
    const globalVs = useToolsStore.getState().vectorStore;
    let targetVsId = selectedAgent?.vectorStoreId || globalVs?.id || "";
    let targetVsName = selectedAgent?.vectorStoreName || globalVs?.name || "";

    setIsUploadingDoc(true);
    setUploadStatus(null);
    try {
      const base64Content = await fileToBase64(file);

      // Upload file to OpenAI
      const uploadRes = await fetch("/api/vector_stores/upload_file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileObject: { name: file.name, content: base64Content } }),
      });
      const uploadData = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok) {
        throw new Error(typeof uploadData?.error === "string" ? uploadData.error : "Upload failed");
      }
      const fileId = uploadData.id;
      if (!fileId) throw new Error("No file ID");

      // Create a vector store if none exists
      if (!targetVsId) {
        const storeName = selectedAgent ? `${selectedAgent.name} Knowledge Base` : "Chat Knowledge Base";
        const createRes = await fetch("/api/vector_stores/create_store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: storeName }),
        });
        const createData = await createRes.json().catch(() => null);
        if (!createRes.ok) {
          throw new Error(typeof createData?.error === "string" ? createData.error : "Failed to create store");
        }
        targetVsId = createData.id;
        targetVsName = storeName;

        // Persist the new store
        if (selectedAgent) {
          useAgentStore.getState().updateAgent(selectedAgent.id, {
            vectorStoreId: targetVsId,
            vectorStoreName: targetVsName,
            fileSearchEnabled: true,
          });
        } else {
          useToolsStore.getState().setVectorStore({ id: targetVsId, name: targetVsName });
          useToolsStore.getState().setFileSearchEnabled(true);
        }
      }

      // Add file to vector store
      const addFileRes = await fetch("/api/vector_stores/add_file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, vectorStoreId: targetVsId }),
      });
      const addFileData = await addFileRes.json().catch(() => null);
      if (!addFileRes.ok) {
        throw new Error(typeof addFileData?.error === "string" ? addFileData.error : "Failed to add file to the knowledge base");
      }

      setUploadedDocName(file.name);
      setUploadStatus({
        type: "success",
        message: `"${file.name}" was added to the knowledge base.`,
      });
      if (!inputMessageText) {
        setinputMessageText(`I just uploaded "${file.name}" to the knowledge base. Please use it to help me.`);
      }
      // Auto-clear the doc indicator after 5 seconds
      setTimeout(() => setUploadedDocName(null), 5000);
    } catch (err) {
      console.error("Document upload error:", err);
      setUploadStatus({
        type: "error",
        message:
          err instanceof Error && err.message.trim().length > 0
            ? err.message
            : "Failed to upload document. Please try again.",
      });
    } finally {
      setIsUploadingDoc(false);
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
    requestAnimationFrame(() => {
      itemsEndRef.current?.scrollIntoView({ behavior: "auto" });
    });
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
    const el = scrollContainerRef.current;
    if (!el) return;

    const update = () => {
      const thresholdPx = 140;
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      setIsNearBottom(remaining <= thresholdPx);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      el.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    if (isNearBottom) scrollToBottom();
  }, [items, isNearBottom]);

  const memoizedMessages = useMemo(
    () => (
      <>
        {items.map((item, index) => {
          const key = ('id' in item && item.id) ? `${item.type}-${item.id}` : `${item.type}-${index}`;
          switch (item.type) {
            case "message":
              return (
                <Message
                  key={key}
                  message={item}
                />
              );
            case "tool_call":
              return (
                <ToolCall
                  key={key}
                  toolCall={item}
                />
              );
            case "mcp_approval_request":
              return (
                <McpApproval
                  key={key}
                  item={item}
                  onRespond={onApprovalResponse}
                />
              );
            case "function_approval_request":
              return (
                <FunctionApproval
                  key={key}
                  item={item}
                  onRespond={onFunctionApprovalResponse}
                />
              );
            case "mcp_list_tools":
              return (
                <McpToolsList
                  key={key}
                  item={item}
                />
              );
            default:
              return null;
          }
        })}
        {isAssistantLoading && <LoadingMessage />}
        <div ref={itemsEndRef} />
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, isAssistantLoading]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/skills/list", { signal: controller.signal })
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
      .catch(() => {
        if (!controller.signal.aborted) setAvailableSkills([]);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto w-full max-w-3xl px-4 min-w-0 pb-32">
          <div className="py-8 space-y-6">
            {memoizedMessages}
          </div>
        </div>
      </div>

      {/* Input area - sticky at bottom */}
      <div className="sticky bottom-0 bg-background border-t border-border pb-6">
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
        {uploadStatus && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              uploadStatus.type === "error"
                ? theme === "dark"
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-red-200 bg-red-50 text-red-700"
                : theme === "dark"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {uploadStatus.message}
          </div>
        )}
        {(isUploadingDoc || uploadedDocName) && (
          <div className={`mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm backdrop-blur-sm ${
            theme === "dark" 
              ? "border-white/10 bg-gradient-to-r from-[#1b1b1b]/80 to-[#2a2a2a]/80 text-white shadow-black/20" 
              : "border-black/10 bg-gradient-to-r from-white/90 to-gray-50/90 text-gray-900 shadow-gray-200/50"
          }`}>
            {isUploadingDoc ? (
              <>
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>Uploading document to knowledge base...</span>
              </>
            ) : uploadedDocName ? (
              <>
                <FileText size={14} className="text-green-500" />
                <span className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                  <span className="font-medium">{uploadedDocName}</span> added to knowledge base
                </span>
              </>
            ) : null}
          </div>
        )}

        {/* Screen capture preview */}
        {capturedImage && (
          <div className="mb-4 relative">
            <div className="relative h-52 w-full rounded-xl overflow-hidden shadow-lg">
              <Image
                src={capturedImage}
                alt="Screen capture"
                fill
                sizes="100vw"
                unoptimized
                className="object-contain"
              />
            </div>
            <button
              onClick={() => setCapturedImage(null)}
              className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-sm text-white rounded-full p-2 hover:bg-red-600/90 transition-all duration-200 shadow-lg hover:scale-105"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        <div
          className={`flex w-full flex-col gap-1.5 rounded-2xl p-1.5 transition-all duration-200 border backdrop-blur-sm focus-within:shadow-md min-h-[62px] ${
            theme === "dark"
              ? "bg-[#1f1f1f]/95 border-white/10 focus-within:border-white/20 shadow-black/20"
              : "bg-white/95 border-black/10 focus-within:border-black/20 shadow-gray-200/30"
          }`}
        >
          {/* Toolbar */}
          <div className="flex items-center gap-1.5 px-3 pt-1.5">
            <AgentSelector />
            {availableSkills.length > 0 && (
              <Popover open={skillsPopoverOpen} onOpenChange={setSkillsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={`p-1.5 rounded-md transition-colors ${
                      selectedSkill
                        ? theme === "dark" ? "bg-blue-600/20 text-blue-400" : "bg-blue-50 text-blue-600"
                        : theme === "dark" ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                    }`}
                    title={selectedSkill ? `Skill: ${selectedSkill}` : "Skills"}
                  >
                    <Plus size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-56 p-1">
                  <div className="space-y-0.5">
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedSkill === null
                          ? theme === "dark" ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900"
                          : theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"
                      }`}
                      onClick={() => { setSelectedSkill(null); setSkillsPopoverOpen(false); }}
                    >
                      None
                    </button>
                    {availableSkills.map((skill) => (
                      <button
                        key={skill.name}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedSkill === skill.name
                            ? theme === "dark" ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                            : theme === "dark" ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"
                        }`}
                        onClick={() => { setSelectedSkill(skill.name); setSkillsPopoverOpen(false); }}
                      >
                        {skill.name}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <ScreenCapture onCapture={handleScreenCapture} />
            <button
              type="button"
              onClick={handleUploadClick}
              className={`p-1.5 rounded-md transition-colors ${
                theme === "dark" ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
              }`}
              title="Attach file"
            >
              <Paperclip size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.c,.cpp,.cs,.css,.doc,.docx,.go,.html,.java,.js,.json,.md,.pdf,.php,.pptx,.py,.rb,.sh,.tex,.ts,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadFile(file);
              }}
            />
            {!voiceModeEnabled && (
              <button
                onClick={() => setShowVoiceAgent?.(true)}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === "dark" ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                }`}
                title="Voice Mode"
              >
                <Mic size={14} />
              </button>
            )}
          </div>
          
          <div className="flex items-end gap-2 px-3 pb-1.5">
            <div className="flex min-w-0 flex-1 flex-col">
              <textarea
                id="prompt-textarea"
                tabIndex={0}
                dir="auto"
                rows={1}
                placeholder="Message OneChatAI..."
                className={`max-h-44 resize-none border-0 focus:outline-none text-sm leading-5 bg-transparent px-0 py-2 font-medium transition-all duration-200 h-9 ${
                  theme === 'dark' 
                    ? 'text-white placeholder:text-gray-400' 
                    : 'text-gray-900 placeholder:text-gray-500'
                }`}
                value={inputMessageText}
                onChange={(e) => setinputMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
              />
            </div>
            <button
              disabled={!inputMessageText.trim() && !capturedImage}
              data-testid="send-button"
              className={`flex size-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 focus-visible:outline-none disabled:hover:scale-100 disabled:opacity-50 shadow-md ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-white to-gray-200 text-black disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-400 shadow-black/20 hover:shadow-black/30' 
                  : 'bg-gradient-to-r from-black to-gray-800 text-white disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 shadow-gray-300/30 hover:shadow-gray-400/40'
              }`}
              onClick={handleSendWithImage}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
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
        <p className={`text-xs text-center mt-3 font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          OneChatAI can make mistakes. Consider checking important information.
        </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
