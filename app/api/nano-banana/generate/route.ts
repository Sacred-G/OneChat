import "server-only";

import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { uploadGeneratedImage } from "@/lib/supabase-storage";

const TMP_DIR = path.join(process.env.TMPDIR || "/tmp", "generated_images");

async function persistDataUrl(dataUrl: string) {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid dataUrl format");
  }

  const mimeType = match[1];
  const b64 = match[2];

  const extByMime: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = extByMime[mimeType] || "png";

  await mkdir(TMP_DIR, { recursive: true });

  const id = randomUUID();
  const filename = `${id}.${ext}`;
  const filePath = path.join(TMP_DIR, filename);
  const buf = Buffer.from(b64, "base64");
  await writeFile(filePath, buf);

  return {
    id,
    filename,
    mimeType,
    url: `/api/generated_images/${encodeURIComponent(filename)}`,
    base64: b64,
  };
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid dataUrl format");
  }
  return { mimeType: match[1], base64: match[2] };
}

export async function POST(request: Request) {
  let prompt: unknown;
  let numberOfImages: unknown;
  let imageSize: unknown;
  let aspectRatio: unknown;
  let model: unknown;
  let referenceImageDataUrl: unknown;

  try {
    const body = await request.json();
    prompt = body?.prompt;
    numberOfImages = body?.numberOfImages;
    imageSize = body?.imageSize;
    aspectRatio = body?.aspectRatio;
    model = body?.model;
    referenceImageDataUrl = body?.referenceImageDataUrl;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
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

  const promptStr = typeof prompt === "string" ? prompt.trim() : "";
  if (!promptStr) {
    return new Response(JSON.stringify({ error: "Missing prompt" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const n = typeof numberOfImages === "number" ? numberOfImages : Number(numberOfImages);
  const numberOfImagesNum = Number.isFinite(n) ? n : 1;
  if (numberOfImagesNum < 1 || numberOfImagesNum > 4) {
    return new Response(JSON.stringify({ error: "numberOfImages must be between 1 and 4" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const imageSizeStr = typeof imageSize === "string" ? imageSize : "1K";
  if (!new Set(["1K", "2K", "4K"]).has(imageSizeStr)) {
    return new Response(JSON.stringify({ error: "imageSize must be either \"1K\", \"2K\", or \"4K\"" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const aspectRatioStr = typeof aspectRatio === "string" ? aspectRatio : "1:1";
  if (!new Set(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]).has(aspectRatioStr)) {
    return new Response(JSON.stringify({ error: "aspectRatio must be one of 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const modelStr = typeof model === "string" && model.trim() ? model.trim() : "gemini-2.5-flash-image";
  if (!new Set(["gemini-2.5-flash-image", "gemini-3-pro-image-preview"]).has(modelStr)) {
    return new Response(JSON.stringify({ error: "model must be gemini-2.5-flash-image or gemini-3-pro-image-preview" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate image size compatibility with model
  if (modelStr === "gemini-2.5-flash-image" && imageSizeStr !== "1K") {
    return new Response(JSON.stringify({ error: "gemini-2.5-flash-image only supports 1K image size" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const referenceStr = typeof referenceImageDataUrl === "string" ? referenceImageDataUrl : "";

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai: any = new GoogleGenAI({ apiKey: googleApiKey });

    let referenceDescription = "";
    if (referenceStr) {
      const { mimeType, base64 } = parseDataUrl(referenceStr);
      const descRes: any = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Describe this image in 1-2 sentences. Focus on the subject, style, lighting, and composition.",
              },
              {
                inlineData: {
                  mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
      });

      referenceDescription =
        typeof descRes?.text === "string"
          ? descRes.text
          : typeof descRes?.candidates?.[0]?.content?.parts?.[0]?.text === "string"
            ? descRes.candidates[0].content.parts[0].text
            : "";
      referenceDescription = referenceDescription.trim();
    }

    const finalPrompt = referenceDescription
      ? `${promptStr}\n\nStyle reference: ${referenceDescription}`
      : promptStr;

    // Use generateContent for Nano Banana models
    const response: any = await ai.models.generateContent({
      model: modelStr,
      contents: finalPrompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: aspectRatioStr,
          imageSize: imageSizeStr,
        },
      } as any,
    });

    const parts = response?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) {
      return new Response(JSON.stringify({ error: "Nano Banana returned no parts" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const urls: string[] = [];
    
    // Extract all images from the response
    for (const part of parts) {
      const inlineData = part?.inlineData;
      if (inlineData && inlineData.data && typeof inlineData.data === "string") {
        const b64 = inlineData.data;
        const mimeType = typeof inlineData.mimeType === "string" ? inlineData.mimeType : "image/png";

        const saved = await persistDataUrl(`data:${mimeType};base64,${b64}`);

        let uploadedUrl: string | null = null;
        try {
          const uploaded = await uploadGeneratedImage({
            base64: saved.base64,
            mimeType: saved.mimeType,
            prefix: "nano-banana",
          });
          uploadedUrl = typeof uploaded.url === "string" ? uploaded.url : null;
        } catch (e) {
          console.error("Supabase upload failed", e);
        }

        urls.push(uploadedUrl || saved.url);
        
        // Limit to requested number of images
        if (urls.length >= numberOfImagesNum) {
          break;
        }
      }
    }

    if (urls.length === 0) {
      return new Response(JSON.stringify({ error: "Nano Banana returned no images" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      urls,
      prompt: finalPrompt,
      model: modelStr,
      imageSize: imageSizeStr,
      aspectRatio: aspectRatioStr,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating Nano Banana images:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    return new Response(JSON.stringify({ error: `Error generating images: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
