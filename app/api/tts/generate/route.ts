import "server-only";

import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const TMP_DIR = path.join(process.env.TMPDIR || "/tmp", "generated_audio");

function pcm16leToWavBuffer(pcm: Buffer, args?: { sampleRate?: number; channels?: number }) {
  const sampleRate = typeof args?.sampleRate === "number" ? args.sampleRate : 24000;
  const channels = typeof args?.channels === "number" ? args.channels : 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

export async function POST(request: Request) {
  let mode: unknown;
  let transcript: unknown;
  let prompt: unknown;
  let seconds: unknown;
  let voiceName: unknown;

  try {
    const body = await request.json();
    mode = body?.mode;
    transcript = body?.transcript;
    prompt = body?.prompt;
    seconds = body?.seconds;
    voiceName = body?.voiceName;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    return new Response(JSON.stringify({ error: "GOOGLE_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const secondsNum = typeof seconds === "number" ? seconds : Number(seconds);
  const targetSeconds = Number.isFinite(secondsNum) && secondsNum > 0 ? secondsNum : 10;
  if (targetSeconds < 1 || targetSeconds > 600) {
    return new Response(JSON.stringify({ error: "seconds must be between 1 and 600" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const modeStr = typeof mode === "string" ? mode : "transcript";
  const voiceNameStr = typeof voiceName === "string" && voiceName.trim() ? voiceName.trim() : "Kore";

  let finalTranscript = "";

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai: any = new GoogleGenAI({ apiKey: googleApiKey });

    if (modeStr === "prompt") {
      const p = typeof prompt === "string" ? prompt.trim() : "";
      if (!p) {
        return new Response(JSON.stringify({ error: "Missing prompt" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const approxWords = Math.max(10, Math.round(targetSeconds * 2.6));
      const scriptRes: any = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Write a spoken-word transcript of about ${approxWords} words (roughly ${targetSeconds} seconds). Do not add stage directions.\n\nTopic/instructions: ${p}`,
      });

      finalTranscript =
        typeof scriptRes?.text === "string"
          ? scriptRes.text
          : typeof scriptRes?.candidates?.[0]?.content?.parts?.[0]?.text === "string"
            ? scriptRes.candidates[0].content.parts[0].text
            : "";

      finalTranscript = finalTranscript.trim();
      if (!finalTranscript) {
        return new Response(JSON.stringify({ error: "Failed to generate transcript" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      const t = typeof transcript === "string" ? transcript.trim() : "";
      if (!t) {
        return new Response(JSON.stringify({ error: "Missing transcript" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      finalTranscript = t;
    }

    const ttsRes: any = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: finalTranscript }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceNameStr },
          },
        },
      } as any,
    });

    const b64 = ttsRes?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!b64 || typeof b64 !== "string") {
      return new Response(JSON.stringify({ error: "TTS returned no audio" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pcm = Buffer.from(b64, "base64");
    const wavBuf = pcm16leToWavBuffer(pcm, { sampleRate: 24000, channels: 1 });

    await mkdir(TMP_DIR, { recursive: true });
    const filename = `${randomUUID()}.wav`;
    const filePath = path.join(TMP_DIR, filename);
    await writeFile(filePath, wavBuf);

    return new Response(
      JSON.stringify({
        url: `/api/generated_audio/${encodeURIComponent(filename)}`,
        filename,
        transcript: finalTranscript,
        seconds: targetSeconds,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating TTS audio:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    return new Response(JSON.stringify({ error: `Error generating audio: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
