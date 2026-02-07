"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import useThemeStore from "@/stores/useThemeStore";
import PromptEnhancer from "@/components/prompt-enhancer";

type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

type PersonGeneration = "dont_allow" | "allow_adult" | "allow_all";

type ImageSize = "1K" | "2K";

type Shot = { id: string; prompt: string };

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

const CAMERA_PROXIMITY = ["", "close-up", "zoomed out"] as const;
const CAMERA_POSITION = ["", "aerial photo", "from below"] as const;
const LIGHTING = ["", "natural lighting", "dramatic lighting", "warm lighting", "cold lighting", "golden hour"] as const;
const CAMERA_SETTINGS = ["", "motion blur", "soft focus", "bokeh", "portrait"] as const;
const LENS_TYPES = ["", "35mm", "50mm", "wide angle", "fisheye", "macro lens", "telephoto zoom"] as const;
const FILM_TYPES = ["", "black and white photo", "polaroid portrait", "film noir"] as const;
const ART_STYLES = [
  "",
  "digital art",
  "technical pencil drawing",
  "charcoal drawing",
  "color pencil drawing",
  "pastel painting",
  "art deco poster",
  "impressionist painting",
  "renaissance painting",
  "pop art",
] as const;

export default function ImagenPage() {
  const { theme } = useThemeStore();

  const [mode, setMode] = useState<"single" | "storyboard">("single");

  const [model, setModel] = useState("imagen-4.0-generate-001");
  const [numberOfImages, setNumberOfImages] = useState(4);
  const [imageSize, setImageSize] = useState<ImageSize>("1K");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [personGeneration, setPersonGeneration] = useState<PersonGeneration>("allow_adult");

  const [basePrompt, setBasePrompt] = useState("");

  const [cameraProximity, setCameraProximity] = useState<(typeof CAMERA_PROXIMITY)[number]>("");
  const [cameraPosition, setCameraPosition] = useState<(typeof CAMERA_POSITION)[number]>("");
  const [lighting, setLighting] = useState<(typeof LIGHTING)[number]>("");
  const [cameraSettings, setCameraSettings] = useState<(typeof CAMERA_SETTINGS)[number]>("");
  const [lensType, setLensType] = useState<(typeof LENS_TYPES)[number]>("");
  const [filmType, setFilmType] = useState<(typeof FILM_TYPES)[number]>("");
  const [artStyle, setArtStyle] = useState<(typeof ART_STYLES)[number]>("");

  const [customModifiers, setCustomModifiers] = useState("");

  const [inspirationFile, setInspirationFile] = useState<File | null>(null);
  const [inspirationDataUrl, setInspirationDataUrl] = useState<string>("");

  const [shots, setShots] = useState<Shot[]>([
    { id: "shot-1", prompt: "" },
    { id: "shot-2", prompt: "" },
    { id: "shot-3", prompt: "" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [urls, setUrls] = useState<string[]>([]);
  const [storyResults, setStoryResults] = useState<Array<{ prompt: string; urls: string[] }>>([]);

  const panelClass = theme === "dark" ? "border-white/10 bg-[#141414]" : "border-stone-200 bg-white";
  const textMain = theme === "dark" ? "text-stone-100" : "text-stone-900";
  const textDim = theme === "dark" ? "text-stone-400" : "text-stone-600";

  const composedPrompt = useMemo(() => {
    const parts = [
      basePrompt.trim(),
      cameraProximity,
      cameraPosition,
      lighting,
      cameraSettings,
      lensType,
      filmType,
      artStyle,
      customModifiers.trim(),
    ].filter((p) => typeof p === "string" && p.trim().length > 0);

    return parts.join(", ");
  }, [basePrompt, cameraProximity, cameraPosition, lighting, cameraSettings, lensType, filmType, artStyle, customModifiers]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (mode === "single") return composedPrompt.trim().length > 0;
    return shots.some((s) => s.prompt.trim().length > 0) && composedPrompt.trim().length > 0;
  }, [submitting, mode, composedPrompt, shots]);

  const resetResults = () => {
    setUrls([]);
    setStoryResults([]);
  };

  const handlePickInspiration = async (file: File | null) => {
    setError("");
    resetResults();

    setInspirationFile(file);
    if (!file) {
      setInspirationDataUrl("");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setInspirationDataUrl(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load image");
    }
  };

  const handleGenerate = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");
    resetResults();

    try {
      const payload: any = {
        model,
        numberOfImages,
        imageSize,
        aspectRatio,
        personGeneration,
        inspirationImageDataUrl: inspirationDataUrl || undefined,
      };

      if (mode === "single") {
        payload.prompt = composedPrompt;
      } else {
        payload.prompts = shots
          .map((s) => s.prompt.trim())
          .filter(Boolean)
          .map((shotPrompt) => `${composedPrompt}\n\nStoryboard shot: ${shotPrompt}`);
      }

      const res = await fetch("/api/imagen/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
        throw new Error(msg);
      }

      if (mode === "single") {
        const next = Array.isArray(data?.urls) ? data.urls : [];
        setUrls(next.filter((u: any) => typeof u === "string"));
      } else {
        const next = Array.isArray(data?.results) ? data.results : [];
        setStoryResults(
          next
            .filter((r: any) => typeof r?.prompt === "string" && Array.isArray(r?.urls))
            .map((r: any) => ({
              prompt: String(r.prompt),
              urls: (r.urls || []).filter((u: any) => typeof u === "string"),
            }))
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate images");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className={`text-lg font-semibold ${textMain}`}>Imagen Studio</h1>
          <Link href="/" className={`text-sm underline ${theme === "dark" ? "text-stone-200" : "text-stone-700"}`}>
            Back to chat
          </Link>
        </div>

        <div className={`mt-4 rounded-xl border p-4 ${panelClass}`}>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Mode</label>
                <select
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value as any);
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  <option value="single">Single prompt</option>
                  <option value="storyboard">Storyboard</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Model</label>
                <input
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                />
                <div className={`mt-1 text-xs ${textDim}`}>Default: imagen-4.0-generate-001</div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textMain}`}># images</label>
                <select
                  value={numberOfImages}
                  onChange={(e) => {
                    setNumberOfImages(Number(e.target.value));
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Image size</label>
                <select
                  value={imageSize}
                  onChange={(e) => {
                    setImageSize(e.target.value as ImageSize);
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  <option value="1K">1K</option>
                  <option value="2K">2K</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Aspect ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => {
                    setAspectRatio(e.target.value as AspectRatio);
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  <option value="1:1">1:1</option>
                  <option value="4:3">4:3</option>
                  <option value="3:4">3:4</option>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textMain}`}>People</label>
                <select
                  value={personGeneration}
                  onChange={(e) => {
                    setPersonGeneration(e.target.value as PersonGeneration);
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  <option value="dont_allow">Dont allow</option>
                  <option value="allow_adult">Allow adult (default)</option>
                  <option value="allow_all">Allow all</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${textMain}`}>Prompt</label>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <textarea
                    value={basePrompt}
                    onChange={(e) => {
                      setBasePrompt(e.target.value);
                      setError("");
                      resetResults();
                    }}
                    rows={3}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                      theme === "dark"
                        ? "bg-transparent border-white/10 text-white placeholder:text-stone-500"
                        : "bg-white border-stone-200 text-stone-900 placeholder:text-stone-400"
                    }`}
                    placeholder="Describe your subject + context. Use the dropdowns to add style/camera modifiers."
                  />
                  <div className={`mt-2 text-xs ${textDim}`}>
                    <div className="font-semibold">Composed prompt:</div>
                    <div className="mt-1 break-words">{composedPrompt || "(empty)"}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <PromptEnhancer
                    prompt={basePrompt}
                    onPromptChange={(newPrompt) => {
                      setBasePrompt(newPrompt);
                      setError("");
                      resetResults();
                    }}
                    placeholder="Describe your subject + context. Use the dropdowns to add style/camera modifiers."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Camera proximity</label>
                <select
                  value={cameraProximity}
                  onChange={(e) => {
                    setCameraProximity(e.target.value as any);
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  {CAMERA_PROXIMITY.map((v) => (
                    <option key={v || "none"} value={v}>
                      {v || "(none)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Camera position</label>
                <select
                  value={cameraPosition}
                  onChange={(e) => {
                    setCameraPosition(e.target.value as any);
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  {CAMERA_POSITION.map((v) => (
                    <option key={v || "none"} value={v}>
                      {v || "(none)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Lighting</label>
                <select
                  value={lighting}
                  onChange={(e) => {
                    setLighting(e.target.value as any);
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  {LIGHTING.map((v) => (
                    <option key={v || "none"} value={v}>
                      {v || "(none)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Camera settings</label>
                <select
                  value={cameraSettings}
                  onChange={(e) => {
                    setCameraSettings(e.target.value as any);
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  {CAMERA_SETTINGS.map((v) => (
                    <option key={v || "none"} value={v}>
                      {v || "(none)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Lens / focal length</label>
                <select
                  value={lensType}
                  onChange={(e) => {
                    setLensType(e.target.value as any);
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  {LENS_TYPES.map((v) => (
                    <option key={v || "none"} value={v}>
                      {v || "(none)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Film type</label>
                <select
                  value={filmType}
                  onChange={(e) => {
                    setFilmType(e.target.value as any);
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  {FILM_TYPES.map((v) => (
                    <option key={v || "none"} value={v}>
                      {v || "(none)"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={`block text-sm font-medium ${textMain}`}>Art style</label>
                <select
                  value={artStyle}
                  onChange={(e) => {
                    setArtStyle(e.target.value as any);
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  {ART_STYLES.map((v) => (
                    <option key={v || "none"} value={v}>
                      {v || "(none)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Custom modifiers</label>
                <input
                  value={customModifiers}
                  onChange={(e) => {
                    setCustomModifiers(e.target.value);
                    setError("");
                    resetResults();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                  placeholder="e.g., HDR, 4k, duotone blue and grey"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${textMain}`}>Inspiration image (optional)</label>
              <input
                type="file"
                accept="image/*"
                className={`mt-2 block w-full text-xs ${theme === "dark" ? "text-stone-200" : "text-stone-700"}`}
                onChange={(e) => handlePickInspiration(e.target.files?.[0] || null)}
              />
              {inspirationFile ? (
                <div className={`mt-2 text-xs ${textDim}`}>{inspirationFile.name}</div>
              ) : (
                <div className={`mt-2 text-xs ${textDim}`}>No inspiration image selected.</div>
              )}
            </div>

            {mode === "storyboard" ? (
              <div>
                <div className={`text-sm font-medium ${textMain}`}>Storyboard shots</div>
                <div className={`mt-1 text-xs ${textDim}`}>Each shot prompt is appended to the composed prompt and generated as a batch.</div>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {shots.map((s, idx) => (
                    <input
                      key={s.id}
                      value={s.prompt}
                      onChange={(e) => {
                        const next = shots.slice();
                        next[idx] = { ...s, prompt: e.target.value };
                        setShots(next);
                        setError("");
                        resetResults();
                      }}
                      className={`h-10 w-full rounded-lg border px-3 text-sm outline-none ${
                        theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                      }`}
                      placeholder={`Shot ${idx + 1} prompt (e.g., wide establishing shot...)`}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className={`text-sm ${theme === "dark" ? "text-red-300" : "text-red-700"}`}>{error}</div>
            ) : null}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerate}
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
                {submitting ? "Generating" : "Generate"}
              </button>
              <div className={`text-xs ${textDim}`}>Uses Imagen for generation; dropdowns help build prompt modifiers from the docs.</div>
            </div>
          </div>
        </div>

        {mode === "single" && urls.length > 0 ? (
          <div className={`mt-4 rounded-xl border p-4 ${panelClass}`}>
            <div className={`text-sm font-medium ${textMain}`}>Results</div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {urls.map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u} src={u} alt="Generated" className="w-full aspect-square object-cover rounded-lg" />
              ))}
            </div>
          </div>
        ) : null}

        {mode === "storyboard" && storyResults.length > 0 ? (
          <div className={`mt-4 rounded-xl border p-4 ${panelClass}`}>
            <div className={`text-sm font-medium ${textMain}`}>Storyboard results</div>
            <div className="mt-3 grid grid-cols-1 gap-4">
              {storyResults.map((r, idx) => (
                <div key={`${idx}-${r.prompt}`} className={`rounded-lg border p-3 ${theme === "dark" ? "border-white/10" : "border-stone-200"}`}>
                  <div className={`text-xs ${textDim}`}>Prompt</div>
                  <div className={`mt-1 text-sm ${textMain}`}>{r.prompt}</div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {r.urls.map((u) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={u} src={u} alt="Generated" className="w-full aspect-square object-cover rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
