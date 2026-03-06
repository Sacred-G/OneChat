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

const AUTO_DEPS: Record<string, string> = {
  "react-router-dom": "^6.30.0",
  "framer-motion": "^11.0.0",
  "lucide-react": "^0.460.0",
  "recharts": "^2.15.0",
  "zustand": "^5.0.0",
  "axios": "^1.7.0",
  "date-fns": "^4.1.0",
  "@tanstack/react-query": "^5.60.0",
  "react-icons": "^5.4.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.6.0",
  "class-variance-authority": "^0.7.0",
  "@radix-ui/react-dialog": "^1.1.0",
  "@radix-ui/react-dropdown-menu": "^2.1.0",
  "@radix-ui/react-popover": "^1.1.0",
  "@radix-ui/react-tooltip": "^1.1.0",
  "@radix-ui/react-select": "^2.1.0",
  "@radix-ui/react-slot": "^1.1.0",
  "@radix-ui/react-tabs": "^1.1.0",
  "@radix-ui/react-switch": "^1.1.0",
  "@radix-ui/react-checkbox": "^1.1.0",
  "@radix-ui/react-label": "^2.1.0",
  "@radix-ui/react-separator": "^1.1.0",
  "@radix-ui/react-accordion": "^1.2.0",
  "@radix-ui/react-avatar": "^1.1.0",
  "@radix-ui/react-scroll-area": "^1.2.0",
  "react-hook-form": "^7.54.0",
  "@hookform/resolvers": "^3.9.0",
  "zod": "^3.24.0",
  "react-hot-toast": "^2.4.0",
  "sonner": "^1.7.0",
  "cmdk": "^1.0.0",
  "embla-carousel-react": "^8.5.0",
  "react-day-picker": "^9.4.0",
  "input-otp": "^1.4.0",
  "next-themes": "^0.4.0",
  "vaul": "^1.1.0",
  "react-resizable-panels": "^2.1.0",
  "swr": "^2.3.0",
  "lodash": "^4.17.21",
  "uuid": "^11.0.0",
  "nanoid": "^5.0.0",
  "d3": "^7.9.0",
  "three": "^0.170.0",
  "@react-three/fiber": "^8.17.0",
  "@react-three/drei": "^9.117.0",
  "lottie-react": "^2.4.0",
  "react-spring": "^9.7.0",
  "@dnd-kit/core": "^6.3.0",
  "@dnd-kit/sortable": "^10.0.0",
  "react-beautiful-dnd": "^13.1.1",
  "react-markdown": "^9.0.0",
  "react-syntax-highlighter": "^15.6.0",
  "highlight.js": "^11.10.0",
  "prismjs": "^1.29.0",
  "@uiw/react-codemirror": "^4.23.0",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@react-google-maps/api": "^2.20.0",
  "mapbox-gl": "^3.8.0",
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "victory": "^37.3.0",
  "nivo": "^0.87.0",
};

const inferTsAppDependencies = (files: Record<string, string>) => {
  const flatCode = Object.values(files || {})
    .filter((code) => typeof code === "string")
    .join("\n");
  const inferred: Record<string, string> = {};
  const hasImport = (pkg: string) => {
    const quoted = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return (
      new RegExp(`\\bfrom\\s+["']${quoted}(/[^"']*)?["']`).test(flatCode) ||
      new RegExp(`require\\(\\s*["']${quoted}(/[^"']*)?["']\\)`).test(flatCode)
    );
  };
  for (const [pkg, version] of Object.entries(AUTO_DEPS)) {
    if (hasImport(pkg)) inferred[pkg] = version;
  }
  return inferred;
};

const normalizeTsAppFiles = (files: unknown): Record<string, string> => {
  if (!files || typeof files !== "object") return {};
  const next: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    if (typeof path === "string" && typeof content === "string") {
      next[path] = content;
    }
  }
  return next;
};

const pathToComponentName = (path: string) => {
  const base = path.split("/").pop() || "";
  const stem = base.replace(/\.[^.]+$/, "");
  const normalized = stem.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Game";
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")
    .replace(/^[^A-Z]+/, "") || "Game";
};

