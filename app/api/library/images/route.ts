import "server-only";

import { listGeneratedImages } from "@/lib/supabase-storage";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const prefix = url.searchParams.get("prefix") || "generated";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 100;

  try {
    const result = await listGeneratedImages({
      prefix,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
