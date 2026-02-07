"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import useThemeStore from "@/stores/useThemeStore";
import PromptEnhancer from "@/components/prompt-enhancer";

type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9";
type ImageSize = "1K" | "2K" | "4K";
type Model = "gemini-2.5-flash-image" | "gemini-3-pro-image-preview";

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

const EXAMPLE_PROMPTS = [
  {
    title: "Photorealistic Scene",
    prompt: "A photo of an everyday scene at a busy cafe serving breakfast. In the foreground is an anime man with blue hair, one of the people is a pencil sketch, another is a claymation person",
    category: "photorealistic"
  },
  {
    title: "Icon Design",
    prompt: "An icon representing a cute dog. The background is white. Make the icons in a colorful and tactile 3D style. No text.",
    category: "icons"
  },
  {
    title: "Product Photography",
    prompt: "Put this logo on a high-end ad for a banana scented perfume. The logo is perfectly integrated into the bottle.",
    category: "commercial"
  },
  {
    title: "Magazine Cover",
    prompt: "A photo of a glossy magazine cover, the cover has the large bold words \"Nano Banana Pro\". The text is in a serif font and fills the view. No other text. In front of the text there is a portrait of a person in a beautiful outfit. Put the issue number and today's date in the corner along with a barcode and a price. The magazine is on a shelf against a brick wall, within a designer store. A mannequin is wearing the same outfit.",
    category: "editorial"
  },
  {
    title: "Isometric Office",
    prompt: "Make a photo that is perfectly isometric. It is not a miniature, it is a captured photo that just happened to be perfectly isometric. It is a photo of a beautiful modern office interior.",
    category: "architectural"
  },
  {
    title: "Image Restoration",
    prompt: "Faithfully restore this image with high fidelity to modern photograph quality, in full color, upscale to 4K",
    category: "restoration"
  }
];

