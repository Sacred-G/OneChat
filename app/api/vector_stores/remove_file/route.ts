import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const vectorStoreId = typeof body?.vectorStoreId === "string" ? body.vectorStoreId : "";
  const fileId = typeof body?.fileId === "string" ? body.fileId : "";

  if (!vectorStoreId || !fileId) {
    return new Response("Missing vectorStoreId or fileId", { status: 400 });
  }

  try {
    const client: any = openai as any;

    if (client.vectorStores?.files?.del) {
      const resp = await client.vectorStores.files.del(vectorStoreId, fileId);
      return new Response(JSON.stringify(resp), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response("OpenAI API key not configured", { status: 500 });
    }

    const resp = await fetch(
      `https://api.openai.com/v1/vector_stores/${encodeURIComponent(vectorStoreId)}/files/${encodeURIComponent(fileId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return new Response(errText || "Error removing file", { status: resp.status });
    }

    const data = await resp.json().catch(() => ({}));
    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error removing file:", error);
    return new Response("Error removing file", { status: 500 });
  }
}