const toRelativeImport = (fromPath: string, targetPath: string) => {
  const fromParts = fromPath.split("/").filter(Boolean);
  const targetParts = targetPath
    .split("/")
    .filter(Boolean)
    .map((part, index, arr) => (index === arr.length - 1 ? part.replace(/\.[^.]+$/, "") : part));
  fromParts.pop();
  while (fromParts.length > 0 && targetParts.length > 0 && fromParts[0] === targetParts[0]) {
    fromParts.shift();
    targetParts.shift();
  }
  const up = fromParts.map(() => "..");
  const down = targetParts;
  const joined = [...up, ...down].join("/");
  return joined.startsWith(".") ? joined : `./${joined}`;
};

const ensureRequiredTsAppFiles = (files: Record<string, string>): Record<string, string> => {
  const next = { ...files };
  const tsxPaths = Object.keys(next).filter(
    (path) => path.endsWith(".tsx") && path !== "/src/index.tsx" && path !== "/src/App.tsx"
  );
  const preferredTargets = [
    "/src/Game.tsx",
    "/src/ContraGame.tsx",
    "/src/Main.tsx",
    "/src/Scene.tsx",
    "/src/components/Game.tsx",
    "/src/components/ContraGame.tsx",
    "/src/components/Main.tsx",
  ];
  const targetPath =
    preferredTargets.find((path) => typeof next[path] === "string") ||
    tsxPaths[0] ||
    "";
  const targetComponent = targetPath ? pathToComponentName(targetPath) : "";
  const targetImport = targetPath ? toRelativeImport("/src/App.tsx", targetPath) : "";

  if (!next["/src/App.tsx"]) {
    next["/src/App.tsx"] = targetPath
      ? `import React from "react";
import ${targetComponent} from "${targetImport}";

export default function App() {
  return <${targetComponent} />;
}
`
      : `import React from "react";

export default function App() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>App ready</h1>
        <p style={{ marginTop: 12, opacity: 0.7 }}>Add your main game or UI component to /src/App.tsx.</p>
      </div>
    </main>
  );
}
`;
  }

  if (!next["/src/index.tsx"]) {
    next["/src/index.tsx"] = `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
`;
  }

  if (!next["/src/styles.css"]) {
    next["/src/styles.css"] = `:root {
  color-scheme: dark;
  font-family: Inter, system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
}

body {
  background: #050816;
  color: #f8fafc;
}

button,
input,
textarea,
select {
  font: inherit;
}
`;
  }

  return next;
};

const hasTsAppChange = ({
  files,
  deleteFiles,
  dependencies,
  devDependencies,
  externalResources,
  entry,
}: {
  files: Record<string, string>;
  deleteFiles?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  externalResources?: string[];
  entry?: string;
}) => {
  const hasFiles = Object.keys(files).length > 0;
  const hasDelete = Array.isArray(deleteFiles) && deleteFiles.length > 0;
  const hasDeps =
    Boolean(dependencies && typeof dependencies === "object" && Object.keys(dependencies).length > 0);
  const hasDevDeps =
    Boolean(devDependencies && typeof devDependencies === "object" && Object.keys(devDependencies).length > 0);
  const hasResources = Array.isArray(externalResources) && externalResources.length > 0;
  const hasEntry = typeof entry === "string" && entry.trim().length > 0;
  return hasFiles || hasDelete || hasDeps || hasDevDeps || hasResources || hasEntry;
};

const isGameLikeTitle = (value?: string) =>
  typeof value === "string" &&
  /(game|contra|platform|platformer|shooter|arcade|run.?n.?gun|canvas|nintendo|boss|enemy)/i.test(value);

const getFallbackBaseFiles = (): Record<string, string> => ({
  "/src/index.tsx": `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
`,
  "/src/App.tsx": `import React from "react";

export default function App() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 32 }}>
      <div style={{ maxWidth: 720 }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>App scaffold ready</h1>
        <p style={{ marginTop: 12, lineHeight: 1.6, opacity: 0.75 }}>
          The model did not provide enough files to generate the requested app, so a minimal shell was created instead of the old generic marketing components.
        </p>
      </div>
    </main>
  );
}
`,
  "/src/styles.css": `:root {
  color-scheme: dark;
  font-family: Inter, system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
}

body {
  background: #050816;
  color: #f8fafc;
}
`,
});

