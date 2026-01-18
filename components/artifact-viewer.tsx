"use client";

import React, { useState, useEffect } from "react";
import { X, Code2, Eye, Download, Maximize2, Minimize2 } from "lucide-react";
import useThemeStore from "@/stores/useThemeStore";

interface ArtifactViewerProps {
  artifact: {
    id: string;
    type: "html" | "react" | "code";
    title?: string;
    code: string;
    language?: string;
  } | null;
  onClose: () => void;
}

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifact, onClose }) => {
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { theme } = useThemeStore();

  useEffect(() => {
    if (artifact?.type === "code") {
      setViewMode("code");
    } else {
      setViewMode("preview");
    }
  }, [artifact]);

  if (!artifact) return null;

  const handleDownload = () => {
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
      } ${theme === 'dark' ? 'bg-[#212121] border-stone-700' : 'bg-white border-stone-200'}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${theme === 'dark' ? 'border-stone-700 bg-[#2f2f2f]' : 'border-stone-200 bg-stone-50'}`}>
        <div className="flex items-center gap-2">
          <Code2 size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'} />
          <span className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
            {artifact.title || "Artifact"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {artifact.type !== "code" && (
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
        {viewMode === "preview" && artifact.type !== "code" ? (
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
