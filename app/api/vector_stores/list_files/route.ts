import OpenAI from "openai";

const openai = new OpenAI();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vectorStoreId = searchParams.get("vector_store_id");

  try {
    const list = await openai.vectorStores.files.list(vectorStoreId || "");
    const data = Array.isArray((list as any)?.data) ? (list as any).data : [];

    const hydrated = await Promise.all(
      data.map(async (item: any) => {
        const fileId = typeof item?.id === "string" ? item.id : (typeof item?.file_id === "string" ? item.file_id : "");
        let filename = "";
        try {
          if (fileId) {
            const f = await openai.files.retrieve(fileId);
            filename = typeof (f as any)?.filename === "string" ? (f as any).filename : "";
          }
        } catch {
          // ignore
        }

        return {
          id: typeof item?.id === "string" ? item.id : "",
          fileId,
          filename,
          status: typeof item?.status === "string" ? item.status : "",
          createdAt: typeof item?.created_at === "number" ? item.created_at : undefined,
        };
      })
    );

    return new Response(JSON.stringify({ ok: true, files: hydrated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    return new Response("Error fetching files", { status: 500 });
  }
}
