"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { 
  Download, 
  Volume2,
  Sparkles,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Headphones,
  Radio
} from "lucide-react";

import useThemeStore from "@/stores/useThemeStore";

const VOICES = [
  "Zephyr",
  "Puck", 
  "Charon",
  "Kore",
  "Fenrir",
  "Leda",
  "Orus",
  "Aoede",
  "Callirrhoe",
  "Autonoe",
  "Enceladus",
  "Iapetus",
  "Umbriel",
  "Algieba",
  "Despina",
  "Erinome",
  "Algenib",
  "Rasalgethi",
  "Laomedeia",
  "Achernar",
  "Alnilam",
  "Schedar",
  "Gacrux",
  "Pulcherrima",
  "Achird",
  "Zubenelgenubi",
  "Vindemiatrix",
  "Sadachbia",
  "Sadaltager",
  "Sulafat",
] as const;

type Mode = "transcript" | "prompt";

const EXAMPLE_PROMPTS = [
  {
    title: "Podcast Introduction",
    prompt: "Welcome to our podcast! In today's episode, we'll explore the fascinating intersection of technology and human creativity.",
    category: "podcast",
    icon: <Radio className="w-4 h-4" />,
    gradient: "from-purple-500 to-pink-500"
  },
  {
    title: "Audiobook Narration",
    prompt: "The old mansion stood silhouetted against the stormy sky, its windows like dark, watchful eyes that had witnessed countless secrets over the centuries.",
    category: "audiobook",
    icon: <Headphones className="w-4 h-4" />,
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    title: "Educational Content",
    prompt: "Today we're going to learn about the fundamental principles of quantum computing and how they're revolutionizing the world of technology.",
    category: "educational",
    icon: <FileText className="w-4 h-4" />,
    gradient: "from-green-500 to-teal-500"
  }
];

function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return reject(new Error("Invalid file result"));
      resolve(result);
    };
    reader.readAsText(file);
  });
}

export default function TTSAudioPage() {
  const { theme: _theme } = useThemeStore();

  const [mode, setMode] = useState<Mode>("prompt");
  const [voice, setVoice] = useState<(typeof VOICES)[number]>("Zephyr");
  const [instructions, setInstructions] = useState("");
  const [transcript, setTranscript] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const glassCard = "backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl";
  const textMain = "text-white";
  const textDim = "text-gray-300";
  const buttonPrimary = "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200";
  const buttonSecondary = "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm";

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (mode === "prompt") return instructions.trim().length > 0;
    return transcript.trim().length > 0;
  }, [submitting, mode, instructions, transcript]);

  const handleFile = async (newFile: File | null) => {
    setFile(newFile);
    if (!newFile) {
      setTranscript("");
      return;
    }

    try {
      const text = await fileToText(newFile);
      setTranscript(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read file");
    }
  };

  const handleGenerate = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");
    setAudioUrl("");

    try {
      const res = await fetch("/api/tts-audio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          voice,
          instructions: mode === "prompt" ? instructions.trim() : "",
          transcript: mode === "transcript" ? transcript.trim() : "",
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
        throw new Error(msg);
      }

      if (data?.audioUrl) {
        setAudioUrl(data.audioUrl);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate audio");
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
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-green-500/5 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-2xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl shadow-lg">
              <Volume2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${textMain} mb-2`}>
                TTS Audio Studio
              </h1>
              <p className={`${textDim} text-lg`}>
                Advanced text-to-speech with natural voice synthesis
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
                    setMode("prompt");
                    setError("");
                    setAudioUrl("");
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    mode === "prompt"
                      ? "border-green-500 bg-green-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="text-left">
                    <div className={`font-semibold ${textMain} mb-1`}>Prompt Mode</div>
                    <div className={`text-xs ${textDim}`}>Generate from instructions</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMode("transcript");
                    setError("");
                    setAudioUrl("");
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    mode === "transcript"
                      ? "border-green-500 bg-green-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="text-left">
                    <div className={`font-semibold ${textMain} mb-1`}>Transcript Mode</div>
                    <div className={`text-xs ${textDim}`}>Generate from transcript</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Voice Selection */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-semibold ${textMain} mb-4`}>Voice Selection</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${textMain} mb-2`}>Voice</label>
                  <select
                    value={voice}
                    onChange={(e) => {
                      setVoice(e.target.value as any);
                      setError("");
                      setAudioUrl("");
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-green-400 focus:outline-none transition-colors"
                  >
                    {VOICES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Content Input */}
            <div className={`${glassCard} rounded-2xl p-6`}>
              <h2 className={`text-xl font-semibold ${textMain} mb-4`}>
                {mode === "prompt" ? "Instructions" : "Transcript"}
              </h2>
              
              {mode === "prompt" ? (
                <textarea
                  value={instructions}
                  onChange={(e) => {
                    setInstructions(e.target.value);
                    setError("");
                  }}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-green-400 focus:outline-none transition-colors resize-none"
                  placeholder="Enter instructions for the voice generation..."
                />
              ) : (
                <div className="space-y-4">
                  <label className="flex items-center justify-center w-full h-32 px-4 py-6 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition-colors cursor-pointer bg-white/5">
                    <input
                      type="file"
                      accept=".txt,.md"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0] || null)}
                    />
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <div className={`text-sm ${textDim}`}>
                        {file ? file.name : "Click to upload or drag and drop"}
                      </div>
                      <div className={`text-xs ${textDim} mt-1`}>
                        TXT, MD files supported
                      </div>
                    </div>
                  </label>

                  <textarea
                    value={transcript}
                    onChange={(e) => {
                      setTranscript(e.target.value);
                      setError("");
                    }}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-green-400 focus:outline-none transition-colors resize-none"
                    placeholder="Or paste your transcript directly..."
                  />
                </div>
              )}
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
                    Generate Audio
                  </>
                )}
              </button>
              
              <div className={`text-xs ${textDim}`}>
                Powered by AI TTS
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

            {/* Audio Player */}
            {audioUrl && (
              <div className={`${glassCard} rounded-2xl p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <h2 className={`text-2xl font-semibold ${textMain}`}>Generated Audio</h2>
                </div>
                
                <audio controls className="w-full" src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
                
                <div className="flex items-center gap-2 mt-4">
                  <a
                    href={audioUrl}
                    download="generated-audio.mp3"
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
                  onClick={() => setSelectedCategory("podcast")}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                    selectedCategory === "podcast"
                      ? buttonPrimary
                      : buttonSecondary
                  }`}
                >
                  Podcast
                </button>
                <button
                  onClick={() => setSelectedCategory("audiobook")}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                    selectedCategory === "audiobook"
                      ? buttonPrimary
                      : buttonSecondary
                  }`}
                >
                  Audiobook
                </button>
                <button
                  onClick={() => setSelectedCategory("educational")}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                    selectedCategory === "educational"
                      ? buttonPrimary
                      : buttonSecondary
                  }`}
                >
                  Educational
                </button>
              </div>

              <div className="space-y-3">
                {filteredPrompts.map((example, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setInstructions(example.prompt);
                      setMode("prompt");
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
