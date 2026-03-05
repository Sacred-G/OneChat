"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Switch } from "./ui/switch";
import useAgentStore, { CustomAgent } from "@/stores/useAgentStore";
import useThemeStore from "@/stores/useThemeStore";
import { Database, Upload, X, FileText, Loader2 } from "lucide-react";

const AGENT_ICONS = [
  { value: "bot", label: "Bot", emoji: "🤖" },
  { value: "brain", label: "Brain", emoji: "🧠" },
  { value: "rocket", label: "Rocket", emoji: "🚀" },
  { value: "star", label: "Star", emoji: "⭐" },
  { value: "fire", label: "Fire", emoji: "🔥" },
  { value: "lightning", label: "Lightning", emoji: "⚡" },
  { value: "code", label: "Code", emoji: "💻" },
  { value: "pen", label: "Writer", emoji: "✍️" },
  { value: "palette", label: "Artist", emoji: "🎨" },
  { value: "chart", label: "Analyst", emoji: "📊" },
  { value: "shield", label: "Shield", emoji: "🛡️" },
  { value: "book", label: "Scholar", emoji: "📚" },
  { value: "microscope", label: "Scientist", emoji: "🔬" },
  { value: "megaphone", label: "Marketing", emoji: "📣" },
  { value: "heart", label: "Health", emoji: "❤️" },
  { value: "globe", label: "Global", emoji: "🌍" },
];

const AGENT_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
  "#3b82f6", "#2563eb", "#7c3aed", "#64748b",
];

const TEMPERATURE_PRESETS = [
  { value: 0, label: "Precise" },
  { value: 0.3, label: "Balanced" },
  { value: 0.7, label: "Creative" },
  { value: 1.0, label: "Wild" },
];

interface AgentCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAgent?: CustomAgent | null;
}

