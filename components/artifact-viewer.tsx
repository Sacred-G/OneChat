"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookmarkPlus, X, Code2, Eye, Download, Maximize2, Minimize2, FileText } from "lucide-react";
import useThemeStore from "@/stores/useThemeStore";
import type { AnyArtifact, FileArtifact } from "@/stores/useArtifactStore";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import ReactMarkdown from "react-markdown";
import { renderAsync } from "docx-preview";

function hashToHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function makeThumbnailDataUrl(params: { title: string; type: string }) {
  const title = params.title.trim() || "Untitled";
  const hue = hashToHue(`${params.type}:${title}`);
  const bg1 = `hsl(${hue} 80% 45%)`;
  const bg2 = `hsl(${(hue + 35) % 360} 80% 35%)`;
  const badge = params.type.toUpperCase();
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg1}" />
      <stop offset="1" stop-color="${bg2}" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#000" flood-opacity="0.35" />
    </filter>
  </defs>
  <rect x="0" y="0" width="640" height="400" fill="url(#g)" />
  <rect x="24" y="24" width="592" height="352" rx="22" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.20)" filter="url(#shadow)" />
  <rect x="48" y="52" width="110" height="34" rx="12" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.22)" />
  <text x="103" y="75" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="14" font-weight="700" fill="#fff">${escapeXml(badge)}</text>
  <text x="48" y="140" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="26" font-weight="800" fill="#fff">${escapeXml(title).slice(0, 42)}</text>
  <text x="48" y="176" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="14" font-weight="600" fill="rgba(255,255,255,0.9)">OneChatAI App Gallery</text>
  <g opacity="0.25">
    <circle cx="560" cy="300" r="70" fill="#fff" />
    <circle cx="520" cy="310" r="26" fill="rgba(0,0,0,0.35)" />
  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface ArtifactViewerProps {
  artifact: AnyArtifact | null;
  onClose: () => void;
}

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifact, onClose }) => {
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { theme } = useThemeStore();
  const [isSaving, setIsSaving] = useState(false);
  const [fileText, setFileText] = useState<string>("");
  const [fileTextError, setFileTextError] = useState<string>("");
  const codeScrollRef = useRef<HTMLDivElement>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [clickedLinkUrl, setClickedLinkUrl] = useState<string>("");
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState<string>("");

  const previewHtml = useMemo(() => {
    if (!artifact) return "";
    if (artifact.type === "code" || artifact.type === "file" || artifact.type === "url") return "";

    const html = artifact.code || "";
    if (!html.trim()) return "";

    const script = `\n<script>\n(() => {\n  try {\n    document.addEventListener('click', (e) => {\n      const a = e.target && e.target.closest ? e.target.closest('a') : null;\n      if (!a) return;\n      const href = a.getAttribute('href') || '';\n      if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) return;\n      e.preventDefault();\n      const payload = { type: 'onechat_artifact_link_click', href };\n      try {\n        window.parent && window.parent.postMessage(payload, '*');\n      } catch {}\n    }, true);\n  } catch {}\n})();\n</script>\n`;

    if (/<head[^>]*>/i.test(html)) {
      return html.replace(/<head[^>]*>/i, (m) => `${m}${script}`);
    }

    if (/<html[^>]*>/i.test(html)) {
      return html.replace(
        /<html[^>]*>/i,
        (m) => `${m}\n<head>${script}</head>`
      );
    }

    return `<!DOCTYPE html><html><head>${script}</head><body>${html}</body></html>`;
  }, [artifact]);

  const syntaxStyle = useMemo(
    () => vscDarkPlus as unknown as { [key: string]: React.CSSProperties },
    []
  );

  useEffect(() => {
    if (artifact?.type === "code") {
      setViewMode("code");
    } else {
      setViewMode("preview");
    }
  }, [artifact]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event?.data as any;
      if (!data || typeof data !== "object") return;
      if (data.type !== "onechat_artifact_link_click") return;
      const href = typeof data.href === "string" ? data.href : "";
      if (!href) return;
      setClickedLinkUrl(href);
      setLinkModalOpen(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const handleSaveToGallery = async () => {
    if (!artifact) return;
    if (artifact.type === "file") return;
    if (isSaving) return;

    const rawTitle = (artifact.title || "").trim();
    const title = window.prompt("Save to App Gallery\n\nTitle:", rawTitle || "My App")?.trim() || "";
    if (!title) return;

    setIsSaving(true);
    try {
      const thumbnail = makeThumbnailDataUrl({ title, type: artifact.type });
      const payload =
        artifact.type === "url"
          ? {
              id: artifact.id,
              type: artifact.type,
              title,
              url: artifact.url,
              thumbnail,
            }
          : {
              id: artifact.id,
              type: artifact.type,
              title,
              code: artifact.code,
              language: artifact.language || "",
              thumbnail,
            };
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Save failed (${res.status})`);
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!artifact) return;
    if (artifact.type === "file") return;
    if (viewMode !== "code") return;
    if (!codeScrollRef.current) return;
    codeScrollRef.current.scrollTop = codeScrollRef.current.scrollHeight;
  }, [artifact, viewMode]);

  useEffect(() => {
    setFileText("");
    setFileTextError("");
    setDocxError("");
    setDocxLoading(false);

    if (!artifact || artifact.type !== "file") return;

    const filename = (artifact.filename || "").toLowerCase();
    const isProbablyText =
      artifact.mime_type.startsWith("text/") ||
      /\.(txt|md|json|csv|log|yaml|yml|xml|html|css|js|ts|tsx|jsx)$/i.test(filename);

    if (!isProbablyText) return;

    let cancelled = false;
    fetch(artifact.url)
      .then((r) => r.text())
      .then((t) => {
        if (cancelled) return;
        setFileText(t);
      })
      .catch((e) => {
        if (cancelled) return;
        setFileTextError(e instanceof Error ? e.message : "Failed to load file");
      });

    return () => {
      cancelled = true;
    };
  }, [artifact]);

  // Render DOCX files
  useEffect(() => {
    if (!artifact || artifact.type !== "file") return;
    
    const filename = (artifact.filename || "").toLowerCase();
    const isDocx = filename.endsWith(".docx") || artifact.mime_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    
    if (!isDocx || viewMode !== "preview") return;
    if (!docxContainerRef.current) return;

    let cancelled = false;
    setDocxLoading(true);
    setDocxError("");

    fetch(artifact.url)
      .then((r) => r.arrayBuffer())
      .then(async (buffer) => {
        if (cancelled || !docxContainerRef.current) return;
        
        // Clear previous content
        docxContainerRef.current.innerHTML = "";
        
        await renderAsync(buffer, docxContainerRef.current, undefined, {
          className: "docx-preview",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });
        
        if (!cancelled) {
          setDocxLoading(false);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setDocxError(e instanceof Error ? e.message : "Failed to render DOCX");
        setDocxLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [artifact, viewMode]);

  if (!artifact) return null;

  const isFileArtifact = artifact.type === "file";
  const fileArtifact = (isFileArtifact ? artifact : null) as FileArtifact | null;

  const fileActionLabel = (() => {
    if (!fileArtifact) return "Open";
    const filename = (fileArtifact.filename || "").toLowerCase();
    if (filename.endsWith(".docx") || filename.endsWith(".doc")) return "Open in Microsoft Word";
    if (filename.endsWith(".xlsx") || filename.endsWith(".xls") || filename.endsWith(".xlsm")) return "Open in Microsoft Excel";
    if (filename.endsWith(".pptx") || filename.endsWith(".ppt")) return "Open in Microsoft PowerPoint";
    if (filename.endsWith(".pdf")) return "Open PDF";
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(filename)) return "Open image";
    return "Open";
  })();

  const handleOpen = () => {
    if (!fileArtifact) return;
    window.open(fileArtifact.url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    if (artifact.type === "file") {
      const a = document.createElement("a");
      a.href = artifact.url;
      a.download = artifact.filename || "file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    if (artifact.type === "url") {
      window.open(artifact.url, "_blank", "noopener,noreferrer");
      return;
    }

    const rawTitle = (artifact.title || "artifact").trim();
    const safeTitle = rawTitle.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120) || "artifact";

    const language = (artifact.language || "").toLowerCase();

    const defaultExt = artifact.type === "code" ? "txt" : "html";
    const extByLang: Record<string, { ext: string; mime: string }> = {
      js: { ext: "js", mime: "text/javascript" },
      jsx: { ext: "jsx", mime: "text/javascript" },
      ts: { ext: "ts", mime: "text/typescript" },
      tsx: { ext: "tsx", mime: "text/typescript" },
      py: { ext: "py", mime: "text/x-python" },
      python: { ext: "py", mime: "text/x-python" },
      sh: { ext: "sh", mime: "text/x-shellscript" },
      bash: { ext: "sh", mime: "text/x-shellscript" },
      zsh: { ext: "sh", mime: "text/x-shellscript" },
      json: { ext: "json", mime: "application/json" },
      yaml: { ext: "yaml", mime: "text/yaml" },
      yml: { ext: "yml", mime: "text/yaml" },
      md: { ext: "md", mime: "text/markdown" },
      markdown: { ext: "md", mime: "text/markdown" },
      html: { ext: "html", mime: "text/html" },
      css: { ext: "css", mime: "text/css" },
    };

    const inferred = extByLang[language];
    const ext = artifact.type === "code" ? (inferred?.ext || defaultExt) : "html";
    const mime = artifact.type === "code" ? (inferred?.mime || "text/plain") : "text/html";

    const blob = new Blob([artifact.code], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`flex flex-col border-l ${
        isFullscreen ? "fixed inset-0 z-50" : "h-full"
      } ${theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-white border-stone-200'}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${theme === 'dark' ? 'border-white/10 bg-[#1b1b1b]' : 'border-stone-200 bg-stone-50'}`}>
        <div className="flex items-center gap-2">
          {artifact.type === "file" ? (
            <FileText size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
          ) : (
            <Code2 size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
          )}
          <span className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
            {artifact.title || (artifact.type === "file" ? (artifact.filename || "File") : "Artifact")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {artifact.type !== "code" && artifact.type !== "file" && (
            <button
              onClick={() =>
                setViewMode(viewMode === "preview" ? "code" : "preview")
              }
              className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-stone-200'}`}
              title={viewMode === "preview" ? "View Code" : "View Preview"}
            >
              {viewMode === "preview" ? (
                <Code2 size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
              ) : (
                <Eye size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
              )}
            </button>
          )}
          {artifact.type === "file" && (() => {
            const fn = (fileArtifact?.filename || "").toLowerCase();
            const isDocx = fn.endsWith(".docx") || (fileArtifact?.mime_type || "") === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            // Future: add xlsx/pptx preview support
            if (!isDocx) return null;
            return (
              <button
                onClick={() => setViewMode(viewMode === "preview" ? "code" : "preview")}
                className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-stone-200'}`}
                title={viewMode === "preview" ? "View as Code/Raw" : "View Preview"}
              >
                {viewMode === "preview" ? (
                  <Code2 size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
                ) : (
                  <Eye size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
                )}
              </button>
            );
          })()}
          {artifact.type === "file" && (
            <button
              onClick={handleOpen}
              className={`px-2.5 py-1.5 rounded text-xs border transition-colors ${
                theme === 'dark'
                  ? 'border-white/10 bg-white/[0.04] hover:bg-white/10 text-stone-200'
                  : 'border-stone-200 hover:bg-stone-100 text-stone-700'
              }`}
              title={fileActionLabel}
            >
              {fileActionLabel}
            </button>
          )}
          <button
            onClick={handleDownload}
            className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-stone-200'}`}
            title="Download"
          >
            <Download size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
          </button>
          {artifact.type !== "file" && (
            <button
              onClick={handleSaveToGallery}
              className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-stone-200'}`}
              title={isSaving ? "Saving…" : "Save to Gallery"}
              disabled={isSaving}
            >
              <BookmarkPlus size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
            </button>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-stone-200'}`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
            ) : (
              <Maximize2 size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
            )}
          </button>
          <button
            onClick={onClose}
            className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-stone-200'}`}
            title="Close"
          >
            <X size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {artifact.type === "file" ? (
          <div className={`h-full overflow-auto ${theme === 'dark' ? 'bg-[#121212]' : 'bg-white'}`}>
            {(() => {
              const filename = (fileArtifact?.filename || "").toLowerCase();
              const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(filename) || (fileArtifact?.mime_type || "").startsWith("image/");
              const isPdf = filename.endsWith(".pdf") || (fileArtifact?.mime_type || "") === "application/pdf";
              const isDocx = filename.endsWith(".docx") || (fileArtifact?.mime_type || "") === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
              const isProbablyText =
                (fileArtifact?.mime_type || "").startsWith("text/") ||
                /\.(txt|md|json|csv|log|yaml|yml|xml|html|css|js|ts|tsx|jsx)$/i.test(filename);

              if (isImage && fileArtifact) {
                return (
                  <div className="p-4">
                    <img src={fileArtifact.url} alt={fileArtifact.filename || ""} className="max-w-full rounded-lg" />
                  </div>
                );
              }

              if (isPdf && fileArtifact) {
                return <iframe src={fileArtifact.url} className="w-full h-full border-0" title={fileArtifact.filename || "PDF"} />;
              }

              // DOCX rendering with toggle support
              if (isDocx && fileArtifact) {
                if (viewMode === "code") {
                  // Show file info in code mode
                  return (
                    <div className={`p-4 font-mono text-xs ${theme === 'dark' ? 'text-stone-100' : 'text-stone-900'}`}>
                      <div className="space-y-2">
                        <div><span className="opacity-60">Filename:</span> {fileArtifact.filename}</div>
                        <div><span className="opacity-60">MIME Type:</span> {fileArtifact.mime_type}</div>
                        <div><span className="opacity-60">File ID:</span> {fileArtifact.file_id}</div>
                        {fileArtifact.container_id && (
                          <div><span className="opacity-60">Container ID:</span> {fileArtifact.container_id}</div>
                        )}
                        <div className="pt-4 opacity-60">
                          Switch to Preview mode to see the rendered document, or use &quot;Open in Microsoft Word&quot; to edit.
                        </div>
                      </div>
                    </div>
                  );
                }
                // Preview mode - render DOCX
                return (
                  <div className="h-full flex flex-col">
                    {docxLoading && (
                      <div className={`p-4 text-sm ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                        Loading document preview…
                      </div>
                    )}
                    {docxError && (
                      <div className={`p-4 text-sm text-red-500`}>
                        Failed to render document: {docxError}
                      </div>
                    )}
                    <div 
                      ref={docxContainerRef} 
                      className={`flex-1 overflow-auto docx-wrapper ${theme === 'dark' ? 'docx-dark' : ''}`}
                      style={{ 
                        display: docxLoading ? 'none' : 'block',
                        padding: '16px',
                      }}
                    />
                    <style jsx global>{`
                      .docx-wrapper {
                        background: ${theme === 'dark' ? '#1a1a1a' : '#f5f5f5'};
                      }
                      .docx-wrapper .docx-wrapper-body {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 16px;
                      }
                      .docx-wrapper section.docx {
                        background: white !important;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                        margin: 0 auto;
                        min-height: auto;
                      }
                      .docx-dark section.docx {
                        background: #fff !important;
                        color: #000 !important;
                      }
                    `}</style>
                  </div>
                );
              }

              if (isProbablyText) {
                const isMarkdown = /\.(md|markdown)$/i.test(filename);
                
                if (isMarkdown && fileText) {
                  return (
                    <div className={`p-4 prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert text-stone-100' : 'text-stone-900'}`}>
                      {fileTextError ? fileTextError : <ReactMarkdown>{fileText}</ReactMarkdown>}
                    </div>
                  );
                }
                
                return (
                  <div className={`p-4 font-mono text-xs whitespace-pre-wrap ${theme === 'dark' ? 'text-stone-100' : 'text-stone-900'}`}>
                    {fileTextError ? fileTextError : fileText || "Loading…"}
                  </div>
                );
              }

              return (
                <div className={`p-4 text-sm ${theme === 'dark' ? 'text-stone-200' : 'text-stone-800'}`}>
                  This file type can’t be previewed here. Use “{fileActionLabel}” or Download.
                </div>
              );
            })()}
          </div>
        ) : artifact.type === "url" ? (
          <iframe
            src={(artifact as any).url}
            className="w-full h-full border-0"
            title={artifact.title || "URL"}
          />
        ) : viewMode === "preview" && artifact.type !== "code" ? (
          <iframe
            srcDoc={previewHtml}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            title={artifact.title || "Artifact Preview"}
          />
        ) : (
          <div
            ref={codeScrollRef}
            className={`h-full overflow-auto ${theme === 'dark' ? 'bg-[#121212]' : 'bg-white'}`}
          >
            <SyntaxHighlighter
              style={syntaxStyle}
              customStyle={{
                backgroundColor: "transparent",
                margin: 0,
                padding: 16,
                fontSize: 12,
                lineHeight: "1.6",
              }}
              language={artifact.type === "code" ? (artifact.language || "text") : "html"}
              showLineNumbers
              wrapLongLines
              lineNumberStyle={{
                minWidth: "2.25em",
                paddingRight: "12px",
                opacity: 0.55,
              }}
            >
              {artifact.code}
            </SyntaxHighlighter>
          </div>
        )}
      </div>

      {linkModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setLinkModalOpen(false)}
            aria-label="Close"
          />
          <div
            className={`relative w-full max-w-lg rounded-xl border p-4 shadow-xl ${
              theme === "dark"
                ? "bg-[#121212] border-white/10 text-stone-100"
                : "bg-white border-stone-200 text-stone-900"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-semibold">OneChatAI</div>
                <div className={theme === "dark" ? "text-xs text-stone-300" : "text-xs text-stone-600"}>
                  Developed and Created by Steven Bouldin
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className={`p-1.5 rounded transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-stone-200"}`}
                title="Close"
              >
                <X size={18} className={theme === "dark" ? "text-stone-300" : "text-stone-700"} />
              </button>
            </div>

            <div className="mt-3">
              <div className={theme === "dark" ? "text-xs text-stone-400" : "text-xs text-stone-600"}>
                Link clicked
              </div>
              <div className={`mt-1 rounded-md border px-3 py-2 text-xs font-mono break-words ${
                theme === "dark" ? "border-white/10 bg-white/[0.04]" : "border-stone-200 bg-stone-50"
              }`}>
                {clickedLinkUrl}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                  theme === "dark"
                    ? "border-white/10 bg-white/[0.04] hover:bg-white/10 text-stone-200"
                    : "border-stone-200 hover:bg-stone-100 text-stone-700"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactViewer;
