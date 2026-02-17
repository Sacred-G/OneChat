import { getMongoDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const MEMORIES_COLLECTION = "memories";

interface MemoryDoc {
  userId: string;
  summary: string;
  keyFacts: string[];
  sourceConversationId: string;
  createdAt: Date;
}

async function getUserId(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).id) {
      return String((session.user as any).id);
    }
    if (session?.user?.email) {
      return session.user.email;
    }
  } catch {
    // ignore auth failures
  }
  return "anonymous";
}

// GET: Fetch memories for the current user
// ?limit=20 (default 20, max 50)
export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(50, Math.max(1, Number(limitParam) || 20));

    const db = await getMongoDb();
    const memories = await db
      .collection<MemoryDoc>(MEMORIES_COLLECTION)
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return new Response(
      JSON.stringify({
        ok: true,
        memories: memories.map((m) => ({
          id: m._id,
          summary: m.summary,
          keyFacts: m.keyFacts,
          sourceConversationId: m.sourceConversationId,
          createdAt: m.createdAt,
        })),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[memories] GET failed", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to fetch memories" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST: Extract memories from a conversation and store them
// Body: { conversationId: string, messages: Array<{ role, content }> }
// OR: { manual: true, summary: string, keyFacts: string[], conversationId?: string }
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    // Manual memory insertion (for testing or direct saves)
    if (body.manual === true) {
      const summary = typeof body.summary === "string" ? body.summary.trim() : "";
      const keyFacts = Array.isArray(body.keyFacts)
        ? body.keyFacts.filter((f: any) => typeof f === "string" && f.trim()).map((f: string) => f.trim())
        : [];
      const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";

      if (!summary && keyFacts.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "No summary or keyFacts provided" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const db = await getMongoDb();
      const doc: MemoryDoc = {
        userId,
        summary,
        keyFacts,
        sourceConversationId: conversationId,
        createdAt: new Date(),
      };
      await db.collection(MEMORIES_COLLECTION).insertOne(doc);

      return new Response(
        JSON.stringify({ ok: true, memory: { summary, keyFacts } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Auto-extract from conversation messages
    const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "No messages provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build a condensed transcript from the conversation
    const transcript = messages
      .filter((m: any) => {
        if (!m || typeof m !== "object") return false;
        const role = m.role;
        return role === "user" || role === "assistant";
      })
      .map((m: any) => {
        const role = m.role === "user" ? "User" : "Assistant";
        let text = "";
        if (typeof m.content === "string") {
          text = m.content;
        } else if (Array.isArray(m.content)) {
          text = m.content
            .map((c: any) => {
              if (typeof c === "string") return c;
              if (c && typeof c.text === "string") return c.text;
              return "";
            })
            .filter(Boolean)
            .join("\n");
        }
        // Truncate very long messages to save tokens
        if (text.length > 1000) text = text.slice(0, 1000) + "...";
        return `${role}: ${text}`;
      })
      .filter((line: string) => line.length > 10)
      .join("\n\n");

    if (transcript.length < 20) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "Conversation too short to extract memories" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Truncate transcript to ~8000 chars to fit in context
    const truncatedTranscript = transcript.length > 8000 ? transcript.slice(0, 8000) + "\n\n[...truncated]" : transcript;

    // Call OpenAI to extract key facts and summary
    const openai = new OpenAI();
    const extraction = await openai.chat.completions.create({
      model: "gpt-5-nano",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a memory extraction assistant. Given a conversation transcript, extract key facts about the user and a brief summary. Focus on:
- User preferences, habits, and personal details they shared
- Important decisions or requests they made
- Technical details about their projects or work
- Any information that would be useful to remember in future conversations

Return JSON: { "summary": "A 1-3 sentence summary of the conversation", "keyFacts": ["fact1", "fact2", ...] }

Rules:
- Keep the summary concise (1-3 sentences)
- Extract 3-10 key facts as short, specific strings
- Focus on USER information, not generic assistant responses
- If the conversation is purely small talk with no memorable info, return empty keyFacts
- Do NOT include sensitive information like passwords or API keys`,
        },
        {
          role: "user",
          content: `Extract key facts and summary from this conversation:\n\n${truncatedTranscript}`,
        },
      ],
    });

    const rawContent = extraction.choices?.[0]?.message?.content || "{}";
    let parsed: { summary?: string; keyFacts?: string[] };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = { summary: "", keyFacts: [] };
    }

    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const keyFacts = Array.isArray(parsed.keyFacts)
      ? parsed.keyFacts.filter((f: any) => typeof f === "string" && f.trim()).map((f: string) => f.trim())
      : [];

    // Skip saving if nothing meaningful was extracted
    if (!summary && keyFacts.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "No meaningful memories extracted" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Save to MongoDB
    const db = await getMongoDb();
    const doc: MemoryDoc = {
      userId,
      summary,
      keyFacts,
      sourceConversationId: conversationId,
      createdAt: new Date(),
    };
    await db.collection(MEMORIES_COLLECTION).insertOne(doc);

    // Ensure index exists for efficient queries
    try {
      await db.collection(MEMORIES_COLLECTION).createIndex(
        { userId: 1, createdAt: -1 },
        { background: true }
      );
    } catch {
      // index may already exist
    }

    return new Response(
      JSON.stringify({ ok: true, memory: { summary, keyFacts } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[memories] POST failed", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to extract/save memories" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE: Clear all memories for the current user, or a specific memory by id
// ?id=<memoryId> to delete one, otherwise deletes all
export async function DELETE(request: Request) {
  try {
    const userId = await getUserId();
    const url = new URL(request.url);
    const memoryId = url.searchParams.get("id");

    const db = await getMongoDb();

    if (memoryId) {
      const { ObjectId } = await import("mongodb");
      await db.collection(MEMORIES_COLLECTION).deleteOne({
        _id: new ObjectId(memoryId) as any,
        userId,
      });
    } else {
      await db.collection(MEMORIES_COLLECTION).deleteMany({ userId });
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[memories] DELETE failed", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to delete memories" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
