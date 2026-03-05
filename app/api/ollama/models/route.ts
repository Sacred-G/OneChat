import { NextRequest, NextResponse } from "next/server";
import { OLLAMA_DEFAULT_BASE_URL } from "@/config/constants";

export async function GET(request: NextRequest) {
  const baseUrl =
    request.nextUrl.searchParams.get("baseUrl") ||
    process.env.OLLAMA_BASE_URL ||
    OLLAMA_DEFAULT_BASE_URL;

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Ollama returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const models = (data.models || []).map((m: any) => ({
      id: m.name,
      name: m.name,
      size: m.size,
      modified_at: m.modified_at,
    }));

    return NextResponse.json({ data: models });
  } catch (err: any) {
    const message =
      err?.cause?.code === "ECONNREFUSED"
        ? "Cannot connect to Ollama. Is it running?"
        : err?.message || "Failed to fetch models";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
