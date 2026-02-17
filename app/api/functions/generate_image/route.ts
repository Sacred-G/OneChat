import OpenAI from "openai";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { uploadGeneratedImage } from "@/lib/supabase-storage";

const openai = new OpenAI();

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
  };
}

export async function POST(request: Request) {
  let prompt: unknown;
  let provider: unknown;
  try {
    const body = await request.json();
    prompt = body?.prompt;
    provider = body?.provider;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!prompt || typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "Missing prompt" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const providerStr = typeof provider === "string" ? provider : "openai";

  try {
    if (providerStr === "gemini") {
      const googleApiKey = process.env.GOOGLE_API_KEY;
      if (!googleApiKey) {
        return new Response(JSON.stringify({ error: "GOOGLE_API_KEY not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: googleApiKey });

      const geminiConfig: any = {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K",
        },
      };

      const response: any = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: prompt,
        config: geminiConfig,
      });

      const parts = response?.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts)) {
        return new Response(JSON.stringify({ error: "Gemini image generation returned no parts" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const inline = parts.find((p: any) => p?.inlineData?.data);
      const b64 = inline?.inlineData?.data;
      if (!b64 || typeof b64 !== "string") {
        return new Response(JSON.stringify({ error: "Gemini image generation returned no image" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const mimeType =
        typeof inline?.inlineData?.mimeType === "string"
          ? inline.inlineData.mimeType
          : "image/png";

      const saved = await persistDataUrl(`data:${mimeType};base64,${b64}`);

      let uploadedUrl: string | null = null;
      try {
        const uploaded = await uploadGeneratedImage({
          base64: b64,
          mimeType,
          prefix: "generated",
        });
        uploadedUrl = typeof uploaded.url === "string" ? uploaded.url : null;
      } catch (e) {
        console.error("Supabase upload failed", e);
      }

      return new Response(JSON.stringify({ url: uploadedUrl || saved.url }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

    const image = await openai.images.generate({
      model: imageModel,
      prompt,
      size: "1024x1024",
    });

    const b64 = image.data?.[0]?.b64_json;
    if (!b64 || typeof b64 !== "string") {
      return new Response(JSON.stringify({ error: "Image generation returned no image" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const saved = await persistDataUrl(`data:image/png;base64,${b64}`);

    let uploadedUrl: string | null = null;
    try {
      const uploaded = await uploadGeneratedImage({
        base64: b64,
        mimeType: "image/png",
        prefix: "generated",
      });
      uploadedUrl = typeof uploaded.url === "string" ? uploaded.url : null;
    } catch (e) {
      console.error("Supabase upload failed", e);
    }

    return new Response(JSON.stringify({ url: uploadedUrl || saved.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating image:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    return new Response(JSON.stringify({ error: `Error generating image: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
