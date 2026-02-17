"use client";

import Link from "next/link";
import Image from "next/image";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useToolsStore from "@/stores/useToolsStore";

type Org = {
  id: string;
  name: string;
  vanityName?: string;
};

export default function LinkedInCommunityClient() {
  const provider = useToolsStore((s) => s.provider);
  const apipieModel = useToolsStore((s) => s.apipieModel);
  const [connected, setConnected] = useState(false);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"recent" | "text" | "multiimage" | "poll">(
    "recent"
  );

  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWriting, setIsWriting] = useState(false);

  const [recentCount, setRecentCount] = useState("10");
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentResult, setRecentResult] = useState<any>(null);

  const [aiWritePrompt, setAiWritePrompt] = useState<string>("");
  const [aiWriteTone, setAiWriteTone] = useState<
    "Professional" | "Friendly" | "Bold" | "Inspirational" | "Concise"
  >("Professional");

  const [textCommentary, setTextCommentary] = useState<string>("");

  const [commentary, setCommentary] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string>("");
  const [galleryItems, setGalleryItems] = useState<
    Array<{ url?: string | null; path?: string; created_at?: any; name?: string }>
  >([]);

  const [aiImagePrompt, setAiImagePrompt] = useState<string>("");
  const [aiImageProvider, setAiImageProvider] = useState<"openai" | "apipie" | "nano-banana">(
    "openai"
  );
  const [aiImageCount, setAiImageCount] = useState<string>("2");
  const [aiImageModel, setAiImageModel] = useState<string>("dall-e-3");
  const [nanoBananaModel, setNanoBananaModel] = useState<
    "gemini-2.5-flash-image" | "gemini-3-pro-image-preview"
  >("gemini-2.5-flash-image");
  const [nanoBananaImageSize, setNanoBananaImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [nanoBananaAspectRatio, setNanoBananaAspectRatio] = useState<
    "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9"
  >("1:1");
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  const [pollCommentary, setPollCommentary] = useState<string>("");
  const [pollQuestion, setPollQuestion] = useState<string>("");
  const [pollDuration, setPollDuration] = useState<
    "ONE_DAY" | "THREE_DAYS" | "SEVEN_DAYS" | "FOURTEEN_DAYS"
  >("THREE_DAYS");
  const [pollOption1, setPollOption1] = useState<string>("");
  const [pollOption2, setPollOption2] = useState<string>("");
  const [pollOption3, setPollOption3] = useState<string>("");
  const [pollOption4, setPollOption4] = useState<string>("");

  const insertAtCursor = (
    el: HTMLTextAreaElement | null,
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (!el) {
      setValue((prev: string) => prev + value);
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const current = el.value;
    const next = current.slice(0, start) + value + current.slice(end);
    setValue(next);
    // best-effort restore cursor
    requestAnimationFrame(() => {
      try {
        el.focus();
        const pos = start + value.length;
        el.setSelectionRange(pos, pos);
      } catch {
        // ignore
      }
    });
  };

  const buildToolsStateForWriter = () => {
    // Minimal safe tools state: no tools enabled (writer only).
    return {
      webSearchEnabled: false,
      fileSearchEnabled: false,
      functionsEnabled: false,
      codeInterpreterEnabled: false,
      vectorStore: { id: "", name: "" },
      webSearchConfig: {},
      mcpEnabled: false,
      mcpConfigs: [],
      commandMcpConfigs: [],
      localAgentEnabled: false,
      localAgentUrl: "",
      localAgentCwd: "",
      approvedFunctionTools: [],
      googleIntegrationEnabled: false,
      linkedinIntegrationEnabled: false,
      geminiImageEnabled: false,
      voiceModeEnabled: false,
      selectedVoice: "alloy",
      videoGenerationEnabled: false,
      provider,
      apipieModel,
      apipieImageModel: "",
      apipieFavoriteModels: [],
      apipieFavoriteImageModels: [],
    } as any;
  };

  const applyGeneratedTextToActiveTab = (text: string) => {
    const t = String(text || "").trim();
    if (!t) return;
    if (activeTab === "text") {
      setTextCommentary(t);
      return;
    }
    if (activeTab === "multiimage") {
      setCommentary(t);
      return;
    }
    if (activeTab === "poll") {
      setPollCommentary(t);
      return;
    }
  };

  const writeWithAI = async () => {
    const prompt = aiWritePrompt.trim();
    if (!prompt) {
      setStatus("Missing AI prompt");
      return;
    }
    setIsWriting(true);
    setStatus("");
    try {
      const orgHint = selectedOrgName ? `Organization/Page: ${selectedOrgName}.` : "";
      const tabHint =
        activeTab === "text"
          ? "Write as a text-only LinkedIn post."
          : activeTab === "multiimage"
            ? "Write as a LinkedIn post caption for a multi-image post."
            : activeTab === "poll"
              ? "Write as the commentary for a LinkedIn poll post."
              : "Write as a LinkedIn post.";

      const instruction =
        `${orgHint}\n` +
        `${tabHint}\n` +
        `Tone: ${aiWriteTone}.\n` +
        `Output plain text ONLY (no HTML).\n` +
        `Use little text format where helpful:\n` +
        `- Use bullet points with escaped asterisk like \\* Item\n` +
        `- Include 3-6 relevant hashtags using {hashtag|\\#|Tag} template\n` +
        `- Keep it readable and suitable for LinkedIn.\n\n` +
        `User request:\n${prompt}`;

      const res = await fetch("/api/turn_response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: instruction }],
          toolsState: buildToolsStateForWriter(),
          selectedSkill: null,
          provider,
          apipieModel,
        }),
      });
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";
      let out = "";

      while (!done) {
        const r = await reader.read();
        done = r.done;
        buffer += decoder.decode(r.value || new Uint8Array(), { stream: !done });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.replace(/^data:\s?/, "").trim();
          if (!payload || payload === "[DONE]") continue;
          let parsed: any = null;
          try {
            parsed = JSON.parse(payload);
          } catch {
            continue;
          }

          const evt = parsed?.event;
          // apipie path uses the same wrapper event name but nests delta under parsed.data.delta
          if (evt === "response.output_text.delta") {
            const delta = parsed?.data?.delta;
            if (typeof delta === "string" && delta) {
              out += delta;
            }
          }
        }
      }

      if (out.trim()) {
        applyGeneratedTextToActiveTab(out);
        setStatus("AI text generated.");
      } else {
        setStatus("AI returned no text.");
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "AI writing failed");
    } finally {
      setIsWriting(false);
    }
  };

  const littleTextHelp = {
    mentionOrg: "@[CompanyName](urn:li:organization:123456)",
    mentionPerson: "@[Name](urn:li:person:123456)",
    hashtagTemplate: "{hashtag|\\#|MyTag}",
    bulletsSample: "Hello, these are some bullet points:\n\n\\* Point 1\n\\* Point 2\n\\* Point 3",
  };

  const selectedOrgName = useMemo(() => {
    const match = orgs.find((o) => o.id === selectedOrgId);
    return match?.name || "Your Page";
  }, [orgs, selectedOrgId]);

  const normalizeLittleText = (input: string) => {
    // turn escaped bullet prefix into a real bullet for preview
    return input.replace(/^\\\*\s+/gm, "• ");
  };

  const renderLittleTextAsLinkedIn = (input: string) => {
    const text = normalizeLittleText(input || "");
    const lines = text.split("\n");

    const renderInline = (line: string) => {
      const parts: React.ReactNode[] = [];
      let i = 0;
      while (i < line.length) {
        const mentionMatch = line.slice(i).match(/^@\[([^\]]+)\]\((urn:li:[^)]+)\)/);
        if (mentionMatch) {
          const label = mentionMatch[1];
          parts.push(
            <span key={`m-${i}`} className="text-[#5bbcff] font-medium">
              @{label}
            </span>
          );
          i += mentionMatch[0].length;
          continue;
        }

        const templateMatch = line.slice(i).match(/^\{hashtag\|\\#\|([^}]+)\}/);
        if (templateMatch) {
          const tag = templateMatch[1];
          parts.push(
            <span key={`h-${i}`} className="text-[#5bbcff] font-medium">
              #{tag}
            </span>
          );
          i += templateMatch[0].length;
          continue;
        }

        const hashtagMatch = line.slice(i).match(/^#([A-Za-z0-9_]+)/);
        if (hashtagMatch) {
          parts.push(
            <span key={`ht-${i}`} className="text-[#5bbcff] font-medium">
              #{hashtagMatch[1]}
            </span>
          );
          i += hashtagMatch[0].length;
          continue;
        }

        // default: consume one char
        parts.push(<span key={`t-${i}`}>{line[i]}</span>);
        i += 1;
      }
      return parts;
    };

    const isBullet = (line: string) => /^•\s+/.test(line);

    const nodes: React.ReactNode[] = [];
    let bulletBuffer: string[] = [];

    const flushBullets = () => {
      if (bulletBuffer.length === 0) return;
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="list-disc pl-5 space-y-1">
          {bulletBuffer.map((l, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(l.replace(/^•\s+/, ""))}
            </li>
          ))}
        </ul>
      );
      bulletBuffer = [];
    };

    lines.forEach((line) => {
      if (isBullet(line)) {
        bulletBuffer.push(line);
        return;
      }
      flushBullets();
      if (!line.trim()) {
        nodes.push(<div key={`sp-${nodes.length}`} className="h-2" />);
        return;
      }
      nodes.push(
        <p key={`p-${nodes.length}`} className="leading-relaxed">
          {renderInline(line)}
        </p>
      );
    });

    flushBullets();
    return nodes;
  };

  const LinkedInPreviewCard = ({ content }: { content: string }) => {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-3 px-4 pt-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0a66c2] to-[#5bbcff] text-white flex items-center justify-center font-semibold">
            {selectedOrgName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate text-white">{selectedOrgName}</div>
            <div className="text-xs text-white/60">Just now • Public</div>
          </div>
        </div>
        <div className="px-4 pb-4 pt-3 text-[14px] text-white/90">
          <div className="space-y-2">{renderLittleTextAsLinkedIn(content || "")}</div>
        </div>
        <div className="border-t border-white/10 px-4 py-3 text-xs text-white/60">
          Preview only
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetch("/api/linkedin/status")
      .then((r) => r.json())
      .then((d) => {
        setConnected(Boolean(d.connected));
        setOauthConfigured(Boolean(d.oauthConfigured));
      })
      .catch(() => {
        setConnected(false);
        setOauthConfigured(false);
      });
  }, []);

  useEffect(() => {
    if (!connected) return;
    fetch("/api/linkedin/organizations")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error || `Failed (${r.status})`);
        return data;
      })
      .then((d) => {
        const list = Array.isArray(d?.organizations) ? (d.organizations as Org[]) : [];
        setOrgs(list);
        if (!selectedOrgId && list[0]?.id) setSelectedOrgId(String(list[0].id));
      })
      .catch((e) => {
        setStatus(e instanceof Error ? e.message : "Failed to load organizations");
        setOrgs([]);
      });
  }, [connected, selectedOrgId]);

  useEffect(() => {
    if (!connected) return;
    if (!selectedOrgId) return;
    if (activeTab !== "recent") return;
    void loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, selectedOrgId, activeTab]);

  const canSubmitText = useMemo(() => {
    return Boolean(
      connected &&
        oauthConfigured &&
        selectedOrgId &&
        textCommentary.trim().length > 0 &&
        !isSubmitting
    );
  }, [connected, oauthConfigured, selectedOrgId, textCommentary, isSubmitting]);

  const submitText = async () => {
    if (!canSubmitText) return;
    setIsSubmitting(true);
    setStatus("");
    try {
      const res = await fetch("/api/linkedin/community/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: selectedOrgId, commentary: textCommentary }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      const id = typeof data?.id === "string" ? data.id : "";
      setStatus(id ? `Created post: ${id}` : "Created post.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadGallery = async () => {
    setGalleryLoading(true);
    setGalleryError("");
    try {
      const res = await fetch("/api/library/images?prefix=all&limit=100", { method: "GET" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      const list = Array.isArray(data) ? data : [];
      setGalleryItems(list);
    } catch (e) {
      setGalleryItems([]);
      setGalleryError(e instanceof Error ? e.message : "Failed to load gallery");
    } finally {
      setGalleryLoading(false);
    }
  };

  const toggleSelectedUrl = (url: string) => {
    setSelectedImageUrls((prev) => {
      const set = new Set(prev);
      if (set.has(url)) set.delete(url);
      else set.add(url);
      return Array.from(set);
    });
  };

  const generateImages = async () => {
    const prompt = aiImagePrompt.trim();
    if (!prompt) {
      setStatus("Missing image prompt");
      return;
    }
    setIsGeneratingImages(true);
    setStatus("");
    try {
      const countNum = Math.max(1, Math.min(4, Number(aiImageCount) || 1));
      let urls: string[] = [];

      if (aiImageProvider === "openai") {
        const res = await fetch("/api/functions/generate_images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        urls = Array.isArray(data?.urls) ? data.urls.filter((u: any) => typeof u === "string") : [];
        urls = urls.slice(0, countNum);
      } else if (aiImageProvider === "apipie") {
        const out: string[] = [];
        for (let i = 0; i < countNum; i++) {
          const res = await fetch("/api/apipie/images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, model: aiImageModel }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
          const u = typeof data?.url === "string" ? data.url : "";
          if (u) out.push(u);
        }
        urls = out;
      } else {
        const res = await fetch("/api/nano-banana/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            numberOfImages: countNum,
            model: nanoBananaModel,
            imageSize: nanoBananaImageSize,
            aspectRatio: nanoBananaAspectRatio,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        urls = Array.isArray(data?.urls) ? data.urls.filter((u: any) => typeof u === "string") : [];
      }

      if (urls.length === 0) throw new Error("No images returned");

      setSelectedImageUrls((prev) => {
        const set = new Set(prev);
        for (const u of urls) set.add(u);
        return Array.from(set);
      });

      setGalleryOpen(true);
      void loadGallery();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to generate images");
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const canSubmitMultiImage = useMemo(() => {
    return Boolean(
      connected &&
        oauthConfigured &&
        selectedOrgId &&
        commentary.trim().length > 0 &&
        (files.length > 0 || selectedImageUrls.length > 0) &&
        !isSubmitting
    );
  }, [connected, oauthConfigured, selectedOrgId, commentary, files, selectedImageUrls, isSubmitting]);

  const submitMultiImage = async () => {
    if (!canSubmitMultiImage) return;
    setIsSubmitting(true);
    setStatus("");
    try {
      const fd = new FormData();
      fd.append("organizationId", selectedOrgId);
      fd.append("commentary", commentary);
      files.forEach((f) => fd.append("images", f));
      selectedImageUrls.forEach((u) => fd.append("imageUrls", u));

      const res = await fetch("/api/linkedin/community/multiimage", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);

      const postId = typeof data?.id === "string" ? data.id : "";
      setStatus(postId ? `Created post: ${postId}` : "Created post.");
      setActiveTab("recent");
      void loadRecent();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmitPoll = useMemo(() => {
    const options = [pollOption1, pollOption2, pollOption3, pollOption4]
      .map((s) => s.trim())
      .filter(Boolean);
    return Boolean(
      connected &&
        oauthConfigured &&
        selectedOrgId &&
        pollCommentary.trim().length > 0 &&
        pollQuestion.trim().length > 0 &&
        options.length >= 2 &&
        !isSubmitting
    );
  }, [
    connected,
    oauthConfigured,
    selectedOrgId,
    pollCommentary,
    pollQuestion,
    pollOption1,
    pollOption2,
    pollOption3,
    pollOption4,
    isSubmitting,
  ]);

  const submitPoll = async () => {
    if (!canSubmitPoll) return;
    setIsSubmitting(true);
    setStatus("");
    try {
      const options = [pollOption1, pollOption2, pollOption3, pollOption4]
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/linkedin/community/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: selectedOrgId,
          commentary: pollCommentary,
          question: pollQuestion,
          duration: pollDuration,
          options,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      const id = typeof data?.id === "string" ? data.id : "";
      setStatus(id ? `Created post: ${id}` : "Created post.");
      setActiveTab("recent");
      void loadRecent();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadRecent = async () => {
    if (!selectedOrgId) return;
    setRecentLoading(true);
    setStatus("");
    try {
      const url = new URL("/api/linkedin/community/posts", window.location.origin);
      url.searchParams.set("organizationId", selectedOrgId);
      url.searchParams.set("count", recentCount || "10");
      url.searchParams.set("sortBy", "LAST_MODIFIED");

      const res = await fetch(url.toString(), { method: "GET" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      setRecentResult(data?.result || null);
    } catch (e) {
      setRecentResult(null);
      setStatus(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setRecentLoading(false);
    }
  };

  // Dark, polished “blue glass” theme for this page only (independent of global theme).
  const containerClass = "relative bg-[#070b18] text-white";
  const panelClass =
    "border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]";

  const tabButtonClass = (isActive: boolean) =>
    `rounded-md px-3 py-1.5 text-sm border transition-colors ${
      isActive
        ? "bg-gradient-to-r from-[#0a66c2] to-[#5bbcff] border-white/10 text-white shadow-[0_10px_30px_-18px_rgba(91,188,255,0.9)]"
        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
    }`;

  const cardClass = "rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4";
  const previewClass = "rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4";

  return (
    <div className={`min-h-screen ${containerClass}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_10%,rgba(91,188,255,0.35),transparent_60%),radial-gradient(900px_circle_at_80%_15%,rgba(10,102,194,0.32),transparent_55%),radial-gradient(800px_circle_at_55%_90%,rgba(128,90,213,0.20),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/40" />
      </div>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <div
                className={
                  "h-6 w-1.5 rounded-full bg-gradient-to-b from-[#5bbcff] via-[#0a66c2] to-[#004182]"
                }
              />
              <h1 className="text-xl font-semibold">LinkedIn Studio</h1>
            </div>
            <div className="text-sm text-white/60">Community Management API (posts, multi-image, polls)</div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-white/70 hover:text-white"
            >
              Back to chat
            </Link>
            {!connected && oauthConfigured ? (
              <a href="/api/linkedin/auth">
                <Button>Connect LinkedIn</Button>
              </a>
            ) : null}
          </div>
        </div>

        <div className={`relative z-10 mt-6 rounded-2xl border p-6 ${panelClass}`}>
          {!oauthConfigured ? (
            <div className="space-y-3">
              <div className="text-white/70">
                Missing LinkedIn env vars. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and
                LINKEDIN_REDIRECT_URI.
              </div>
            </div>
          ) : !connected ? (
            <div className="space-y-3">
              <div className="text-white/70">
                Connect LinkedIn to continue.
              </div>
              <a href="/api/linkedin/auth">
                <Button>Connect LinkedIn</Button>
              </a>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <label
                    className="text-sm text-white/70"
                  >
                    Company Page
                  </label>
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#5bbcff]/60"
                  >
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm text-white/70"
                  >
                    Quick actions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={tabButtonClass(activeTab === "recent")}
                      onClick={() => setActiveTab("recent")}
                    >
                      Recent
                    </button>
                    <button
                      type="button"
                      className={tabButtonClass(activeTab === "text")}
                      onClick={() => setActiveTab("text")}
                    >
                      Text
                    </button>
                    <button
                      type="button"
                      className={tabButtonClass(activeTab === "multiimage")}
                      onClick={() => setActiveTab("multiimage")}
                    >
                      Multi-image
                    </button>
                    <button
                      type="button"
                      className={tabButtonClass(activeTab === "poll")}
                      onClick={() => setActiveTab("poll")}
                    >
                      Poll
                    </button>
                  </div>
                </div>
              </div>

              {activeTab === "recent" ? (
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Recent posts</div>
                      <div className="text-xs text-white/60">
                        Uses Posts API finder by author.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <Input
                          value={recentCount}
                          onChange={(e) => setRecentCount(e.target.value)}
                          placeholder="10"
                        />
                      </div>
                      <Button onClick={loadRecent} disabled={recentLoading || !selectedOrgId}>
                        {recentLoading ? "Loading…" : "Refresh"}
                      </Button>
                    </div>
                  </div>

                  <div
                    className="rounded-xl border border-white/10 bg-black/20 p-4 overflow-auto max-h-[420px]"
                  >
                    <pre className="text-xs whitespace-pre-wrap break-words">
                      {recentResult ? JSON.stringify(recentResult, null, 2) : "No data yet."}
                    </pre>
                  </div>
                </div>
              ) : null}

              {activeTab === "text" ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Create text post</div>
                  <div className={cardClass}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                      <div className="flex-1">
                        <div className="text-xs text-white/60">AI Writer</div>
                        <Input
                          value={aiWritePrompt}
                          onChange={(e) => setAiWritePrompt(e.target.value)}
                          placeholder="Describe what you want the post to say"
                        />
                      </div>
                      <div className="w-full md:w-44">
                        <div className="text-xs text-white/60">Tone</div>
                        <select
                          value={aiWriteTone}
                          onChange={(e) => setAiWriteTone(e.target.value as any)}
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#5bbcff]/60"
                        >
                          <option value="Professional">Professional</option>
                          <option value="Friendly">Friendly</option>
                          <option value="Bold">Bold</option>
                          <option value="Inspirational">Inspirational</option>
                          <option value="Concise">Concise</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <Button onClick={writeWithAI} disabled={isWriting}>
                          {isWriting ? "Writing…" : "Generate"}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-white/60">
                      Provider: {provider === "apipie" ? `apipie.ai (${apipieModel})` : "OpenAI"}
                    </div>
                  </div>
                  <div className={cardClass}>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        type="button"
                        className={tabButtonClass(false)}
                        onClick={() => {
                          const el = document.getElementById("li-text") as HTMLTextAreaElement | null;
                          insertAtCursor(el, littleTextHelp.hashtagTemplate, setTextCommentary);
                        }}
                      >
                        Add hashtag
                      </button>
                      <button
                        type="button"
                        className={tabButtonClass(false)}
                        onClick={() => {
                          const el = document.getElementById("li-text") as HTMLTextAreaElement | null;
                          insertAtCursor(el, littleTextHelp.mentionOrg, setTextCommentary);
                        }}
                      >
                        Add org mention
                      </button>
                      <button
                        type="button"
                        className={tabButtonClass(false)}
                        onClick={() => {
                          const el = document.getElementById("li-text") as HTMLTextAreaElement | null;
                          insertAtCursor(el, "\n\n" + littleTextHelp.bulletsSample, setTextCommentary);
                        }}
                      >
                        Add bullets sample
                      </button>
                    </div>

                    <Textarea
                      id="li-text"
                      value={textCommentary}
                      onChange={(e) => setTextCommentary(e.target.value)}
                      rows={6}
                      placeholder="Write your post (supports little text format for mentions/hashtags/bullets)"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={previewClass}>
                      <div className="text-xs text-white/60">little text (raw)</div>
                      <pre className="mt-2 text-xs whitespace-pre-wrap break-words">{textCommentary || "(empty)"}</pre>
                    </div>
                    <LinkedInPreviewCard content={textCommentary} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={submitText} disabled={!canSubmitText}>
                      {isSubmitting ? "Posting…" : "Post"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeTab === "multiimage" ? (
                <div className="space-y-4">
                  <div className="text-sm font-medium">Create multi-image post</div>
                  <div className={cardClass}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                      <div className="flex-1">
                        <div className="text-xs text-white/60">AI Writer</div>
                        <Input
                          value={aiWritePrompt}
                          onChange={(e) => setAiWritePrompt(e.target.value)}
                          placeholder="Describe what you want the post caption to say"
                        />
                      </div>
                      <div className="w-full md:w-44">
                        <div className="text-xs text-white/60">Tone</div>
                        <select
                          value={aiWriteTone}
                          onChange={(e) => setAiWriteTone(e.target.value as any)}
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#5bbcff]/60"
                        >
                          <option value="Professional">Professional</option>
                          <option value="Friendly">Friendly</option>
                          <option value="Bold">Bold</option>
                          <option value="Inspirational">Inspirational</option>
                          <option value="Concise">Concise</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <Button onClick={writeWithAI} disabled={isWriting}>
                          {isWriting ? "Writing…" : "Generate"}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-white/60">
                      Provider: {provider === "apipie" ? `apipie.ai (${apipieModel})` : "OpenAI"}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        className="text-sm text-white/70"
                      >
                        Commentary
                      </label>
                      <div className={cardClass}>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <button
                            type="button"
                            className={tabButtonClass(false)}
                            onClick={() => {
                              const el = document.getElementById("li-multi") as HTMLTextAreaElement | null;
                              insertAtCursor(el, littleTextHelp.hashtagTemplate, setCommentary);
                            }}
                          >
                            Add hashtag
                          </button>
                          <button
                            type="button"
                            className={tabButtonClass(false)}
                            onClick={() => {
                              const el = document.getElementById("li-multi") as HTMLTextAreaElement | null;
                              insertAtCursor(el, littleTextHelp.mentionOrg, setCommentary);
                            }}
                          >
                            Add org mention
                          </button>
                          <button
                            type="button"
                            className={tabButtonClass(false)}
                            onClick={() => {
                              const el = document.getElementById("li-multi") as HTMLTextAreaElement | null;
                              insertAtCursor(el, "\n\n" + littleTextHelp.bulletsSample, setCommentary);
                            }}
                          >
                            Add bullets sample
                          </button>
                        </div>
                        <Textarea
                          id="li-multi"
                          value={commentary}
                          onChange={(e) => setCommentary(e.target.value)}
                          rows={6}
                          placeholder="Write the post text (supports little text format)"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm text-white/70"
                      >
                        Images
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setFiles(Array.from(e.target.files || []))}
                        className="text-sm text-white/70"
                      />
                      <div
                        className="text-xs text-white/60"
                      >
                        Uploads images with the Images API, then creates the post via the MultiImage API.
                      </div>
                      {files.length > 0 ? (
                        <div
                          className="text-xs text-white/60"
                        >
                          {files.length} file(s) selected
                        </div>
                      ) : null}

                      <div className="pt-2 space-y-2">
                        <button
                          type="button"
                          className={tabButtonClass(false)}
                          onClick={() => {
                            setGalleryOpen(true);
                            void loadGallery();
                          }}
                        >
                          Choose from gallery ({selectedImageUrls.length})
                        </button>
                        {selectedImageUrls.length > 0 ? (
                          <div className="text-xs text-white/60 break-words">
                            Attached from gallery: {selectedImageUrls.length}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className={cardClass}>
                    <div className="text-sm font-medium">AI image generation</div>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="md:col-span-2">
                        <Input
                          value={aiImagePrompt}
                          onChange={(e) => setAiImagePrompt(e.target.value)}
                          placeholder="Describe the image(s) you want to generate"
                        />
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={aiImageProvider}
                          onChange={(e) => setAiImageProvider(e.target.value as any)}
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#5bbcff]/60"
                        >
                          <option value="openai">OpenAI</option>
                          <option value="apipie">apipie.ai</option>
                          <option value="nano-banana">Nano Banana</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <Input
                          value={aiImageCount}
                          onChange={(e) => setAiImageCount(e.target.value)}
                          placeholder="Count (1-4)"
                        />
                      </div>
                      {aiImageProvider === "apipie" ? (
                        <div>
                          <Input
                            value={aiImageModel}
                            onChange={(e) => setAiImageModel(e.target.value)}
                            placeholder="Model (e.g. dall-e-3)"
                          />
                        </div>
                      ) : (
                        <div />
                      )}
                      <div className="flex items-center justify-start">
                        <Button onClick={generateImages} disabled={isGeneratingImages}>
                          {isGeneratingImages ? "Generating…" : "Generate"}
                        </Button>
                      </div>
                    </div>

                    {aiImageProvider === "nano-banana" ? (
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <select
                          value={nanoBananaModel}
                          onChange={(e) => setNanoBananaModel(e.target.value as any)}
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#5bbcff]/60"
                        >
                          <option value="gemini-2.5-flash-image">gemini-2.5-flash-image</option>
                          <option value="gemini-3-pro-image-preview">gemini-3-pro-image-preview</option>
                        </select>
                        <select
                          value={nanoBananaImageSize}
                          onChange={(e) => setNanoBananaImageSize(e.target.value as any)}
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#5bbcff]/60"
                        >
                          <option value="1K">1K</option>
                          <option value="2K">2K</option>
                          <option value="4K">4K</option>
                        </select>
                        <select
                          value={nanoBananaAspectRatio}
                          onChange={(e) => setNanoBananaAspectRatio(e.target.value as any)}
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#5bbcff]/60"
                        >
                          <option value="1:1">1:1</option>
                          <option value="4:5">4:5</option>
                          <option value="16:9">16:9</option>
                          <option value="9:16">9:16</option>
                          <option value="3:2">3:2</option>
                          <option value="2:3">2:3</option>
                          <option value="21:9">21:9</option>
                        </select>
                      </div>
                    ) : null}

                    <div className="mt-3 text-xs text-white/60">
                      Generated images are saved in your gallery automatically. Use “Choose from gallery” to attach.
                    </div>
                  </div>

                  <LinkedInPreviewCard content={commentary} />

                  <div className="flex items-center gap-3">
                    <Button onClick={submitMultiImage} disabled={!canSubmitMultiImage}>
                      {isSubmitting ? "Posting…" : "Create post"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeTab === "poll" ? (
                <div className="space-y-4">
                  <div className="text-sm font-medium">Create poll post</div>
                  <div className={cardClass}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                      <div className="flex-1">
                        <div className="text-xs text-white/60">AI Writer</div>
                        <Input
                          value={aiWritePrompt}
                          onChange={(e) => setAiWritePrompt(e.target.value)}
                          placeholder="Describe the poll topic and desired tone"
                        />
                      </div>
                      <div className="w-full md:w-44">
                        <div className="text-xs text-white/60">Tone</div>
                        <select
                          value={aiWriteTone}
                          onChange={(e) => setAiWriteTone(e.target.value as any)}
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#5bbcff]/60"
                        >
                          <option value="Professional">Professional</option>
                          <option value="Friendly">Friendly</option>
                          <option value="Bold">Bold</option>
                          <option value="Inspirational">Inspirational</option>
                          <option value="Concise">Concise</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <Button onClick={writeWithAI} disabled={isWriting}>
                          {isWriting ? "Writing…" : "Generate"}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-white/60">
                      Provider: {provider === "apipie" ? `apipie.ai (${apipieModel})` : "OpenAI"}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        className="text-sm text-white/70"
                      >
                        Commentary
                      </label>
                      <div className={cardClass}>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <button
                            type="button"
                            className={tabButtonClass(false)}
                            onClick={() => {
                              const el = document.getElementById("li-poll") as HTMLTextAreaElement | null;
                              insertAtCursor(el, littleTextHelp.hashtagTemplate, setPollCommentary);
                            }}
                          >
                            Add hashtag
                          </button>
                          <button
                            type="button"
                            className={tabButtonClass(false)}
                            onClick={() => {
                              const el = document.getElementById("li-poll") as HTMLTextAreaElement | null;
                              insertAtCursor(el, littleTextHelp.mentionOrg, setPollCommentary);
                            }}
                          >
                            Add org mention
                          </button>
                        </div>
                        <Textarea
                          id="li-poll"
                          value={pollCommentary}
                          onChange={(e) => setPollCommentary(e.target.value)}
                          rows={4}
                          placeholder="Optional context above the poll (supports little text format)"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm text-white/70"
                      >
                        Duration
                      </label>
                      <select
                        value={pollDuration}
                        onChange={(e) => setPollDuration(e.target.value as any)}
                        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#5bbcff]/60"
                      >
                        <option value="ONE_DAY">1 day</option>
                        <option value="THREE_DAYS">3 days</option>
                        <option value="SEVEN_DAYS">7 days</option>
                        <option value="FOURTEEN_DAYS">14 days</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm text-white/70"
                    >
                      Question
                    </label>
                    <Input
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="What should we ask?"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Input
                      value={pollOption1}
                      onChange={(e) => setPollOption1(e.target.value)}
                      placeholder="Option 1"
                    />
                    <Input
                      value={pollOption2}
                      onChange={(e) => setPollOption2(e.target.value)}
                      placeholder="Option 2"
                    />
                    <Input
                      value={pollOption3}
                      onChange={(e) => setPollOption3(e.target.value)}
                      placeholder="Option 3 (optional)"
                    />
                    <Input
                      value={pollOption4}
                      onChange={(e) => setPollOption4(e.target.value)}
                      placeholder="Option 4 (optional)"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={submitPoll} disabled={!canSubmitPoll}>
                      {isSubmitting ? "Posting…" : "Create poll"}
                    </Button>
                  </div>

                  <LinkedInPreviewCard content={pollCommentary} />
                </div>
              ) : null}

              {status ? (
                <div
                  className={
                    status.startsWith("Created post")
                      ? "text-sm text-emerald-300"
                      : "text-sm text-rose-300"
                  }
                >
                  {status}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-3xl border-white/10 bg-white/5 backdrop-blur-xl text-white">
          <DialogHeader>
            <DialogTitle>Gallery</DialogTitle>
            <DialogDescription className="text-white/60">
              Select images to attach to your LinkedIn multi-image post.
            </DialogDescription>
          </DialogHeader>

          {galleryError ? <div className="text-sm text-rose-300">{galleryError}</div> : null}

          <div className="max-h-[60vh] overflow-auto pr-1">
            {galleryLoading ? (
              <div className="text-sm text-white/60">Loading…</div>
            ) : galleryItems.length === 0 ? (
              <div className="text-sm text-white/60">No images found.</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {galleryItems
                  .filter((it) => typeof it?.url === "string" && it.url)
                  .map((it) => {
                    const url = String(it.url);
                    const checked = selectedImageUrls.includes(url);
                    return (
                      <button
                        key={it.path || it.name || url}
                        type="button"
                        onClick={() => toggleSelectedUrl(url)}
                        className={`group relative overflow-hidden rounded-xl border transition-colors ${
                          checked
                            ? "border-[#5bbcff]/70"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <Image src={url} alt="" width={112} height={112} className="h-28 w-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white">
                          {checked ? "Selected" : "Select"}
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          <DialogFooter>
            <div className="flex w-full items-center justify-between gap-3">
              <div className="text-xs text-white/60">Selected: {selectedImageUrls.length}</div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    void loadGallery();
                  }}
                  disabled={galleryLoading}
                >
                  Refresh
                </Button>
                <Button
                  onClick={() => setSelectedImageUrls([])}
                  disabled={selectedImageUrls.length === 0}
                >
                  Clear
                </Button>
                <Button onClick={() => setGalleryOpen(false)}>Done</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