const getFallbackGameFiles = (): Record<string, string> => ({
  "/src/index.tsx": `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
`,
  "/src/App.tsx": `import React from "react";
import ArcadeGame from "./src-game/ArcadeGame";

export default function App() {
  return <ArcadeGame />;
}
`,
  "/src/src-game/ArcadeGame.tsx": `import React, { useEffect, useRef, useState } from "react";

type Bullet = { x: number; y: number; vx: number; vy: number };
type Enemy = { x: number; y: number; vx: number; hp: number };
type State = {
  mode: "start" | "playing" | "won" | "lost";
  player: { x: number; y: number; vx: number; vy: number; w: number; h: number; onGround: boolean; facing: 1 | -1; lives: number };
  bullets: Bullet[];
  enemies: Enemy[];
  score: number;
  cooldown: number;
};

const W = 960;
const H = 540;
const FLOOR = 462;
const SPEED = 220;
const JUMP = 420;
const GRAVITY = 980;

function makeInitialState(): State {
  return {
    mode: "start",
    player: { x: 120, y: FLOOR - 56, vx: 0, vy: 0, w: 34, h: 56, onGround: true, facing: 1, lives: 3 },
    bullets: [],
    enemies: [
      { x: 620, y: FLOOR - 48, vx: -55, hp: 2 },
      { x: 820, y: FLOOR - 48, vx: -70, hp: 2 },
    ],
    score: 0,
    cooldown: 0,
  };
}

export default function ArcadeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const stateRef = useRef<State>(makeInitialState());
  const [, forceRender] = useState(0);

  const draw = () => {
    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#081120";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#11243f";
    ctx.fillRect(0, 0, W, 84);
    ctx.fillStyle = "#1c3a66";
    for (let i = 0; i < 16; i++) {
      ctx.fillRect(i * 64, FLOOR + 18 + (i % 2) * 5, 42, 18);
    }
    ctx.fillStyle = "#263238";
    ctx.fillRect(0, FLOOR, W, H - FLOOR);

    ctx.fillStyle = "#ffe082";
    ctx.font = "16px monospace";
    ctx.fillText("Move: A/D or arrows  Jump: W/Up  Fire: Space  Restart: R", 24, 34);
    ctx.fillText("Lives: " + s.player.lives + "  Score: " + s.score, 24, 58);

    if (s.mode === "start") {
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 38px monospace";
      ctx.fillText("ARCADE ASSAULT", 310, 210);
      ctx.font = "18px monospace";
      ctx.fillText("Press Enter to start", 366, 252);
    }

    ctx.fillStyle = "#80cbc4";
    ctx.fillRect(s.player.x, s.player.y, s.player.w, s.player.h);
    ctx.fillStyle = "#102027";
    ctx.fillRect(s.player.x + (s.player.facing === 1 ? 24 : -6), s.player.y + 18, 16, 6);

    ctx.fillStyle = "#ffca28";
    s.bullets.forEach((b) => ctx.fillRect(b.x, b.y, 10, 4));

    ctx.fillStyle = "#ef5350";
    s.enemies.forEach((e) => {
      ctx.fillRect(e.x, e.y, 32, 48);
      ctx.fillStyle = "#fff59d";
      ctx.fillRect(e.x + 6, e.y - 10, 20 * (e.hp / 2), 4);
      ctx.fillStyle = "#ef5350";
    });

    if (s.mode === "won" || s.mode === "lost") {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 42px monospace";
      ctx.fillText(s.mode === "won" ? "AREA CLEAR" : "MISSION FAILED", 290, 220);
      ctx.font = "18px monospace";
      ctx.fillText("Press R to restart", 384, 260);
    }
  };

  const update = (dt: number) => {
    const s = stateRef.current;
    const keys = keysRef.current;
    if (s.mode === "start") return;
    if (s.mode === "won" || s.mode === "lost") return;

    const move = (keys.ArrowLeft || keys.a ? -1 : 0) + (keys.ArrowRight || keys.d ? 1 : 0);
    s.player.vx = move * SPEED;
    if (move !== 0) s.player.facing = move > 0 ? 1 : -1;
    if ((keys.ArrowUp || keys.w) && s.player.onGround) {
      s.player.vy = -JUMP;
      s.player.onGround = false;
    }

    s.player.vy += GRAVITY * dt;
    s.player.x = Math.max(0, Math.min(W - s.player.w, s.player.x + s.player.vx * dt));
    s.player.y += s.player.vy * dt;
    if (s.player.y + s.player.h >= FLOOR) {
      s.player.y = FLOOR - s.player.h;
      s.player.vy = 0;
      s.player.onGround = true;
    }

    s.cooldown = Math.max(0, s.cooldown - dt);
    if (keys[" "] && s.cooldown === 0) {
      s.cooldown = 0.22;
      s.bullets.push({ x: s.player.x + (s.player.facing === 1 ? 28 : -4), y: s.player.y + 24, vx: s.player.facing * 420, vy: 0 });
    }

    s.bullets = s.bullets
      .map((b) => ({ ...b, x: b.x + b.vx * dt }))
      .filter((b) => b.x > -20 && b.x < W + 20);

    s.enemies = s.enemies
      .map((e) => {
        const nx = e.x + e.vx * dt;
        return { ...e, x: nx < 420 ? 420 : nx > 860 ? 860 : nx, vx: nx < 420 || nx > 860 ? -e.vx : e.vx };
      })
      .filter((e) => e.hp > 0);

    for (const bullet of s.bullets) {
      for (const enemy of s.enemies) {
        if (bullet.x < enemy.x + 32 && bullet.x + 10 > enemy.x && bullet.y < enemy.y + 48 && bullet.y + 4 > enemy.y) {
          bullet.x = 2000;
          enemy.hp -= 1;
          if (enemy.hp <= 0) s.score += 100;
        }
      }
    }
    s.bullets = s.bullets.filter((b) => b.x < W + 40);

    for (const enemy of s.enemies) {
      const hit =
        s.player.x < enemy.x + 32 &&
        s.player.x + s.player.w > enemy.x &&
        s.player.y < enemy.y + 48 &&
        s.player.y + s.player.h > enemy.y;
      if (hit) {
        s.player.lives -= 1;
        s.player.x = 120;
        s.player.y = FLOOR - s.player.h;
        s.player.vx = 0;
        s.player.vy = 0;
        if (s.player.lives <= 0) s.mode = "lost";
        break;
      }
    }

    if (s.enemies.length === 0) s.mode = "won";
  };

  useEffect(() => {
    const tick = (time: number) => {
      const last = (tick as any).last ?? time;
      const dt = Math.min(0.033, (time - last) / 1000);
      (tick as any).last = time;
      update(dt);
      draw();
      requestAnimationFrame(tick);
    };

    const down = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === "Enter" && stateRef.current.mode === "start") stateRef.current.mode = "playing";
      if ((e.key === "r" || e.key === "R") && stateRef.current.mode !== "playing") stateRef.current = makeInitialState();
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    const renderGameToText = () =>
      JSON.stringify({
        coordinateSystem: { origin: "top-left", xDirection: "right", yDirection: "down" },
        mode: stateRef.current.mode,
        player: stateRef.current.player,
        enemies: stateRef.current.enemies,
        bullets: stateRef.current.bullets,
        score: stateRef.current.score,
      });

    (window as any).render_game_to_text = renderGameToText;
    (window as any).advanceTime = (ms: number) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let i = 0; i < steps; i++) update(1 / 60);
      draw();
      forceRender((v) => v + 1);
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    draw();
    requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      delete (window as any).render_game_to_text;
      delete (window as any).advanceTime;
    };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} style={{ width: "min(100vw, 960px)", height: "auto", border: "1px solid rgba(255,255,255,0.18)", imageRendering: "pixelated" }} />;
}
`,
  "/src/styles.css": `:root {
  color-scheme: dark;
  font-family: "Press Start 2P", "Courier New", monospace;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
}

body {
  display: grid;
  place-items: center;
  background: radial-gradient(circle at top, #14233f, #050816 60%);
  color: #f8fafc;
}
`,
});

