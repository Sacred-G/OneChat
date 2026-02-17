import { getMongoDb } from "@/lib/mongodb";

import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const COLLECTION = "conversations";
const DEFAULT_ID = "default";

const isHosted = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";

const globalForConversations = globalThis as unknown as {
  _conversationMemory?: Map<string, ConversationDoc>;
};

function getMemoryStore() {
  if (!globalForConversations._conversationMemory) {
    globalForConversations._conversationMemory = new Map();
  }
  return globalForConversations._conversationMemory;
}

async function getDbOrNull() {
  try {
    return await getMongoDb();
  } catch {
    return null;
  }
}

type ConversationState = {
  chatMessages: unknown[];
  conversationItems: unknown[];
  selectedSkill: string | null;
};

type ConversationDoc = {
  _id: string;
  state: ConversationState;
  title?: string;
  workspaceId?: string;
  createdAt: Date;
  updatedAt: Date;
};

function getIdFromRequest(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  return id && id.trim().length > 0 ? id : null;
}

function getWorkspaceIdFromRequest(request: Request) {
  const url = new URL(request.url);
  const wid = url.searchParams.get("workspaceId");
  return wid && wid.trim().length > 0 ? wid.trim() : null;
}

function shouldList(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("list") === "1";
}

export async function GET(request: Request) {
  try {
    const db = await getDbOrNull();
    if (!db) {
      if (isHosted) throw new Error("MongoDB unavailable");
      const store = getMemoryStore();

      if (shouldList(request)) {
        const workspaceId = getWorkspaceIdFromRequest(request);
        const docs = Array.from(store.values())
          .filter((d) => {
            if (!workspaceId) return !d.workspaceId;
            return d.workspaceId === workspaceId;
          })
          .sort((a, b) => (b.updatedAt?.getTime?.() || 0) - (a.updatedAt?.getTime?.() || 0))
          .slice(0, 50);
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
      const doc = store.get(id);
      return new Response(JSON.stringify({ ok: true, state: doc ? doc.state : null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (shouldList(request)) {
      const workspaceId = getWorkspaceIdFromRequest(request);
      const filter: Record<string, any> = workspaceId
        ? { workspaceId }
        : { $or: [{ workspaceId: { $exists: false } }, { workspaceId: null }, { workspaceId: "" }] };
      const docs = await db
        .collection<ConversationDoc>(COLLECTION)
        .find(filter, { projection: { _id: 1, title: 1, updatedAt: 1, createdAt: 1 } })
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
  let workspaceId: string | undefined;
  try {
    const body = await request.json();
    state = body?.state;
    id = body?.id;
    title = body?.title;
    workspaceId = typeof body?.workspaceId === "string" && body.workspaceId.trim() ? body.workspaceId.trim() : undefined;
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
    const db = await getDbOrNull();
    if (!db) {
      if (isHosted) throw new Error("MongoDB unavailable");
      const store = getMemoryStore();
      const existing = store.get(conversationId);
      const createdAt = existing?.createdAt || new Date();
      store.set(conversationId, {
        _id: conversationId,
        state: conversationState,
        ...(conversationTitle ? { title: conversationTitle } : {}),
        ...(workspaceId ? { workspaceId } : existing?.workspaceId ? { workspaceId: existing.workspaceId } : {}),
        createdAt,
        updatedAt: new Date(),
      });
      return new Response(JSON.stringify({ ok: true, id: conversationId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    await db.collection<ConversationDoc>(COLLECTION).updateOne(
      { _id: conversationId },
      {
        $set: {
          state: conversationState,
          ...(conversationTitle ? { title: conversationTitle } : {}),
          ...(workspaceId ? { workspaceId } : {}),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
          ...(workspaceId ? {} : { workspaceId: "" }),
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
    const db = await getDbOrNull();
    if (!db) {
      if (isHosted) throw new Error("MongoDB unavailable");
      const store = getMemoryStore();
      const id = getIdFromRequest(request);
      const workspaceId = getWorkspaceIdFromRequest(request);
      if (id) {
        store.delete(id);
      } else if (workspaceId) {
        for (const [key, doc] of store.entries()) {
          if (doc.workspaceId === workspaceId) store.delete(key);
        }
      } else {
        store.clear();
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = getIdFromRequest(request);
    const workspaceId = getWorkspaceIdFromRequest(request);
    if (id) {
      await db.collection<ConversationDoc>(COLLECTION).deleteOne({ _id: id });
    } else if (workspaceId) {
      await db.collection<ConversationDoc>(COLLECTION).deleteMany({ workspaceId });
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
