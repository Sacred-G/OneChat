import OpenAI from "openai";
const openai = new OpenAI();

export async function POST(request: Request) {
  let fileObject: { name?: string; content?: string } | null = null;
  try {
    const body = await request.json();
    fileObject = body?.fileObject ?? null;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!fileObject?.name || !fileObject?.content) {
    return new Response(JSON.stringify({ error: "Missing file data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const fileBuffer = Buffer.from(fileObject.content, "base64");
    const fileBlob = new Blob([fileBuffer], {
      type: "application/octet-stream",
    });

    const file = await openai.files.create({
      file: new File([fileBlob], fileObject.name),
      purpose: "assistants",
    });

    return new Response(JSON.stringify(file), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    const message = error instanceof Error ? error.message : "Error uploading file";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
