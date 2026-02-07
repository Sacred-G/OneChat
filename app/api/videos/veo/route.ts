import "server-only";

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const TMP_DIR = path.join(process.env.TMPDIR || "/tmp", "generated_videos");

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid dataUrl format");
  }
  return { mimeType: match[1], base64: match[2] };
}

function extFromMime(mimeType: string) {
  const m = mimeType.toLowerCase();
  if (m === "video/mp4") return "mp4";
  if (m === "video/webm") return "webm";
  if (m === "video/quicktime") return "mov";
  return "mp4";
}

export async function POST(request: Request) {
  let prompt: unknown;
  let referenceImages: unknown;
  let aspectRatio: unknown;
  let resolution: unknown;

  try {
    const body = await request.json();
    prompt = body?.prompt;
    referenceImages = body?.referenceImages;
    aspectRatio = body?.aspectRatio;
    resolution = body?.resolution;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return new Response(JSON.stringify({ error: "Missing prompt" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    return new Response(JSON.stringify({ error: "GOOGLE_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const refs: string[] = Array.isArray(referenceImages)
    ? referenceImages.filter((x) => typeof x === "string")
    : [];

  if (refs.length > 3) {
    return new Response(JSON.stringify({ error: "referenceImages supports up to 3 images" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const aspectRatioStr = typeof aspectRatio === "string" ? aspectRatio : "16:9";
  const resolutionStr = typeof resolution === "string" ? resolution : "720p";

  if (!new Set(["16:9", "9:16"]).has(aspectRatioStr)) {
    return new Response(JSON.stringify({ error: "aspectRatio must be either \"16:9\" or \"9:16\"" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!new Set(["720p", "1080p", "4k"]).has(resolutionStr)) {
    return new Response(JSON.stringify({ error: "resolution must be one of \"720p\", \"1080p\", \"4k\"" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");

    const ai: any = new GoogleGenAI({ apiKey: googleApiKey });

    const referenceImagesConfig = refs.map((dataUrl) => {
      const { mimeType, base64 } = parseDataUrl(dataUrl);
      return {
        image: {
          imageBytes: base64,
          mimeType,
        },
        referenceType: "asset",
      };
    });

    let operation: any = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt: prompt.trim(),
      config: {
        aspectRatio: aspectRatioStr,
        resolution: resolutionStr,
        referenceImages: referenceImagesConfig.length ? referenceImagesConfig : undefined,
      } as any,
    });

    const startedAt = Date.now();
    const timeoutMs = 10 * 60 * 1000;
    while (!operation?.done) {
      if (Date.now() - startedAt > timeoutMs) {
        return new Response(JSON.stringify({ error: "Video generation timed out" }), {
          status: 504,
          headers: { "Content-Type": "application/json" },
        });
      }
      await new Promise((r) => setTimeout(r, 10_000));
      operation = await ai.operations.getVideosOperation({ operation } as any);
    }

    const videoFile = operation?.response?.generatedVideos?.[0]?.video;
    if (!videoFile) {
      return new Response(JSON.stringify({ error: "Veo returned no video" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    await mkdir(TMP_DIR, { recursive: true });
    const id = randomUUID();

    const mimeType = typeof videoFile?.mimeType === "string" ? videoFile.mimeType : "video/mp4";
    const ext = extFromMime(mimeType);
    const filename = `${id}.${ext}`;
    const filePath = path.join(TMP_DIR, filename);

    try {
      await ai.files.download({
        file: videoFile,
        downloadPath: filePath,
      } as any);
    } catch (e) {
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
      return new Response(JSON.stringify({ error: `Failed to download video: ${msg}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      url: `/api/generated_videos/${encodeURIComponent(filename)}`,
      filename,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating Veo video:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    return new Response(JSON.stringify({ error: `Error generating video: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
