import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

const TMP_DIR = path.join(process.env.TMPDIR || "/tmp", "generated_images");

function mimeFromFilename(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ filename: string }> }
) {
  const { filename } = await ctx.params;

  // Basic traversal protection
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return new Response("Invalid filename", { status: 400 });
  }

  const filePath = path.join(TMP_DIR, filename);

  try {
    const buf = await readFile(filePath);
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": mimeFromFilename(filename),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
