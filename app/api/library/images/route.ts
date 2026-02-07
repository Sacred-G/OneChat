import "server-only";

import { listGeneratedImages } from "@/lib/supabase-storage";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const prefixParam = url.searchParams.get("prefix") || "generated";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 100;

  try {
    let result: any[] = [];
    
    // If specific prefix is requested, use that
    if (prefixParam !== "all") {
      const singleResult = await listGeneratedImages({
        prefix: prefixParam,
        limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
      });
      result = singleResult.items || [];
    } else {
      // If "all" is requested, fetch from multiple prefixes
      const prefixes = ["generated", "nano-banana", "imagen", "apipie"];
      const promises = prefixes.map(async (prefix) => {
        try {
          const response = await listGeneratedImages({
            prefix,
            limit: Math.ceil((Number.isFinite(limit) && limit > 0 ? limit : 100) / prefixes.length),
          });
          return response.items || [];
        } catch (error) {
          console.error(`Failed to fetch images for prefix ${prefix}:`, error);
          return [];
        }
      });
      
      const results = await Promise.all(promises);
      result = results.flat();
      
      // Sort by created_at descending
      result.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
      
      // Limit to requested number
      result = result.slice(0, Number.isFinite(limit) && limit > 0 ? limit : 100);
    }

    return new Response(JSON.stringify({ items: result, count: result.length }), {
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
