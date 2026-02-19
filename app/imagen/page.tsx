"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { 
  Palette, 
  Camera, 
  Wand2, 
  Download,
  CheckCircle,
  AlertCircle,
  Upload,
  Sparkles,
} from "lucide-react";

import useThemeStore from "@/stores/useThemeStore";

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

const EXAMPLE_PROMPTS = [
  {
    title: "Digital Art Portrait",
    prompt: "A stunning digital art portrait of a fantasy warrior with glowing armor, detailed facial features, and dramatic lighting",
    category: "digital-art",
    icon: <Palette className="w-4 h-4" />,
    gradient: "from-purple-500 to-pink-500"
  },
  {
    title: "Photorealistic Landscape",
    prompt: "A photorealistic landscape of a serene mountain lake at sunrise, with mist rising from the water and golden light filtering through pine trees",
    category: "photorealistic",
    icon: <Camera className="w-4 h-4" />,
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    title: "Character Design",
    prompt: "Character design sheet for a steampunk inventor, showing front, side, and back views with detailed costume elements and accessories",
    category: "character",
    icon: <Wand2 className="w-4 h-4" />,
    gradient: "from-amber-500 to-orange-500"
  }
];

export default function ImagenPage() {
  const { theme } = useThemeStore();

  const [mode, setMode] = useState<"single" | "multi">("single");
  const [imageSize, setImageSize] = useState<ImageSize>("1K");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [personGeneration, setPersonGeneration] = useState<PersonGeneration>("dont_allow");

  const [basePrompt, setBasePrompt] = useState("");
  const [cameraProximity, setCameraProximity] = useState("");
  const [cameraPosition, setCameraPosition] = useState("");
  const [lighting, setLighting] = useState("");
  const [cameraSettings, setCameraSettings] = useState("");
  const [lensType, setLensType] = useState("");
  const [filmType, setFilmType] = useState("");
  const [artStyle, setArtStyle] = useState("");
  const [customModifiers, setCustomModifiers] = useState("");

  const [shots, setShots] = useState<Shot[]>([{ id: "1", prompt: "" }]);
  const [inspirationFile, setInspirationFile] = useState<File | null>(null);
  const [inspirationDataUrl, setInspirationDataUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const glassCard = "backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl";
  const textMain = "text-white";
  const textDim = "text-gray-300";
  const buttonPrimary = "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200";
  const buttonSecondary = "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm";

  const composedPrompt = useMemo(() => {
    const parts = [
      mode === "single" ? basePrompt : "",
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
  }, [basePrompt, cameraProximity, cameraPosition, lighting, cameraSettings, lensType, filmType, artStyle, customModifiers, mode]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (mode === "single") return composedPrompt.trim().length > 0;
    return shots.some((s) => s.prompt.trim().length > 0) && composedPrompt.trim().length > 0;
  }, [submitting, mode, composedPrompt, shots]);

  const resetResults = () => {
    setResults([]);
    setError("");
  };

  const handleInspirationFile = async (file: File | null) => {
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
        mode,
        imageSize,
        aspectRatio,
        personGeneration,
        prompt: composedPrompt.trim(),
      };

      if (inspirationDataUrl) {
        payload.inspirationImageDataUrl = inspirationDataUrl;
      }

      if (mode === "multi") {
        payload.shots = shots.map((s) => ({ id: s.id, prompt: s.prompt.trim() })).filter((s) => s.prompt.length > 0);
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

      const next = Array.isArray(data?.urls) ? data.urls : [];
      setResults(next.filter((u: any) => typeof u === "string"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate images");
    } finally {
      setSubmitting(false);
    }
  };

  const addShot = () => {
    const newId = String(Math.max(...shots.map((s) => Number(s.id)), 0) + 1);
    setShots([...shots, { id: newId, prompt: "" }]);
  };

  const removeShot = (id: string) => {
    if (shots.length > 1) {
      setShots(shots.filter((s) => s.id !== id));
    }
  };

  const updateShot = (id: string, prompt: string) => {
    setShots(shots.map((s) => (s.id === id ? { ...s, prompt } : s)));
  };

  const filteredPrompts = useMemo(() => {
    if (selectedCategory === "all") return EXAMPLE_PROMPTS;
    return EXAMPLE_PROMPTS.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-pink-500/5 blur-3xl" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-2xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${textMain} mb-2`}>
                Imagen Studio
              </h1>
              <p className={`${textDim} text-lg`}>
                Google&apos;s advanced image generation with creative controls
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
            {/* Mode Selection */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-semibold ${textMain} mb-4`}>Generation Mode</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setMode("single");
                    setError("");
                    resetResults();
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    mode === "single"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="text-left">
                    <div className={`font-semibold ${textMain} mb-1`}>Single Image</div>
                    <div className={`text-xs ${textDim}`}>Generate one detailed image</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMode("multi");
                    setError("");
                    resetResults();
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    mode === "multi"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="text-left">
                    <div className={`font-semibold ${textMain} mb-1`}>Multi-Shot</div>
                    <div className={`text-xs ${textDim}`}>Generate multiple variations</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Generation Settings */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-semibold ${textMain} mb-4`}>Generation Settings</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${textMain} mb-2`}>Size</label>
                  <select
                    value={imageSize}
                    onChange={(e) => {
                      setImageSize(e.target.value as ImageSize);
                      setError("");
                      resetResults();
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none transition-colors"
                  >
                    <option value="1K">1K</option>
                    <option value="2K">2K</option>
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
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none transition-colors"
                  >
                    <option value="1:1">1:1</option>
                    <option value="3:4">3:4</option>
                    <option value="4:3">4:3</option>
                    <option value="9:16">9:16</option>
                    <option value="16:9">16:9</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textMain} mb-2`}>Person Generation</label>
                  <select
                    value={personGeneration}
                    onChange={(e) => {
                      setPersonGeneration(e.target.value as PersonGeneration);
                      setError("");
                      resetResults();
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none transition-colors"
                  >
                    <option value="dont_allow">Don&apos;t Allow</option>
                    <option value="allow_adult">Allow Adults</option>
                    <option value="allow_all">Allow All</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Creative Controls */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-semibold ${textMain} mb-4`}>Creative Controls</h2>
              
              <div className="space-y-4">
                {mode === "single" && (
                  <div>
                    <label className={`block text-sm font-medium ${textMain} mb-2`}>Base Prompt</label>
                    <textarea
                      value={basePrompt}
                      onChange={(e) => {
                        setBasePrompt(e.target.value);
                        setError("");
                        resetResults();
                      }}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors resize-none"
                      placeholder="Describe what you want to generate..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${textMain} mb-2`}>Camera Proximity</label>
                    <select
                      value={cameraProximity}
                      onChange={(e) => {
                        setCameraProximity(e.target.value);
                        setError("");
                        resetResults();
                      }}
                      className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none transition-colors"
                    >
                      {CAMERA_PROXIMITY.map((option) => (
                        <option key={option} value={option}>
                          {option || "None"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${textMain} mb-2`}>Camera Position</label>
                    <select
                      value={cameraPosition}
                      onChange={(e) => {
                        setCameraPosition(e.target.value);
                        setError("");
                        resetResults();
                      }}
                      className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none transition-colors"
                    >
                      {CAMERA_POSITION.map((option) => (
                        <option key={option} value={option}>
                          {option || "None"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${textMain} mb-2`}>Lighting</label>
                    <select
                      value={lighting}
                      onChange={(e) => {
                        setLighting(e.target.value);
                        setError("");
                        resetResults();
                      }}
                      className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none transition-colors"
                    >
                      {LIGHTING.map((option) => (
                        <option key={option} value={option}>
                          {option || "None"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${textMain} mb-2`}>Camera Settings</label>
                    <select
                      value={cameraSettings}
                      onChange={(e) => {
                        setCameraSettings(e.target.value);
                        setError("");
                        resetResults();
                      }}
                      className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none transition-colors"
                    >
                      {CAMERA_SETTINGS.map((option) => (
                        <option key={option} value={option}>
                          {option || "None"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${textMain} mb-2`}>Lens Type</label>
                    <select
                      value={lensType}
                      onChange={(e) => {
                        setLensType(e.target.value);
                        setError("");
                        resetResults();
                      }}
                      className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none transition-colors"
                    >
                      {LENS_TYPES.map((option) => (
                        <option key={option} value={option}>
                          {option || "None"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${textMain} mb-2`}>Film Type</label>
                    <select
                      value={filmType}
                      onChange={(e) => {
                        setFilmType(e.target.value);
                        setError("");
                        resetResults();
                      }}
                      className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none transition-colors"
                    >
                      {FILM_TYPES.map((option) => (
                        <option key={option} value={option}>
                          {option || "None"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textMain} mb-2`}>Art Style</label>
                  <select
                    value={artStyle}
                    onChange={(e) => {
                      setArtStyle(e.target.value);
                      setError("");
                      resetResults();
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none transition-colors"
                  >
                    {ART_STYLES.map((option) => (
                      <option key={option} value={option}>
                        {option || "None"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textMain} mb-2`}>Custom Modifiers</label>
                  <input
                    type="text"
                    value={customModifiers}
                    onChange={(e) => {
                      setCustomModifiers(e.target.value);
                      setError("");
                      resetResults();
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                    placeholder="Additional creative modifiers..."
                  />
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className={`text-sm font-medium ${textMain} mb-2`}>Composed Prompt:</div>
                  <div className={`text-sm ${textDim} leading-relaxed`}>
                    {composedPrompt || "Your prompt will appear here..."}
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-Shot Management */}
            {mode === "multi" && (
              <div className={`${glassCard} rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-semibold ${textMain}`}>Shots</h2>
                  <button
                    onClick={addShot}
                    className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
                  >
                    Add Shot
                  </button>
                </div>

                <div className="space-y-3">
                  {shots.map((shot) => (
                    <div key={shot.id} className="flex gap-3">
                      <input
                        type="text"
                        value={shot.prompt}
                        onChange={(e) => updateShot(shot.id, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                        placeholder="Enter shot description..."
                      />
                      {shots.length > 1 && (
                        <button
                          onClick={() => removeShot(shot.id)}
                          className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reference Image */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-semibold ${textMain} mb-4`}>Reference Image (Optional)</h2>
              
              <div className="space-y-4">
                <label className="flex items-center justify-center w-full h-32 px-4 py-6 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition-colors cursor-pointer bg-white/5">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleInspirationFile(e.target.files?.[0] || null)}
                  />
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <div className={`text-sm ${textDim}`}>
                      {inspirationFile ? inspirationFile.name : "Click to upload or drag and drop"}
                    </div>
                    <div className={`text-xs ${textDim} mt-1`}>
                      PNG, JPG, GIF up to 10MB
                    </div>
                  </div>
                </label>

                {inspirationDataUrl && (
                  <div className="relative">
                    <Image 
                      src={inspirationDataUrl} 
                      alt="Reference" 
                      width={200}
                      height={200}
                      className="w-32 h-32 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => handleInspirationFile(null)}
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
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                Powered by Google Imagen
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
                  onClick={() => setSelectedCategory("digital-art")}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                    selectedCategory === "digital-art"
                      ? buttonPrimary
                      : buttonSecondary
                  }`}
                >
                  Digital Art
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
                  onClick={() => setSelectedCategory("character")}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                    selectedCategory === "character"
                      ? buttonPrimary
                      : buttonSecondary
                  }`}
                >
                  Character
                </button>
              </div>

              <div className="space-y-3">
                {filteredPrompts.map((example, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setBasePrompt(example.prompt);
                      setError("");
                      resetResults();
                    }}
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
