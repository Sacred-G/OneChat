import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  let prompt: unknown;
  let provider: unknown;
  try {
    const body = await request.json();
    prompt = body?.prompt;
    provider = body?.provider;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!prompt || typeof prompt !== "string") {
    return new Response("Missing prompt", { status: 400 });
  }

  const providerStr = typeof provider === "string" ? provider : "openai";

  try {
    if (providerStr === "gemini") {
      const googleApiKey = process.env.GOOGLE_API_KEY;
      if (!googleApiKey) {
        return new Response("GOOGLE_API_KEY not configured", { status: 500 });
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
        return new Response("Gemini image generation returned no parts", { status: 500 });
      }

      const inline = parts.find((p: any) => p?.inlineData?.data);
      const b64 = inline?.inlineData?.data;
      if (!b64 || typeof b64 !== "string") {
        return new Response("Gemini image generation returned no image", { status: 500 });
      }

      const mimeType =
        typeof inline?.inlineData?.mimeType === "string"
          ? inline.inlineData.mimeType
          : "image/png";

      return new Response(
        JSON.stringify({
          dataUrl: `data:${mimeType};base64,${b64}`,
        }),
        { status: 200 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response("OpenAI API key not configured", { status: 500 });
    }

    const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

    const image = await openai.images.generate({
      model: imageModel,
      prompt,
      size: "1024x1024",
    });

    const b64 = image.data?.[0]?.b64_json;
    if (!b64 || typeof b64 !== "string") {
      return new Response("Image generation returned no image", { status: 500 });
    }

    return new Response(JSON.stringify({ dataUrl: `data:image/png;base64,${b64}` }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    return new Response(`Error generating image: ${message}`, { status: 500 });
  }
}
