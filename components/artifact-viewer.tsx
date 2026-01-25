"use client";

import React, { useState, useEffect } from "react";
import { X, Code2, Eye, Download, Maximize2, Minimize2, FileText, Loader2 } from "lucide-react";
import useThemeStore from "@/stores/useThemeStore";
import mammoth from "mammoth";

interface ArtifactViewerProps {
  artifact: {
    id: string;
    type: "html" | "react" | "code" | "docx";
    title?: string;
    code: string;
    language?: string;
    fileUrl?: string;
  } | null;
  onClose: () => void;
}

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifact, onClose }) => {
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);
  const { theme } = useThemeStore();

  useEffect(() => {
    if (artifact?.type === "code") {
      setViewMode("code");
    } else {
      setViewMode("preview");
    }
  }, [artifact]);

  // Load and convert DOCX files
  useEffect(() => {
    if (artifact?.type === "docx" && artifact.fileUrl) {
      setDocxLoading(true);
      setDocxError(null);
      setDocxHtml(null);

      fetch(artifact.fileUrl)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch document");
          return res.arrayBuffer();
        })
        .then((arrayBuffer) => mammoth.convertToHtml({ arrayBuffer }))
        .then((result) => {
          // Wrap in styled HTML document
          const styledHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
    p { margin: 1em 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    ul, ol { margin: 1em 0; padding-left: 2em; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
${result.value}
</body>
</html>`;
          setDocxHtml(styledHtml);
          setDocxLoading(false);
        })
        .catch((err) => {
          console.error("DOCX conversion error:", err);
          setDocxError(err.message || "Failed to load document");
          setDocxLoading(false);
        });
    }
  }, [artifact?.type, artifact?.fileUrl]);

  if (!artifact) return null;

  const handleDownload = () => {
    const rawTitle = (artifact.title || "artifact").trim();
    const safeTitle = rawTitle.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120) || "artifact";

    // For DOCX files, download the original file
    if (artifact.type === "docx" && artifact.fileUrl) {
      const a = document.createElement("a");
      a.href = artifact.fileUrl;
      a.download = safeTitle.endsWith(".docx") ? safeTitle : `${safeTitle}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

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
      } ${theme === 'dark' ? 'bg-[#212121] border-stone-700' : 'bg-white border-stone-200'}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${theme === 'dark' ? 'border-stone-700 bg-[#2f2f2f]' : 'border-stone-200 bg-stone-50'}`}>
        <div className="flex items-center gap-2">
          {artifact.type === "docx" ? (
            <FileText size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
          ) : (
            <Code2 size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
          )}
          <span className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
            {artifact.title || "Artifact"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(artifact.type !== "code" || artifact.type === "docx") && (
            <button
              onClick={() =>
                setViewMode(viewMode === "preview" ? "code" : "preview")
              }
              className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-stone-700' : 'hover:bg-stone-200'}`}
              title={viewMode === "preview" ? "View Code" : "View Preview"}
            >
              {viewMode === "preview" ? (
                <Code2 size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
              ) : (
                <Eye size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
              )}
            </button>
          )}
          <button
            onClick={handleDownload}
            className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-stone-700' : 'hover:bg-stone-200'}`}
            title="Download"
          >
            <Download size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-stone-700' : 'hover:bg-stone-200'}`}
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
            className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-stone-700' : 'hover:bg-stone-200'}`}
            title="Close"
          >
            <X size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {artifact.type === "docx" ? (
          // DOCX document preview
          docxLoading ? (
            <div className={`flex items-center justify-center h-full ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className={`animate-spin ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`} />
                <span className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}>Loading document...</span>
              </div>
            </div>
          ) : docxError ? (
            <div className={`flex items-center justify-center h-full ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
              <div className="flex flex-col items-center gap-3 text-red-500">
                <FileText size={32} />
                <span>Error: {docxError}</span>
              </div>
            </div>
          ) : viewMode === "preview" && docxHtml ? (
            <iframe
              srcDoc={docxHtml}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-same-origin"
              title={artifact.title || "Document Preview"}
            />
          ) : (
            <div className={`h-full overflow-auto p-4 ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-stone-900'}`}>
              <pre className="text-sm text-stone-100 font-mono whitespace-pre-wrap">
                <code>{docxHtml || artifact.code}</code>
              </pre>
            </div>
          )
        ) : viewMode === "preview" && artifact.type !== "code" ? (
          <iframe
            srcDoc={artifact.code}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            title={artifact.title || "Artifact Preview"}
          />
        ) : (
          <div className={`h-full overflow-auto p-4 ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-stone-900'}`}>
            <pre className="text-sm text-stone-100 font-mono">
              <code>{artifact.code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtifactViewer;
