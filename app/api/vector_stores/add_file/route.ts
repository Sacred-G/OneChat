import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  let vectorStoreId = "";
  let fileId = "";
  try {
    const body = await request.json();
    vectorStoreId = typeof body?.vectorStoreId === "string" ? body.vectorStoreId.trim() : "";
    fileId = typeof body?.fileId === "string" ? body.fileId.trim() : "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!vectorStoreId || !fileId) {
    return new Response(JSON.stringify({ error: "Missing vector store or file ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const vectorStore = await openai.vectorStores.files.create(
      vectorStoreId,
      {
        file_id: fileId,
      }
    );
    return new Response(JSON.stringify(vectorStore), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error adding file:", error);
    const message = error instanceof Error ? error.message : "Error adding file";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
