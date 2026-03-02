"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { 
  Sparkles, 
  Camera, 
  Palette, 
  Wand2, 
  Download,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Upload
} from "lucide-react";

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
    category: "photorealistic",
    icon: <Camera className="w-4 h-4" />,
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    title: "Icon Design",
    prompt: "An icon representing a cute dog. The background is white. Make the icons in a colorful and tactile 3D style. No text.",
    category: "icons",
    icon: <Palette className="w-4 h-4" />,
    gradient: "from-purple-500 to-pink-500"
  },
  {
    title: "Product Photography",
    prompt: "Put this logo on a high-end ad for a banana scented perfume. The logo is perfectly integrated into the bottle.",
    category: "commercial",
    icon: <Sparkles className="w-4 h-4" />,
    gradient: "from-amber-500 to-orange-500"
  },
  {
    title: "Magazine Cover",
    prompt: "A photo of a glossy magazine cover, the cover has the large bold words \"Nano Banana Pro\". The text is in a serif font and fills the view. No other text. In front of the text there is a portrait of a person in a beautiful outfit. Put the issue number and today's date in the corner along with a barcode and a price. The magazine is on a shelf against a brick wall, within a designer store. A mannequin is wearing the same outfit.",
    category: "editorial",
    icon: <Wand2 className="w-4 h-4" />,
    gradient: "from-rose-500 to-pink-500"
  },
  {
    title: "Isometric Office",
    prompt: "Make a photo that is perfectly isometric. It is not a miniature, it is a captured photo that just happened to be perfectly isometric. It is a photo of a beautiful modern office interior.",
    category: "architectural",
    icon: <Settings className="w-4 h-4" />,
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    title: "Image Restoration",
    prompt: "Faithfully restore this image with high fidelity to modern photograph quality, in full color, upscale to 4K",
    category: "restoration",
    icon: <RefreshCw className="w-4 h-4" />,
    gradient: "from-indigo-500 to-purple-500"
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

  const glassCard = "backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl";
  const textMain = "text-white";
  const textDim = "text-gray-300";
  const buttonPrimary = "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-semibold shadow-lg hover:shadow-xl transition-all duration-200";
  const buttonSecondary = "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm";

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

  const setExamplePrompt = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    setError("");
    resetResults();
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

  const getModelCapabilities = () => {
    if (model === "gemini-2.5-flash-image") {
      return {
        maxResolution: "1024px",
        strengths: ["Speed", "Efficiency", "High-volume tasks"],
        supportedSizes: ["1K"],
        badge: "bg-gradient-to-r from-green-500 to-emerald-500",
        name: "Nano Banana"
      };
    } else {
      return {
        maxResolution: "4K",
        strengths: ["Professional quality", "Complex instructions", "High-fidelity text", "Search grounding"],
        supportedSizes: ["1K", "2K", "4K"],
        badge: "bg-gradient-to-r from-purple-500 to-pink-500",
        name: "Nano Banana Pro"
      };
    }
  };

  const capabilities = getModelCapabilities();

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-x-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-yellow-500/5 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-2xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg">
              <Sparkles className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${textMain} mb-2`}>
                Nano Banana Studio
              </h1>
              <p className={`${textDim} text-lg`}>
                Gemini&apos;s native image generation capabilities
              </p>
            </div>
          </div>
          <Link 
            href="/" 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-200"
          >
            Back to chat
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Model Selection */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${textMain}`}>Model Selection</h2>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold text-black ${capabilities.badge}`}>
                  {capabilities.name}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setModel("gemini-2.5-flash-image");
                    setError("");
                    resetResults();
                    if (imageSize !== "1K") setImageSize("1K");
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    model === "gemini-2.5-flash-image"
                      ? "border-green-500 bg-green-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="text-left">
                    <div className={`font-semibold ${textMain} mb-1`}>Nano Banana</div>
                    <div className={`text-xs ${textDim} mb-2`}>2.5 Flash</div>
                    <div className="text-xs text-green-400">Max: {capabilities.maxResolution}</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setModel("gemini-3-pro-image-preview");
                    setError("");
                    resetResults();
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    model === "gemini-3-pro-image-preview"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="text-left">
                    <div className={`font-semibold ${textMain} mb-1`}>Nano Banana Pro</div>
                    <div className={`text-xs ${textDim} mb-2`}>3 Pro</div>
                    <div className="text-xs text-purple-400">Max: {capabilities.maxResolution}</div>
                  </div>
                </button>
              </div>

              <div className={`mt-4 p-3 rounded-lg bg-white/5 border border-white/10`}>
                <div className={`text-xs font-medium ${textMain} mb-2`}>Strengths:</div>
                <div className="flex flex-wrap gap-2">
                  {capabilities.strengths.map((strength, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Generation Settings */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-semibold ${textMain} mb-4`}>Generation Settings</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${textMain} mb-2`}>Images</label>
                  <select
                    value={numberOfImages}
                    onChange={(e) => {
                      setNumberOfImages(Number(e.target.value));
                      setError("");
                      resetResults();
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-yellow-400 focus:outline-none transition-colors"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textMain} mb-2`}>Size</label>
                  <select
                    value={imageSize}
                    onChange={(e) => {
                      setImageSize(e.target.value as ImageSize);
                      setError("");
                      resetResults();
                    }}
                    disabled={!capabilities.supportedSizes.includes(imageSize)}
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-yellow-400 focus:outline-none transition-colors disabled:opacity-50"
                  >
                    <option value="1K">1K</option>
                    <option value="2K" disabled={!capabilities.supportedSizes.includes("2K")}>2K</option>
                    <option value="4K" disabled={!capabilities.supportedSizes.includes("4K")}>4K</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textMain} mb-2`}>Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => {
                      setAspectRatio(e.target.value as AspectRatio);
                      setError("");
                      resetResults();
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-yellow-400 focus:outline-none transition-colors"
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
            </div>

            {/* Prompt Input */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-semibold ${textMain} mb-4`}>Prompt</h2>
              
              <div className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setError("");
                    resetResults();
                  }}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none transition-colors resize-none"
                  placeholder="Describe what you want to generate. Be specific about style, composition, lighting, and details."
                />
                
                <div className="flex items-center justify-between">
                  <div className={`text-xs ${textDim}`}>
                    {prompt.length} characters
                  </div>
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

            {/* Reference Image */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-semibold ${textMain} mb-4`}>Reference Image (Optional)</h2>
              
              <div className="space-y-4">
                <label className="flex items-center justify-center w-full h-32 px-4 py-6 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition-colors cursor-pointer bg-white/5">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                  />
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <div className={`text-sm ${textDim}`}>
                      {uploadedImage ? uploadedImage.name : "Click to upload or drag and drop"}
                    </div>
                    <div className={`text-xs ${textDim} mt-1`}>
                      PNG, JPG, GIF up to 10MB
                    </div>
                  </div>
                </label>

                {uploadedImageDataUrl && (
                  <div className="relative">
                    <Image 
                      src={uploadedImageDataUrl} 
                      alt="Reference" 
                      width={200}
                      height={200}
                      className="w-32 h-32 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => handleImageUpload(null)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canSubmit}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  !canSubmit
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : buttonPrimary
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Images
                  </>
                )}
              </button>
              
              <div className={`text-xs ${textDim}`}>
                Powered by Gemini {model === "gemini-2.5-flash-image" ? "2.5 Flash" : "3 Pro"} Image
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div className={`text-sm text-red-400`}>{error}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Examples & Results */}
          <div className="space-y-6">
            {/* Example Prompts */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-semibold ${textMain} mb-4`}>Example Prompts</h2>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                    selectedCategory === "all"
                      ? buttonPrimary
                      : buttonSecondary
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedCategory("photorealistic")}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                    selectedCategory === "photorealistic"
                      ? buttonPrimary
                      : buttonSecondary
                  }`}
                >
                  Photorealistic
                </button>
                <button
                  onClick={() => setSelectedCategory("icons")}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                    selectedCategory === "icons"
                      ? buttonPrimary
                      : buttonSecondary
                  }`}
                >
                  Icons
                </button>
                <button
                  onClick={() => setSelectedCategory("commercial")}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                    selectedCategory === "commercial"
                      ? buttonPrimary
                      : buttonSecondary
                  }`}
                >
                  Commercial
                </button>
              </div>

              <div className="space-y-3">
                {filteredPrompts.map((example, idx) => (
                  <div
                    key={idx}
                    onClick={() => setExamplePrompt(example.prompt)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:border-white/30 hover:bg-white/5 ${
                      theme === "dark" 
                        ? "border-white/10" 
                        : "border-stone-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${example.gradient}`}>
                        {example.icon}
                      </div>
                      <div className={`font-medium ${textMain}`}>{example.title}</div>
                    </div>
                    <div className={`text-xs ${textDim} leading-relaxed`}>{example.prompt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className={`mt-8 ${glassCard} rounded-2xl p-6`}>
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className={`text-2xl font-semibold ${textMain}`}>Generated Images</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {results.map((url, idx) => (
                <div key={idx} className="relative group">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    <Image 
                      src={url} 
                      alt={`Generated image ${idx + 1}`} 
                      width={512}
                      height={512}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 rounded-xl flex items-center justify-center">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 text-black px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-white"
                      >
                        <Download className="w-4 h-4" />
                        View Full Size
                      </a>
                    </div>
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
