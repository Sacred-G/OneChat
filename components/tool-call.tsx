"use client";

import React, { useMemo, useState } from "react";

import { ToolCallItem } from "@/lib/assistant";
import {
  BookOpenText,
  Clock,
  Globe,
  Zap,
  Code2,
  Download,
  ChevronDown,
  FileText,
  Terminal,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  Pencil,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy, vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import useThemeStore from "@/stores/useThemeStore";
import useArtifactStore from "@/stores/useArtifactStore";

interface ToolCallProps {
  toolCall: ToolCallItem;
}

async function downloadUrl(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status}`);
  }
  const blob = await res.blob();
  const obj = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = obj;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(obj);
}

function filenameFromUrl(url: string, fallback = "image.png") {
  try {
    const u = new URL(url);
    const base = u.pathname.split("/").filter(Boolean).pop() || "";
    const clean = decodeURIComponent(base);
    return clean || fallback;
  } catch {
    return fallback;
  }
}

function htmlForImage(url: string) {
  const safe = url.replace(/\"/g, "%22");
  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;background:transparent;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${safe}" style="max-width:100%;max-height:100%;object-fit:contain;" /></body></html>`;
}

async function toDataUrlFromRemoteUrl(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status}`);
  }
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

function getJsonString(value: any) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

function formatInline(value: any) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getToolSummary(toolCall: ToolCallItem) {
  const name = toolCall.name || "";
  const args = toolCall.parsedArguments || {};
  const path = typeof (args as any)?.path === "string" ? String((args as any).path) : "";
  const url = typeof (args as any)?.url === "string" ? String((args as any).url) : "";

  if (name === "read_file" && path) return `Reading ${path}`;
  if (name === "read_multiple_files") return "Reading multiple files";
  if (name === "write_file" && path) return `Writing ${path}`;
  if (name === "edit_file" && path) return `Editing ${path}`;
  if (name === "open_document" && path) return `Opening ${path}`;
  if (name === "get_document_text" && path) return `Reading ${path}`;
  if (name === "get_page_content" && url) return `Reading ${url}`;

  if (toolCall.tool_type === "file_search_call") return toolCall.status === "completed" ? "Searched files" : "Searching files";
  if (toolCall.tool_type === "web_search_call") return toolCall.status === "completed" ? "Searched the web" : "Searching the web";
  if (toolCall.tool_type === "code_interpreter_call") return toolCall.status === "completed" ? "Running code" : "Running code";

  if (name) return toolCall.status === "completed" ? `Called ${name}` : `Calling ${name}`;
  return toolCall.status === "completed" ? "Tool call" : "Calling tool";
}

function FileAction({ file }: { file: { file_id: string; container_id?: string; filename?: string; mime_type: string } }) {
  const { theme } = useThemeStore();
  const href = `/api/container_files/content?file_id=${file.file_id}${
    file.container_id ? `&container_id=${file.container_id}` : ""
  }${file.filename ? `&filename=${encodeURIComponent(file.filename)}` : ""}`;

  return (
    <a
      href={href}
      download
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
        theme === "dark"
          ? "border-white/10 bg-white/[0.04] text-stone-200 hover:bg-white/10"
          : "border-black/10 bg-black/[0.02] text-stone-800 hover:bg-black/5"
      }`}
    >
      Download
      <Download size={12} />
    </a>
  );
}

