import { getMongoDb } from "@/lib/mongodb";

import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const COLLECTION = "conversations";
const DEFAULT_ID = "default";

type ConversationState = {
  chatMessages: unknown[];
  conversationItems: unknown[];
  selectedSkill: string | null;
};

type ConversationDoc = {
  _id: string;
  state: ConversationState;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
};

function getIdFromRequest(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  return id && id.trim().length > 0 ? id : null;
}

function shouldList(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("list") === "1";
}

export async function GET(request: Request) {
  try {
    const db = await getMongoDb();

    if (shouldList(request)) {
      const docs = await db
        .collection<ConversationDoc>(COLLECTION)
        .find({}, { projection: { _id: 1, title: 1, updatedAt: 1, createdAt: 1 } })
        .sort({ updatedAt: -1 })
        .limit(50)
        .toArray();

      return new Response(
        JSON.stringify({
          ok: true,
          conversations: docs.map((d) => ({
            id: d._id,
            title: d.title ?? null,
            updatedAt: d.updatedAt,
            createdAt: d.createdAt,
          })),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const id = getIdFromRequest(request) ?? DEFAULT_ID;
    const doc = await db.collection<ConversationDoc>(COLLECTION).findOne({ _id: id });

    if (!doc) {
      return new Response(JSON.stringify({ ok: true, state: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, state: doc.state }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[conversation] GET failed", error);
    const message = error instanceof Error ? error.message : "Failed to load conversation";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
  let state: unknown;
  let id: unknown;
  let title: unknown;
  try {
    const body = await request.json();
    state = body?.state;
    id = body?.id;
    title = body?.title;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!state || typeof state !== "object") {
    return new Response(JSON.stringify({ ok: false, error: "Missing state" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const s = state as Partial<ConversationState>;
  if (!Array.isArray(s.chatMessages) || !Array.isArray(s.conversationItems)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid state" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!(typeof s.selectedSkill === "string" || s.selectedSkill === null)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid state" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const conversationState: ConversationState = {
    chatMessages: s.chatMessages,
    conversationItems: s.conversationItems,
    selectedSkill: s.selectedSkill,
  };

  const conversationId =
    typeof id === "string" && id.trim().length > 0 ? id.trim() : randomUUID();

  const conversationTitle = typeof title === "string" ? title : undefined;

  try {
    const db = await getMongoDb();
    await db.collection<ConversationDoc>(COLLECTION).updateOne(
      { _id: conversationId },
      {
        $set: {
          state: conversationState,
          ...(conversationTitle ? { title: conversationTitle } : {}),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return new Response(JSON.stringify({ ok: true, id: conversationId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[conversation] POST failed", error);
    const message = error instanceof Error ? error.message : "Failed to save conversation";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getMongoDb();

    const id = getIdFromRequest(request);
    if (id) {
      await db.collection<ConversationDoc>(COLLECTION).deleteOne({ _id: id });
    } else {
      await db.collection<ConversationDoc>(COLLECTION).deleteMany({});
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[conversation] DELETE failed", error);
    const message = error instanceof Error ? error.message : "Failed to clear conversation";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
