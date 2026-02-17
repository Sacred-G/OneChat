import OpenAI from "openai";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { uploadGeneratedImage } from "@/lib/supabase-storage";
import { toFile } from "openai/uploads";

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
  let imageDataUrl: unknown;
  try {
    const body = await request.json();
    prompt = body?.prompt;
    imageDataUrl = body?.imageDataUrl;
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

  const imageDataUrlStr = typeof imageDataUrl === "string" ? imageDataUrl : "";
  if (imageDataUrlStr && imageDataUrlStr.length > 15_000_000) {
    return new Response(JSON.stringify({ error: "imageDataUrl too large" }), {
      status: 413,
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

  try {
    let b64s: string[] = [];

    if (imageDataUrlStr) {
      const match = /^data:([^;]+);base64,(.+)$/i.exec(imageDataUrlStr);
      if (!match) {
        return new Response(JSON.stringify({ error: "Invalid imageDataUrl format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const mimeType = match[1];
      const b64 = match[2];
      const buf = Buffer.from(b64, "base64");
      const ext = mimeType.toLowerCase().includes("png")
        ? "png"
        : mimeType.toLowerCase().includes("webp")
          ? "webp"
          : mimeType.toLowerCase().includes("gif")
            ? "gif"
            : "jpg";

      const file = await toFile(buf, `input.${ext}`, { type: mimeType });

      const imagesApi: any = openai.images as any;
      const editFn: any = imagesApi?.edit || imagesApi?.edits;
      if (typeof editFn !== "function") {
        return new Response(JSON.stringify({ error: "OpenAI images edit API not available" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const edited = await editFn.call(imagesApi, {
        model: "gpt-image-1.5",
        image: file,
        prompt,
        n: 6,
        size: "1024x1024",
      });

      b64s = Array.isArray(edited.data)
        ? edited.data.map((d: any) => d?.b64_json).filter((x: any) => typeof x === "string")
        : [];
    } else {
      const image = await openai.images.generate({
        model: "gpt-image-1.5",
        prompt,
        n: 6,
        size: "1024x1024",
      });

      b64s = Array.isArray(image.data)
        ? image.data.map((d: any) => d?.b64_json).filter((x: any) => typeof x === "string")
        : [];
    }

    if (b64s.length === 0) {
      return new Response(JSON.stringify({ error: "Image generation returned no images" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const saved = await Promise.all(
      b64s.map((b64: string) => persistDataUrl(`data:image/png;base64,${b64}`))
    );

    const uploaded = await Promise.all(
      b64s.map(async (b64: string) => {
        try {
          return await uploadGeneratedImage({
            base64: b64,
            mimeType: "image/png",
            prefix: "generated",
          });
        } catch (e) {
          console.error("Supabase upload failed", e);
          return null;
        }
      })
    );

    const supabaseUrls = uploaded
      .map((u) => (u && typeof u.url === "string" ? u.url : null))
      .filter((u): u is string => Boolean(u));

    const urls = supabaseUrls.length > 0 ? supabaseUrls : saved.map((s) => s.url);

    return new Response(JSON.stringify({ urls }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating images:", error);
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
