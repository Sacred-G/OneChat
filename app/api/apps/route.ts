import { getMongoDb } from "@/lib/mongodb";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const COLLECTION = "apps";

const isHosted = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";

type AppType = "html" | "react" | "code" | "url";

type AppDoc = {
  _id: string;
  type: AppType;
  title: string;
  code?: string;
  url?: string;
  language?: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
};

const globalForApps = globalThis as unknown as {
  _appsMemory?: Map<string, AppDoc>;
};

function getMemoryStore() {
  if (!globalForApps._appsMemory) {
    globalForApps._appsMemory = new Map();
  }
  return globalForApps._appsMemory;
}

async function getDbOrNull() {
  try {
    return await getMongoDb();
  } catch {
    return null;
  }
}

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
    const id = getIdFromRequest(request);
    const db = await getDbOrNull();

    if (!db) {
      if (isHosted) throw new Error("MongoDB unavailable");
      const store = getMemoryStore();

      if (shouldList(request) || !id) {
        const docs = Array.from(store.values())
          .sort((a, b) => (b.updatedAt?.getTime?.() || 0) - (a.updatedAt?.getTime?.() || 0))
          .slice(0, 200);

        return new Response(
          JSON.stringify({
            ok: true,
            apps: docs.map((d) => ({
              id: d._id,
              title: d.title,
              type: d.type,
              language: d.language ?? null,
              thumbnail: typeof d.thumbnail === "string" ? d.thumbnail : null,
              updatedAt: d.updatedAt,
              createdAt: d.createdAt,
            })),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const doc = store.get(id);
      if (!doc) {
        return new Response(JSON.stringify({ ok: true, app: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          ok: true,
          app: {
            id: doc._id,
            title: doc.title,
            type: doc.type,
            language: doc.type === "url" ? null : doc.language ?? null,
            thumbnail: typeof doc.thumbnail === "string" ? doc.thumbnail : null,
            ...(typeof doc.code === "string" ? { code: doc.code } : {}),
            ...(typeof doc.url === "string" ? { url: doc.url } : {}),
            updatedAt: doc.updatedAt,
            createdAt: doc.createdAt,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (shouldList(request) || !id) {
      const docs = await db
        .collection<AppDoc>(COLLECTION)
        .find({}, { projection: { _id: 1, title: 1, type: 1, language: 1, thumbnail: 1, updatedAt: 1, createdAt: 1 } })
        .sort({ updatedAt: -1 })
        .limit(200)
        .toArray();

      return new Response(
        JSON.stringify({
          ok: true,
          apps: docs.map((d) => ({
            id: d._id,
            title: d.title,
            type: d.type,
            language: d.type === "url" ? null : d.language ?? null,
            thumbnail: typeof d.thumbnail === "string" ? d.thumbnail : null,
            updatedAt: d.updatedAt,
            createdAt: d.createdAt,
          })),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const doc = await db.collection<AppDoc>(COLLECTION).findOne({ _id: id });
    if (!doc) {
      return new Response(JSON.stringify({ ok: true, app: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        app: {
          id: doc._id,
          title: doc.title,
          type: doc.type,
          language: doc.type === "url" ? null : doc.language ?? null,
          thumbnail: typeof doc.thumbnail === "string" ? doc.thumbnail : null,
          ...(typeof doc.code === "string" ? { code: doc.code } : {}),
          ...(typeof doc.url === "string" ? { url: doc.url } : {}),
          updatedAt: doc.updatedAt,
          createdAt: doc.createdAt,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[apps] GET failed", error);
    const message = error instanceof Error ? error.message : "Failed to load apps";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const id = typeof body?.id === "string" && body.id.trim().length > 0 ? body.id.trim() : randomUUID();
  const type = body?.type === "html" || body?.type === "react" || body?.type === "code" || body?.type === "url" ? body.type : null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const code = typeof body?.code === "string" ? body.code : "";
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const language = typeof body?.language === "string" ? body.language : undefined;
  const thumbnailRaw = typeof body?.thumbnail === "string" ? body.thumbnail : "";
  const thumbnail = thumbnailRaw && thumbnailRaw.length <= 250_000 ? thumbnailRaw : undefined;

  if (!type) {
    return new Response(JSON.stringify({ ok: false, error: "Missing type" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!title) {
    return new Response(JSON.stringify({ ok: false, error: "Missing title" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (type === "url") {
    if (!url) {
      return new Response(JSON.stringify({ ok: false, error: "Missing url" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    if (!code.trim()) {
      return new Response(JSON.stringify({ ok: false, error: "Missing code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  try {
    const db = await getDbOrNull();

    if (!db) {
      if (isHosted) throw new Error("MongoDB unavailable");
      const store = getMemoryStore();
      const existing = store.get(id);
      const createdAt = existing?.createdAt || new Date();
      store.set(id, {
        _id: id,
        type,
        title,
        ...(type === "url" ? { url } : { code }),
        ...(type === "url" ? {} : language ? { language } : {}),
        ...(thumbnail ? { thumbnail } : {}),
        createdAt,
        updatedAt: new Date(),
      });

      return new Response(JSON.stringify({ ok: true, id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const $set: any = {
      type,
      title,
      ...(thumbnail ? { thumbnail } : {}),
      updatedAt: new Date(),
    };
    const $unset: any = {};

    if (type === "url") {
      $set.url = url;
      $unset.code = "";
      $unset.language = "";
    } else {
      $set.code = code;
      if (language) {
        $set.language = language;
      } else {
        $unset.language = "";
      }
      $unset.url = "";
    }

    await db.collection<AppDoc>(COLLECTION).updateOne(
      { _id: id },
      {
        $set,
        ...((Object.keys($unset).length > 0 ? { $unset } : {}) as any),
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[apps] POST failed", error);
    const message = error instanceof Error ? error.message : "Failed to save app";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = getIdFromRequest(request);
    const db = await getDbOrNull();

    if (!db) {
      if (isHosted) throw new Error("MongoDB unavailable");
      const store = getMemoryStore();
      if (id) {
        store.delete(id);
      } else {
        store.clear();
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (id) {
      await db.collection<AppDoc>(COLLECTION).deleteOne({ _id: id });
    } else {
      await db.collection<AppDoc>(COLLECTION).deleteMany({});
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[apps] DELETE failed", error);
    const message = error instanceof Error ? error.message : "Failed to delete app";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
