import "server-only";

export const dynamic = "force-dynamic";

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return json(404, { ok: false, error: "disabled in production" });
  }

  try {
    const { resolve } = await import("node:path");
    const { promises: fs } = await import("node:fs");

    const targetPath = resolve(process.cwd(), "streamlit-app", "app.py");
    const code = await fs.readFile(targetPath, "utf8");
    return json(200, { ok: true, code });
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      return json(200, { ok: true, code: "" });
    }
    return json(500, { ok: false, error: e instanceof Error ? e.message : "Failed to read app.py" });
  }
}
