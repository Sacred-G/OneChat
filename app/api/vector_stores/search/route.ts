import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  const { vectorStoreId, query, maxNumResults } = await request.json();

  if (!vectorStoreId || typeof vectorStoreId !== "string") {
    return new Response("Missing vectorStoreId", { status: 400 });
  }
  if (!query || typeof query !== "string") {
    return new Response("Missing query", { status: 400 });
  }

  try {
    const max_num_results =
      typeof maxNumResults === "number" && maxNumResults > 0 ? maxNumResults : 5;

    const client: any = openai as any;

    let raw: any;

    if (client.vectorStores?.search) {
      raw = await client.vectorStores.search(vectorStoreId, {
        query,
        max_num_results,
      });
    } else {
      const resp = await fetch(
        `https://api.openai.com/v1/vector_stores/${vectorStoreId}/search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, max_num_results }),
        }
      );

      if (!resp.ok) {
        const errText = await resp.text();
        return new Response(errText || "Vector store search failed", {
          status: resp.status,
        });
      }

      raw = await resp.json();
    }

    const data = Array.isArray(raw?.data) ? raw.data : [];

    const results = data.map((r: any) => {
      const contentArr = Array.isArray(r?.content) ? r.content : [];
      const textParts = contentArr
        .filter((c: any) => c?.type === "text" && typeof c?.text === "string")
        .map((c: any) => c.text);

      return {
        file_id: r?.file_id,
        filename: r?.filename,
        score: r?.score,
        text: textParts.join("\n\n").trim(),
      };
    });

    return new Response(JSON.stringify({ query, results }), { status: 200 });
  } catch (error) {
    console.error("Error searching vector store:", error);
    return new Response("Error searching vector store", { status: 500 });
  }
}
