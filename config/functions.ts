// Functions mapping to tool calls
// Define one function per tool call - each tool call should have a matching function
// Parameters for a tool call are passed as an object to the corresponding function

import useToolsStore from "@/stores/useToolsStore";

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

export const functionsMap = {
  get_weather: get_weather,
  get_joke: get_joke,
  generate_image: generate_image,
  generate_images: generate_images,
  send_email: send_email,
  local_list_dir: local_list_dir,
  local_read_file: local_read_file,
  local_write_file: local_write_file,
  local_run_command: local_run_command,
};
