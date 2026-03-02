// Functions mapping to tool calls
// Define one function per tool call - each tool call should have a matching function
// Parameters for a tool call are passed as an object to the corresponding function

import useToolsStore from "@/stores/useToolsStore";
import useArtifactStore from "@/stores/useArtifactStore";

export const get_weather = async ({
  location,
  unit,
}: {
  location: string;
  unit: string;
}) => {
  const res = await fetch(
    `/api/functions/get_weather?location=${location}&unit=${unit}`
  ).then((res) => res.json());

  return res;
};

export const local_list_dir = async ({ path }: { path: string }) => {
  const { localAgentUrl } = useToolsStore.getState();
  const res = await fetch(`/api/local_agent/fs/list?path=${encodeURIComponent(path || "/")}`, {
    headers: { "x-local-agent-url": localAgentUrl },
  }).then((r) => r.json());
  return res;
};

export const local_read_file = async ({ path }: { path: string }) => {
  const { localAgentUrl } = useToolsStore.getState();
  const res = await fetch(`/api/local_agent/fs/read?path=${encodeURIComponent(path || "")}`, {
    headers: { "x-local-agent-url": localAgentUrl },
  }).then((r) => r.json());
  return res;
};

export const local_write_file = async ({
  path,
  content,
}: {
  path: string;
  content: string;
}) => {
  const { localAgentUrl } = useToolsStore.getState();
  const res = await fetch(`/api/local_agent/fs/write`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-local-agent-url": localAgentUrl },
    body: JSON.stringify({ path, content }),
  }).then((r) => r.json());
  return res;
};

export const local_run_command = async ({
  command,
  cwd,
}: {
  command: string;
  cwd: string;
}) => {
  const { localAgentUrl } = useToolsStore.getState();
  const res = await fetch(`/api/local_agent/cmd/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-local-agent-url": localAgentUrl },
    body: JSON.stringify({ command, cwd }),
  }).then((r) => r.json());
  return res;
};

export const send_email = async ({
  to,
  subject,
  text,
  html,
  dry_run,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  dry_run?: boolean;
}) => {
  const res = await fetch(`/api/functions/send_email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      subject,
      text,
      ...(typeof html === "string" ? { html } : {}),
      ...(typeof dry_run === "boolean" ? { dry_run } : {}),
    }),
  }).then((res) => res.json());
  return res;
};

export const get_joke = async () => {
  const res = await fetch(`/api/functions/get_joke`).then((res) => res.json());
  return res;
};

export const generate_image = async ({
  prompt,
}: {
  prompt: string;
}) => {
  const { geminiImageEnabled } = useToolsStore.getState();
  const res = await fetch(`/api/functions/generate_image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      provider: geminiImageEnabled ? "gemini" : "openai",
    }),
  }).then((res) => res.json());
  return res;
};

export const generate_images = async ({
  prompt,
  imageDataUrl,
}: {
  prompt: string;
  imageDataUrl?: string;
}) => {
  const res = await fetch(`/api/functions/generate_images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      ...(typeof imageDataUrl === "string" && imageDataUrl.trim()
        ? { imageDataUrl: imageDataUrl.trim() }
        : {}),
    }),
  }).then((res) => res.json());
  return res;
};

export const generate_video = async ({
  prompt,
  size = "1280x720",
  seconds = 10,
}: {
  prompt: string;
  size?: "1280x720" | "1920x1080";
  seconds?: number;
}) => {
  const res = await fetch(`/api/videos/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: prompt.trim(),
      model: "sora-2",
      size,
      seconds,
    }),
  }).then((res) => res.json());
  return res;
};

export const read_skill_reference = async ({
  skillName,
  referencePath,
}: {
  skillName: string;
  referencePath?: string;
}) => {
  const res = await fetch(`/api/skills/reference`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skillName,
      ...(typeof referencePath === "string" && referencePath.trim()
        ? { referencePath: referencePath.trim() }
        : {}),
    }),
  }).then((r) => r.json());
  return res;
};

export const mcp_local_tool = async ({
  server_id,
  tool_name,
  arguments: toolArgs,
}: {
  server_id: string;
  tool_name: string;
  arguments: Record<string, any>;
}) => {
  const res = await fetch(`/api/mcp_local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "call_tool",
      server_id,
      tool_name,
      arguments: toolArgs,
    }),
  }).then((r) => r.json());
  return res;
};

