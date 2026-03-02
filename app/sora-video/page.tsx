"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { 
  Download, 
  Loader2, 
  Trash2, 
  RefreshCw,
  Video,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Film,
  Zap
} from "lucide-react";

import useThemeStore from "@/stores/useThemeStore";

interface VideoItem {
  id: string;
  status: string;
  prompt?: string;
  created_at?: number;
  completed_at?: number;
  expires_at?: number;
  model?: string;
  size?: string;
  seconds?: number;
  error?: {
    code?: string;
    message?: string;
  };
}

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
    icon: <Sparkles className="w-4 h-4" />,
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

export default function SoraVideoPage() {
  const { theme: _theme } = useThemeStore();
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<"720x1280" | "1280x720" | "1024x1792" | "1792x1024">("1280x720");
  const [model, setModel] = useState<"sora-2" | "sora-2-pro">("sora-2");
  const [seconds, setSeconds] = useState<4 | 8 | 12>(8);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Video library
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());
  const [_failedVideos, setFailedVideos] = useState<Set<string>>(new Set());

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const glassCard = "backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl";
  const textMain = "text-white";
  const textDim = "text-gray-300";
  const buttonPrimary = "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200";
  const buttonSecondary = "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm";

  const canSubmit = useMemo(() => {
    return !submitting && prompt.trim().length > 0;
  }, [submitting, prompt]);

  // Auto-select model based on size selection
  const handleSizeChange = (newSize: string) => {
    setSize(newSize as any);
    // Auto-select sora-2-pro for larger sizes
    if (newSize === "1024x1792" || newSize === "1792x1024") {
      setModel("sora-2-pro");
    } else {
      setModel("sora-2");
    }
    setError("");
  };

  const handleGenerate = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          size,
          model,
          seconds,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
        throw new Error(msg);
      }

      // Add to videos list
      if (data?.id) {
        setVideos((prev) => [data, ...prev]);
        setPollingIds((prev) => new Set(prev).add(data.id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate video");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const res = await fetch("/api/videos");
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.data)) {
        setVideos(data.data);
        // Start polling for incomplete videos
        const incompleteIds = data.data
          .filter((v: VideoItem) => v.status === "in_progress" || v.status === "pending")
          .map((v: VideoItem) => v.id);
        setPollingIds(new Set(incompleteIds));
      }
    } catch (e) {
      console.error("Failed to fetch videos:", e);
    } finally {
      setLoadingVideos(false);
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      const res = await fetch(`/api/videos?videoId=${id}`, { method: "DELETE" });
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== id));
        setPollingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setFailedVideos((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (e) {
      console.error("Failed to delete video:", e);
    }
  };

  const downloadVideo = async (id: string) => {
    try {
      const res = await fetch(`/api/videos/download/${id}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sora-video-${id}.mp4`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Failed to download video:", e);
    }
  };

  // Poll for video completion
  useEffect(() => {
    if (pollingIds.size === 0) return;

    const interval = setInterval(async () => {
      const stillPending = new Set<string>();

      for (const id of pollingIds) {
        try {
          const res = await fetch(`/api/videos/status/${id}`);
          const data = await res.json().catch(() => null);

          if (res.ok && data) {
            setVideos((prev) =>
              prev.map((v) => (v.id === id ? { ...v, ...data } : v))
            );

            if (data.status === "completed") {
              // Video completed
            } else if (data.status === "failed") {
              setFailedVideos((prev) => new Set(prev).add(id));
            } else {
              stillPending.add(id);
            }
          } else {
            stillPending.add(id);
          }
        } catch (e) {
          console.error(`Failed to poll video ${id}:`, e);
          stillPending.add(id);
        }
      }

      setPollingIds(stillPending);
    }, 2000);

    return () => clearInterval(interval);
  }, [pollingIds]);

  // Load videos on mount
  useEffect(() => {
    fetchVideos();
  }, []);

  const filteredPrompts = useMemo(() => {
    if (selectedCategory === "all") return EXAMPLE_PROMPTS;
    return EXAMPLE_PROMPTS.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-x-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-purple-500/5 blur-3xl" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-2xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg">
              <Video className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${textMain} mb-2`}>
                Sora Video Studio
              </h1>
              <p className={`${textDim} text-lg`}>
                OpenAI&apos;s advanced video generation with cinematic quality
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
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${textMain} mb-2`}>Size</label>
                  <select
                    value={size}
                    onChange={(e) => handleSizeChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:outline-none transition-colors"
                  >
                    <option value="1280x720">1280×720 (16:9)</option>
                    <option value="720x1280">720×1280 (9:16)</option>
                    <option value="1792x1024">1792×1024 (16:9)</option>
                    <option value="1024x1792">1024×1792 (9:16)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textMain} mb-2`}>Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:outline-none transition-colors"
                  >
                    <option value="sora-2">Sora 2</option>
                    <option value="sora-2-pro">Sora 2 Pro</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textMain} mb-2`}>Duration</label>
                  <select
                    value={seconds}
                    onChange={(e) => setSeconds(Number(e.target.value) as any)}
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:outline-none transition-colors"
                  >
                    <option value={4}>4 seconds</option>
                    <option value={8}>8 seconds</option>
                    <option value={12}>12 seconds</option>
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
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none transition-colors resize-none"
                placeholder="Describe the video you want to generate..."
              />
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
                    <Loader2 className="w-5 h-5 animate-spin" />
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
                Powered by OpenAI Sora
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

          {/* Right Column - Examples & Library */}
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

            {/* Video Library */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${textMain}`}>Video Library</h2>
                <button
                  onClick={fetchVideos}
                  disabled={loadingVideos}
                  className={`p-2 rounded-lg transition-colors ${
                    loadingVideos
                      ? "text-white/40 cursor-not-allowed"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingVideos ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="space-y-3">
                {videos.length === 0 ? (
                  <div className={`text-center py-8 ${textDim}`}>
                    No videos generated yet
                  </div>
                ) : (
                  videos.map((video) => (
                    <div
                      key={video.id}
                      className={`p-4 rounded-xl border transition-all duration-200 ${
                        video.status === "completed"
                          ? "border-green-500/20 bg-green-500/5"
                          : video.status === "failed"
                          ? "border-red-500/20 bg-red-500/5"
                          : "border-blue-500/20 bg-blue-500/5"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${textMain} truncate`}>
                            {video.prompt || "Untitled video"}
                          </div>
                          <div className={`text-xs ${textDim} mt-1`}>
                            {video.size} • {video.seconds}s • {video.model}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {video.status === "completed" ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : video.status === "failed" ? (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                          )}
                        </div>
                      </div>

                      {video.status === "completed" && (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => downloadVideo(video.id)}
                            className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                          <button
                            onClick={() => deleteVideo(video.id)}
                            className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      )}

                      {video.status === "failed" && (
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs text-red-400">
                            {video.error?.message || "Generation failed"}
                          </span>
                          <button
                            onClick={() => deleteVideo(video.id)}
                            className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
