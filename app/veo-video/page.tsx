"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { 
  Video, 
  Upload, 
  Download, 
  Sparkles,
  CheckCircle,
  AlertCircle,
  Film,
  Camera,
  Zap
} from "lucide-react";

import useThemeStore from "@/stores/useThemeStore";

type RefImage = {
  id: string;
  file?: File;
  dataUrl?: string;
};

const EXAMPLE_PROMPTS = [
  {
    title: "Cinematic Scene",
    prompt: "A cinematic shot of a futuristic city at sunset with flying cars and neon lights reflecting on wet streets",
    category: "cinematic",
    icon: <Film className="w-4 h-4" />,
    gradient: "from-blue-500 to-purple-500"
  },
  {
    title: "Nature Documentary",
    prompt: "A majestic eagle soaring through mountain valleys at sunrise, captured in stunning 4K detail",
    category: "nature",
    icon: <Camera className="w-4 h-4" />,
    gradient: "from-green-500 to-teal-500"
  },
  {
    title: "Action Sequence",
    prompt: "A dynamic action sequence of a parkour athlete jumping across rooftops in a modern urban environment",
    category: "action",
    icon: <Zap className="w-4 h-4" />,
    gradient: "from-orange-500 to-red-500"
  }
];

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
  const { theme: _theme } = useThemeStore();
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

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const glassCard = "backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl";
  const textMain = "text-white";
  const textDim = "text-gray-300";
  const buttonPrimary = "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200";
  const buttonSecondary = "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm";

  const canSubmit = useMemo(() => {
    return !submitting && prompt.trim().length > 0;
  }, [submitting, prompt]);

  const setRefFile = async (idx: number, file: File | null) => {
    const newRefs = [...refs];
    newRefs[idx] = { ...newRefs[idx], file: file || undefined };
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        newRefs[idx].dataUrl = dataUrl;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load image");
      }
    } else {
      newRefs[idx].dataUrl = undefined;
    }
    setRefs(newRefs);
  };

  const handleGenerate = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");
    setVideoUrl("");

    try {
      const payload: any = {
        prompt: prompt.trim(),
        aspectRatio,
        resolution,
      };

      const refDataUrls = refs.map((r) => r.dataUrl).filter(Boolean);
      if (refDataUrls.length > 0) {
        payload.refImages = refDataUrls;
      }

      const res = await fetch("/api/veo-video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
        throw new Error(msg);
      }

      if (data?.videoUrl) {
        setVideoUrl(data.videoUrl);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate video");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPrompts = useMemo(() => {
    if (selectedCategory === "all") return EXAMPLE_PROMPTS;
    return EXAMPLE_PROMPTS.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-x-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-red-500/5 blur-3xl" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-pink-500/5 blur-2xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg">
              <Video className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${textMain} mb-2`}>
                Veo Video Studio
              </h1>
              <p className={`${textDim} text-lg`}>
                Google&apos;s advanced video generation with image-to-video capabilities
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
            {/* Video Settings */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-semibold ${textMain} mb-4`}>Video Settings</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${textMain} mb-2`}>Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => {
                      setAspectRatio(e.target.value as any);
                      setError("");
                      setVideoUrl("");
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-orange-400 focus:outline-none transition-colors"
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textMain} mb-2`}>Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => {
                      setResolution(e.target.value as any);
                      setError("");
                      setVideoUrl("");
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-orange-400 focus:outline-none transition-colors"
                  >
                    <option value="720p">720p (HD)</option>
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="4k">4K (Ultra HD)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Prompt Input */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-semibold ${textMain} mb-4`}>Video Prompt</h2>
              
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setError("");
                }}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-orange-400 focus:outline-none transition-colors resize-none"
                placeholder="Describe the video you want to generate..."
              />
            </div>

            {/* Reference Images */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-semibold ${textMain} mb-4`}>Reference Images (Optional)</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {refs.map((ref, idx) => (
                  <div key={ref.id} className="space-y-2">
                    <label className="flex items-center justify-center w-full h-32 px-4 py-6 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition-colors cursor-pointer bg-white/5">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setRefFile(idx, e.target.files?.[0] || null)}
                      />
                      {ref.dataUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={ref.dataUrl}
                          alt={`Reference ${idx + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                          <div className={`text-xs ${textDim}`}>
                            Ref {idx + 1}
                          </div>
                        </div>
                      )}
                    </label>
                    {ref.file && (
                      <button
                        onClick={() => setRefFile(idx, null)}
                        className="w-full px-2 py-1 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
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
                    Generate Video
                  </>
                )}
              </button>
              
              <div className={`text-xs ${textDim}`}>
                Powered by Google Veo
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

            {/* Video Player */}
            {videoUrl && (
              <div className={`${glassCard} rounded-2xl p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <h2 className={`text-2xl font-semibold ${textMain}`}>Generated Video</h2>
                </div>
                
                <video controls className="w-full rounded-xl" src={videoUrl}>
                  Your browser does not support the video element.
                </video>
                
                <div className="flex items-center gap-2 mt-4">
                  <a
                    href={videoUrl}
                    download="generated-video.mp4"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Examples */}
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
                  onClick={() => setSelectedCategory("cinematic")}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                    selectedCategory === "cinematic"
                      ? buttonPrimary
                      : buttonSecondary
                  }`}
                >
                  Cinematic
                </button>
                <button
                  onClick={() => setSelectedCategory("nature")}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                    selectedCategory === "nature"
                      ? buttonPrimary
                      : buttonSecondary
                  }`}
                >
                  Nature
                </button>
                <button
                  onClick={() => setSelectedCategory("action")}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                    selectedCategory === "action"
                      ? buttonPrimary
                      : buttonSecondary
                  }`}
                >
                  Action
                </button>
              </div>

              <div className="space-y-3">
                {filteredPrompts.map((example, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setPrompt(example.prompt);
                      setError("");
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:border-white/30 hover:bg-white/5 border-white/10`}
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
      </div>
    </div>
  );
}