export const web_search_query = async ({
  query,
}: {
  query: string;
}) => {
  const res = await fetch(`/api/web_search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  }).then((r) => r.json());
  return res;
};

export const launch_streamlit_app = async () => {
  const res = await fetch(`/api/streamlit/launch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).then((r) => r.json());
  return res;
};

export const deploy_streamlit_app = async ({ code }: { code: string }) => {
  const res = await fetch(`/api/streamlit/deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  }).then((r) => r.json());
  return res;
};

export const create_ts_app = async ({
  files,
  dependencies,
  entry,
  title,
}: {
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  entry?: string;
  title?: string;
}) => {
  const { upsertArtifact, setCurrentArtifact } =
    useArtifactStore.getState() as any;

  const spec: any = {
    entry: typeof entry === "string" && entry.trim() ? entry.trim() : "/src/index.tsx",
    dependencies: dependencies && typeof dependencies === "object" ? dependencies : {},
    files: files && typeof files === "object" ? files : {},
  };

  const artifact = {
    id: `ts_app_${Date.now()}`,
    title: typeof title === "string" && title.trim() ? title.trim() : "TypeScript App",
    type: "ts_app",
    language: "ts_app",
    code: JSON.stringify(spec, null, 2),
    revision: Date.now(),
  };

  if (typeof upsertArtifact === "function") upsertArtifact(artifact);
  if (typeof setCurrentArtifact === "function") setCurrentArtifact(artifact);

  return { ok: true };
};

export const update_ts_app = async ({
  files,
  deleteFiles,
  dependencies,
  entry,
  mode = "merge",
}: {
  files: Record<string, string>;
  deleteFiles?: string[];
  dependencies?: Record<string, string>;
  entry?: string;
  mode?: "merge" | "replace";
}) => {
  const { currentArtifact, upsertArtifact, setCurrentArtifact } =
    useArtifactStore.getState() as any;

  if (!currentArtifact || currentArtifact.type !== "ts_app") {
    return { ok: false, error: "No ts_app is currently open" };
  }

  const raw = typeof currentArtifact.code === "string" ? currentArtifact.code : "";
  const base = (() => {
    try {
      const parsed = raw && raw.trim() ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") return null;
      return parsed as any;
    } catch {
      return null;
    }
  })();

  const nextSpec: any =
    mode === "replace"
      ? {
          entry: typeof entry === "string" && entry.trim() ? entry.trim() : "/src/index.tsx",
          dependencies: dependencies && typeof dependencies === "object" ? dependencies : {},
          files: files && typeof files === "object" ? files : {},
        }
      : {
          entry:
            typeof entry === "string" && entry.trim()
              ? entry.trim()
              : typeof base?.entry === "string"
                ? base.entry
                : "/src/index.tsx",
          dependencies: {
            ...((base?.dependencies && typeof base.dependencies === "object") ? base.dependencies : {}),
            ...((dependencies && typeof dependencies === "object") ? dependencies : {}),
          },
          files: {
            ...((base?.files && typeof base.files === "object") ? base.files : {}),
            ...((files && typeof files === "object") ? files : {}),
          },
        };

  if (Array.isArray(deleteFiles) && deleteFiles.length > 0) {
    for (const p of deleteFiles) {
      if (typeof p === "string" && p in (nextSpec.files || {})) {
        try {
          delete nextSpec.files[p];
        } catch {
          // ignore
        }
      }
    }
  }

  const nextArtifact = {
    ...currentArtifact,
    type: "ts_app",
    language: "ts_app",
    code: JSON.stringify(nextSpec, null, 2),
    revision: Date.now(),
  };

  if (typeof upsertArtifact === "function") upsertArtifact(nextArtifact);
  if (typeof setCurrentArtifact === "function") setCurrentArtifact(nextArtifact);

  return { ok: true };
};

export const functionsMap: Record<string, (params: any) => Promise<any>> = {
  get_weather: get_weather,
  get_joke: get_joke,
  generate_image: generate_image,
  generate_images: generate_images,
  generate_video: generate_video,
  send_email: send_email,
  local_list_dir: local_list_dir,
  local_read_file: local_read_file,
  local_write_file: local_write_file,
  local_run_command: local_run_command,
  read_skill_reference: read_skill_reference,
  launch_streamlit_app: launch_streamlit_app,
  deploy_streamlit_app: deploy_streamlit_app,
  create_ts_app: create_ts_app,
  update_ts_app: update_ts_app,
  web_search_query: web_search_query,
};
