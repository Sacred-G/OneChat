"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react";
import useThemeStore from "@/stores/useThemeStore";
import { RealtimeAgent, RealtimeSession, OpenAIRealtimeWebRTC, tool } from "@openai/agents/realtime";
import { Item } from "@/lib/assistant";
import useToolsStore from "@/stores/useToolsStore";
import useConversationStore from "@/stores/useConversationStore";
import ScreenCapture from "@/components/screen-capture";
import Image from "next/image";
import { Monitor, MonitorOff } from "lucide-react";
import { z } from "zod";
import { getDeveloperPrompt } from "@/config/constants";

type VoiceStatus = "idle" | "connecting" | "connected" | "error";

interface VoiceAgentProps {
  onClose?: () => void;
  onTranscript?: (item: Item) => void;
}

export default function VoiceAgent({ onClose, onTranscript }: VoiceAgentProps) {
  const { theme } = useThemeStore();
  const { vectorStore, webSearchEnabled, webSearchConfig, mcpEnabled, commandMcpConfigs, selectedVoice } = useToolsStore();
  const { selectedSkill } = useConversationStore();
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Array<{ role: string; text: string }>>();
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [currentScreenImage, setCurrentScreenImage] = useState<string | null>(null);
  const screenShareIntervalRef = useRef<number | null>(null);
  
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
            mcpConfigs: state.mcpConfigs,
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

  const generateVideoTool = useMemo(
    () =>
      tool({
        name: "generate_video",
        description: "Generate a video using OpenAI's Sora model. Use this when the user asks for video content, animations, or visual stories.",
        parameters: z.object({
          prompt: z.string().describe("The video description/prompt"),
          size: z.enum(["1280x720", "1920x1080"]).optional().describe("Video resolution: 1280x720 (720p) or 1920x1080 (1080p)"),
          seconds: z.number().min(1).max(60).optional().describe("Video duration in seconds (1-60)"),
        }),
        execute: async ({ prompt, size = "1280x720", seconds = 10 }) => {
          try {
            const resp = await fetch("/api/videos/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: prompt.trim(),
                model: "sora-2",
                size,
                seconds,
              }),
            });

            if (!resp.ok) {
              const errText = await resp.text();
              return `Video generation failed: ${errText}`;
            }

            const data = await resp.json();
            
            if (data.error) {
              return `Video generation failed: ${data.error}`;
            }

            // Start polling for completion
            const videoId = data.id;
            let attempts = 0;
            const maxAttempts = 60; // 2 minutes with 2-second intervals

            while (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const statusResp = await fetch(`/api/videos/status/${videoId}`);
              if (!statusResp.ok) {
                return "Failed to check video status";
              }

              const statusData = await statusResp.json();
              
              if (statusData.status === "completed") {
                // Post the video to chat
                if (onTranscript) {
                  const item: Item = {
                    type: "message",
                    role: "assistant",
                    content: [
                      {
                        type: "output_text",
                        text: `I've generated your video: "${prompt}"\n\nVideo ID: ${videoId}\nResolution: ${size}\nDuration: ${seconds}s\n\nThe video is now processing and will be available shortly. You can download it once it's ready.`
                      } as any
                    ],
                  };
                  onTranscript(item);
                }
                return `Video generation completed! Video ID: ${videoId}. The video will be available for download shortly.`;
              }
              
              if (statusData.status === "failed") {
                return `Video generation failed: ${statusData.error?.message || 'Unknown error'}`;
              }

              attempts++;
            }

            return "Video generation is taking longer than expected. Please check back later for the result.";
          } catch (e) {
            return `Failed to generate video: ${e instanceof Error ? e.message : "unknown error"}`;
          }
        },
      }),
    [onTranscript]
  );

  const generateImageTool = useMemo(
    () =>
      tool({
        name: "generate_image",
        description: "Generate an image using AI. Use this when the user asks to create, generate, or make an image.",
        parameters: z.object({
          prompt: z.string().describe("The image description/prompt"),
        }),
        execute: async ({ prompt }) => {
          try {
            const state = useToolsStore.getState();
            const resp = await fetch("/api/functions/generate_image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: prompt.trim(),
                provider: state.geminiImageEnabled ? "gemini" : "openai",
              }),
            });

            if (!resp.ok) {
              const errText = await resp.text();
              return `Image generation failed: ${errText}`;
            }

            const data = await resp.json();
            
            if (data.error) {
              return `Image generation failed: ${data.error}`;
            }

            // Post the image to chat
            if (onTranscript && data.imageData) {
              const item: Item = {
                type: "message",
                role: "assistant",
                content: [
                  {
                    type: "output_text",
                    text: `I've generated your image: "${prompt}"\n\n![Generated image](${data.imageData})`
                  } as any
                ],
              };
              onTranscript(item);
            }
            
            return `Image generated successfully!`;
          } catch (e) {
            return `Failed to generate image: ${e instanceof Error ? e.message : "unknown error"}`;
          }
        },
      }),
    [onTranscript]
  );

  const generateImagesTool = useMemo(
    () =>
      tool({
        name: "generate_images",
        description: "Generate images with optional reference image input. Use this when the user asks to create images based on or inspired by an existing image.",
        parameters: z.object({
          prompt: z.string().describe("The image description/prompt"),
          imageDataUrl: z.string().optional().describe("Optional base64 image data URL to use as reference"),
        }),
        execute: async ({ prompt, imageDataUrl }) => {
          try {
            const resp = await fetch("/api/functions/generate_images", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: prompt.trim(),
                ...(typeof imageDataUrl === "string" && imageDataUrl.trim()
                  ? { imageDataUrl: imageDataUrl.trim() }
                  : {}),
              }),
            });

            if (!resp.ok) {
              const errText = await resp.text();
              return `Image generation failed: ${errText}`;
            }

            const data = await resp.json();
            
            if (data.error) {
              return `Image generation failed: ${data.error}`;
            }

            // Post the image to chat
            if (onTranscript && data.imageData) {
              const item: Item = {
                type: "message",
                role: "assistant",
                content: [
                  {
                    type: "output_text",
                    text: `I've generated your image: "${prompt}"\n\n![Generated image](${data.imageData})`
                  } as any
                ],
              };
              onTranscript(item);
            }
            
            return `Image generated successfully!`;
          } catch (e) {
            return `Failed to generate image: ${e instanceof Error ? e.message : "unknown error"}`;
          }
        },
      }),
    [onTranscript]
  );

  // Tool to list available skills
  const listSkillsTool = useMemo(
    () =>
      tool({
        name: "list_skills",
        description: "List all available skills that can be used. Call this when the user asks what skills are available.",
        parameters: z.object({}),
        execute: async () => {
          try {
            const resp = await fetch("/api/skills/list");
            if (!resp.ok) {
              return "Failed to list skills.";
            }
            const data = await resp.json();
            const skills = data.skills || [];
            if (skills.length === 0) {
              return "No skills are currently available.";
            }
            return `Available skills: ${skills.map((s: any) => s.name || s).join(", ")}`;
          } catch (e) {
            return `Failed to list skills: ${e instanceof Error ? e.message : "unknown error"}`;
          }
        },
      }),
    []
  );

  // Tool to use/invoke a specific skill
  const useSkillTool = useMemo(
    () =>
      tool({
        name: "use_skill",
        description: "Use a specific skill to process a request. This loads the skill's instructions and generates a response using the chat pipeline.",
        parameters: z.object({
          skillName: z.string().describe("The name of the skill to use"),
          prompt: z.string().describe("The user's request to process with this skill"),
        }),
        execute: async ({ skillName, prompt }) => {
          try {
            // First, get the skill content
            const skillResp = await fetch("/api/skills/get", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ skillName }),
            });

            if (!skillResp.ok) {
              return `Skill "${skillName}" not found. Use list_skills to see available skills.`;
            }

            const skillData = await skillResp.json();
            if (!skillData.skill) {
              return `Skill "${skillName}" not found.`;
            }

            // Use the chat pipeline with the skill
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
              mcpConfigs: state.mcpConfigs,
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
                content: [{ type: "input_text", text: prompt }],
              },
            ];

            const res = await fetch("/api/turn_response", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages,
                toolsState,
                googleIntegrationEnabled: state.googleIntegrationEnabled,
                selectedSkill: skillName,
                provider: state.provider,
                apipieModel: state.apipieModel,
              }),
            });

            if (!res.ok || !res.body) {
              const t = await res.text().catch(() => "");
              return `Failed to use skill: ${t || res.statusText}`;
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

            if (!output.trim()) return `Skill "${skillName}" completed but returned no output.`;

            if (onTranscript) {
              const item: Item = {
                type: "message",
                role: "assistant",
                content: [{ type: "output_text", text: output } as any],
              };
              onTranscript(item);
            }

            return `Done. I used the "${skillName}" skill and posted the result in the chat.`;
          } catch (e) {
            return `Failed to use skill: ${e instanceof Error ? e.message : "unknown error"}`;
          }
        },
      }),
    [onTranscript]
  );

  // Tool to list available MCP servers and their tools
  const listMcpToolsTool = useMemo(
    () =>
      tool({
        name: "list_mcp_tools",
        description: "List all available MCP (Model Context Protocol) servers and their tools. Use this to discover what external tools are available.",
        parameters: z.object({}),
        execute: async () => {
          if (!mcpEnabled) {
            return "MCP is disabled. Ask the user to enable MCP in Settings.";
          }

          try {
            const resp = await fetch("/api/mcp_local", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "list_all_tools" }),
            });

            if (!resp.ok) {
              return "Failed to list MCP tools.";
            }

            const data = await resp.json();
            if (!data.ok || !data.tools || data.tools.length === 0) {
              return "No MCP tools are currently available. Make sure MCP servers are configured in mcp_config.json.";
            }

            const toolsByServer: Record<string, string[]> = {};
            for (const { serverId, tool: t } of data.tools) {
              if (!toolsByServer[serverId]) toolsByServer[serverId] = [];
              toolsByServer[serverId].push(`${t.name}: ${t.description || "No description"}`);
            }

            let result = "Available MCP tools:\n";
            for (const [server, tools] of Object.entries(toolsByServer)) {
              result += `\n**${server}**:\n`;
              for (const t of tools) {
                result += `  - ${t}\n`;
              }
            }
            return result;
          } catch (e) {
            return `Failed to list MCP tools: ${e instanceof Error ? e.message : "unknown error"}`;
          }
        },
      }),
    [mcpEnabled]
  );

  // Tool to call an MCP tool
  const callMcpToolTool = useMemo(
    () =>
      tool({
        name: "call_mcp_tool",
        description: "Call a specific tool from an MCP server. Use list_mcp_tools first to see available tools.",
        parameters: z.object({
          serverId: z.string().describe("The MCP server ID (e.g., 'exa', 'playwright')"),
          toolName: z.string().describe("The name of the tool to call"),
          arguments: z.record(z.any()).optional().describe("Arguments to pass to the tool as a JSON object"),
        }),
        execute: async ({ serverId, toolName, arguments: toolArgs }) => {
          if (!mcpEnabled) {
            return "MCP is disabled. Ask the user to enable MCP in Settings.";
          }

          try {
            const resp = await fetch("/api/mcp_local", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "call_tool",
                server_id: serverId,
                tool_name: toolName,
                arguments: toolArgs || {},
              }),
            });

            if (!resp.ok) {
              const errText = await resp.text();
              return `MCP tool call failed: ${errText}`;
            }

            const data = await resp.json();
            if (!data.ok) {
              return `MCP tool call failed: ${data.error || "Unknown error"}`;
            }

            // Format the result
            const result = data.result;
            if (typeof result === "string") {
              return result;
            }
            if (result?.content) {
              // MCP tools often return { content: [...] }
              const contents = Array.isArray(result.content) ? result.content : [result.content];
              return contents.map((c: any) => {
                if (typeof c === "string") return c;
                if (c?.text) return c.text;
                return JSON.stringify(c);
              }).join("\n");
            }
            return JSON.stringify(result, null, 2);
          } catch (e) {
            return `Failed to call MCP tool: ${e instanceof Error ? e.message : "unknown error"}`;
          }
        },
      }),
    [mcpEnabled]
  );

  const handleVoiceScreenCapture = useCallback(
    async (imageData: string) => {
      lastCapturedImageRef.current = imageData;
      setCurrentScreenImage(imageData);
      setIsScreenSharing(true);

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

  const toggleScreenSharing = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      setIsScreenSharing(false);
      setCurrentScreenImage(null);
      if (screenShareIntervalRef.current) {
        clearInterval(screenShareIntervalRef.current);
        screenShareIntervalRef.current = null;
      }
      return;
    }

    // Start screen sharing with auto-refresh
    const captureScreen = async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
          } as MediaTrackConstraints,
          audio: false,
        });

        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();

        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL("image/png");
          
          stream.getTracks().forEach((track) => track.stop());
          
          handleVoiceScreenCapture(imageData);
        }
      } catch (error) {
        console.error("Error capturing screen:", error);
        if (error instanceof Error && error.name !== "NotAllowedError") {
          setError("Failed to capture screen. Please try again.");
          // Stop auto-refresh on error
          setIsScreenSharing(false);
          if (screenShareIntervalRef.current) {
            clearInterval(screenShareIntervalRef.current);
            screenShareIntervalRef.current = null;
          }
        }
      }
    };

    // Initial capture
    await captureScreen();

    // Set up auto-refresh every 3 seconds
    screenShareIntervalRef.current = window.setInterval(async () => {
      if (isScreenSharing && status === "connected") {
        await captureScreen();
      }
    }, 3000);
  }, [isScreenSharing, status, handleVoiceScreenCapture]);

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

