"use client";

import Image from "next/image";

import React, { useEffect, useMemo, useState } from "react";

import { Download, ExternalLink, Image as ImageIcon } from "lucide-react";
import useThemeStore from "@/stores/useThemeStore";
import useArtifactStore from "@/stores/useArtifactStore";

type LibraryItem = {
  name: string;
  path: string;
  created_at?: string | null;
  url: string | null;
};

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

function getImageSource(path: string): { name: string; color: string } {
  if (path.startsWith("nano-banana/")) {
    return { name: "Nano Banana", color: "text-yellow-500" };
  } else if (path.startsWith("imagen/")) {
    return { name: "Imagen", color: "text-blue-500" };
  } else if (path.startsWith("generated/")) {
    return { name: "Generated", color: "text-green-500" };
  }
  return { name: "Unknown", color: "text-gray-500" };
}

function htmlForImage(url: string) {
  const safe = url.replace(/"/g, "%22");
  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;background:transparent;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${safe}" style="max-width:100%;max-height:100%;object-fit:contain;" /></body></html>`;
}

export default function ImagesLibrary({ limit = 100 }: { limit?: number }) {
  const { theme } = useThemeStore();
  const { addArtifact, setCurrentArtifact } = useArtifactStore();

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const borderClass = theme === "dark" ? "border-white/10" : "border-black/10";
  const cardClass = theme === "dark" ? "bg-white/[0.03]" : "bg-black/[0.02]";
  const textDim = theme === "dark" ? "text-stone-400" : "text-stone-500";
  const textMain = theme === "dark" ? "text-stone-100" : "text-stone-900";

  const url = useMemo(() => `/api/library/images?prefix=all&limit=${encodeURIComponent(String(limit))}`, [limit]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const next = Array.isArray(d?.items)
          ? (d.items as any[])
              .filter((x) => typeof x?.path === "string")
              .map((x) => ({
                name: String(x?.name || ""),
                path: String(x.path),
                created_at: typeof x?.created_at === "string" ? x.created_at : null,
                url: typeof x?.url === "string" ? x.url : null,
              }))
          : [];
        setItems(next);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load images");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-2 text-sm ${textMain}`}>
        <ImageIcon size={16} className={theme === "dark" ? "text-stone-200" : "text-stone-700"} />
        All Generated Images (Nano Banana, Imagen, Chat)
      </div>

      {loading ? (
        <div className={`text-sm ${textDim}`}>Loading…</div>
      ) : error ? (
        <div className={`text-sm ${theme === "dark" ? "text-red-300" : "text-red-700"}`}>{error}</div>
      ) : items.length === 0 ? (
        <div className={`text-sm ${textDim}`}>No images found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => {
            const src = item.url;
            const filename = src ? filenameFromUrl(src, item.name || "image.png") : item.name || "image.png";
            const source = getImageSource(item.path || "");

            return (
              <div
                key={item.path}
                className={`rounded-xl border overflow-hidden ${borderClass} ${cardClass}`}
              >
                <div className="aspect-square w-full bg-black/20">
                  {src ? (
                    <Image src={src} alt={item.name || "Generated image"} width={512} height={512} className="h-full w-full object-cover" />
                  ) : (
                    <div className={`h-full w-full flex items-center justify-center text-xs ${textDim}`}>No URL</div>
                  )}
                </div>

                <div className="p-2 flex flex-col gap-1">
                  <div className={`min-w-0 text-xs truncate ${textDim}`}>{item.name || item.path}</div>
                  <div className={`text-xs font-medium ${source.color}`}>{source.name}</div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={!src}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                        theme === "dark"
                          ? "border-white/10 bg-white/[0.04] text-stone-200 hover:bg-white/10 disabled:opacity-50"
                          : "border-black/10 bg-black/[0.02] text-stone-700 hover:bg-black/5 disabled:opacity-50"
                      }`}
                      onClick={() => {
                        if (!src) return;
                        const artifact: any = {
                          id: `image-${item.path}`,
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
                      href={src || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                        theme === "dark"
                          ? "border-white/10 bg-white/[0.04] text-stone-200 hover:bg-white/10"
                          : "border-black/10 bg-black/[0.02] text-stone-700 hover:bg-black/5"
                      } ${!src ? "pointer-events-none opacity-50" : ""}`}
                      title="Open in new tab"
                    >
                      <ExternalLink size={12} />
                    </a>

                    <button
                      type="button"
                      disabled={!src}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                        theme === "dark"
                          ? "border-white/10 bg-white/[0.04] text-stone-200 hover:bg-white/10 disabled:opacity-50"
                          : "border-black/10 bg-black/[0.02] text-stone-700 hover:bg-black/5 disabled:opacity-50"
                      }`}
                      onClick={async () => {
                        if (!src) return;
                        await downloadUrl(src, filename);
                      }}
                      title="Download"
                    >
                      <Download size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
