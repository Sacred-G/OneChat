"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react";
import useThemeStore from "@/stores/useThemeStore";
import { RealtimeAgent, RealtimeSession, OpenAIRealtimeWebRTC, tool } from "@openai/agents/realtime";
import { Item } from "@/lib/assistant";
import useToolsStore from "@/stores/useToolsStore";
import useConversationStore from "@/stores/useConversationStore";
import ScreenCapture from "@/components/screen-capture";
import { z } from "zod";
import { getDeveloperPrompt } from "@/config/constants";

type VoiceStatus = "idle" | "connecting" | "connected" | "error";

interface VoiceAgentProps {
  onClose?: () => void;
  onTranscript?: (item: Item) => void;
}

export default function VoiceAgent({ onClose, onTranscript }: VoiceAgentProps) {
  const { theme } = useThemeStore();
  const { vectorStore, webSearchEnabled, webSearchConfig } = useToolsStore();
  const { selectedSkill } = useConversationStore();
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Array<{ role: string; text: string }>>();
  
  const sessionRef = useRef<RealtimeSession | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const micDebugIntervalRef = useRef<number | null>(null);
  const lastCapturedImageRef = useRef<string | null>(null);
  const processedTranscriptKeysRef = useRef<Set<string>>(new Set());
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const searchVectorStoreTool = useMemo(
    () =>
      tool({
        name: "search_vector_store",
        description:
          "Search the user's linked vector store for relevant passages. Use this when asked about uploaded documents.",
        parameters: z.object({
          query: z.string(),
          maxNumResults: z.number().int().min(1).max(20).optional(),
        }),
        execute: async ({ query, maxNumResults }) => {
          const storeId = vectorStore?.id;
          if (!storeId) {
            return "No vector store is linked. Ask the user to enable File Search in Settings and link a vector store (vs_...).";
          }

          const resp = await fetch("/api/vector_stores/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vectorStoreId: storeId,
              query,
              maxNumResults,
            }),
          });

          if (!resp.ok) {
            const errText = await resp.text();
            return `Vector store search failed: ${errText}`;
          }

          const data = await resp.json();
          return JSON.stringify(data);
        },
      }),
    [vectorStore?.id]
  );

  const webSearchTool = useMemo(
    () =>
      tool({
        name: "web_search",
        description: "Search the web for up-to-date information.",
        parameters: z.object({
          query: z.string(),
        }),
        execute: async ({ query }) => {
          if (!webSearchEnabled) {
            return "Web Search is disabled. Ask the user to enable Web Search in Settings.";
          }

          const resp = await fetch("/api/web_search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, webSearchConfig }),
          });

          if (!resp.ok) {
            const errText = await resp.text();
            return `Web search failed: ${errText}`;
          }

          const data = await resp.json();
          return JSON.stringify(data);
        },
      }),
    [webSearchConfig, webSearchEnabled]
  );

  const generateArtifactTool = useMemo(
    () =>
      tool({
        name: "generate_artifact",
        description:
          "Generate a complete HTML artifact via the app's standard chat pipeline and post it into the chat UI. Use this for code-heavy outputs (landing pages, components) so you don't read code aloud.",
        parameters: z.object({
          prompt: z.string(),
        }),
        execute: async ({ prompt }) => {
          const trimmed = typeof prompt === "string" ? prompt.trim() : "";
          if (!trimmed) return "Please provide a prompt.";

          const state = useToolsStore.getState();
          const toolsState = {
            webSearchEnabled: state.webSearchEnabled,
            fileSearchEnabled: state.fileSearchEnabled,
            functionsEnabled: state.functionsEnabled,
            codeInterpreterEnabled: state.codeInterpreterEnabled,
            vectorStore: state.vectorStore,
            selectedProjectId: state.selectedProjectId,
            webSearchConfig: state.webSearchConfig,
            mcpEnabled: state.mcpEnabled,
            mcpConfig: state.mcpConfig,
            googleIntegrationEnabled: state.googleIntegrationEnabled,
            geminiImageEnabled: state.geminiImageEnabled,
            voiceModeEnabled: state.voiceModeEnabled,
            provider: state.provider,
            apipieModel: state.apipieModel,
            apipieImageModel: state.apipieImageModel,
            apipieFavoriteModels: state.apipieFavoriteModels,
            apipieFavoriteImageModels: state.apipieFavoriteImageModels,
          } as any;

          const messages = [
            {
              role: "user",
              content: [{ type: "input_text", text: trimmed }],
            },
          ];

          try {
            const res = await fetch("/api/turn_response", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages,
                toolsState,
                googleIntegrationEnabled: state.googleIntegrationEnabled,
                selectedSkill: useConversationStore.getState().selectedSkill,
                provider: state.provider,
                apipieModel: state.apipieModel,
              }),
            });

            if (!res.ok || !res.body) {
              const t = await res.text().catch(() => "");
              return `Failed to generate artifact: ${t || res.statusText}`;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let done = false;
            let output = "";

            while (!done) {
              const { value, done: doneReading } = await reader.read();
              done = doneReading;
              buffer += decoder.decode(value);
              const chunks = buffer.split("\n\n");
              buffer = chunks.pop() || "";

              for (const chunk of chunks) {
                if (!chunk.startsWith("data: ")) continue;
                const dataStr = chunk.slice(6);
                if (dataStr === "[DONE]") {
                  done = true;
                  break;
                }

                const payload = JSON.parse(dataStr);
                const event = payload?.event;
                const data = payload?.data;
                if (
                  (event === "response.output_text.delta" || event === "response.output_text.annotation.added") &&
                  typeof data?.delta === "string"
                ) {
                  output += data.delta;
                }
              }
            }

            if (!output.trim()) return "I didn't get any artifact content back.";

            if (onTranscript) {
              const item: Item = {
                type: "message",
                role: "assistant",
                content: [{ type: "output_text", text: output } as any],
              };
              onTranscript(item);
            }

            return "Done. I posted the artifact in the chat.";
          } catch (e) {
            return `Failed to generate artifact: ${e instanceof Error ? e.message : "unknown error"}`;
          }
        },
      }),
    [onTranscript]
  );

  const handleVoiceScreenCapture = useCallback(
    async (imageData: string) => {
      lastCapturedImageRef.current = imageData;

      const session = sessionRef.current;
      if (!session) return;

      try {
        const base64 = imageData.includes(",") ? imageData.split(",")[1] : imageData;
        session.transport.addImage(base64, { triggerResponse: false });
        session.transport.sendEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: "I just shared a screenshot. Describe what you see and ask a brief clarifying question if needed.",
              },
            ],
          },
        });
        session.transport.sendEvent({ type: "response.create" });
      } catch (e) {
        console.error("[VoiceAgent] Failed to send screenshot into voice session", e);
      }
    },
    []
  );

  const addTranscript = useCallback((role: "user" | "assistant", text: string) => {
    if (!text.trim()) return;
    
    setTranscripts(prev => [...(prev || []).slice(-19), { role, text }]);
    
    if (onTranscript) {
      const looksLikeHtml = (t: string) => {
        const s = t.trim();
        if (!s) return false;
        if (s.includes("```")) return false;
        if (/<!doctype\s+html/i.test(s)) return true;
        if (/<html[\s>]/i.test(s)) return true;
        if (/<head[\s>]/i.test(s)) return true;
        if (/<body[\s>]/i.test(s)) return true;
        if (/<style[\s>]/i.test(s)) return true;
        if (/<div[\s>]/i.test(s)) return true;
        return false;
      };

      const displayText = (() => {
        if (role === "user") return `🎤 ${text}`;
        if (looksLikeHtml(text)) return `\n\n\`\`\`html\n${text.trim()}\n\`\`\`\n`;
        return text;
      })();
      const item: Item = {
        type: "message",
        role: role === "user" ? "user" : "assistant",
        content: [{ type: "output_text", text: displayText }],
      };
      onTranscript(item);
    }
  }, [onTranscript]);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    setTranscripts([]);
    processedTranscriptKeysRef.current = new Set();

    try {
      // Get ephemeral token from our API
      const tokenResponse = await fetch("/api/realtime/token", { method: "POST" });
      if (!tokenResponse.ok) {
        throw new Error("Failed to get session token");
      }
      const { client_secret } = await tokenResponse.json();

      console.log("[VoiceAgent] Requesting microphone access...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = mediaStream;
      console.log("[VoiceAgent] Microphone access granted");

      const micTrack = mediaStream.getAudioTracks()[0];
      if (!micTrack) {
        throw new Error("No microphone track available");
      }
      micTrack.enabled = true;
      console.log("[VoiceAgent] Mic track state", {
        enabled: micTrack.enabled,
        muted: (micTrack as MediaStreamTrack).muted,
        readyState: micTrack.readyState,
        settings: typeof micTrack.getSettings === "function" ? micTrack.getSettings() : undefined,
      });
      console.log("[VoiceAgent] Mic track label", micTrack.label);
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices
          .filter((d) => d.kind === "audioinput")
          .map((d) => ({ deviceId: d.deviceId, label: d.label }));
        console.log("[VoiceAgent] Available audioinput devices", audioInputs);
      } catch (e) {
        console.warn("[VoiceAgent] Failed to enumerate devices", e);
      }
      micTrack.onmute = () => console.log("[VoiceAgent] Mic track muted");
      micTrack.onunmute = () => console.log("[VoiceAgent] Mic track unmuted");
      micTrack.onended = () => console.log("[VoiceAgent] Mic track ended");

      if (micDebugIntervalRef.current) {
        window.clearInterval(micDebugIntervalRef.current);
        micDebugIntervalRef.current = null;
      }

      try {
        const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextCtor) {
          const audioContext = new AudioContextCtor();
          const source = audioContext.createMediaStreamSource(mediaStream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;
          source.connect(analyser);
          const data = new Uint8Array(analyser.fftSize);
          micDebugIntervalRef.current = window.setInterval(() => {
            analyser.getByteTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
              const v = (data[i] - 128) / 128;
              sum += v * v;
            }
            const rms = Math.sqrt(sum / data.length);
            console.log("[VoiceAgent] Mic level", { rms: Number(rms.toFixed(4)) });
          }, 1000);
        }
      } catch (e) {
        console.warn("[VoiceAgent] Mic diagnostics unavailable", e);
      }

      // Create audio element for playback
      const audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElement.id = "voice-agent-audio";
      document.body.appendChild(audioElement);
      audioElementRef.current = audioElement;
      console.log("[VoiceAgent] Audio element created");

      // Create the WebRTC transport with explicit audio configuration
      const transport = new OpenAIRealtimeWebRTC({
        mediaStream,
        audioElement,
      });

      let skillInstructions = "";
      if (selectedSkill) {
        try {
          const resp = await fetch("/api/skills/get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skillName: selectedSkill }),
          });
          if (resp.ok) {
            const data = await resp.json();
            const content = data?.skill?.content;
            if (typeof content === "string" && content.trim()) {
              skillInstructions = `\n\n# Skill: ${selectedSkill}\n\n${content}`;
            }
          }
        } catch (e) {
          console.error("[VoiceAgent] Failed to load selected skill", e);
        }
      }

      // Create the RealtimeAgent
      const agent = new RealtimeAgent({
        name: "VoiceAssistant",
        instructions:
          `${getDeveloperPrompt()}

You are operating in Voice Mode.

When the user asks you to create a landing page, UI, or any code-heavy output, DO NOT read code aloud. Instead, call the generate_artifact tool with the user's request (include any design requirements) and then respond briefly with a confirmation.

If you are not calling generate_artifact, keep responses natural and concise.

${skillInstructions}`,
        tools: [generateArtifactTool, searchVectorStoreTool, webSearchTool],
      });

      // Create the RealtimeSession with custom transport and input config
      const session = new RealtimeSession(agent, {
        model: "gpt-realtime-mini-2025-12-15",
        transport,
        config: {
          inputAudioTranscription: {
            model: "gpt-4o-mini-transcribe",
          },
          turnDetection: {
            type: "semantic_vad",
            eagerness: "medium",
            createResponse: true,
            interruptResponse: true,
          },
        },
      });
      sessionRef.current = session;

      // Listen for history updates to get transcripts
      session.on("history_updated", (history) => {
        console.log("[VoiceAgent] History updated:", history.length, "items");
        for (const item of history) {
          if (!item || item.type !== "message") continue;
          if (!item.content || !Array.isArray(item.content)) continue;

          const role = item.role === "user" ? "user" : "assistant";

          const hasOutputAudioTranscript =
            role === "assistant" &&
            item.content.some(
              (c: any) => c?.type === "output_audio" && typeof c?.transcript === "string" && c.transcript.trim()
            );

          for (const content of item.content) {
            const contentType = content?.type;

            if (role === "user") {
              if (contentType === "input_audio" && typeof content?.transcript === "string" && content.transcript.trim()) {
                const key = `${item.itemId ?? ""}:input_audio:${content.transcript}`;
                if (!processedTranscriptKeysRef.current.has(key)) {
                  processedTranscriptKeysRef.current.add(key);
                  addTranscript("user", content.transcript);
                }
                continue;
              }

              if (contentType === "input_text" && typeof content?.text === "string" && content.text.trim()) {
                if (content.text.trim().startsWith("[System:")) {
                  continue;
                }
                const key = `${item.itemId ?? ""}:input_text:${content.text}`;
                if (!processedTranscriptKeysRef.current.has(key)) {
                  processedTranscriptKeysRef.current.add(key);
                  addTranscript("user", content.text);
                }
              }
              continue;
            }

            if (role === "assistant") {
              if (contentType === "output_audio" && typeof content?.transcript === "string" && content.transcript.trim()) {
                const key = `${item.itemId ?? ""}:output_audio:${content.transcript}`;
                if (!processedTranscriptKeysRef.current.has(key)) {
                  processedTranscriptKeysRef.current.add(key);
                  addTranscript("assistant", content.transcript);
                }
                continue;
              }

              if (hasOutputAudioTranscript) {
                continue;
              }

              if (contentType === "output_text" && typeof content.text === "string" && content.text.trim()) {
                const key = `${item.itemId ?? ""}:output_text:${content.text}`;
                if (!processedTranscriptKeysRef.current.has(key)) {
                  processedTranscriptKeysRef.current.add(key);
                  addTranscript("assistant", content.text);
                }
              }
            }
          }
        }
      });

      // Listen for audio events
      session.on("audio", () => {
        console.log("[VoiceAgent] Audio event received");
      });

      // Listen for all transport events to debug
      session.transport.on("*", (event: unknown) => {
        const evt = event as { type?: string };
        const type = evt?.type;
        if (!type) {
          console.log("[VoiceAgent] Transport event:", event);
          return;
        }
        const shouldLogPayload =
          type.includes("input") ||
          type.includes("vad") ||
          type.includes("turn") ||
          type.includes("transcript");
        if (shouldLogPayload) {
          console.log("[VoiceAgent] Transport event payload:", event);
        } else {
          console.log("[VoiceAgent] Transport event:", type);
        }
      });

      // Connect using the ephemeral token
      await session.connect({
        apiKey: client_secret.value,
      });

      console.log("[VoiceAgent] Connected successfully");
      setStatus("connected");

      try {
        session.transport.mute(false);
        setIsMuted(false);
      } catch (e) {
        console.warn("[VoiceAgent] Failed to unmute transport", e);
      }

      try {
        session.transport.sendEvent({
          type: "session.update",
          session: {
            type: "realtime",
            input_audio_transcription: {
              model: "gpt-4o-mini-transcribe",
            },
            turn_detection: {
              type: "semantic_vad",
              eagerness: "medium",
              create_response: true,
              interrupt_response: true,
            },
          },
        });
      } catch (e) {
        console.warn("[VoiceAgent] Failed to send session.update", e);
      }

      // Make the agent speak first by adding a hidden user message and triggering response
      session.transport.sendEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user", 
          content: [
            {
              type: "input_text",
              text: "[System: The user just connected. Greet them warmly.]",
            },
          ],
        },
      });
      session.transport.sendEvent({
        type: "response.create",
      });
    } catch (err) {
      console.error("Connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      setStatus("error");
    }
  }, [addTranscript, searchVectorStoreTool, selectedSkill, webSearchTool]);

  const disconnect = useCallback(() => {
    if (micDebugIntervalRef.current) {
      window.clearInterval(micDebugIntervalRef.current);
      micDebugIntervalRef.current = null;
    }
    if (audioElementRef.current) {
      if (audioElementRef.current.parentNode) {
        audioElementRef.current.parentNode.removeChild(audioElementRef.current);
      }
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    dataChannelRef.current = null;
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.error("Error closing session:", e);
      }
      sessionRef.current = null;
    }
    setStatus("idle");
  }, []);

  const toggleMute = useCallback(() => {
    if (sessionRef.current) {
      const newMuted = !isMuted;
      sessionRef.current.transport.mute(newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  useEffect(() => {
    return () => {
      if (micDebugIntervalRef.current) {
        window.clearInterval(micDebugIntervalRef.current);
        micDebugIntervalRef.current = null;
      }
      if (sessionRef.current) {
        sessionRef.current.close();
      }
    };
  }, []);

  const bgColor = theme === "dark" ? "bg-[#2f2f2f]" : "bg-stone-100";
  const textColor = theme === "dark" ? "text-white" : "text-stone-900";
  const mutedTextColor = theme === "dark" ? "text-stone-400" : "text-stone-500";

  return (
    <div className={`flex flex-col h-full ${theme === "dark" ? "bg-[#212121]" : "bg-white"}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${theme === "dark" ? "border-stone-700" : "border-stone-200"}`}>
        <h2 className={`text-lg font-semibold ${textColor}`}>Voice Mode</h2>
        {onClose && (
          <button
            onClick={() => {
              disconnect();
              onClose();
            }}
            className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-stone-700" : "hover:bg-stone-100"}`}
          >
            <PhoneOff size={20} className={mutedTextColor} />
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* Status indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
            status === "connected" 
              ? "bg-green-500/20 animate-pulse" 
              : status === "connecting"
              ? "bg-yellow-500/20 animate-pulse"
              : bgColor
          }`}>
            {status === "connected" ? (
              <Volume2 size={40} className="text-green-500" />
            ) : status === "connecting" ? (
              <Mic size={40} className="text-yellow-500 animate-pulse" />
            ) : (
              <Mic size={40} className={mutedTextColor} />
            )}
          </div>
          <p className={`text-sm ${mutedTextColor}`}>
            {status === "idle" && "Click to start voice chat"}
            {status === "connecting" && "Connecting..."}
            {status === "connected" && (isMuted ? "Muted" : "Listening...")}
            {status === "error" && "Connection failed"}
          </p>
          {error && (
            <p className="text-sm text-red-500 text-center max-w-xs">{error}</p>
          )}
        </div>

        {/* Transcript */}
        {transcripts && transcripts.length > 0 && (
          <div className={`w-full max-w-md rounded-lg p-4 ${bgColor} max-h-48 overflow-y-auto`}>
            {transcripts.map((line, i) => (
              <p key={i} className={`text-sm ${textColor} mb-1`}>
                <span className="font-medium">{line.role === "user" ? "You" : "Assistant"}:</span> {line.text}
              </p>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          {status === "idle" || status === "error" ? (
            <button
              onClick={connect}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
            >
              <Phone size={20} />
              <span>Start Voice Chat</span>
            </button>
          ) : status === "connecting" ? (
            <button
              disabled
              className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-full opacity-75 cursor-not-allowed"
            >
              <Mic size={20} className="animate-pulse" />
              <span>Connecting...</span>
            </button>
          ) : (
            <>
              <ScreenCapture onCapture={handleVoiceScreenCapture} />

              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-colors ${
                  isMuted 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : `${bgColor} hover:opacity-80 ${textColor}`
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <button
                onClick={disconnect}
                className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                title="End call"
              >
                <PhoneOff size={24} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className={`px-4 py-3 border-t ${theme === "dark" ? "border-stone-700" : "border-stone-200"}`}>
        <p className={`text-xs text-center ${mutedTextColor}`}>
          Voice chat uses OpenAI Realtime API. Speak naturally and the assistant will respond.
        </p>
      </div>
    </div>
  );
}
