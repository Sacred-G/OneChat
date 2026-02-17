export const dynamic = "force-dynamic";

function buildUrl(request: Request) {
  const url = new URL(request.url);
  const upstream = new URL("https://apipie.ai/v1/models");

  url.searchParams.forEach((value, key) => {
    upstream.searchParams.set(key, value);
  });

  return upstream;
}

export async function GET(request: Request) {
  const apiKey = process.env.APIPIE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing APIPIE_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upstream = buildUrl(request);

  const res = await fetch(upstream.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
