"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Trash2, X } from "lucide-react";

import useThemeStore from "@/stores/useThemeStore";
import useArtifactStore from "@/stores/useArtifactStore";

type AppListItem = {
  id: string;
  title: string;
  type: "html" | "react" | "code" | "url";
  language: string | null;
  thumbnail: string | null;
  updatedAt: string;
  createdAt: string;
};

type AppDetail = {
  id: string;
  title: string;
  type: "html" | "react" | "code" | "url";
  language: string | null;
  code?: string;
  url?: string;
  updatedAt: string;
  createdAt: string;
};

export default function AppsGallery({ onClose }: { onClose: () => void }) {
  const { theme } = useThemeStore();
  const { setCurrentArtifact } = useArtifactStore();

  const [items, setItems] = useState<AppListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const listUrl = useMemo(() => "/api/apps?list=1", []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(listUrl);
      if (!res.ok) throw new Error(`Failed to load apps (${res.status})`);
      const data = await res.json().catch(() => null);
      const next = Array.isArray(data?.apps) ? data.apps : [];
      setItems(
        next
          .filter((x: any) => typeof x?.id === "string" && typeof x?.title === "string")
          .map((x: any) => ({
            id: String(x.id),
            title: String(x.title),
            type: x.type === "html" || x.type === "react" || x.type === "code" || x.type === "url" ? x.type : "code",
            language: typeof x.language === "string" ? x.language : null,
            thumbnail: typeof x.thumbnail === "string" ? x.thumbnail : null,
            updatedAt: typeof x.updatedAt === "string" ? x.updatedAt : "",
            createdAt: typeof x.createdAt === "string" ? x.createdAt : "",
          }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load apps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpen = async (id: string) => {
    try {
      const res = await fetch(`/api/apps?id=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`Failed to load app (${res.status})`);
      const data = await res.json().catch(() => null);
      const app: AppDetail | null = data?.app || null;
      if (!app) return;

      if (app.type === "url") {
        if (typeof (app as any).url !== "string" || !(app as any).url) return;
        setCurrentArtifact({
          id: app.id,
          type: "url",
          title: app.title,
          url: String((app as any).url),
        });
        onClose();
        return;
      }

      if (typeof (app as any).code !== "string") return;

      setCurrentArtifact({
        id: app.id,
        type: app.type,
        title: app.title,
        code: String((app as any).code),
        language: typeof app.language === "string" ? app.language : undefined,
      });
      onClose();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    const ok = window.confirm("Delete this saved app? This cannot be undone.");
    if (!ok) return;

    setDeletingId(id);
    try {
      await fetch(`/api/apps?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await load();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const panelClass = theme === "dark" ? "border-white/10 bg-[#141414]" : "border-stone-200 bg-white";
  const textMain = theme === "dark" ? "text-stone-100" : "text-stone-900";
  const textDim = theme === "dark" ? "text-stone-400" : "text-stone-600";

  const formatDate = (value: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const badgeClass = (type: AppListItem["type"]) => {
    const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide";
    if (theme === "dark") {
      if (type === "html") return `${base} bg-emerald-500/20 text-emerald-200 border border-emerald-500/20`;
      if (type === "react") return `${base} bg-sky-500/20 text-sky-200 border border-sky-500/20`;
      if (type === "url") return `${base} bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/20`;
      return `${base} bg-amber-500/20 text-amber-200 border border-amber-500/20`;
    }
    if (type === "html") return `${base} bg-emerald-50 text-emerald-700 border border-emerald-200`;
    if (type === "react") return `${base} bg-sky-50 text-sky-700 border border-sky-200`;
    if (type === "url") return `${base} bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200`;
    return `${base} bg-amber-50 text-amber-800 border border-amber-200`;
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black bg-opacity-30">
      <div className={`w-full max-w-3xl h-full overflow-y-auto border-l ml-auto ${panelClass}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${textMain}`}>App Gallery</h2>
            <button
              onClick={onClose}
              className={`p-1 rounded transition-colors ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-stone-100"}`}
              title="Close"
            >
              <X size={20} className={theme === "dark" ? "text-stone-300" : "text-stone-700"} />
            </button>
          </div>

          {loading ? (
            <div className={`text-sm ${textDim}`}>Loading…</div>
          ) : error ? (
            <div className={`text-sm ${theme === "dark" ? "text-red-300" : "text-red-700"}`}>{error}</div>
          ) : items.length === 0 ? (
            <div className={`text-sm ${textDim}`}>No saved apps yet. Open an artifact and click Save.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((app) => (
                <div
                  key={app.id}
                  className={`group rounded-xl border overflow-hidden ${
                    theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-stone-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleOpen(app.id)}
                    className="block w-full text-left"
                    title="Open"
                  >
                    <div className="relative w-full aspect-[16/10] overflow-hidden">
                      {app.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={app.thumbnail}
                          alt={app.title}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 flex items-center justify-center ${
                            theme === "dark" ? "bg-white/[0.04]" : "bg-stone-50"
                          }`}
                        >
                          <div className={`text-xs ${textDim}`}>No thumbnail</div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`text-sm font-semibold leading-snug ${textMain}`}>{app.title}</div>
                        <span className={badgeClass(app.type)}>{app.type}</span>
                      </div>
                      <div className={`mt-1 text-xs ${textDim}`}>
                        {app.language ? `${app.language} · ` : ""}Updated {formatDate(app.updatedAt)}
                      </div>
                    </div>
                  </button>
                  <div className="px-3 pb-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(app.id)}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        theme === "dark"
                          ? "border-white/10 hover:bg-white/10 text-stone-200"
                          : "border-stone-200 hover:bg-stone-100 text-stone-700"
                      }`}
                      title="Delete"
                      disabled={deletingId === app.id}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
