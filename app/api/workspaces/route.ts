import { getMongoDb } from "@/lib/mongodb";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const COLLECTION = "workspaces";

type WorkspaceDoc = {
  _id: string;
  name: string;
  icon: string;
  color: string;
  // Workspace-scoped settings
  agents: any[];
  selectedAgentId: string | null;
  selectedProjectId: string;
  toolSettings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
};

const isHosted = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";

const globalForWorkspaces = globalThis as unknown as {
  _workspaceMemory?: Map<string, WorkspaceDoc>;
};

function getMemoryStore() {
  if (!globalForWorkspaces._workspaceMemory) {
    globalForWorkspaces._workspaceMemory = new Map();
  }
  return globalForWorkspaces._workspaceMemory;
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
    const db = await getDbOrNull();
    if (!db) {
      if (isHosted) throw new Error("MongoDB unavailable");
      const store = getMemoryStore();

      if (shouldList(request)) {
        const docs = Array.from(store.values())
          .sort((a, b) => (b.updatedAt?.getTime?.() || 0) - (a.updatedAt?.getTime?.() || 0));
        return Response.json({
          ok: true,
          workspaces: docs.map((d) => ({
            id: d._id,
            name: d.name,
            icon: d.icon || "💼",
            color: d.color || "#6366f1",
            agents: d.agents || [],
            selectedAgentId: d.selectedAgentId ?? null,
            selectedProjectId: d.selectedProjectId || "",
            toolSettings: d.toolSettings || {},
            updatedAt: d.updatedAt,
            createdAt: d.createdAt,
          })),
        });
      }

      const id = getIdFromRequest(request);
      if (!id) {
        return Response.json({ ok: true, workspace: null });
      }
      const doc = store.get(id);
      if (!doc) {
        return Response.json({ ok: true, workspace: null });
      }
      return Response.json({
        ok: true,
        workspace: {
          id: doc._id,
          name: doc.name,
          icon: doc.icon || "💼",
          color: doc.color || "#6366f1",
          agents: doc.agents || [],
          selectedAgentId: doc.selectedAgentId ?? null,
          selectedProjectId: doc.selectedProjectId || "",
          toolSettings: doc.toolSettings || {},
          updatedAt: doc.updatedAt,
          createdAt: doc.createdAt,
        },
      });
    }

    if (shouldList(request)) {
      const docs = await db
        .collection<WorkspaceDoc>(COLLECTION)
        .find({})
        .sort({ updatedAt: -1 })
        .limit(100)
        .toArray();

      return Response.json({
        ok: true,
        workspaces: docs.map((d) => ({
          id: d._id,
          name: d.name,
          icon: d.icon || "💼",
          color: d.color || "#6366f1",
          agents: d.agents || [],
          selectedAgentId: d.selectedAgentId ?? null,
          selectedProjectId: d.selectedProjectId || "",
          toolSettings: d.toolSettings || {},
          updatedAt: d.updatedAt,
          createdAt: d.createdAt,
        })),
      });
    }

    const id = getIdFromRequest(request);
    if (!id) {
      return Response.json({ ok: true, workspace: null });
    }

    const doc = await db.collection<WorkspaceDoc>(COLLECTION).findOne({ _id: id });
    if (!doc) {
      return Response.json({ ok: true, workspace: null });
    }

    return Response.json({
      ok: true,
      workspace: {
        id: doc._id,
        name: doc.name,
        icon: doc.icon || "💼",
        color: doc.color || "#6366f1",
        agents: doc.agents || [],
        selectedAgentId: doc.selectedAgentId ?? null,
        selectedProjectId: doc.selectedProjectId || "",
        toolSettings: doc.toolSettings || {},
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
      },
    });
  } catch (error) {
    console.error("[workspaces] GET failed", error);
    return Response.json({ ok: false, error: "Failed to load workspaces" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body?.id === "string" && body.id.trim().length > 0 ? body.id.trim() : randomUUID();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const icon = typeof body?.icon === "string" ? body.icon : "💼";
  const color = typeof body?.color === "string" ? body.color : "#6366f1";
  const agents = Array.isArray(body?.agents) ? body.agents : undefined;
  const selectedAgentId = body?.selectedAgentId !== undefined ? body.selectedAgentId : undefined;
  const selectedProjectId = typeof body?.selectedProjectId === "string" ? body.selectedProjectId : undefined;
  const toolSettings = body?.toolSettings && typeof body.toolSettings === "object" ? body.toolSettings : undefined;

  if (!name) {
    return Response.json({ ok: false, error: "Missing name" }, { status: 400 });
  }

  const $set: Record<string, any> = {
    name,
    icon,
    color,
    updatedAt: new Date(),
  };
  if (agents !== undefined) $set.agents = agents;
  if (selectedAgentId !== undefined) $set.selectedAgentId = selectedAgentId;
  if (selectedProjectId !== undefined) $set.selectedProjectId = selectedProjectId;
  if (toolSettings !== undefined) $set.toolSettings = toolSettings;

  try {
    const db = await getDbOrNull();
    if (!db) {
      if (isHosted) throw new Error("MongoDB unavailable");
      const store = getMemoryStore();
      const existing = store.get(id);
      store.set(id, {
        _id: id,
        name,
        icon,
        color,
        agents: agents ?? existing?.agents ?? [],
        selectedAgentId: selectedAgentId ?? existing?.selectedAgentId ?? null,
        selectedProjectId: selectedProjectId ?? existing?.selectedProjectId ?? "",
        toolSettings: toolSettings ?? existing?.toolSettings ?? {},
        createdAt: existing?.createdAt || new Date(),
        updatedAt: new Date(),
      });
      return Response.json({ ok: true, id });
    }

    await db.collection<WorkspaceDoc>(COLLECTION).updateOne(
      { _id: id },
      {
        $set,
        $setOnInsert: {
          createdAt: new Date(),
          ...(agents === undefined ? { agents: [] } : {}),
          ...(selectedAgentId === undefined ? { selectedAgentId: null } : {}),
          ...(selectedProjectId === undefined ? { selectedProjectId: "" } : {}),
          ...(toolSettings === undefined ? { toolSettings: {} } : {}),
        },
      },
      { upsert: true }
    );

    return Response.json({ ok: true, id });
  } catch (error) {
    console.error("[workspaces] POST failed", error);
    return Response.json({ ok: false, error: "Failed to save workspace" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = getIdFromRequest(request);
    if (!id) {
      return Response.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    const db = await getDbOrNull();
    if (!db) {
      if (isHosted) throw new Error("MongoDB unavailable");
      const store = getMemoryStore();
      store.delete(id);
      return Response.json({ ok: true });
    }

    await db.collection<WorkspaceDoc>(COLLECTION).deleteOne({ _id: id });

    // Also clean up conversations belonging to this workspace
    try {
      await db.collection("conversations").deleteMany({ workspaceId: id });
    } catch {
      // ignore cleanup failures
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[workspaces] DELETE failed", error);
    return Response.json({ ok: false, error: "Failed to delete workspace" }, { status: 500 });
  }
}
