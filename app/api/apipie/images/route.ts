export const dynamic = "force-dynamic";

import { uploadGeneratedImage } from "@/lib/supabase-storage";

export async function POST(request: Request) {
  const apiKey = process.env.APIPIE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing APIPIE_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const model = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : "dall-e-3";
  const image = typeof body?.image === "string" && body.image.trim() ? body.image.trim() : undefined;
  const provider = typeof body?.provider === "string" && body.provider.trim() ? body.provider.trim() : undefined;
  const size = typeof body?.size === "string" && body.size.trim() ? body.size.trim() : undefined;
  const quality = typeof body?.quality === "string" && body.quality.trim() ? body.quality.trim() : undefined;
  const style = typeof body?.style === "string" && body.style.trim() ? body.style.trim() : undefined;
  const response_format =
    typeof body?.response_format === "string" && body.response_format.trim()
      ? body.response_format.trim()
      : undefined;

  if (!prompt) {
    return new Response(JSON.stringify({ error: "Missing prompt" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = await fetch("https://apipie.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      ...(provider ? { provider } : {}),
      ...(size ? { size } : {}),
      ...(quality ? { quality } : {}),
      ...(style ? { style } : {}),
      ...(response_format ? { response_format } : {}),
      ...(image ? { image } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[apipie/images] upstream failed", {
      status: res.status,
      statusText: res.statusText,
      body: text,
    });
    let errorPayload: any = { error: "apipie.ai image generation failed" };
    try {
      const maybeJson = JSON.parse(text);
      errorPayload = maybeJson;
    } catch {
      if (text) errorPayload = { error: text };
    }
    if (typeof errorPayload !== "object" || errorPayload === null) {
      errorPayload = { error: String(errorPayload) };
    }
    if (typeof errorPayload.error !== "string") {
      errorPayload.error = "apipie.ai image generation failed";
    }
    errorPayload.status = res.status;
    errorPayload.statusText = res.statusText;
    return new Response(JSON.stringify(errorPayload), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const json = await res.json().catch(() => null);
  const url = typeof json?.data?.[0]?.url === "string" ? json.data[0].url : null;
  const b64 = typeof json?.data?.[0]?.b64_json === "string" ? json.data[0].b64_json : null;
  const dataUrl = b64 ? `data:image/png;base64,${b64}` : null;

  let persistedUrl: string | null = null;
  if (b64) {
    try {
      const uploaded = await uploadGeneratedImage({
        base64: b64,
        mimeType: "image/png",
        prefix: "apipie",
      });
      persistedUrl = typeof uploaded?.url === "string" ? uploaded.url : null;
    } catch (e) {
      console.error("[apipie/images] Supabase upload failed", e);
    }
  }

  return new Response(
    JSON.stringify({ url: persistedUrl || url, persistedUrl, b64_json: b64, dataUrl, raw: json }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
