import "server-only";

import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";

export const runtime = "nodejs";

const TMP_AUDIO_DIR = path.join(process.env.TMPDIR || "/tmp", "generated_audio");
const TMP_VIDEO_DIR = path.join(process.env.TMPDIR || "/tmp", "generated_videos");

function extFromVideoMime(mimeType: string) {
  const m = mimeType.toLowerCase();
  if (m === "video/mp4") return "mp4";
  if (m === "video/webm") return "webm";
  if (m === "video/quicktime") return "mov";
  return "mp4";
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });

    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const video = form.get("video");
  const audioUrl = form.get("audioUrl");

  if (!(video instanceof File)) {
    return new Response(JSON.stringify({ error: "Missing video file" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof audioUrl !== "string" || !audioUrl.trim()) {
    return new Response(JSON.stringify({ error: "Missing audioUrl" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const id = randomUUID();

    await mkdir(TMP_VIDEO_DIR, { recursive: true });
    await mkdir(TMP_AUDIO_DIR, { recursive: true });

    const videoBuf = Buffer.from(await video.arrayBuffer());
    const videoExt = extFromVideoMime(video.type || "video/mp4");
    const videoPath = path.join(TMP_VIDEO_DIR, `${id}.input.${videoExt}`);
    await writeFile(videoPath, videoBuf);

    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch audioUrl (${audioRes.status})` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const audioBuf = Buffer.from(await audioRes.arrayBuffer());
    const audioPath = path.join(TMP_AUDIO_DIR, `${id}.input.wav`);
    await writeFile(audioPath, audioBuf);

    const outFilename = `${id}.mp4`;
    const outPath = path.join(TMP_VIDEO_DIR, outFilename);

    await runFfmpeg([
      "-y",
      "-i",
      videoPath,
      "-i",
      audioPath,
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-shortest",
      outPath,
    ]);

    return new Response(JSON.stringify({ url: `/api/generated_videos/${encodeURIComponent(outFilename)}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error muxing audio into video:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);

    const ffmpegHint = message.toLowerCase().includes("spawn ffmpeg")
      ? " (ffmpeg not installed on server)"
      : "";

    return new Response(JSON.stringify({ error: `Mux failed: ${message}${ffmpegHint}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