function ShowWorkingFile({
  file,
}: {
  file: { file_id: string; container_id?: string; filename?: string; mime_type: string };
}) {
  const { theme } = useThemeStore();
  const { setCurrentArtifact, addArtifact } = useArtifactStore();

  const url = `/api/container_files/content?file_id=${file.file_id}${
    file.container_id ? `&container_id=${file.container_id}` : ""
  }${file.filename ? `&filename=${encodeURIComponent(file.filename)}` : ""}`;

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
        theme === "dark"
          ? "border-white/10 bg-white/[0.04] text-stone-200 hover:bg-white/10"
          : "border-black/10 bg-black/[0.02] text-stone-800 hover:bg-black/5"
      }`}
      onClick={() => {
        const artifact: any = {
          id: `file-${file.file_id}`,
          type: "file",
          title: file.filename || "File",
          file_id: file.file_id,
          ...(file.container_id ? { container_id: file.container_id } : {}),
          ...(file.filename ? { filename: file.filename } : {}),
          mime_type: file.mime_type,
          url,
        };
        addArtifact(artifact);
        setCurrentArtifact(artifact);
      }}
    >
      Show working file
    </button>
  );
}

function ToolCard({
  toolCall,
  icon,
  children,
}: {
  toolCall: ToolCallItem;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const { theme } = useThemeStore();
  const summary = getToolSummary(toolCall);

  const openByDefault = toolCall.status !== "completed";

  return (
    <div className="flex justify-start pt-2">
      <div className="w-full max-w-3xl">
        <details
          className={`group rounded-xl border ${
            theme === "dark" ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-black/[0.02]"
          }`}
          open={openByDefault}
        >
          <summary
            className={`flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 ${
              theme === "dark" ? "text-stone-200" : "text-stone-800"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md ${
                  theme === "dark" ? "bg-white/10" : "bg-black/5"
                }`}
              >
                {icon}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{summary}</div>
                <div
                  className={`text-xs ${
                    theme === "dark" ? "text-stone-400" : "text-stone-500"
                  }`}
                >
                  {toolCall.tool_type === "mcp_call" && toolCall.name
                    ? `MCP tool: ${toolCall.name}`
                    : toolCall.name
                      ? `Tool: ${toolCall.name}`
                      : ""}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {toolCall.status === "completed" ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    theme === "dark" ? "bg-white/10 text-stone-300" : "bg-black/5 text-stone-600"
                  }`}
                >
                  Done
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Loader2
                    size={14}
                    className={
                      "animate-spin " +
                      (theme === "dark" ? "text-blue-200" : "text-blue-700")
                    }
                  />
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      theme === "dark" ? "bg-blue-500/20 text-blue-200" : "bg-blue-500/10 text-blue-700"
                    }`}
                  >
                    Running
                  </span>
                </span>
              )}
              <ChevronDown
                size={16}
                className={`transition-transform group-open:rotate-180 ${
                  theme === "dark" ? "text-stone-400" : "text-stone-500"
                }`}
              />
            </div>
          </summary>

          <div className="px-4 pb-4">{children}</div>
        </details>
      </div>
    </div>
  );
}

function ApiCallCell({ toolCall }: ToolCallProps) {
  const { theme } = useThemeStore();
  const { addArtifact, setCurrentArtifact } = useArtifactStore();
  const syntaxStyle = theme === "dark" ? vscDarkPlus : coy;

  const parsedOutput = useMemo(() => {
    if (!toolCall.output) return null;
    try {
      return JSON.parse(toolCall.output);
    } catch {
      return null;
    }
  }, [toolCall.output]);

  const imageUrls = useMemo(() => {
    if (!parsedOutput) return [] as string[];

    if (toolCall.name === "generate_image") {
      const u = (parsedOutput as any)?.url;
      return typeof u === "string" && u.trim() ? [u] : [];
    }

    if (toolCall.name === "generate_images") {
      const urls = (parsedOutput as any)?.urls;
      return Array.isArray(urls)
        ? urls.filter((u: any) => typeof u === "string" && u.trim())
        : [];
    }

    return [];
  }, [parsedOutput, toolCall.name]);

  const [editOpen, setEditOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [editResults, setEditResults] = useState<string[]>([]);

  return (
    <ToolCard toolCall={toolCall} icon={<Zap size={16} className={theme === "dark" ? "text-stone-200" : "text-stone-800"} />}>
      <div className="space-y-3">
        {imageUrls.length > 0 && (
          <div>
            <div className={`text-xs mb-2 flex items-center gap-2 ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
              <ImageIcon size={14} />
              Result
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imageUrls.map((src) => {
                const filename = filenameFromUrl(src, "image.png");
                return (
                  <div
                    key={src}
                    className={`rounded-xl border overflow-hidden ${theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"}`}
                  >
                    <div className="aspect-square w-full bg-black/20">
                      <img src={src} alt="Generated" className="h-full w-full object-cover" />
                    </div>
                    <div className="p-2 flex items-center justify-between gap-2">
                      <div className={`min-w-0 text-xs truncate ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>{filename}</div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                            theme === "dark"
                              ? "border-white/10 bg-white/[0.04] text-stone-200 hover:bg-white/10"
                              : "border-black/10 bg-black/[0.02] text-stone-700 hover:bg-black/5"
                          }`}
                          onClick={() => {
                            const artifact: any = {
                              id: `image-${src}`,
                              type: "html",
                              title: filename,
                              code: htmlForImage(src),
                            };
                            addArtifact(artifact);
                            setCurrentArtifact(artifact);
                          }}
                          title="Open in panel"
                        >
                          Open
                        </button>

                        <a
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                            theme === "dark"
                              ? "border-white/10 bg-white/[0.04] text-stone-200 hover:bg-white/10"
                              : "border-black/10 bg-black/[0.02] text-stone-700 hover:bg-black/5"
                          }`}
                          title="Open in new tab"
                        >
                          <ExternalLink size={12} />
                        </a>

                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                            theme === "dark"
                              ? "border-white/10 bg-white/[0.04] text-stone-200 hover:bg-white/10"
                              : "border-black/10 bg-black/[0.02] text-stone-700 hover:bg-black/5"
                          }`}
                          onClick={async () => {
                            await downloadUrl(src, filename);
                          }}
                          title="Download"
                        >
                          <Download size={12} />
                        </button>

                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                            theme === "dark"
                              ? "border-white/10 bg-white/[0.04] text-stone-200 hover:bg-white/10"
                              : "border-black/10 bg-black/[0.02] text-stone-700 hover:bg-black/5"
                          }`}
                          onClick={() => {
                            setEditResults([]);
                            setEditError("");
                            setEditPrompt(toolCall.parsedArguments?.prompt ? String(toolCall.parsedArguments.prompt) : "");
                            setEditOpen(true);
                          }}
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {editOpen && imageUrls.length > 0 && (
              <div className={`mt-3 rounded-xl border p-3 ${theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"}`}>
                <div className={`text-xs mb-2 ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>Edit prompt</div>
                <div className="flex flex-col gap-2">
                  <input
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    className={`h-9 rounded-md border px-2 text-sm outline-none ${
                      theme === "dark"
                        ? "bg-transparent border-white/10 text-white placeholder:text-stone-500"
                        : "bg-white border-black/10 text-stone-900 placeholder:text-stone-400"
                    }`}
                    placeholder="Describe the change you want…"
                  />
                  {editError ? (
                    <div className={`text-xs ${theme === "dark" ? "text-red-300" : "text-red-700"}`}>{editError}</div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={editing || !editPrompt.trim()}
                      className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-xs transition-colors ${
                        theme === "dark"
                          ? "border-white/10 bg-white/[0.04] text-stone-200 hover:bg-white/10 disabled:opacity-50"
                          : "border-black/10 bg-black/[0.02] text-stone-700 hover:bg-black/5 disabled:opacity-50"
                      }`}
                      onClick={async () => {
                        setEditing(true);
                        setEditError("");
                        setEditResults([]);
                        try {
                          const imageDataUrl = await toDataUrlFromRemoteUrl(imageUrls[0]!);
                          const res = await fetch("/api/functions/generate_images", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ prompt: editPrompt.trim(), imageDataUrl }),
                          });
                          const data = await res.json().catch(() => null);
                          const urls = Array.isArray(data?.urls)
                            ? data.urls.filter((u: any) => typeof u === "string" && u.trim())
                            : [];
                          if (urls.length === 0) {
                            setEditError(typeof data?.error === "string" ? data.error : "No edited images returned");
                          } else {
                            setEditResults(urls);
                          }
                        } catch (e) {
                          setEditError(e instanceof Error ? e.message : "Edit failed");
                        } finally {
                          setEditing(false);
                        }
                      }}
                    >
                      {editing ? "Editing…" : "Run edit"}
                    </button>
                    <button
                      type="button"
                      className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-xs transition-colors ${
                        theme === "dark"
                          ? "border-white/10 bg-transparent text-stone-300 hover:bg-white/5"
                          : "border-black/10 bg-transparent text-stone-700 hover:bg-black/5"
                      }`}
                      onClick={() => {
                        setEditOpen(false);
                        setEditResults([]);
                        setEditError("");
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>

                {editResults.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {editResults.map((src) => {
                      const filename = filenameFromUrl(src, "edited.png");
                      return (
                        <button
                          key={src}
                          type="button"
                          className={`rounded-xl border overflow-hidden text-left transition-colors ${
                            theme === "dark"
                              ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                              : "border-black/10 bg-black/[0.02] hover:bg-black/[0.04]"
                          }`}
                          onClick={() => {
                            const artifact: any = {
                              id: `image-${src}`,
                              type: "html",
                              title: filename,
                              code: htmlForImage(src),
                            };
                            addArtifact(artifact);
                            setCurrentArtifact(artifact);
                          }}
                        >
                          <div className="aspect-square w-full bg-black/20">
                            <img src={src} alt="Edited" className="h-full w-full object-cover" />
                          </div>
                          <div className={`p-2 text-xs truncate ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>{filename}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <div className={`text-xs mb-1 ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>Request</div>
          <div className={`rounded-lg border ${theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"}`}>
            <SyntaxHighlighter
              customStyle={{
                backgroundColor: "transparent",
                padding: "12px",
                margin: 0,
                fontSize: "12px",
              }}
              language="json"
              style={syntaxStyle}
            >
              {getJsonString(toolCall.parsedArguments)}
            </SyntaxHighlighter>
          </div>
        </div>

        <div>
          <div className={`text-xs mb-1 ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>Response</div>
          <div className={`rounded-lg border ${theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"}`}>
            {toolCall.output ? (
              <SyntaxHighlighter
                customStyle={{
                  backgroundColor: "transparent",
                  padding: "12px",
                  margin: 0,
                  fontSize: "12px",
                }}
                language="json"
                style={syntaxStyle}
              >
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(toolCall.output), null, 2);
                  } catch {
                    return String(toolCall.output);
                  }
                })()}
              </SyntaxHighlighter>
            ) : (
              <div className={`flex items-center gap-2 px-3 py-2 text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
                <Clock size={14} />
                Waiting for result…
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolCard>
  );
}

function FileSearchCell({ toolCall }: ToolCallProps) {
  const { theme } = useThemeStore();

  return (
    <ToolCard
      toolCall={toolCall}
      icon={<BookOpenText size={16} className={theme === "dark" ? "text-stone-200" : "text-stone-800"} />}
    >
      <div className="space-y-3">
        <div>
          <div className={`text-xs mb-1 ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>Response</div>
          <div className={`rounded-lg border ${theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"}`}>
            {toolCall.output ? (
              <pre className={`whitespace-pre-wrap px-3 py-2 text-xs ${theme === "dark" ? "text-stone-200" : "text-stone-800"}`}>
                {formatInline(toolCall.output)}
              </pre>
            ) : (
              <div className={`flex items-center gap-2 px-3 py-2 text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
                <Clock size={14} />
                Waiting for results…
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolCard>
  );
}

function WebSearchCell({ toolCall }: ToolCallProps) {
  const { theme } = useThemeStore();

  return (
    <ToolCard
      toolCall={toolCall}
      icon={<Globe size={16} className={theme === "dark" ? "text-stone-200" : "text-stone-800"} />}
    >
      <div className="space-y-3">
        <div>
          <div className={`text-xs mb-1 ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>Response</div>
          <div className={`rounded-lg border ${theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"}`}>
            {toolCall.output ? (
              <pre className={`whitespace-pre-wrap px-3 py-2 text-xs ${theme === "dark" ? "text-stone-200" : "text-stone-800"}`}>
                {formatInline(toolCall.output)}
              </pre>
            ) : (
              <div className={`flex items-center gap-2 px-3 py-2 text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
                <Clock size={14} />
                Waiting for results…
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolCard>
  );
}

function McpCallCell({ toolCall }: ToolCallProps) {
  const { theme } = useThemeStore();
  const syntaxStyle = theme === "dark" ? vscDarkPlus : coy;

  return (
    <ToolCard toolCall={toolCall} icon={<Terminal size={16} className={theme === "dark" ? "text-stone-200" : "text-stone-800"} />}>
      <div className="space-y-3">
        <div>
          <div className={`text-xs mb-1 ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>Request</div>
          <div className={`rounded-lg border ${theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"}`}>
            <SyntaxHighlighter
              customStyle={{
                backgroundColor: "transparent",
                padding: "12px",
                margin: 0,
                fontSize: "12px",
              }}
              language="json"
              style={syntaxStyle}
            >
              {getJsonString(toolCall.parsedArguments)}
            </SyntaxHighlighter>
          </div>
        </div>

        <div>
          <div className={`text-xs mb-1 ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>Response</div>
          <div className={`rounded-lg border ${theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"}`}>
            {toolCall.output ? (
              <SyntaxHighlighter
                customStyle={{
                  backgroundColor: "transparent",
                  padding: "12px",
                  margin: 0,
                  fontSize: "12px",
                }}
                language="json"
                style={syntaxStyle}
              >
                {(() => {
                  try {
                    const parsed = JSON.parse(toolCall.output!);
                    return JSON.stringify(parsed, null, 2);
                  } catch {
                    return String(toolCall.output);
                  }
                })()}
              </SyntaxHighlighter>
            ) : (
              <div className={`flex items-center gap-2 px-3 py-2 text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
                <Clock size={14} />
                Waiting for result…
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolCard>
  );
}

function CodeInterpreterCell({ toolCall }: ToolCallProps) {
  const { theme } = useThemeStore();
  const { addArtifact, setCurrentArtifact } = useArtifactStore();
  const syntaxStyle = theme === "dark" ? vscDarkPlus : coy;

  return (
    <ToolCard toolCall={toolCall} icon={<Code2 size={16} className={theme === "dark" ? "text-stone-200" : "text-stone-800"} />}>
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className={`text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>Command</div>
            <button
              type="button"
              onClick={() => {
                const artifact: any = {
                  id: `code-interpreter-${toolCall.id}`,
                  type: "code",
                  title: "Code interpreter",
                  code: toolCall.code || "",
                  language: "python",
                };
                addArtifact(artifact);
                setCurrentArtifact(artifact);
              }}
              className={`text-xs rounded-md border px-2 py-1 transition-colors ${
                theme === "dark"
                  ? "border-white/10 bg-white/[0.04] text-stone-200 hover:bg-white/10"
                  : "border-black/10 bg-black/[0.02] text-stone-700 hover:bg-black/5"
              }`}
            >
              Open streaming code
            </button>
          </div>
          <div className={`rounded-lg border ${theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"}`}>
            <SyntaxHighlighter
              customStyle={{
                backgroundColor: "transparent",
                padding: "12px",
                margin: 0,
                fontSize: "12px",
                lineHeight: "1.5",
              }}
              language="python"
              style={syntaxStyle}
              showLineNumbers
              wrapLongLines
              lineNumberStyle={{
                minWidth: "2.25em",
                paddingRight: "12px",
                opacity: 0.55,
              }}
            >
              {toolCall.code || ""}
            </SyntaxHighlighter>
          </div>
        </div>

        {toolCall.files && toolCall.files.length > 0 && (
          <div>
            <div className={`text-xs mb-2 ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>Presented file</div>
            <div className="space-y-2">
              {toolCall.files.map((f) => (
                <div
                  key={f.file_id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                    theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        theme === "dark" ? "bg-white/10" : "bg-black/5"
                      }`}
                    >
                      <FileText size={16} className={theme === "dark" ? "text-stone-200" : "text-stone-800"} />
                    </div>
                    <div className="min-w-0">
                      <div className={`truncate text-sm ${theme === "dark" ? "text-stone-200" : "text-stone-800"}`}>
                        {f.filename || f.file_id}
                      </div>
                      <div className={`text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
                        {f.mime_type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShowWorkingFile file={f as any} />
                    <FileAction file={f as any} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolCard>
  );
}

export default function ToolCall({ toolCall }: ToolCallProps) {
  return (
    <>
      {(() => {
        switch (toolCall.tool_type) {
          case "function_call":
            return <ApiCallCell toolCall={toolCall} />;
          case "file_search_call":
            return <FileSearchCell toolCall={toolCall} />;
          case "web_search_call":
            return <WebSearchCell toolCall={toolCall} />;
          case "mcp_call":
            return <McpCallCell toolCall={toolCall} />;
          case "code_interpreter_call":
            return <CodeInterpreterCell toolCall={toolCall} />;
          default:
            return null;
        }
      })()}
    </>
  );
}
