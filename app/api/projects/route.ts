import { getMongoDb } from "@/lib/mongodb";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const COLLECTION = "projects";

type ProjectDoc = {
  _id: string;
  name: string;
  vectorStoreId?: string;
  vectorStoreName?: string;
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
        .collection<ProjectDoc>(COLLECTION)
        .find({}, { projection: { _id: 1, name: 1, vectorStoreId: 1, vectorStoreName: 1, updatedAt: 1, createdAt: 1 } })
        .sort({ updatedAt: -1 })
        .limit(200)
        .toArray();

      return new Response(
        JSON.stringify({
          ok: true,
          projects: docs.map((d) => ({
            id: d._id,
            name: d.name,
            vectorStoreId: d.vectorStoreId ?? "",
            vectorStoreName: d.vectorStoreName ?? "",
            updatedAt: d.updatedAt,
            createdAt: d.createdAt,
          })),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const id = getIdFromRequest(request);
    if (!id) {
      return new Response(JSON.stringify({ ok: true, project: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const doc = await db.collection<ProjectDoc>(COLLECTION).findOne({ _id: id });
    if (!doc) {
      return new Response(JSON.stringify({ ok: true, project: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        project: {
          id: doc._id,
          name: doc.name,
          vectorStoreId: doc.vectorStoreId ?? "",
          vectorStoreName: doc.vectorStoreName ?? "",
          updatedAt: doc.updatedAt,
          createdAt: doc.createdAt,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[projects] GET failed", error);
    return new Response("Failed to load projects", { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const id = typeof body?.id === "string" && body.id.trim().length > 0 ? body.id.trim() : randomUUID();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const vectorStoreId = typeof body?.vectorStoreId === "string" ? body.vectorStoreId.trim() : "";
  const vectorStoreName = typeof body?.vectorStoreName === "string" ? body.vectorStoreName.trim() : "";

  if (!name) {
    return new Response("Missing name", { status: 400 });
  }

  try {
    const db = await getMongoDb();

    await db.collection<ProjectDoc>(COLLECTION).updateOne(
      { _id: id },
      {
        $set: {
          name,
          ...(vectorStoreId ? { vectorStoreId } : { vectorStoreId: "" }),
          ...(vectorStoreName ? { vectorStoreName } : { vectorStoreName: "" }),
          updatedAt: new Date(),
        },
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
    console.error("[projects] POST failed", error);
    return new Response("Failed to save project", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getMongoDb();
    const id = getIdFromRequest(request);

    if (!id) {
      return new Response("Missing id", { status: 400 });
    }

    await db.collection<ProjectDoc>(COLLECTION).deleteOne({ _id: id });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[projects] DELETE failed", error);
    return new Response("Failed to delete project", { status: 500 });
  }
}
