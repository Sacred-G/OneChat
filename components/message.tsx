import { MessageItem } from "@/lib/assistant";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { extractArtifacts } from "@/lib/artifact-parser";
import useArtifactStore from "@/stores/useArtifactStore";
import useThemeStore from "@/stores/useThemeStore";
import Image from "next/image";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Eye } from "lucide-react";

interface MessageProps {
  message: MessageItem;
}

const SYNTAX_HIGHLIGHTER_STYLE =
  vscDarkPlus as unknown as { [key: string]: React.CSSProperties };

const Message: React.FC<MessageProps> = ({ message }) => {
  const { addArtifact, setCurrentArtifact } = useArtifactStore();
  const { theme } = useThemeStore();
  const [messageArtifacts, setMessageArtifacts] = useState<any[]>([]);

  const messageText = message.content
    .map((c: any) => (c && typeof c.text === "string" ? c.text : ""))
    .join("")
    .replace(/\bfilecite\s*:\s*\S+/gi, "")
    .replace(/\bturn\d+file\b\s*:?\s*\S*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  useEffect(() => {
    const text = message.content
      .map((c: any) => (c && typeof c.text === "string" ? c.text : ""))
      .join("");

    if (message.role === "assistant" && text) {
      const { artifacts } = extractArtifacts(text);
      if (artifacts.length > 0) {
        setMessageArtifacts(artifacts);
        artifacts.forEach((artifact) => addArtifact(artifact));
      }
    }
  }, [message, addArtifact]);

  const renderContent = () => {
    const { cleanedContent } = extractArtifacts(messageText);
    
    return (
      <ReactMarkdown
        components={{
          a({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) {
            // If the assistant emitted a direct link to our container file proxy endpoint,
            // open it in the Artifact Viewer instead of navigating.
            if (href && (href.startsWith("/api/container_files/content") || href.includes("/api/container_files/content?"))) {
              let fileId = "";
              let containerId = "";
              let filename = "";
              try {
                const u = new URL(href, window.location.origin);
                fileId = u.searchParams.get("file_id") || "";
                containerId = u.searchParams.get("container_id") || "";
                filename = u.searchParams.get("filename") || "";
              } catch {
                // ignore
              }

              return (
                <span
                  className="text-blue-500 hover:text-blue-600 underline cursor-pointer"
                  onClick={() => {
                    if (!fileId) return;
                    const artifact: any = {
                      id: `file-${fileId}`,
                      type: "file",
                      title: filename || fileId,
                      file_id: fileId,
                      ...(containerId ? { container_id: containerId } : {}),
                      ...(filename ? { filename } : {}),
                      mime_type: "application/octet-stream",
                      url: href,
                    };
                    addArtifact(artifact);
                    setCurrentArtifact(artifact);
                  }}
                  {...props}
                >
                  {children}
                </span>
              );
            }
            // Handle sandbox:/ links - these are file download links from the AI
            if (href && href.startsWith("sandbox:/")) {
              const filename = href.replace(/^sandbox:\/.*\//, "");
              return (
                <span
                  className="text-blue-500 hover:text-blue-600 underline cursor-pointer"
                  onClick={() => {
                    // Show a message that sandbox files need to be downloaded via the artifact viewer
                    alert(`File "${filename}" was generated in a sandbox environment.\n\nTo download files, the AI should use the container_files API or generate the file content directly.`);
                  }}
                  {...props}
                >
                  {children}
                </span>
              );
            }
            return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
          },
          code(
            {
              inline,
              className,
              style: codeStyle,
              children,
              ...props
            }: React.HTMLAttributes<HTMLElement> & {
              inline?: boolean;
              children?: React.ReactNode;
            }
          ) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                style={SYNTAX_HIGHLIGHTER_STYLE}
                customStyle={{
                  ...(codeStyle || {}),
                  backgroundColor: "transparent",
                  margin: 0,
                }}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          img({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
            // Handle data URLs and image artifacts
            if (src && src.startsWith('data:')) {
              return (
                <img
                  src={src}
                  alt={alt || ""}
                  className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  {...props}
                />
              );
            }
            // Handle container file URLs
            if (src && (src.startsWith("/api/container_files/content") || src.includes("/api/container_files/content?"))) {
              let fileId = "";
              let containerId = "";
              let filename = "";
              try {
                const u = new URL(src, window.location.origin);
                fileId = u.searchParams.get("file_id") || "";
                containerId = u.searchParams.get("container_id") || "";
                filename = u.searchParams.get("filename") || "";
              } catch {
                // ignore
              }

              if (fileId) {
                const artifact: any = {
                  id: `file-${fileId}`,
                  type: "file",
                  title: filename || fileId,
                  file_id: fileId,
                  ...(containerId ? { container_id: containerId } : {}),
                  ...(filename ? { filename } : {}),
                  mime_type: "application/octet-stream",
                  url: src,
                };
                
                return (
                  <div className="relative mt-2 h-64 w-full cursor-pointer" onClick={() => {
                    addArtifact(artifact);
                    setCurrentArtifact(artifact);
                  }}>
                    <Image
                      src={src}
                      alt={alt || filename || ""}
                      fill
                      sizes="100vw"
                      className="rounded-lg object-contain border border-gray-200 dark:border-gray-700"
                      unoptimized
                    />
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      View artifact
                    </div>
                  </div>
                );
              }
            }
            // Fallback for empty or invalid src
            if (!src) {
              return null;
            }
            return (
              <img
                src={src}
                alt={alt || ""}
                className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                {...props}
              />
            );
          },
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    );
  };

  return (
    <div className="text-[14px] leading-[1.6]">
      {message.role === "user" ? (
        <div className="flex justify-end">
          <div className="w-full max-w-[85%] sm:max-w-[75%] md:max-w-[70%]">
            <div
              className={`ml-auto rounded-2xl px-4 py-3 shadow-sm border ${
                theme === "dark"
                  ? "bg-white/[0.06] border-white/10 text-stone-50"
                  : "bg-black/5 border-black/10 text-stone-900"
              }`}
            >
              <div>
                <div>
                  <div
                    className={`prose prose-sm max-w-none prose-p:my-2 prose-li:my-1 prose-headings:my-3 prose-headings:font-semibold ${
                      theme === "dark" ? "prose-invert" : ""
                    }`}
                  >
                    <ReactMarkdown>{messageText}</ReactMarkdown>
                  </div>
                </div>
                {/* Display image if present */}
                {message.content.find((c) => c.type === "input_image" && c.image) && (
                  <div className="mt-2">
                    <div className="relative h-48 w-full">
                      <Image
                        src={message.content.find((c) => c.type === "input_image")?.image || ""}
                        alt="User uploaded"
                        fill
                        sizes="100vw"
                        unoptimized
                        className={`rounded-lg border object-contain ${
                          theme === "dark" ? "border-white/10" : "border-black/10"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex">
            <div className={`px-0 py-2 max-w-full ${theme === 'dark' ? 'text-stone-200' : 'text-stone-800'}`}>
              <div
                className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-2.5 prose-li:my-1 prose-headings:my-3 prose-headings:font-semibold prose-pre:rounded-xl prose-pre:border prose-pre:my-3 prose-pre:px-4 prose-pre:py-3 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-[''] prose-code:after:content-[''] ${
                  theme === "dark"
                    ? "prose-invert prose-pre:border-white/10 prose-pre:bg-white/[0.04] prose-code:bg-white/10"
                    : "prose-pre:border-black/10 prose-pre:bg-black/[0.02] prose-code:bg-black/5"
                }`}
              >
                {renderContent()}
                {message.content[0].annotations &&
                  message.content[0].annotations
                    .filter(
                      (a) =>
                        a.type === "container_file_citation" &&
                        a.filename &&
                        /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(a.filename)
                    )
                    .map((a, i) => (
                      <div key={i} className="relative mt-2 h-64 w-full">
                        <Image
                          src={`/api/container_files/content?file_id=${a.fileId}${a.containerId ? `&container_id=${a.containerId}` : ""}${a.filename ? `&filename=${encodeURIComponent(a.filename)}` : ""}`}
                          alt={a.filename || ""}
                          fill
                          sizes="100vw"
                          className="rounded-lg object-contain"
                        />
                      </div>
                    ))}
              </div>
              {/* Artifact buttons */}
              {messageArtifacts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {messageArtifacts.map((artifact, idx) => (
                    <button
                      key={artifact.id}
                      onClick={() => setCurrentArtifact(artifact)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        theme === "dark"
                          ? "bg-white/10 hover:bg-white/15 text-white border-white/10"
                          : "bg-black/5 hover:bg-black/10 text-stone-900 border-black/10"
                      }`}
                    >
                      <Eye size={16} />
                      View Artifact{messageArtifacts.length > 1 ? ` ${idx + 1}` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;
