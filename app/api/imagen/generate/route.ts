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
  let prompts: unknown;
  let numberOfImages: unknown;
  let imageSize: unknown;
  let aspectRatio: unknown;
  let personGeneration: unknown;
  let model: unknown;
  let inspirationImageDataUrl: unknown;

  try {
    const body = await request.json();
    prompt = body?.prompt;
    prompts = body?.prompts;
    numberOfImages = body?.numberOfImages;
    imageSize = body?.imageSize;
    aspectRatio = body?.aspectRatio;
    personGeneration = body?.personGeneration;
    model = body?.model;
    inspirationImageDataUrl = body?.inspirationImageDataUrl;
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

  const promptList: string[] = Array.isArray(prompts)
    ? prompts.filter((x) => typeof x === "string").map((x) => x.trim()).filter(Boolean)
    : [];

  if (promptList.length === 0) {
    const p = typeof prompt === "string" ? prompt.trim() : "";
    if (!p) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    promptList.push(p);
  }

  const n = typeof numberOfImages === "number" ? numberOfImages : Number(numberOfImages);
  const numberOfImagesNum = Number.isFinite(n) ? n : 4;
  if (numberOfImagesNum < 1 || numberOfImagesNum > 4) {
    return new Response(JSON.stringify({ error: "numberOfImages must be between 1 and 4" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const imageSizeStr = typeof imageSize === "string" ? imageSize : "1K";
  if (!new Set(["1K", "2K"]).has(imageSizeStr)) {
    return new Response(JSON.stringify({ error: "imageSize must be either \"1K\" or \"2K\"" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const aspectRatioStr = typeof aspectRatio === "string" ? aspectRatio : "1:1";
  if (!new Set(["1:1", "3:4", "4:3", "9:16", "16:9"]).has(aspectRatioStr)) {
    return new Response(JSON.stringify({ error: "aspectRatio must be one of 1:1, 3:4, 4:3, 9:16, 16:9" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const personGenerationStr = typeof personGeneration === "string" ? personGeneration : "allow_adult";
  if (!new Set(["dont_allow", "allow_adult", "allow_all"]).has(personGenerationStr)) {
    return new Response(JSON.stringify({ error: "personGeneration must be dont_allow, allow_adult, or allow_all" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const modelStr = typeof model === "string" && model.trim() ? model.trim() : "imagen-4.0-generate-001";

  const inspirationStr = typeof inspirationImageDataUrl === "string" ? inspirationImageDataUrl : "";

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai: any = new GoogleGenAI({ apiKey: googleApiKey });

    let inspirationDescription = "";
    if (inspirationStr) {
      const { mimeType, base64 } = parseDataUrl(inspirationStr);
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

      inspirationDescription =
        typeof descRes?.text === "string"
          ? descRes.text
          : typeof descRes?.candidates?.[0]?.content?.parts?.[0]?.text === "string"
            ? descRes.candidates[0].content.parts[0].text
            : "";
      inspirationDescription = inspirationDescription.trim();
    }

    const results = [] as Array<{ prompt: string; urls: string[] }>;

    for (const basePrompt of promptList) {
      const mergedPrompt = inspirationDescription
        ? `${basePrompt}\n\nStyle reference description: ${inspirationDescription}`
        : basePrompt;

      const response: any = await ai.models.generateImages({
        model: modelStr,
        prompt: mergedPrompt,
        config: {
          numberOfImages: numberOfImagesNum,
          imageSize: imageSizeStr,
          aspectRatio: aspectRatioStr,
          personGeneration: personGenerationStr,
        } as any,
      });

      const generated: any[] = Array.isArray(response?.generatedImages) ? response.generatedImages : [];
      if (generated.length === 0) {
        return new Response(JSON.stringify({ error: "Imagen returned no images" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const urls: string[] = [];

      for (const gi of generated) {
        const b64 = gi?.image?.imageBytes;
        const mimeType = typeof gi?.image?.mimeType === "string" ? gi.image.mimeType : "image/png";
        if (!b64 || typeof b64 !== "string") continue;

        const saved = await persistDataUrl(`data:${mimeType};base64,${b64}`);

        let uploadedUrl: string | null = null;
        try {
          const uploaded = await uploadGeneratedImage({
            base64: saved.base64,
            mimeType: saved.mimeType,
            prefix: "imagen",
          });
          uploadedUrl = typeof uploaded.url === "string" ? uploaded.url : null;
        } catch (e) {
          console.error("Supabase upload failed", e);
        }

        urls.push(uploadedUrl || saved.url);
      }

      results.push({ prompt: mergedPrompt, urls });
    }

    if (promptList.length === 1) {
      return new Response(JSON.stringify({
        urls: results[0]?.urls || [],
        prompt: results[0]?.prompt || promptList[0],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating Imagen images:", error);
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
