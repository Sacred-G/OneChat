import { MessageItem } from "@/lib/assistant";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { extractArtifacts } from "@/lib/artifact-parser";
import useArtifactStore from "@/stores/useArtifactStore";
import useThemeStore from "@/stores/useThemeStore";
import Image from "next/image";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Eye, Download, ExternalLink, FileText } from "lucide-react";

interface MessageProps {
  message: MessageItem;
}

const SYNTAX_HIGHLIGHTER_STYLE =
  vscDarkPlus as unknown as { [key: string]: React.CSSProperties };

const Message: React.FC<MessageProps> = ({ message }) => {
  const { addArtifact, setCurrentArtifact } = useArtifactStore();
  const { theme } = useThemeStore();
  const [messageArtifacts, setMessageArtifacts] = useState<any[]>([]);

  useEffect(() => {
    const allArtifacts: any[] = [];

    // Extract code artifacts from text
    if (message.role === "assistant" && message.content[0]?.text) {
      const { artifacts } = extractArtifacts(message.content[0].text as string);
      allArtifacts.push(...artifacts);
    }

    // Extract document artifacts from annotations (DOCX, XLSX, PPTX, PDF)
    if (message.role === "assistant" && message.content[0]?.annotations) {
      const docAnnotations = message.content[0].annotations.filter(
        (a: any) =>
          a.type === "container_file_citation" &&
          a.filename &&
          /\.(docx|xlsx|pptx)$/i.test(a.filename)
      );

      docAnnotations.forEach((a: any, idx: number) => {
        const fileUrl = `/api/container_files/content?file_id=${a.fileId}${a.containerId ? `&container_id=${a.containerId}` : ""}${a.filename ? `&filename=${encodeURIComponent(a.filename)}` : ""}`;
        const ext = a.filename.split('.').pop()?.toLowerCase();

        allArtifacts.push({
          id: `doc-artifact-${Date.now()}-${idx}`,
          type: ext === "docx" ? "docx" : "code", // For now only DOCX has preview support
          title: a.filename,
          code: "", // Will be loaded from fileUrl
          fileUrl,
          language: ext,
        });
      });
    }

    if (allArtifacts.length > 0) {
      setMessageArtifacts(allArtifacts);
      allArtifacts.forEach((artifact) => addArtifact(artifact));
    }
  }, [message, addArtifact]);

  const renderContent = () => {
    const text = message.content[0].text as string;
    const { cleanedContent } = extractArtifacts(text);

    return (
      <ReactMarkdown
        components={{
          a({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) {
            // Check if this is a file download link (API endpoint or sandbox URL)
            const isDownloadLink = href && (
              href.includes('/api/container_files/') ||
              href.includes('/api/files/') ||
              href.startsWith('sandbox:') ||
              /\.(docx|xlsx|pptx|pdf|zip|txt|csv|json)$/i.test(href)
            );

            // Check if external link
            const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));

            if (isDownloadLink) {
              // Convert sandbox: URLs to API endpoints if needed
              let downloadHref = href || '';
              if (downloadHref.startsWith('sandbox:')) {
                // Extract file path from sandbox URL and convert to API endpoint
                const filePath = downloadHref.replace('sandbox:', '');
                downloadHref = `/api/container_files/content?filename=${encodeURIComponent(filePath)}`;
              }

              return (
                <a
                  href={downloadHref}
                  download
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-white/10 hover:bg-white/20 text-blue-400"
                      : "bg-black/5 hover:bg-black/10 text-blue-600"
                  }`}
                  {...props}
                >
                  <Download size={14} />
                  {children}
                </a>
              );
            }

            if (isExternal) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 underline"
                  {...props}
                >
                  {children}
                  <ExternalLink size={12} />
                </a>
              );
            }

            // Default link behavior for internal navigation
            return <a href={href} {...props}>{children}</a>;
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
                customStyle={codeStyle}
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
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    );
  };

  return (
    <div className="text-sm leading-relaxed">
      {message.role === "user" ? (
        <div className="flex justify-end">
          <div className="w-full max-w-[85%] sm:max-w-[75%] md:max-w-[70%]">
            <div
              className={`ml-auto rounded-2xl px-4 py-3 shadow-sm ${
                theme === "dark"
                  ? "bg-white/10 text-white"
                  : "bg-black/5 text-stone-900"
              }`}
            >
              <div>
                <div>
                  <ReactMarkdown>
                    {message.content[0].text as string}
                  </ReactMarkdown>
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
            <div className={`px-1 py-2 max-w-full ${theme === 'dark' ? 'text-stone-200' : 'text-stone-800'}`}>
              <div
                className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:rounded-xl prose-pre:border ${
                  theme === "dark" ? "prose-invert prose-pre:border-white/10" : "prose-pre:border-black/10"
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
                  {messageArtifacts.map((artifact) => (
                    <button
                      key={artifact.id}
                      onClick={() => setCurrentArtifact(artifact)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        theme === "dark"
                          ? "bg-white/10 hover:bg-white/15 text-white border-white/10"
                          : "bg-black/5 hover:bg-black/10 text-stone-900 border-black/10"
                      }`}
                    >
                      {artifact.type === "docx" ? <FileText size={16} /> : <Eye size={16} />}
                      {artifact.type === "docx" ? `View ${artifact.title || "Document"}` : `View Artifact`}
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
