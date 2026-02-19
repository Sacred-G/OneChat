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
import useConnectorsStore from "@/stores/useConnectorsStore";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Switch } from "./ui/switch";
import { Plus, Settings2, Mic, FileText, Loader2, X } from "lucide-react";
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
  showVoiceAgent: _showVoiceAgent = false,
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
  const [showFunctionsList, _setShowFunctionsList] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [skillsPopoverOpen, setSkillsPopoverOpen] = useState(false);
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
    disabledFunctions,
    toggleFunction,
  } = useToolsStore();

  const { connectors, setConnectorEnabled, composioSelectedToolkits } = useConnectorsStore();

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

  const memoizedMessages = useMemo(
    () => (
      <>
        {items.map((item, index) => {
          switch (item.type) {
            case "message":
              return (
                <Message
                  key={index}
                  message={item}
                />
              );
            case "tool_call":
              return (
                <ToolCall
                  key={index}
                  toolCall={item}
                />
              );
            case "mcp_approval_request":
              return (
                <McpApproval
                  key={index}
                  item={item}
                  onRespond={onApprovalResponse}
                />
              );
            case "function_approval_request":
              return (
                <FunctionApproval
                  key={index}
                  item={item}
                  onRespond={onFunctionApprovalResponse}
                />
              );
            case "mcp_list_tools":
              return (
                <McpToolsList
                  key={index}
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
    [items, isAssistantLoading, onApprovalResponse, onFunctionApprovalResponse]
  );

  useEffect(() => {
    fetch("/api/skills/list")
      .then((r) => r.json())
      .then((d) => {
        console.log("Skills API response:", d); // Debug log
        const skills = Array.isArray(d?.skills) ? d.skills : [];
        console.log("Parsed skills:", skills); // Debug log
        setAvailableSkills(
          skills
            .filter((s: any) => typeof s?.name === "string")
            .map((s: any) => ({
              name: s.name,
              description: typeof s?.description === "string" ? s.description : "",
            }))
        );
      })
      .catch((e) => {
        console.error("Failed to load skills:", e);
        setAvailableSkills([]);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          className={`flex w-full flex-col gap-2 rounded-3xl p-2 transition-all duration-300 border shadow-lg backdrop-blur-sm focus-within:shadow-xl focus-within:scale-[1.01] min-h-[80px] ${
            theme === "dark"
              ? "bg-gradient-to-br from-[#1a1a1a]/90 to-[#2d2d2d]/90 border-white/15 focus-within:border-white/25 shadow-black/30"
              : "bg-gradient-to-br from-white/95 to-gray-50/95 border-black/10 focus-within:border-black/20 shadow-gray-300/40"
          }`}
        >
          {/* Screen capture button row */}
          <div className="flex items-center gap-2 px-4 pt-3">
            <AgentSelector />
            {availableSkills.length > 0 && (
              <Popover open={skillsPopoverOpen} onOpenChange={setSkillsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={`p-2 rounded-lg transition-colors ${
                      theme === "dark"
                        ? "hover:bg-white/10 text-gray-300"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                    title="Skills"
                  >
                    <Plus size={16} />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-64 max-h-60">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Plus size={16} className={theme === "dark" ? "text-stone-300" : "text-stone-700"} />
                      <div className={`text-sm font-medium ${theme === "dark" ? "text-stone-100" : "text-stone-900"}`}>Skills</div>
                      <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        ({availableSkills.length} skills, selected: {selectedSkill || 'none'})
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
                      <button
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedSkill === null
                            ? theme === "dark"
                              ? "bg-blue-600 text-white"
                              : "bg-blue-500 text-white"
                            : theme === "dark"
                            ? "hover:bg-white/10 text-gray-300"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                        onClick={() => {
                          console.log("Setting skill to null");
                          setSelectedSkill(null);
                          setSkillsPopoverOpen(false); // Close popover after selection
                        }}
                      >
                        None
                      </button>
                      {availableSkills.map((skill) => (
                        <button
                          key={skill.name}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedSkill === skill.name
                              ? theme === "dark"
                                ? "bg-blue-600 text-white"
                                : "bg-blue-500 text-white"
                              : theme === "dark"
                              ? "hover:bg-white/10 text-gray-300"
                                : "hover:bg-gray-100 text-gray-700"
                          }`}
                          onClick={() => {
                            console.log("Setting skill to:", skill.name);
                            setSelectedSkill(skill.name);
                            setSkillsPopoverOpen(false); // Close popover after selection
                          }}
                        >
                          {skill.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`p-2 rounded-lg transition-colors ${
                    theme === "dark"
                      ? "hover:bg-white/10 text-gray-300"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                  title="Tools"
                >
                  <Settings2 size={16} />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-80">
                <div className="space-y-4">
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
                            <div className="min-w-0">
                              <div className="text-sm">Functions</div>
                              <div className={`text-xs ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>
                                {(() => {
                                  const d = Array.isArray(disabledFunctions) ? disabledFunctions : [];
                                  const enabled = toolsList.filter((t) => !d.includes(t.name)).length;
                                  return `${enabled}/${toolsList.length} enabled`;
                                })()}
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
                            checked={Boolean(connectors?.google?.enabled)}
                            onCheckedChange={(v) => setConnectorEnabled("google", Boolean(v))}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm">Outlook</div>
                            <div className={`text-xs ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>Outlook Email + Calendar</div>
                          </div>
                          <Switch
                            checked={Boolean(connectors?.outlook?.enabled)}
                            onCheckedChange={(v) => setConnectorEnabled("outlook", Boolean(v))}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm">Composio</div>
                            <div className={`text-xs ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>
                              {composioSelectedToolkits.length > 0
                                ? `${composioSelectedToolkits.length} toolkit${composioSelectedToolkits.length !== 1 ? 's' : ''} selected`
                                : 'No toolkits selected'}
                            </div>
                          </div>
                          <Switch
                            checked={Boolean(connectors?.composio?.enabled)}
                            onCheckedChange={(v) => setConnectorEnabled("composio", Boolean(v))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <ScreenCapture onCapture={handleScreenCapture} />
            <button
              ref={uploadInputRef as React.RefObject<HTMLButtonElement>}
              type="button"
              onClick={handleUploadClick}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-white/10 text-gray-300"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              title="Upload"
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
              }}
            />
            {!voiceModeEnabled && (
              <button
                onClick={() => setShowVoiceAgent?.(true)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "hover:bg-white/10 text-gray-300"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
                title="Voice Mode"
              >
                <Mic size={16} />
              </button>
            )}
          </div>
          
          <div className="flex items-end gap-3 px-4 pb-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <textarea
                id="prompt-textarea"
                tabIndex={0}
                dir="auto"
                rows={1}
                placeholder="Message OneChatAI..."
                className={`max-h-56 resize-none border-0 focus:outline-none text-sm leading-6 bg-transparent px-0 pt-3 font-medium transition-all duration-200 h-10 ${
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
              className={`flex size-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 focus-visible:outline-none disabled:hover:scale-100 disabled:opacity-50 shadow-lg ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-white to-gray-200 text-black disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-400 shadow-black/20 hover:shadow-black/30' 
                  : 'bg-gradient-to-r from-black to-gray-800 text-white disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 shadow-gray-400/30 hover:shadow-gray-500/40'
              }`}
              onClick={handleSendWithImage}
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
        <p className={`text-xs text-center mt-3 font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          OneChatAI can make mistakes. Consider checking important information.
        </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
