"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import useThemeStore from "@/stores/useThemeStore";

type RefImage = {
  id: string;
  file?: File;
  dataUrl?: string;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return reject(new Error("Invalid file result"));
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
}

export default function VeoVideoPage() {
  const { theme } = useThemeStore();
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [resolution, setResolution] = useState<"720p" | "1080p" | "4k">("720p");
  const [refs, setRefs] = useState<RefImage[]>([
    { id: "ref-1" },
    { id: "ref-2" },
    { id: "ref-3" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState<string>("");

  const panelClass = theme === "dark" ? "border-white/10 bg-[#141414]" : "border-stone-200 bg-white";
  const textMain = theme === "dark" ? "text-stone-100" : "text-stone-900";
  const textDim = theme === "dark" ? "text-stone-400" : "text-stone-600";

  const canSubmit = useMemo(() => {
    return !submitting && prompt.trim().length > 0;
  }, [submitting, prompt]);

  const setRefFile = async (idx: number, file: File | null) => {
    setError("");
    setVideoUrl("");

    const next = refs.slice();
    if (!file) {
      next[idx] = { ...next[idx], file: undefined, dataUrl: undefined };
      setRefs(next);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      next[idx] = { ...next[idx], file, dataUrl };
      setRefs(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reference image");
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");
    setVideoUrl("");

    try {
      const referenceImages = refs
        .map((r) => r.dataUrl)
        .filter((x): x is string => typeof x === "string" && x.length > 0);

      const res = await fetch("/api/videos/veo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          resolution,
          referenceImages,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
        throw new Error(msg);
      }

      const url = typeof data?.url === "string" ? data.url : "";
      if (!url) throw new Error("No video URL returned");
      setVideoUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate video");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className={`text-lg font-semibold ${textMain}`}>Veo Video Generator</h1>
          <Link
            href="/"
            className={`text-sm underline ${theme === "dark" ? "text-stone-200" : "text-stone-700"}`}
          >
            Back to chat
          </Link>
        </div>

        <div className={`mt-4 rounded-xl border p-4 ${panelClass}`}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={`block text-sm font-medium ${textMain}`}>Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                  theme === "dark"
                    ? "bg-transparent border-white/10 text-white placeholder:text-stone-500"
                    : "bg-white border-stone-200 text-stone-900 placeholder:text-stone-400"
                }`}
                placeholder="Describe the video you want to generate…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Aspect ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  <option value="16:9">16:9 (landscape)</option>
                  <option value="9:16">9:16 (portrait)</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as any)}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="4k">4k</option>
                </select>
              </div>
            </div>

            <div>
              <div className={`text-sm font-medium ${textMain}`}>Reference images (up to 3)</div>
              <div className={`mt-1 text-xs ${textDim}`}>Upload images to guide subject/product appearance.</div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {refs.map((r, idx) => (
                  <div key={r.id} className={`rounded-lg border p-3 ${theme === "dark" ? "border-white/10" : "border-stone-200"}`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setRefFile(idx, e.target.files?.[0] || null)}
                      className={`block w-full text-xs ${theme === "dark" ? "text-stone-200" : "text-stone-700"}`}
                    />
                    {r.dataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.dataUrl}
                        alt={`Reference ${idx + 1}`}
                        className="mt-3 w-full aspect-square object-cover rounded-md"
                      />
                    ) : (
                      <div className={`mt-3 w-full aspect-square rounded-md flex items-center justify-center ${theme === "dark" ? "bg-white/[0.04]" : "bg-stone-50"}`}>
                        <div className={`text-xs ${textDim}`}>No image</div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setRefFile(idx, null)}
                      className={`mt-3 w-full rounded-md border px-2 py-1.5 text-xs font-semibold ${
                        theme === "dark"
                          ? "border-white/10 text-stone-200 hover:bg-white/10"
                          : "border-stone-200 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      Clear
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error ? (
              <div className={`text-sm ${theme === "dark" ? "text-red-300" : "text-red-700"}`}>{error}</div>
            ) : null}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  !canSubmit
                    ? theme === "dark"
                      ? "bg-white/10 text-white/40"
                      : "bg-stone-200 text-stone-500"
                    : theme === "dark"
                      ? "bg-[#10a37f] hover:bg-[#0e9070] text-white"
                      : "bg-stone-900 hover:bg-stone-800 text-white"
                }`}
              >
                {submitting ? "Generating…" : "Generate video"}
              </button>
              <div className={`text-xs ${textDim}`}>Generation can take a few minutes.</div>
            </div>
          </div>
        </div>

        {videoUrl ? (
          <div className={`mt-4 rounded-xl border p-4 ${panelClass}`}>
            <div className={`text-sm font-medium ${textMain}`}>Result</div>
            <video
              className="mt-3 w-full rounded-lg"
              controls
              src={videoUrl}
            />
            <div className="mt-3">
              <a
                href={videoUrl}
                download
                className={`text-sm underline ${theme === "dark" ? "text-stone-200" : "text-stone-700"}`}
              >
                Download
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
