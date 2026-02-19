import "server-only";

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const TMP_DIR = path.join(process.env.TMPDIR || "/tmp", "generated_videos");

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  // Validate input size to prevent stack overflow
  if (typeof dataUrl !== 'string' || dataUrl.length > 10_000_000) { // 10MB limit
    throw new Error("Invalid dataUrl: too large or not a string");
  }
  
  // Use a simpler approach to avoid regex stack overflow
  const commaIndex = dataUrl.indexOf(',');
  const semicolonIndex = dataUrl.indexOf(';');
  
  if (commaIndex === -1 || semicolonIndex === -1 || semicolonIndex > commaIndex) {
    throw new Error("Invalid dataUrl format");
  }
  
  const prefix = dataUrl.substring(0, semicolonIndex);
  const mimeType = prefix.replace(/^data:/i, '').trim();
  const base64 = dataUrl.substring(commaIndex + 1);
  
  if (!mimeType || !base64) {
    throw new Error("Invalid dataUrl format");
  }
  
  return { mimeType, base64 };
}

function _extFromMime(mimeType: string) {
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

  try {
    const body = await request.json();
    prompt = body?.prompt;
    referenceImages = body?.referenceImages;
    aspectRatio = body?.aspectRatio;
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
  if (!googleApiKey || googleApiKey.trim() === "") {
    return new Response(JSON.stringify({ 
      error: "GOOGLE_API_KEY not configured",
      details: "Add GOOGLE_API_KEY to your environment variables to enable video generation"
    }), {
      status: 503, // Service Unavailable instead of 500
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate API key format (Google API keys are typically 39 characters)
  if (googleApiKey.length < 20) {
    return new Response(JSON.stringify({ 
      error: "Invalid GOOGLE_API_KEY format",
      details: "The Google API key appears to be invalid"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const refs: string[] = Array.isArray(referenceImages)
    ? referenceImages.filter((x) => {
        if (typeof x !== 'string') return false;
        if (x.length > 50_000_000) return false; // 50MB limit per image
        if (!x.startsWith('data:')) return false;
        return true;
      })
    : [];

  if (refs.length > 3) {
    return new Response(JSON.stringify({ error: "referenceImages supports up to 3 images" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const aspectRatioStr = typeof aspectRatio === "string" ? aspectRatio : "16:9";

  if (!new Set(["16:9", "9:16"]).has(aspectRatioStr)) {
    return new Response(JSON.stringify({ error: "aspectRatio must be either \"16:9\" or \"9:16\"" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({ apiKey: googleApiKey });

    // Convert reference images to the format expected by Google GenAI
    const referenceImagesConfig = refs.map((dataUrl, index) => {
      try {
        const { mimeType, base64 } = parseDataUrl(dataUrl);
        return {
          image: {
            imageBytes: base64,
            mimeType,
          },
          referenceType: "asset",
        };
      } catch (e) {
        console.error(`Error processing reference image ${index + 1}:`, e);
        throw new Error(`Invalid reference image ${index + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    });

    let operation;
    // Operations client (method name differs across SDK versions)
    const operationsClient: any = typeof (ai as any).operations === "function"
      ? await (ai as any).operations()
      : (ai as any).operations
        ? (ai as any).operations
        : typeof (ai as any).operationsClient === "function"
          ? await (ai as any).operationsClient()
          : (ai as any).operationsClient;
    console.log("Veo operations client keys:", Object.keys(operationsClient || {}));
    if (operationsClient?.operations) {
      console.log("Veo nested operations keys:", Object.keys(operationsClient.operations || {}));
    }
    if (!operationsClient) {
      return new Response(JSON.stringify({
        error: "Google GenAI operations client unavailable",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    try {
      operation = await ai.models.generateVideos({
        model: "veo-3.1-generate-preview",
        prompt: prompt.trim(),
        config: {
          aspectRatio: aspectRatioStr,
          referenceImages: referenceImagesConfig.length ? referenceImagesConfig : undefined,
        } as any,
      });
    } catch (apiError) {
      console.error("Google GenAI API error:", apiError);
      const errorMsg = apiError instanceof Error ? apiError.message : "Unknown API error";
      return new Response(JSON.stringify({ 
        error: "Failed to generate video",
        details: errorMsg.includes("quota") ? "API quota exceeded or invalid API key" : errorMsg
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Video generation started:", operation);
    console.log("Initial operation keys:", Object.keys(operation || {}));

    // Poll for completion using the correct method from documentation
    const nestedOperations = (operationsClient as any)?.apiClient?.operations || (operationsClient as any)?.operations;

    while (!operation.done) {
      console.log("Waiting for video generation to complete...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      // Poll using the available operations method
      const operationName: string | undefined =
        (operation as any)?.name ?? (operation as any)?.operation;
      if (typeof operationsClient.getVideosOperation === "function") {
        operation = await operationsClient.getVideosOperation({ operation });
      } else if (typeof operationsClient.getOperation === "function") {
        if (!operationName) {
          throw new Error("Missing operation name while polling video generation");
        }
        operation = await operationsClient.getOperation({ name: operationName });
      } else if (typeof operationsClient.wait === "function") {
        if (!operationName) {
          throw new Error("Missing operation name while polling video generation");
        }
        operation = await operationsClient.wait({ name: operationName });
      } else if (typeof operationsClient.waitOperation === "function") {
        if (!operationName) {
          throw new Error("Missing operation name while polling video generation");
        }
        operation = await operationsClient.waitOperation({ name: operationName });
      } else if (typeof nestedOperations?.getOperation === "function") {
        if (!operationName) {
          throw new Error("Missing operation name while polling video generation");
        }
        operation = await nestedOperations.getOperation({ name: operationName });
      } else if (typeof nestedOperations?.getVideosOperation === "function") {
        operation = await nestedOperations.getVideosOperation({ operation });
      } else {
        // HTTP fallback using Operations REST endpoint
        if (!operationName) {
          throw new Error("Missing operation name while polling video generation");
        }
        // If name already includes full path (e.g., models/.../operations/abc), use directly; otherwise prefix operations/
        const url: string = operationName.includes("/")
          ? `https://generativelanguage.googleapis.com/v1beta/${operationName}`
          : `https://generativelanguage.googleapis.com/v1beta/operations/${operationName}`;
        const res: Response = await fetch(`${url}?key=${encodeURIComponent(googleApiKey)}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Operations polling failed (${res.status}): ${text}`);
        }
        operation = await res.json();
      }
    }

    console.log("Video generation completed:", operation);

    const videoFile = operation?.response?.generatedVideos?.[0]?.video;
    if (!videoFile) {
      return new Response(JSON.stringify({ error: "Veo returned no video" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    await mkdir(TMP_DIR, { recursive: true });
    const id = randomUUID();
    const filename = `${id}.mp4`;
    const filePath = path.join(TMP_DIR, filename);

    try {
      await (ai.files as any).download({
        file: videoFile,
        downloadPath: filePath,
      });
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
