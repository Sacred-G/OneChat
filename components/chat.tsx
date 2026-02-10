"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import ToolCall from "./tool-call";
import Message from "./message";
import Annotations from "./annotations";
import McpToolsList from "./mcp-tools-list";
import McpApproval from "./mcp-approval";
import FunctionApproval from "./function-approval";
import {
  FunctionApprovalAction,
  FunctionApprovalRequestItem,
  Item,
  McpApprovalRequestItem,
} from "@/lib/assistant";
import LoadingMessage from "./loading-message";
import useConversationStore from "@/stores/useConversationStore";
import useThemeStore from "@/stores/useThemeStore";
import ScreenCapture from "./screen-capture";
import useToolsStore from "@/stores/useToolsStore";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Switch } from "./ui/switch";
import { Plus, Settings2, Mic, ChevronDown, ChevronRight, FileText, Loader2 } from "lucide-react";
import AgentSelector from "./agent-selector";
import { toolsList } from "@/config/tools-list";
import useAgentStore from "@/stores/useAgentStore";

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
  showVoiceAgent = false,
  setShowVoiceAgent,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [inputMessageText, setinputMessageText] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [availableSkills, setAvailableSkills] = useState<
    Array<{ name: string; description: string }>
  >([]);
  const [isNearBottom, setIsNearBottom] = useState(true);
  // This state is used to provide better user experience for non-English IMEs such as Japanese
  const [isComposing, setIsComposing] = useState(false);
  const [showFunctionsList, setShowFunctionsList] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const { isAssistantLoading, selectedSkill, setSelectedSkill } = useConversationStore();
  const { theme } = useThemeStore();
  const {
    webSearchEnabled,
    setWebSearchEnabled,
    fileSearchEnabled,
    setFileSearchEnabled,
    functionsEnabled,
    setFunctionsEnabled,
    codeInterpreterEnabled,
    setCodeInterpreterEnabled,
    mcpEnabled,
    setMcpEnabled,
    localAgentEnabled,
    setLocalAgentEnabled,
    googleIntegrationEnabled,
    setGoogleIntegrationEnabled,
    disabledFunctions,
    toggleFunction,
  } = useToolsStore();

  const handleScreenCapture = (imageData: string) => {
    setCapturedImage(imageData);
    // Optionally auto-send or let user add context
    if (!inputMessageText) {
      setinputMessageText("What do you see in this screenshot?");
    }
  };

  const handleUploadClick = () => {
    uploadInputRef.current?.click();
  };

  const handleUploadFile = async (file: File) => {
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".heic", ".heif"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const isImage = file.type.startsWith("image/") || imageExts.includes(ext);

    if (isImage) {
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
    const selectedAgent = useAgentStore.getState().getSelectedAgent();
    const globalVs = useToolsStore.getState().vectorStore;
    let targetVsId = selectedAgent?.vectorStoreId || globalVs?.id || "";
    let targetVsName = selectedAgent?.vectorStoreName || globalVs?.name || "";

    setIsUploadingDoc(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const base64Content = btoa(binary);

      // Upload file to OpenAI
      const uploadRes = await fetch("/api/vector_stores/upload_file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileObject: { name: file.name, content: base64Content } }),
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
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
        if (!createRes.ok) throw new Error("Failed to create store");
        const createData = await createRes.json();
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
      await fetch("/api/vector_stores/add_file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, vectorStoreId: targetVsId }),
      });

      setUploadedDocName(file.name);
      if (!inputMessageText) {
        setinputMessageText(`I just uploaded "${file.name}" to the knowledge base. Please use it to help me.`);
      }
      // Auto-clear the doc indicator after 5 seconds
      setTimeout(() => setUploadedDocName(null), 5000);
    } catch (err) {
      console.error("Document upload error:", err);
      alert("Failed to upload document. Please try again.");
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="mx-auto w-full max-w-3xl px-4 min-w-0">
          <div className="py-6 space-y-5">
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {item.type === "tool_call" ? (
                  <ToolCall toolCall={item} />
                ) : item.type === "message" ? (
                  <div className="flex flex-col gap-2 min-w-0">
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
                ) : item.type === "function_approval_request" ? (
                  <FunctionApproval
                    item={item as FunctionApprovalRequestItem}
                    onRespond={onFunctionApprovalResponse}
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
            ? "border-white/10 bg-[#121212]/90"
            : "border-black/10 bg-white/90"
        } backdrop-blur`}
      >
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          {/* Document upload indicator */}
          {(isUploadingDoc || uploadedDocName) && (
            <div className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              theme === "dark" ? "border-white/10 bg-[#1b1b1b] text-white" : "border-black/10 bg-gray-50 text-gray-900"
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
                ? "bg-[#1b1b1b] border-white/10 focus-within:border-white/20"
                : "bg-white border-black/10 focus-within:border-black/20"
            }`}
          >
            {/* Screen capture button row */}
            <div className="flex items-center gap-1 px-3 pt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`h-9 w-9 inline-flex items-center justify-center rounded-md border text-sm outline-none transition-colors ${
                      theme === "dark"
                        ? "bg-transparent border-white/10 text-white hover:bg-white/10"
                        : "bg-white border-black/10 text-gray-900 hover:bg-gray-50"
                    }`}
                    title="Tools"
                  >
                    <Plus size={18} />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className={`w-[320px] p-3 ${
                    theme === "dark"
                      ? "bg-[#1b1b1b] border-white/10 text-white"
                      : "bg-white border-black/10 text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Settings2 size={16} className={theme === "dark" ? "text-stone-300" : "text-stone-700"} />
                    <div className={`text-sm font-medium ${theme === "dark" ? "text-stone-100" : "text-stone-900"}`}>Tools</div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className={`text-xs mb-2 ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>Search</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm">Web search</div>
                            <div className={`text-xs ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>Use web results</div>
                          </div>
                          <Switch checked={webSearchEnabled} onCheckedChange={(v) => setWebSearchEnabled(Boolean(v))} />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm">File search</div>
                            <div className={`text-xs ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>Search your vector store</div>
                          </div>
                          <Switch checked={fileSearchEnabled} onCheckedChange={(v) => setFileSearchEnabled(Boolean(v))} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className={`text-xs mb-2 ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>Execution</div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setShowFunctionsList(!showFunctionsList)}
                                className="p-0.5 -ml-1 rounded hover:bg-white/10"
                              >
                                {showFunctionsList ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              <div>
                                <div className="text-sm">Functions</div>
                                <div className={`text-xs ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>
                                  {(() => {
                                    const d = Array.isArray(disabledFunctions) ? disabledFunctions : [];
                                    const enabled = toolsList.filter((t) => !d.includes(t.name)).length;
                                    return `${enabled}/${toolsList.length} enabled`;
                                  })()}
                                </div>
                              </div>
                            </div>
                            <Switch checked={functionsEnabled} onCheckedChange={(v) => setFunctionsEnabled(Boolean(v))} />
                          </div>
                          {showFunctionsList && functionsEnabled && (
                            <div className={`mt-2 ml-4 space-y-1.5 max-h-48 overflow-y-auto rounded-md border p-2 ${
                              theme === "dark" ? "border-white/10 bg-black/20" : "border-black/5 bg-stone-50"
                            }`}>
                              {toolsList.map((tool) => {
                                const d = Array.isArray(disabledFunctions) ? disabledFunctions : [];
                                const isOn = !d.includes(tool.name);
                                return (
                                  <div key={tool.name} className="flex items-center justify-between gap-2">
                                    <span className={`text-xs font-mono truncate ${isOn ? "" : "opacity-50"}`}>{tool.name}</span>
                                    <Switch
                                      checked={isOn}
                                      onCheckedChange={() => toggleFunction(tool.name)}
                                      className="scale-75"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm">Code interpreter</div>
                            <div className={`text-xs ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>Run Python code</div>
                          </div>
                          <Switch checked={codeInterpreterEnabled} onCheckedChange={(v) => setCodeInterpreterEnabled(Boolean(v))} />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm">Local agent</div>
                            <div className={`text-xs ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>Dev-only filesystem + commands</div>
                          </div>
                          <Switch checked={localAgentEnabled} onCheckedChange={(v) => setLocalAgentEnabled(Boolean(v))} />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm">MCP</div>
                            <div className={`text-xs ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>Remote MCP server tools</div>
                          </div>
                          <Switch checked={mcpEnabled} onCheckedChange={(v) => setMcpEnabled(Boolean(v))} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className={`text-xs mb-2 ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>Connectors</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm">Google</div>
                            <div className={`text-xs ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>Gmail + Calendar</div>
                          </div>
                          <Switch
                            checked={googleIntegrationEnabled}
                            onCheckedChange={(v) => setGoogleIntegrationEnabled(Boolean(v))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <ScreenCapture onCapture={handleScreenCapture} />
              <button
                type="button"
                onClick={handleUploadClick}
                className={`h-9 rounded-md border px-1 text-xs outline-none transition-colors sm:px-2 sm:text-sm ${
                  theme === "dark"
                    ? "bg-transparent border-white/10 text-white hover:bg-white/10"
                    : "bg-white border-black/10 text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="hidden sm:inline">Upload</span>
                <span className="sm:hidden">📎</span>
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*,.c,.cpp,.cs,.css,.doc,.docx,.go,.html,.java,.js,.json,.md,.pdf,.php,.pptx,.py,.rb,.sh,.tex,.ts,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadFile(file);
                  e.currentTarget.value = "";
                }}
              />
              <AgentSelector />
              <select
                value={selectedSkill ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedSkill(v ? v : null);
                }}
                className={`h-9 rounded-md border px-1 text-xs outline-none sm:px-2 sm:text-sm ${
                  theme === "dark"
                    ? "bg-transparent border-white/10 text-white"
                    : "bg-white border-black/10 text-gray-900"
                }`}
              >
                <option value="">Default</option>
                {availableSkills.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              {voiceModeEnabled && (
                <button
                  type="button"
                  onClick={() => setShowVoiceAgent?.(!showVoiceAgent)}
                  className={`h-9 w-9 inline-flex items-center justify-center rounded-md border text-sm outline-none transition-colors ${
                    showVoiceAgent
                      ? "bg-green-500 hover:bg-green-600 text-white border-green-600"
                      : theme === "dark"
                        ? "bg-transparent border-white/10 text-white hover:bg-white/10"
                        : "bg-white border-black/10 text-gray-900 hover:bg-gray-50"
                  }`}
                  title="Voice Mode"
                >
                  <Mic size={16} />
                </button>
              )}
            </div>
            
            <div className="flex items-end gap-2 px-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <textarea
                  id="prompt-textarea"
                  tabIndex={0}
                  dir="auto"
                  rows={1}
                  placeholder="Message OneChatAI"
                  className={`max-h-52 resize-none border-0 focus:outline-none text-sm leading-5 bg-transparent px-0 py-2 ${
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
                    minHeight: '20px',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
              </div>
              <button
                disabled={!inputMessageText.trim() && !capturedImage}
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
            OneChatAI can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
