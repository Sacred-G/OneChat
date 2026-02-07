"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
  const { theme } = useThemeStore();

  const [mode, setMode] = useState<Mode>("transcript");
  const [seconds, setSeconds] = useState<number>(10);
  const [voiceName, setVoiceName] = useState<string>("Kore");

  const [transcript, setTranscript] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [audioUrl, setAudioUrl] = useState<string>("");
  const [generatedTranscript, setGeneratedTranscript] = useState<string>("");

  const [previewSubmitting, setPreviewSubmitting] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string>("");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [muxSubmitting, setMuxSubmitting] = useState(false);
  const [muxError, setMuxError] = useState("");
  const [muxedVideoUrl, setMuxedVideoUrl] = useState<string>("");

  const panelClass = theme === "dark" ? "border-white/10 bg-[#141414]" : "border-stone-200 bg-white";
  const textMain = theme === "dark" ? "text-stone-100" : "text-stone-900";
  const textDim = theme === "dark" ? "text-stone-400" : "text-stone-600";

  const canGenerate = useMemo(() => {
    if (submitting) return false;
    if (seconds < 1 || seconds > 600) return false;
    if (mode === "transcript") return transcript.trim().length > 0;
    return prompt.trim().length > 0;
  }, [submitting, seconds, mode, transcript, prompt]);

  const resetOutputs = () => {
    setAudioUrl("");
    setGeneratedTranscript("");
    setMuxedVideoUrl("");
    setMuxError("");
  };

  const handlePreviewVoice = async () => {
    if (previewSubmitting) return;
    setPreviewSubmitting(true);
    setPreviewError("");
    setPreviewAudioUrl("");

    try {
      const previewText =
        "Say cheerfully and clearly: Hi! This is a voice preview for your video narration.";

      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "transcript",
          seconds: 5,
          voiceName,
          transcript: previewText,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
        throw new Error(msg);
      }

      const url = typeof data?.url === "string" ? data.url : "";
      if (!url) throw new Error("No preview audio URL returned");
      setPreviewAudioUrl(url);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Failed to preview voice");
    } finally {
      setPreviewSubmitting(false);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setSubmitting(true);
    setError("");
    resetOutputs();

    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          seconds,
          voiceName,
          transcript: mode === "transcript" ? transcript : undefined,
          prompt: mode === "prompt" ? prompt : undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
        throw new Error(msg);
      }

      const url = typeof data?.url === "string" ? data.url : "";
      if (!url) throw new Error("No audio URL returned");
      setAudioUrl(url);
      setGeneratedTranscript(typeof data?.transcript === "string" ? data.transcript : "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate audio");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMux = async () => {
    if (!audioUrl) return;
    if (!videoFile) return;
    if (muxSubmitting) return;

    setMuxSubmitting(true);
    setMuxError("");
    setMuxedVideoUrl("");

    try {
      const form = new FormData();
      form.set("video", videoFile);
      form.set("audioUrl", audioUrl);

      const res = await fetch("/api/tts/mux", {
        method: "POST",
        body: form,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : `Mux failed (${res.status})`;
        throw new Error(msg);
      }

      const url = typeof data?.url === "string" ? data.url : "";
      if (!url) throw new Error("No muxed video URL returned");
      setMuxedVideoUrl(url);
    } catch (e) {
      setMuxError(e instanceof Error ? e.message : "Failed to mux audio into video");
    } finally {
      setMuxSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className={`text-lg font-semibold ${textMain}`}>TTS Audio Generator</h1>
          <Link href="/" className={`text-sm underline ${theme === "dark" ? "text-stone-200" : "text-stone-700"}`}>
            Back to chat
          </Link>
        </div>

        <div className={`mt-4 rounded-xl border p-4 ${panelClass}`}>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Mode</label>
                <select
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value as Mode);
                    setError("");
                    resetOutputs();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  <option value="transcript">Use transcript</option>
                  <option value="prompt">Write from prompt</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Target length (seconds)</label>
                <input
                  type="number"
                  value={seconds}
                  min={1}
                  max={600}
                  step={1}
                  onChange={(e) => {
                    setSeconds(Number(e.target.value));
                    setError("");
                    resetOutputs();
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                />
                <div className={`mt-1 text-xs ${textDim}`}>Used to size the generated script when using Prompt mode.</div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Voice</label>
                <select
                  value={voiceName}
                  onChange={(e) => {
                    setVoiceName(e.target.value);
                    setError("");
                    resetOutputs();
                    setPreviewError("");
                    setPreviewAudioUrl("");
                  }}
                  className={`mt-2 h-10 w-full rounded-lg border px-2 text-sm outline-none ${
                    theme === "dark" ? "bg-transparent border-white/10 text-white" : "bg-white border-stone-200 text-stone-900"
                  }`}
                >
                  {VOICES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePreviewVoice}
                disabled={previewSubmitting}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  previewSubmitting
                    ? theme === "dark"
                      ? "bg-white/10 text-white/40"
                      : "bg-stone-200 text-stone-500"
                    : theme === "dark"
                      ? "border border-white/10 hover:bg-white/10 text-white"
                      : "border border-stone-200 hover:bg-stone-100 text-stone-800"
                }`}
              >
                {previewSubmitting ? "Generating preview…" : "Preview voice"}
              </button>
              <div className={`text-xs ${textDim}`}>Generates a short sample using the selected voice.</div>
            </div>

            {previewError ? (
              <div className={`text-sm ${theme === "dark" ? "text-red-300" : "text-red-700"}`}>{previewError}</div>
            ) : null}

            {previewAudioUrl ? <audio className="w-full" controls src={previewAudioUrl} /> : null}

            {mode === "transcript" ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className={`block text-sm font-medium ${textMain}`}>Transcript</label>
                  <input
                    type="file"
                    accept="text/plain,.txt"
                    className={`text-xs ${theme === "dark" ? "text-stone-200" : "text-stone-700"}`}
                    onChange={async (e) => {
                      const f = e.target.files?.[0] || null;
                      if (!f) return;
                      setError("");
                      resetOutputs();
                      try {
                        const txt = await fileToText(f);
                        setTranscript(txt);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Failed to load transcript file");
                      }
                    }}
                  />
                </div>
                <textarea
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    setError("");
                    resetOutputs();
                  }}
                  rows={7}
                  className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                    theme === "dark"
                      ? "bg-transparent border-white/10 text-white placeholder:text-stone-500"
                      : "bg-white border-stone-200 text-stone-900 placeholder:text-stone-400"
                  }`}
                  placeholder="Paste or upload a transcript to read aloud…"
                />
              </div>
            ) : (
              <div>
                <label className={`block text-sm font-medium ${textMain}`}>Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setError("");
                    resetOutputs();
                  }}
                  rows={5}
                  className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                    theme === "dark"
                      ? "bg-transparent border-white/10 text-white placeholder:text-stone-500"
                      : "bg-white border-stone-200 text-stone-900 placeholder:text-stone-400"
                  }`}
                  placeholder="Describe what you want narrated, plus style notes (accent, tone, pace)…"
                />
              </div>
            )}

            {error ? (
              <div className={`text-sm ${theme === "dark" ? "text-red-300" : "text-red-700"}`}>{error}</div>
            ) : null}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  !canGenerate
                    ? theme === "dark"
                      ? "bg-white/10 text-white/40"
                      : "bg-stone-200 text-stone-500"
                    : theme === "dark"
                      ? "bg-[#10a37f] hover:bg-[#0e9070] text-white"
                      : "bg-stone-900 hover:bg-stone-800 text-white"
                }`}
              >
                {submitting ? "Generating…" : "Generate audio"}
              </button>
              <div className={`text-xs ${textDim}`}>Returns a `.wav` you can add to videos.</div>
            </div>
          </div>
        </div>

        {audioUrl ? (
          <div className={`mt-4 rounded-xl border p-4 ${panelClass}`}>
            <div className={`text-sm font-medium ${textMain}`}>Result</div>
            <audio className="mt-3 w-full" controls src={audioUrl} />
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <a href={audioUrl} download className={`text-sm underline ${theme === "dark" ? "text-stone-200" : "text-stone-700"}`}>
                Download .wav
              </a>
            </div>
            {generatedTranscript ? (
              <div className="mt-4">
                <div className={`text-sm font-medium ${textMain}`}>Transcript used</div>
                <pre className={`mt-2 whitespace-pre-wrap text-xs rounded-lg border p-3 ${theme === "dark" ? "border-white/10 text-stone-200" : "border-stone-200 text-stone-800"}`}>
                  {generatedTranscript}
                </pre>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={`mt-4 rounded-xl border p-4 ${panelClass}`}>
          <div className={`text-sm font-medium ${textMain}`}>Optional: add audio to a silent video</div>
          <div className={`mt-1 text-xs ${textDim}`}>Requires `ffmpeg` installed where the Next.js server runs.</div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${textMain}`}>Silent video file</label>
              <input
                type="file"
                accept="video/*"
                className={`mt-2 block w-full text-xs ${theme === "dark" ? "text-stone-200" : "text-stone-700"}`}
                onChange={(e) => {
                  setVideoFile(e.target.files?.[0] || null);
                  setMuxError("");
                  setMuxedVideoUrl("");
                }}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleMux}
                disabled={!audioUrl || !videoFile || muxSubmitting}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  !audioUrl || !videoFile || muxSubmitting
                    ? theme === "dark"
                      ? "bg-white/10 text-white/40"
                      : "bg-stone-200 text-stone-500"
                    : theme === "dark"
                      ? "bg-[#10a37f] hover:bg-[#0e9070] text-white"
                      : "bg-stone-900 hover:bg-stone-800 text-white"
                }`}
              >
                {muxSubmitting ? "Muxing…" : "Add audio to video"}
              </button>
            </div>
          </div>

          {muxError ? (
            <div className={`mt-3 text-sm ${theme === "dark" ? "text-red-300" : "text-red-700"}`}>{muxError}</div>
          ) : null}

          {muxedVideoUrl ? (
            <div className="mt-4">
              <div className={`text-sm font-medium ${textMain}`}>Muxed video</div>
              <video className="mt-3 w-full rounded-lg" controls src={muxedVideoUrl} />
              <div className="mt-3">
                <a href={muxedVideoUrl} download className={`text-sm underline ${theme === "dark" ? "text-stone-200" : "text-stone-700"}`}>
                  Download video
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