const AgentCreator: React.FC<AgentCreatorProps> = ({
  open,
  onOpenChange,
  editingAgent,
}) => {
  const { theme } = useThemeStore();
  const { addAgent, updateAgent } = useAgentStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [icon, setIcon] = useState("bot");
  const [color, setColor] = useState("#6366f1");
  const [preferredProvider, setPreferredProvider] = useState<"openai" | "apipie" | "ollama" | "none">("none");
  const [temperature, setTemperature] = useState(0.7);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [codeInterpreterEnabled, setCodeInterpreterEnabled] = useState(false);
  const [fileSearchEnabled, setFileSearchEnabled] = useState(false);
  const [vectorStoreId, setVectorStoreId] = useState("");
  const [vectorStoreName, setVectorStoreName] = useState("");
  const [vsIdInput, setVsIdInput] = useState("");
  const [vsFiles, setVsFiles] = useState<Array<{ fileId: string; filename: string; status?: string }>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");

  useEffect(() => {
    if (editingAgent) {
      setName(editingAgent.name);
      setDescription(editingAgent.description);
      setPrompt(editingAgent.prompt);
      setIcon(editingAgent.icon);
      setColor(editingAgent.color);
      setPreferredProvider(editingAgent.preferredProvider ?? "none");
      setTemperature(editingAgent.temperature ?? 0.7);
      setWebSearchEnabled(editingAgent.webSearchEnabled ?? false);
      setCodeInterpreterEnabled(editingAgent.codeInterpreterEnabled ?? false);
      setFileSearchEnabled(editingAgent.fileSearchEnabled ?? false);
      setVectorStoreId(editingAgent.vectorStoreId ?? "");
      setVectorStoreName(editingAgent.vectorStoreName ?? "");
    } else {
      setName("");
      setDescription("");
      setPrompt("");
      setIcon("bot");
      setColor("#6366f1");
      setPreferredProvider("none");
      setTemperature(0.7);
      setWebSearchEnabled(false);
      setCodeInterpreterEnabled(false);
      setFileSearchEnabled(false);
      setVectorStoreId("");
      setVectorStoreName("");
    }
    setVsIdInput("");
    setVsFiles([]);
    setNewStoreName("");
  }, [editingAgent, open]);

  // Load files when vectorStoreId changes
  useEffect(() => {
    if (!vectorStoreId) {
      setVsFiles([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setIsLoadingFiles(true);
      try {
        const res = await fetch(`/api/vector_stores/list_files?vector_store_id=${encodeURIComponent(vectorStoreId)}`);
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data?.files) ? data.files : [];
        if (!cancelled) {
          setVsFiles(
            list
              .filter((f: any) => typeof f?.fileId === "string")
              .map((f: any) => ({
                fileId: String(f.fileId),
                filename: typeof f?.filename === "string" ? f.filename : "",
                status: typeof f?.status === "string" ? f.status : "",
              }))
          );
        }
      } catch { /* ignore */ } finally {
        if (!cancelled) setIsLoadingFiles(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [vectorStoreId]);

  const handleSave = () => {
    if (!name.trim() || !prompt.trim()) return;

    const agentData = {
      name: name.trim(),
      description: description.trim(),
      prompt: prompt.trim(),
      icon,
      color,
      preferredProvider,
      temperature: (preferredProvider === "apipie" || preferredProvider === "ollama") ? temperature : undefined,
      webSearchEnabled,
      codeInterpreterEnabled,
      fileSearchEnabled,
      vectorStoreId: vectorStoreId || undefined,
      vectorStoreName: vectorStoreName || undefined,
    };

    if (editingAgent) {
      updateAgent(editingAgent.id, agentData);
    } else {
      addAgent(agentData);
    }

    onOpenChange(false);
  };

  const isDark = theme === "dark";
  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    isDark
      ? "bg-[#2a2a2a] border-white/10 text-white placeholder:text-gray-500 focus:border-white/30"
      : "bg-gray-50 border-black/10 text-gray-900 placeholder:text-gray-400 focus:border-black/30"
  }`;

  const selectedIconEmoji =
    AGENT_ICONS.find((i) => i.value === icon)?.emoji ?? "🤖";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-xl max-h-[90vh] overflow-y-auto ${
          isDark ? "bg-[#1b1b1b] border-white/10 text-white" : "bg-white border-black/10 text-gray-900"
        }`}
      >
        <DialogHeader>
          <DialogTitle className={isDark ? "text-white" : "text-gray-900"}>
            {editingAgent ? "Edit Agent" : "Create Agent"}
          </DialogTitle>
          <DialogDescription className={isDark ? "text-gray-400" : "text-gray-500"}>
            {editingAgent
              ? "Update your custom agent configuration."
              : "Create a custom agent with its own personality and instructions."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Icon & Color */}
          <div className="space-y-2">
            <label className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Icon & Color
            </label>
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-xl text-2xl shrink-0"
                style={{ backgroundColor: color + "20", border: `2px solid ${color}` }}
              >
                {selectedIconEmoji}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {AGENT_ICONS.map((ic) => (
                    <button
                      key={ic.value}
                      type="button"
                      onClick={() => setIcon(ic.value)}
                      className={`w-8 h-8 rounded-md text-base flex items-center justify-center transition-all ${
                        icon === ic.value
                          ? "ring-2 ring-offset-1 scale-110"
                          : "opacity-60 hover:opacity-100"
                      } ${isDark ? "ring-offset-[#1b1b1b]" : "ring-offset-white"}`}
                      style={icon === ic.value ? { outlineColor: color } : {}}
                      title={ic.label}
                    >
                      {ic.emoji}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {AGENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-5 h-5 rounded-full transition-all ${
                        color === c ? "ring-2 ring-offset-1 scale-125" : "hover:scale-110"
                      } ${isDark ? "ring-offset-[#1b1b1b]" : "ring-offset-white"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Code Reviewer, Marketing Writer..."
              className={inputClass}
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this agent does"
              className={inputClass}
              maxLength={120}
            />
          </div>

          {/* System Prompt */}
          <div className="space-y-1.5">
            <label className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              System Prompt *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="You are a helpful assistant that specializes in..."
              className={`${inputClass} min-h-[120px] resize-y`}
              rows={5}
            />
            <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              This prompt will be prepended to the system instructions when this agent is active.
            </p>
          </div>

          {/* Provider Preference */}
          <div className="space-y-2">
            <label className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Preferred Provider
            </label>
            <div className="flex items-center gap-2">
              {([
                { value: "none" as const, label: "Use Chat Default" },
                { value: "openai" as const, label: "OpenAI" },
                { value: "apipie" as const, label: "APIPie" },
                { value: "ollama" as const, label: "Ollama" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPreferredProvider(opt.value)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                    preferredProvider === opt.value
                      ? "text-white"
                      : isDark
                        ? "bg-[#2a2a2a] text-gray-300 hover:bg-[#333]"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={
                    preferredProvider === opt.value
                      ? { backgroundColor: color }
                      : {}
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              {preferredProvider === "none"
                ? "Agent will use whichever provider is active in the main chat."
                : `Agent will default to ${preferredProvider === "openai" ? "OpenAI" : preferredProvider === "ollama" ? "Ollama" : "APIPie"}. You can still switch in the chat.`}
            </p>
          </div>

          {/* Temperature (apipie only) */}
          {(preferredProvider === "apipie" || preferredProvider === "ollama") && (
          <div className="space-y-2">
            <label className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Temperature <span className={`font-normal ${isDark ? "text-gray-500" : "text-gray-400"}`}>(APIPie only)</span>
            </label>
            <div className="flex items-center gap-2">
              {TEMPERATURE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setTemperature(preset.value)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                    temperature === preset.value
                      ? "text-white"
                      : isDark
                        ? "bg-[#2a2a2a] text-gray-300 hover:bg-[#333]"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={
                    temperature === preset.value
                      ? { backgroundColor: color }
                      : {}
                  }
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-current"
              style={{ accentColor: color }}
            />
            <div className={`text-xs text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {temperature.toFixed(2)}
            </div>
          </div>
          )}

          {/* Tool Options */}
          <div className="space-y-2">
            <label className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Default Tools
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm">Web Search</div>
                  <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Enable web search by default
                  </div>
                </div>
                <Switch
                  checked={webSearchEnabled}
                  onCheckedChange={(v) => setWebSearchEnabled(Boolean(v))}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm">Code Interpreter</div>
                  <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Enable code execution by default
                  </div>
                </div>
                <Switch
                  checked={codeInterpreterEnabled}
                  onCheckedChange={(v) => setCodeInterpreterEnabled(Boolean(v))}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm">File Search</div>
                  <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Search a knowledge base when active
                  </div>
                </div>
                <Switch
                  checked={fileSearchEnabled}
                  onCheckedChange={(v) => setFileSearchEnabled(Boolean(v))}
                />
              </div>
            </div>
          </div>

          {/* Knowledge Base / Vector Store */}
          {fileSearchEnabled && (
          <div className="space-y-3">
            <label className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              <div className="flex items-center gap-1.5">
                <Database size={14} />
                Knowledge Base
              </div>
            </label>

            {vectorStoreId ? (
              <div className="space-y-3">
                <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${isDark ? "border-white/10 bg-[#2a2a2a]" : "border-black/10 bg-gray-50"}`}>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                      {vectorStoreName || "Vector Store"}
                    </div>
                    <div className={`text-xs font-mono truncate ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                      {vectorStoreId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setVectorStoreId(""); setVectorStoreName(""); setVsFiles([]); }}
                    className={`ml-2 p-1 rounded-md transition-colors ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-200 text-gray-500"}`}
                    title="Unlink vector store"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Files list */}
                <div className={`rounded-lg border p-3 ${isDark ? "border-white/10" : "border-black/10"}`}>
                  <div className={`text-xs font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                    Documents ({vsFiles.length})
                  </div>
                  {isLoadingFiles ? (
                    <div className={`flex items-center gap-2 text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                      <Loader2 size={12} className="animate-spin" /> Loading...
                    </div>
                  ) : vsFiles.length === 0 ? (
                    <div className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>No documents yet. Upload files below.</div>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {vsFiles.map((f) => (
                        <div key={f.fileId} className={`flex items-center gap-2 text-xs rounded px-2 py-1 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                          <FileText size={12} className={isDark ? "text-gray-400" : "text-gray-500"} />
                          <span className="truncate flex-1">{f.filename || f.fileId}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload file to this store */}
                  <label className={`mt-2 flex items-center gap-2 cursor-pointer rounded-md border border-dashed px-3 py-2 text-xs transition-colors ${
                    isDark ? "border-white/10 hover:border-white/20 text-gray-400" : "border-black/10 hover:border-black/20 text-gray-500"
                  } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {isUploading ? "Uploading..." : "Upload file"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".c,.cpp,.cs,.css,.doc,.docx,.go,.html,.java,.js,.json,.md,.pdf,.php,.pptx,.py,.rb,.sh,.tex,.ts,.txt"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        e.currentTarget.value = "";
                        setIsUploading(true);
                        try {
                          const arrayBuffer = await file.arrayBuffer();
                          const bytes = new Uint8Array(arrayBuffer);
                          let binary = "";
                          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                          const base64Content = btoa(binary);

                          const uploadRes = await fetch("/api/vector_stores/upload_file", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ fileObject: { name: file.name, content: base64Content } }),
                          });
                          if (!uploadRes.ok) throw new Error("Upload failed");
                          const uploadData = await uploadRes.json();
                          const fileId = uploadData.id;
                          if (!fileId) throw new Error("No file ID");

                          await fetch("/api/vector_stores/add_file", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ fileId, vectorStoreId }),
                          });

                          setVsFiles((prev) => [...prev, { fileId, filename: file.name, status: "completed" }]);
                        } catch (err) {
                          console.error("File upload error:", err);
                          alert("Failed to upload file. Please try again.");
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Link existing store */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={vsIdInput}
                    onChange={(e) => setVsIdInput(e.target.value)}
                    placeholder="Paste vector store ID (vs_XXXX...)"
                    className={inputClass}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && vsIdInput.trim()) {
                        e.preventDefault();
                        try {
                          const res = await fetch(`/api/vector_stores/retrieve_store?vector_store_id=${encodeURIComponent(vsIdInput.trim())}`);
                          const data = await res.json();
                          if (data.id) {
                            setVectorStoreId(String(data.id));
                            setVectorStoreName(typeof data.name === "string" ? data.name : "");
                            setVsIdInput("");
                          } else {
                            alert("Vector store not found");
                          }
                        } catch { alert("Failed to retrieve vector store"); }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!vsIdInput.trim()) return;
                      try {
                        const res = await fetch(`/api/vector_stores/retrieve_store?vector_store_id=${encodeURIComponent(vsIdInput.trim())}`);
                        const data = await res.json();
                        if (data.id) {
                          setVectorStoreId(String(data.id));
                          setVectorStoreName(typeof data.name === "string" ? data.name : "");
                          setVsIdInput("");
                        } else {
                          alert("Vector store not found");
                        }
                      } catch { alert("Failed to retrieve vector store"); }
                    }}
                    className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? "bg-[#2a2a2a] text-gray-300 hover:bg-[#333]" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    Link
                  </button>
                </div>

                {/* Or create new store */}
                <div className={`text-xs text-center ${isDark ? "text-gray-500" : "text-gray-400"}`}>or</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    placeholder="New store name (e.g. My Agent KB)"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    disabled={isCreatingStore}
                    onClick={async () => {
                      const storeName = newStoreName.trim() || `${name.trim() || "Agent"} Knowledge Base`;
                      setIsCreatingStore(true);
                      try {
                        const res = await fetch("/api/vector_stores/create_store", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name: storeName }),
                        });
                        if (!res.ok) throw new Error("Failed to create store");
                        const data = await res.json();
                        if (data.id) {
                          setVectorStoreId(String(data.id));
                          setVectorStoreName(storeName);
                          setNewStoreName("");
                        }
                      } catch { alert("Failed to create vector store"); } finally {
                        setIsCreatingStore(false);
                      }
                    }}
                    className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${isDark ? "bg-[#2a2a2a] text-gray-300 hover:bg-[#333]" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {isCreatingStore ? "Creating..." : "Create"}
                  </button>
                </div>
                <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  Link an existing OpenAI vector store or create a new one. You can upload files after linking.
                </p>
              </div>
            )}
          </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? "bg-[#2a2a2a] text-gray-300 hover:bg-[#333]"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || !prompt.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: color }}
          >
            {editingAgent ? "Save Changes" : "Create Agent"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentCreator;