export default function NanoBananaPage() {
  const { theme } = useThemeStore();

  const [model, setModel] = useState<Model>("gemini-2.5-flash-image");
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [imageSize, setImageSize] = useState<ImageSize>("1K");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");

  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImageDataUrl, setUploadedImageDataUrl] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const panelClass = theme === "dark" ? "border-white/10 bg-[#141414]" : "border-stone-200 bg-white";
  const textMain = theme === "dark" ? "text-stone-100" : "text-stone-900";
  const textDim = theme === "dark" ? "text-stone-400" : "text-stone-600";
  const buttonClass = theme === "dark" ? "bg-[#10a37f] hover:bg-[#0e9070] text-white" : "bg-stone-900 hover:bg-stone-800 text-white";

  const filteredPrompts = useMemo(() => {
    if (selectedCategory === "all") return EXAMPLE_PROMPTS;
    return EXAMPLE_PROMPTS.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    return prompt.trim().length > 0;
  }, [submitting, prompt]);

  const resetResults = () => {
    setResults([]);
    setError("");
  };

  const handleImageUpload = async (file: File | null) => {
    setError("");
    resetResults();

    setUploadedImage(file);
    if (!file) {
      setUploadedImageDataUrl("");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setUploadedImageDataUrl(dataUrl);
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
        prompt: prompt.trim(),
      };

      if (uploadedImageDataUrl) {
        payload.referenceImageDataUrl = uploadedImageDataUrl;
      }

      const res = await fetch("/api/nano-banana/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
        throw new Error(msg);
      }

      const next = Array.isArray(data?.urls) ? data.urls : [];
      setResults(next.filter((u: any) => typeof u === "string"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate images");
    } finally {
      setSubmitting(false);
    }
  };

  const useExamplePrompt = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    setError("");
    resetResults();
  };

  const getModelCapabilities = () => {
    if (model === "gemini-2.5-flash-image") {
      return {
        maxResolution: "1024px",
        strengths: ["Speed", "Efficiency", "High-volume tasks"],
        supportedSizes: ["1K"]
      };
    } else {
      return {
        maxResolution: "4K",
        strengths: ["Professional quality", "Complex instructions", "High-fidelity text", "Search grounding"],
        supportedSizes: ["1K", "2K", "4K"]
      };
    }
  };

  const capabilities = getModelCapabilities();

  return (
    <div className="min-h-[100dvh] w-full bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className={`text-lg font-semibold ${textMain}`}>Nano Banana Studio</h1>
            <p className={`text-sm ${textDim} mt-1`}>Gemini's native image generation capabilities</p>
          </div>
          <Link href="/" className={`text-sm underline ${theme === "dark" ? "text-stone-200" : "text-stone-700"}`}>
            Back to chat
          </Link>
        </div>

        {/* Model Info */}
        <div className={`mt-4 rounded-xl border p-4 ${panelClass}`}>
          <div className={`text-sm font-medium ${textMain}`}>Model: {model === "gemini-2.5-flash-image" ? "Nano Banana" : "Nano Banana Pro"}</div>
          <div className={`mt-2 text-xs ${textDim}`}>
            <div className="font-semibold">Capabilities:</div>
            <div>• Max Resolution: {capabilities.maxResolution}</div>
            <div>• Strengths: {capabilities.strengths.join(", ")}</div>
          </div>
        </div>

        {/* Main Controls */}
        <div className={`mt-4 rounded-xl border p-4 ${panelClass}`}>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Model</label>
                <select
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value as Model);
                    setError("");
                    resetResults();
                    // Reset image size if not supported
                    const newModel = e.target.value as Model;
                    if (newModel === "gemini-2.5-flash-image" && imageSize !== "1K") {
                      setImageSize("1K");
                    }
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  <option value="gemini-2.5-flash-image">Nano Banana (2.5 Flash)</option>
                  <option value="gemini-3-pro-image-preview">Nano Banana Pro (3 Pro)</option>
                </select>
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
                  disabled={!capabilities.supportedSizes.includes(imageSize)}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" 
                      ? "bg-transparent border-white/10 text-white disabled:opacity-50" 
                      : "bg-white border-stone-200 text-stone-900 disabled:opacity-50"
                  }`}
                >
                  <option value="1K">1K</option>
                  <option value="2K" disabled={!capabilities.supportedSizes.includes("2K")}>2K</option>
                  <option value="4K" disabled={!capabilities.supportedSizes.includes("4K")}>4K</option>
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
                  <option value="2:3">2:3</option>
                  <option value="3:2">3:2</option>
                  <option value="3:4">3:4</option>
                  <option value="4:3">4:3</option>
                  <option value="4:5">4:5</option>
                  <option value="5:4">5:4</option>
                  <option value="9:16">9:16</option>
                  <option value="16:9">16:9</option>
                  <option value="21:9">21:9</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${textMain}`}>Prompt</label>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      setError("");
                      resetResults();
                    }}
                    rows={4}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                      theme === "dark"
                        ? "bg-transparent border-white/10 text-white placeholder:text-stone-500"
                        : "bg-white border-stone-200 text-stone-900 placeholder:text-stone-400"
                    }`}
                    placeholder="Describe what you want to generate. Be specific about style, composition, lighting, and details."
                  />
                  <div className={`mt-1 text-xs ${textDim}`}>
                    {prompt.length} characters
                  </div>
                </div>
                <div className="mt-2">
                  <PromptEnhancer
                    prompt={prompt}
                    onPromptChange={(newPrompt) => {
                      setPrompt(newPrompt);
                      setError("");
                      resetResults();
                    }}
                    placeholder="Describe what you want to generate. Be specific about style, composition, lighting, and details."
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${textMain}`}>Reference image (optional)</label>
              <input
                type="file"
                accept="image/*"
                className={`mt-2 block w-full text-xs ${theme === "dark" ? "text-stone-200" : "text-stone-700"}`}
                onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
              />
              {uploadedImage ? (
                <div className={`mt-2 text-xs ${textDim}`}>{uploadedImage.name}</div>
              ) : (
                <div className={`mt-2 text-xs ${textDim}`}>Upload an image to use as style reference</div>
              )}
            </div>

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
                    : buttonClass
                }`}
              >
                {submitting ? "Generating..." : "Generate Images"}
              </button>
              <div className={`text-xs ${textDim}`}>
                Powered by Gemini {model === "gemini-2.5-flash-image" ? "2.5 Flash" : "3 Pro"} Image
              </div>
            </div>
          </div>
        </div>

        {/* Example Prompts */}
        <div className={`mt-4 rounded-xl border p-4 ${panelClass}`}>
          <div className={`text-sm font-medium ${textMain}`}>Example Prompts</div>
          <div className={`mt-2 text-xs ${textDim}`}>Click any example to use it as your prompt</div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === "all"
                  ? buttonClass
                  : theme === "dark" 
                    ? "bg-white/10 text-white hover:bg-white/20" 
                    : "bg-stone-200 text-stone-700 hover:bg-stone-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory("photorealistic")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === "photorealistic"
                  ? buttonClass
                  : theme === "dark" 
                    ? "bg-white/10 text-white hover:bg-white/20" 
                    : "bg-stone-200 text-stone-700 hover:bg-stone-300"
              }`}
            >
              Photorealistic
            </button>
            <button
              onClick={() => setSelectedCategory("icons")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === "icons"
                  ? buttonClass
                  : theme === "dark" 
                    ? "bg-white/10 text-white hover:bg-white/20" 
                    : "bg-stone-200 text-stone-700 hover:bg-stone-300"
              }`}
            >
              Icons
            </button>
            <button
              onClick={() => setSelectedCategory("commercial")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === "commercial"
                  ? buttonClass
                  : theme === "dark" 
                    ? "bg-white/10 text-white hover:bg-white/20" 
                    : "bg-stone-200 text-stone-700 hover:bg-stone-300"
              }`}
            >
              Commercial
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            {filteredPrompts.map((example, idx) => (
              <div
                key={idx}
                onClick={() => useExamplePrompt(example.prompt)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  theme === "dark" 
                    ? "border-white/10 hover:border-white/20 hover:bg-white/5" 
                    : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                <div className={`text-sm font-medium ${textMain}`}>{example.title}</div>
                <div className={`mt-1 text-xs ${textDim}`}>{example.prompt}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className={`mt-4 rounded-xl border p-4 ${panelClass}`}>
            <div className={`text-sm font-medium ${textMain}`}>Generated Images</div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {results.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img 
                    src={url} 
                    alt={`Generated image ${idx + 1}`} 
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-black px-2 py-1 rounded text-xs"
                    >
                      View Full Size
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