When the user asks for video content, animations, or visual stories, use the generate_video tool. This creates actual videos using OpenAI's Sora model. After generating, let the user know the video ID and that it will be available for download.

When the user asks to create, generate, or make an image, use the generate_image tool. This creates images using AI and posts them to the chat.

When the user asks to create images based on or inspired by an existing image (like a screenshot), use the generate_images tool with the image data.

## Skills
You have access to skills - specialized capabilities that can help with specific tasks:
- Use list_skills to see what skills are available
- Use use_skill to invoke a specific skill with a prompt
- Skills are useful for specialized tasks like algorithmic art, brand guidelines, canvas design, etc.

## MCP (Model Context Protocol) Tools
You have access to external tools via MCP servers:
- Use list_mcp_tools to discover available MCP servers and their tools
- Use call_mcp_tool to invoke a specific tool from an MCP server
- MCP tools can include web search (exa), browser automation (playwright), and other external integrations

If you are not calling a tool, keep responses natural and concise.

${skillInstructions}`,
        tools: [generateArtifactTool, searchVectorStoreTool, webSearchTool, generateVideoTool, generateImageTool, generateImagesTool, listSkillsTool, useSkillTool, listMcpToolsTool, callMcpToolTool],
      });

      // Create the RealtimeSession with custom transport and input config
      const session = new RealtimeSession(agent, {
        model: "gpt-realtime-mini-2025-12-15",
        transport,
        config: {
          voice: selectedVoice,
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
  }, [addTranscript, searchVectorStoreTool, selectedSkill, webSearchTool, generateVideoTool, generateImageTool, generateImagesTool, generateArtifactTool]);

  const disconnect = useCallback(() => {
    if (micDebugIntervalRef.current) {
      window.clearInterval(micDebugIntervalRef.current);
      micDebugIntervalRef.current = null;
    }
    if (screenShareIntervalRef.current) {
      window.clearInterval(screenShareIntervalRef.current);
      screenShareIntervalRef.current = null;
    }
    setIsScreenSharing(false);
    setCurrentScreenImage(null);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
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
      if (screenShareIntervalRef.current) {
        window.clearInterval(screenShareIntervalRef.current);
        screenShareIntervalRef.current = null;
      }
      if (sessionRef.current) {
        sessionRef.current.close();
      }
    };
  }, []);

  const bgColor = theme === "dark" ? "bg-white/[0.04]" : "bg-stone-100";
  const textColor = theme === "dark" ? "text-white" : "text-stone-900";
  const mutedTextColor = theme === "dark" ? "text-stone-400" : "text-stone-500";

  return (
    <div className={`flex flex-col h-full ${theme === "dark" ? "bg-[#121212]" : "bg-white"}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${theme === "dark" ? "border-white/10" : "border-stone-200"}`}>
        <h2 className={`text-lg font-semibold ${textColor}`}>Voice Mode</h2>
        {onClose && (
          <button
            onClick={() => {
              disconnect();
              onClose();
            }}
            className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-stone-100"}`}
          >
            <PhoneOff size={20} className={mutedTextColor} />
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
        {/* Screen preview */}
        {currentScreenImage && (
          <div className="flex-shrink-0">
            <div className="relative h-48 w-full max-w-md mx-auto rounded-lg overflow-hidden border border-gray-300">
              <Image
                src={currentScreenImage}
                alt="Screen preview"
                fill
                sizes="100vw"
                unoptimized
                className="object-contain"
              />
              <button
                onClick={() => {
                  setIsScreenSharing(false);
                  setCurrentScreenImage(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                ✕
              </button>
            </div>
            <p className={`text-xs text-center mt-2 ${mutedTextColor}`}>
              Screen sharing active - AI can see your screen
            </p>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
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
            <div className={`w-full max-w-md rounded-lg p-4 ${bgColor} max-h-32 overflow-y-auto`}>
              {transcripts.map((line, i) => (
                <p key={i} className={`text-sm ${textColor} mb-1`}>
                  <span className="font-medium">{line.role === "user" ? "You" : "Assistant"}:</span> {line.text}
                </p>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
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
                <button
                  onClick={toggleScreenSharing}
                  className={`p-3 rounded-full transition-colors ${
                    isScreenSharing
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : `${bgColor} hover:opacity-80 ${textColor}`
                  }`}
                  title={isScreenSharing ? "Stop screen sharing" : "Share screen"}
                >
                  {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                </button>

                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full transition-colors ${
                    isMuted 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : `${bgColor} hover:opacity-80 ${textColor}`
                  }`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <button
                  onClick={disconnect}
                  className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                  title="End call"
                >
                  <PhoneOff size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className={`px-4 py-3 border-t ${theme === "dark" ? "border-white/10" : "border-stone-200"}`}>
        <p className={`text-xs text-center ${mutedTextColor}`}>
          Voice chat uses OpenAI Realtime API. Speak naturally and the assistant will respond. Share your screen for real-time visual context, or ask for video generation to create content with Sora.
        </p>
      </div>
    </div>
  );
}
