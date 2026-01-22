"use client";

import React from "react";
import useThemeStore from "@/stores/useThemeStore";
import useConversationStore from "@/stores/useConversationStore";
import { SCENES } from "@/prompts";
import Image from "next/image";

type SubTheme = {
  id: string;
  label: string;
  prompt: string;
};

type Scene = {
  id: string;
  title: string;
  description?: string;
  emoji?: string;
  isCustom?: boolean;
  subThemes?: SubTheme[];
};

const toSceneList = (): Scene[] => {
  const raw = Array.isArray(SCENES) ? (SCENES as any[]) : [];
  return raw
    .filter((s) => s && typeof s === "object" && typeof (s as any).id === "string")
    .map((s) => ({
      id: String((s as any).id),
      title: String((s as any).title ?? (s as any).id),
      description: typeof (s as any).description === "string" ? (s as any).description : undefined,
      emoji: typeof (s as any).emoji === "string" ? (s as any).emoji : undefined,
      isCustom: Boolean((s as any).isCustom),
      subThemes: Array.isArray((s as any).subThemes) ? ((s as any).subThemes as any[]) : [],
    }));
};

export default function DestinationsPanel() {
  const { theme } = useThemeStore();
  const { addChatMessage, addConversationItem } = useConversationStore();

  const scenes = React.useMemo(() => toSceneList(), []);

  const [sceneId, setSceneId] = React.useState<string>(scenes[0]?.id ?? "");
  const scene = React.useMemo(() => scenes.find((s) => s.id === sceneId) || scenes[0], [sceneId, scenes]);

  const subThemes = React.useMemo(() => {
    const list = Array.isArray(scene?.subThemes) ? scene.subThemes : [];
    return list
      .filter((t: any) => t && typeof t === "object" && typeof t.id === "string")
      .map((t: any) => ({
        id: String(t.id),
        label: String(t.label ?? t.id),
        prompt: String(t.prompt ?? ""),
      }));
  }, [scene]);

  const [subThemeId, setSubThemeId] = React.useState<string>(subThemes[0]?.id ?? "");

  React.useEffect(() => {
    setSubThemeId(subThemes[0]?.id ?? "");
  }, [sceneId]);

  const subTheme = React.useMemo(
    () => subThemes.find((t) => t.id === subThemeId) || subThemes[0],
    [subThemeId, subThemes]
  );

  const [customPrompt, setCustomPrompt] = React.useState<string>("");
  const [extraInstructions, setExtraInstructions] = React.useState<string>("");
  const [inputImageDataUrl, setInputImageDataUrl] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  const resolvedPrompt = React.useMemo(() => {
    const base = scene?.isCustom ? customPrompt.trim() : String(subTheme?.prompt || "").trim();
    const extra = extraInstructions.trim();
    if (!extra) return base;
    if (!base) return extra;
    return `${base}\n\n${extra}`;
  }, [customPrompt, extraInstructions, scene?.isCustom, subTheme?.prompt]);

  const handleGenerate = async () => {
    if (isLoading) return;
    setError("");

    if (!resolvedPrompt) {
      setError(scene?.isCustom ? "Enter a custom prompt." : "Select a style with a prompt.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/functions/generate_images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: resolvedPrompt,
          ...(inputImageDataUrl ? { imageDataUrl: inputImageDataUrl } : {}),
        }),
      });

      const data = await res.json().catch(() => null);
      const urls = Array.isArray(data?.urls) ? data.urls : [];
      const list = urls.filter((u: any) => typeof u === "string" && u.trim());
      const err = typeof data?.error === "string" ? data.error : null;

      if (!res.ok) {
        setError(err || `Request failed (${res.status})`);
        return;
      }

      if (list.length === 0) {
        setError(err || "No images returned.");
        return;
      }

      const title = `${scene?.emoji ? `${scene.emoji} ` : ""}${scene?.title || "Destination"}`;
      const header = subTheme?.label ? `**${title} — ${subTheme.label}**` : `**${title}**`;
      const text = `${header}\n\n${list.map((u: string) => `![Generated image](${u})`).join("\n\n")}`;

      addChatMessage({
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text } as any],
      } as any);

      addConversationItem({
        role: "assistant",
        content: [{ type: "output_text", text }],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = `h-9 w-full rounded-md border px-2 text-sm outline-none ${
    theme === "dark"
      ? "bg-transparent border-white/10 text-white"
      : "bg-white border-black/10 text-gray-900"
  }`;

  const textareaClass = `w-full rounded-md border px-3 py-2 text-sm outline-none min-h-[84px] ${
    theme === "dark"
      ? "bg-transparent border-white/10 text-white"
      : "bg-white border-black/10 text-gray-900"
  }`;

  const buttonClass = `inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm disabled:opacity-50 ${
    theme === "dark"
      ? "border-white/10 bg-transparent text-white hover:bg-white/10"
      : "border-stone-300 bg-white text-stone-900 hover:bg-stone-50"
  }`;

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (result) setInputImageDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-stone-900"}`}>
          Destination
        </div>
        <select
          className={inputClass}
          value={sceneId}
          onChange={(e) => setSceneId(e.target.value)}
        >
          {scenes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.emoji ? `${s.emoji} ` : ""}{s.title}
            </option>
          ))}
        </select>
        {scene?.description ? (
          <div className={`text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
            {scene.description}
          </div>
        ) : null}
      </div>

      {!scene?.isCustom && (
        <div className="space-y-1">
          <div className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-stone-900"}`}>
            Style
          </div>
          <select
            className={inputClass}
            value={subThemeId}
            onChange={(e) => setSubThemeId(e.target.value)}
            disabled={subThemes.length === 0}
          >
            {subThemes.length === 0 ? (
              <option value="">No styles</option>
            ) : (
              subThemes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {scene?.isCustom && (
        <div className="space-y-1">
          <div className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-stone-900"}`}>
            Custom prompt
          </div>
          <textarea
            className={textareaClass}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe the destination/style you want…"
          />
        </div>
      )}

      <div className="space-y-1">
        <div className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-stone-900"}`}>
          Extra instructions (optional)
        </div>
        <textarea
          className={textareaClass}
          value={extraInstructions}
          onChange={(e) => setExtraInstructions(e.target.value)}
          placeholder="e.g. cinematic lighting, photoreal, no text, consistent face"
        />
      </div>

      <div className="space-y-2">
        <div className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-stone-900"}`}>
          Photo (optional)
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />
        {inputImageDataUrl ? (
          <div className="space-y-2">
            <div className={`relative h-40 w-full rounded-lg border overflow-hidden ${theme === "dark" ? "border-white/10" : "border-black/10"}`}>
              <Image
                src={inputImageDataUrl}
                alt="Uploaded"
                fill
                sizes="100vw"
                unoptimized
                className="object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className={buttonClass} onClick={handlePickImage} disabled={isLoading}>
                Change photo
              </button>
              <button
                type="button"
                className={buttonClass}
                onClick={() => setInputImageDataUrl("")}
                disabled={isLoading}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className={buttonClass} onClick={handlePickImage} disabled={isLoading}>
            Upload photo
          </button>
        )}
        <div className={`text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
          Upload a photo and we’ll reimagine that person in the selected destination/style.
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className={buttonClass} onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? "Generating…" : "Generate 6 images"}
        </button>
        {error ? (
          <div className={`text-xs ${theme === "dark" ? "text-red-300" : "text-red-600"}`}>{error}</div>
        ) : null}
      </div>
    </div>
  );
}