const getFallbackTsAppFiles = (title?: string): Record<string, string> =>
  isGameLikeTitle(title) ? getFallbackGameFiles() : getFallbackBaseFiles();

const resolveTsAppTemplate = (template: string | undefined, files: Record<string, string>, entry: string | undefined) => {
  if (typeof template === "string" && template.trim()) return template.trim();
  const normalizedEntry = typeof entry === "string" && entry.trim() ? entry.trim() : "/src/index.tsx";
  const hasSrcTree = Object.keys(files).some((path) => path.startsWith("/src/"));
  return hasSrcTree || normalizedEntry.startsWith("/src/") ? "vite-react-ts" : "react-ts";
};

const analyzeGameContract = ({
  title,
  files,
}: {
  title?: string;
  files: Record<string, string>;
}) => {
  const joined = Object.entries(files)
    .map(([path, code]) => `${path}\n${code}`)
    .join("\n");
  const lower = joined.toLowerCase();
  const isGame =
    isGameLikeTitle(title) ||
    /render_game_to_text|advancetime|requestanimationframe|canvas|getcontext\(["']2d["']\)|game loop/.test(lower);

  if (!isGame) {
    return {
      isGame: false,
      status: "not_game" as const,
      missing: [] as string[],
    };
  }

  const hasGameplayFile =
    Object.keys(files).some((path) => /game|player|enemy|level|scene|world|arcade|contra|canvas/i.test(path)) ||
    /canvas|getcontext\(["']2d["']\)|requestanimationframe/.test(lower);
  const hasControls =
    /keydown|keyup|key ===|keycode|wasd|arrowleft|arrowright|arrowup|space/.test(lower);
  const hasRestart =
    /restart|reset|play again|press r|game over/.test(lower);
  const hasHooks =
    /render_game_to_text/.test(lower) && /advancetime/.test(lower);
  const hasPlayableState =
    /score|lives|health|hp|win|lose|won|lost|enemy/.test(lower);

  const missing = [
    ...(hasGameplayFile ? [] : ["required gameplay files"]),
    ...(hasControls ? [] : ["required controls"]),
    ...(hasRestart ? [] : ["required restart loop"]),
    ...(hasHooks ? [] : ["required test hooks"]),
    ...(hasPlayableState ? [] : ["required playable state"]),
  ];

  return {
    isGame: true,
    status: missing.length === 0 ? ("complete" as const) : ("incomplete" as const),
    missing,
    checks: {
      gameplayFiles: hasGameplayFile,
      controls: hasControls,
      restartLoop: hasRestart,
      testHooks: hasHooks,
      playableState: hasPlayableState,
    },
  };
};

const makeTsAppBuildMeta = ({
  title,
  files,
  dependencies,
  entry,
  template,
  fallbackUsed,
}: {
  title?: string;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  entry?: string;
  template?: string;
  fallbackUsed: boolean;
}) => ({
  templateUsed: resolveTsAppTemplate(template, files, entry),
  filesCreated: Object.keys(files).sort(),
  dependenciesAdded: Object.keys(dependencies || {}).sort(),
  fallbackUsed,
  gameContract: analyzeGameContract({ title, files }),
});

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
  devDependencies,
  externalResources,
  template,
  entry,
  title,
}: {
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  externalResources?: string[];
  template?: string;
  entry?: string;
  title?: string;
}) => {
  console.log("[create_ts_app] called with", Object.keys(files || {}));
  const incomingFiles = normalizeTsAppFiles(files);
  const fallbackUsed = Object.keys(incomingFiles).length === 0;
  const normalizedFiles =
    fallbackUsed
      ? getFallbackTsAppFiles(title)
      : ensureRequiredTsAppFiles(incomingFiles);

  console.log("[create_ts_app] normalized files:", Object.keys(normalizedFiles));

  const { upsertArtifact, setCurrentArtifact, addArtifact } =
    useArtifactStore.getState() as any;

  const validResources = Array.isArray(externalResources)
    ? externalResources.filter((u) => typeof u === "string" && u.trim())
    : [];

  const spec: any = {
    entry: typeof entry === "string" && entry.trim() ? entry.trim() : "/src/index.tsx",
    template: resolveTsAppTemplate(template, normalizedFiles, entry),
    dependencies: {
      ...inferTsAppDependencies(normalizedFiles),
      ...(dependencies && typeof dependencies === "object" ? dependencies : {}),
    },
    ...(devDependencies && typeof devDependencies === "object" && Object.keys(devDependencies).length > 0
      ? { devDependencies }
      : {}),
    ...(validResources.length > 0 ? { externalResources: validResources } : {}),
    files: normalizedFiles,
  };
  const buildMeta = makeTsAppBuildMeta({
    title,
    files: normalizedFiles,
    dependencies: spec.dependencies,
    entry: spec.entry,
    template: spec.template,
    fallbackUsed,
  });

  const artifact = {
    id: `ts_app_${Date.now()}`,
    title: typeof title === "string" && title.trim() ? title.trim() : "TypeScript App",
    type: "ts_app",
    language: "ts_app",
    code: JSON.stringify(spec, null, 2),
    revision: Date.now(),
    meta: {
      build: buildMeta,
    },
  };

  // Use addArtifact to both add to history AND set as current in one call
  if (typeof addArtifact === "function") {
    addArtifact(artifact);
  } else {
    if (typeof upsertArtifact === "function") upsertArtifact(artifact);
    if (typeof setCurrentArtifact === "function") setCurrentArtifact(artifact);
  }

  console.log("[create_ts_app] artifact created:", artifact.id);
  return {
    ok: true,
    artifactId: artifact.id,
    filesCreated: buildMeta.filesCreated,
    templateUsed: buildMeta.templateUsed,
    dependenciesAdded: buildMeta.dependenciesAdded,
    fallbackUsed: buildMeta.fallbackUsed,
    gameContract: buildMeta.gameContract,
    message: "App created successfully. The preview is now loading. Do NOT call create_ts_app or update_ts_app again unless the user explicitly asks for changes.",
  };
};

export const update_ts_app = async ({
  files,
  deleteFiles,
  dependencies,
  devDependencies,
  externalResources,
  entry,
  mode = "merge",
}: {
  files: Record<string, string>;
  deleteFiles?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  externalResources?: string[];
  entry?: string;
  mode?: "merge" | "replace";
}) => {
  console.log("[update_ts_app] called with files:", Object.keys(files || {}), "mode:", mode);
  const { currentArtifact, artifactHistory, upsertArtifact, setCurrentArtifact } =
    useArtifactStore.getState() as any;

  // Find the ts_app artifact: prefer currentArtifact, fallback to most recent in history
  let tsAppArtifact = currentArtifact?.type === "ts_app" ? currentArtifact : null;
  if (!tsAppArtifact) {
    const history = Array.isArray(artifactHistory) ? artifactHistory : [];
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i]?.type === "ts_app") {
        tsAppArtifact = history[i];
        break;
      }
    }
  }

  if (!tsAppArtifact) {
    console.warn("[update_ts_app] No ts_app found — auto-redirecting to create_ts_app");
    return create_ts_app({ files, dependencies, devDependencies, externalResources, entry });
  }

  const raw = typeof tsAppArtifact.code === "string" ? tsAppArtifact.code : "";
  const base = (() => {
    try {
      const parsed = raw && raw.trim() ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") return null;
      return parsed as any;
    } catch {
      return null;
    }
  })();
  const normalizedFiles = normalizeTsAppFiles(files);
  const preparedFiles =
    mode === "replace" && Object.keys(normalizedFiles).length > 0
      ? ensureRequiredTsAppFiles(normalizedFiles)
      : normalizedFiles;

  if (!hasTsAppChange({ files: preparedFiles, deleteFiles, dependencies, devDependencies, externalResources, entry })) {
    return { ok: true, message: "No changes detected — the app is already up to date." };
  }

  if (mode === "replace" && Object.keys(preparedFiles).length === 0) {
    return { ok: false, error: "update_ts_app (replace mode) requires a non-empty files object." };
  }

  const mergedDevDeps = (baseDevDeps?: Record<string, string>, incoming?: Record<string, string>) => {
    const merged = {
      ...(baseDevDeps && typeof baseDevDeps === "object" ? baseDevDeps : {}),
      ...(incoming && typeof incoming === "object" ? incoming : {}),
    };
    return Object.keys(merged).length > 0 ? merged : undefined;
  };

  const validResources = Array.isArray(externalResources)
    ? externalResources.filter((u) => typeof u === "string" && u.trim())
    : [];

  const mergeResources = (baseRes?: string[], incoming?: string[]) => {
    const set = new Set<string>([
      ...(Array.isArray(baseRes) ? baseRes : []),
      ...(Array.isArray(incoming) ? incoming : []),
    ]);
    return set.size > 0 ? [...set] : undefined;
  };

  const nextSpec: any =
    mode === "replace"
      ? {
          entry: typeof entry === "string" && entry.trim() ? entry.trim() : "/src/index.tsx",
          ...(base?.template ? { template: base.template } : {}),
          dependencies: {
            ...inferTsAppDependencies(preparedFiles),
            ...(dependencies && typeof dependencies === "object" ? dependencies : {}),
          },
          ...(devDependencies && typeof devDependencies === "object" && Object.keys(devDependencies).length > 0
            ? { devDependencies }
            : {}),
          ...(validResources.length > 0 ? { externalResources: validResources } : {}),
          files: preparedFiles,
        }
      : {
          entry:
            typeof entry === "string" && entry.trim()
              ? entry.trim()
              : typeof base?.entry === "string"
                ? base.entry
                : "/src/index.tsx",
          ...(base?.template ? { template: base.template } : {}),
          dependencies: {
            ...((base?.dependencies && typeof base.dependencies === "object") ? base.dependencies : {}),
            ...inferTsAppDependencies({ ...(base?.files || {}), ...preparedFiles }),
            ...((dependencies && typeof dependencies === "object") ? dependencies : {}),
          },
          ...(mergedDevDeps(base?.devDependencies, devDependencies)
            ? { devDependencies: mergedDevDeps(base?.devDependencies, devDependencies) }
            : {}),
          ...(mergeResources(base?.externalResources, validResources)
            ? { externalResources: mergeResources(base?.externalResources, validResources) }
            : {}),
          files: {
            ...((base?.files && typeof base.files === "object") ? base.files : {}),
            ...preparedFiles,
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
    ...tsAppArtifact,
    type: "ts_app",
    language: "ts_app",
    code: JSON.stringify(nextSpec, null, 2),
    revision: Date.now(),
    meta: {
      ...((tsAppArtifact as any)?.meta || {}),
      build: makeTsAppBuildMeta({
        title: (tsAppArtifact as any)?.title,
        files: nextSpec.files,
        dependencies: nextSpec.dependencies || {},
        entry: nextSpec.entry,
        template: nextSpec.template,
        fallbackUsed: false,
      }),
    },
  };

  if (typeof upsertArtifact === "function") upsertArtifact(nextArtifact);
  if (typeof setCurrentArtifact === "function") setCurrentArtifact(nextArtifact);

  console.log("[update_ts_app] updated artifact:", nextArtifact.id, "files:", Object.keys(nextSpec.files));
  return {
    ok: true,
    artifactId: nextArtifact.id,
    message: "App updated successfully. The preview is now refreshing. Do NOT call update_ts_app again unless the user explicitly asks for further changes.",
    updatedFiles: Object.keys(nextSpec.files),
    templateUsed: nextArtifact.meta.build.templateUsed,
    dependenciesAdded: nextArtifact.meta.build.dependenciesAdded,
    fallbackUsed: nextArtifact.meta.build.fallbackUsed,
    gameContract: nextArtifact.meta.build.gameContract,
  };
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
