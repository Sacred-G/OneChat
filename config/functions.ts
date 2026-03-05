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

const getFallbackTsAppFiles = (): Record<string, string> => ({
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
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
`,
  "/src/styles.css": `:root {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-secondary: #64748b;
  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-border: #e2e8f0;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
  color-scheme: light;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  color: var(--color-text);
  background: var(--color-bg);
}

a { color: var(--color-primary); text-decoration: none; }
a:hover { text-decoration: underline; }
`,
  "/src/components/Button.tsx": `import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export default function Button({ variant = "primary", size = "md", style, children, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "none",
    borderRadius: "var(--radius-md)",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontFamily: "inherit",
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: 13 },
    md: { padding: "10px 20px", fontSize: 14 },
    lg: { padding: "14px 28px", fontSize: 16 },
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "var(--color-primary)", color: "#fff" },
    secondary: { background: "var(--color-secondary)", color: "#fff" },
    outline: { background: "transparent", color: "var(--color-primary)", border: "1.5px solid var(--color-primary)" },
    ghost: { background: "transparent", color: "var(--color-text)" },
    danger: { background: "var(--color-danger)", color: "#fff" },
  };

  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant], ...style }} {...props}>
      {children}
    </button>
  );
}
`,
  "/src/components/Card.tsx": `import React from "react";

interface CardProps {
  children: React.ReactNode;
  padding?: number | string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function Card({ children, padding = 24, style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding,
        boxShadow: "var(--shadow-sm)",
        transition: "box-shadow 0.15s ease",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
`,
  "/src/components/Container.tsx": `import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: React.CSSProperties;
}

export default function Container({ children, maxWidth = 1200, style }: ContainerProps) {
  return (
    <div style={{ maxWidth, margin: "0 auto", padding: "0 24px", width: "100%", ...style }}>
      {children}
    </div>
  );
}
`,
  "/src/components/Navbar.tsx": `import React from "react";
import Container from "./Container";

interface NavbarProps {
  brand?: string;
  links?: { label: string; href: string }[];
  style?: React.CSSProperties;
}

export default function Navbar({ brand = "App", links = [], style }: NavbarProps) {
  return (
    <nav style={{ borderBottom: "1px solid var(--color-border)", padding: "14px 0", background: "var(--color-bg)", ...style }}>
      <Container style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 18 }}>{brand}</strong>
        {links.length > 0 && (
          <div style={{ display: "flex", gap: 24 }}>
            {links.map((l) => (
              <a key={l.href} href={l.href} style={{ color: "var(--color-text-muted)", fontSize: 14, fontWeight: 500 }}>
                {l.label}
              </a>
            ))}
          </div>
        )}
      </Container>
    </nav>
  );
}
`,
  "/src/components/Hero.tsx": `import React from "react";
import Container from "./Container";
import Button from "./Button";

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  style?: React.CSSProperties;
}

export default function Hero({
  title = "Build Something Amazing",
  subtitle = "A modern React app with reusable components ready to customize.",
  ctaLabel = "Get Started",
  onCtaClick,
  style,
}: HeroProps) {
  return (
    <section style={{ padding: "80px 0", textAlign: "center", ...style }}>
      <Container maxWidth={800}>
        <h1 style={{ fontSize: 48, fontWeight: 800, margin: "0 0 16px", lineHeight: 1.1 }}>{title}</h1>
        <p style={{ fontSize: 18, color: "var(--color-text-muted)", margin: "0 0 32px", lineHeight: 1.6 }}>{subtitle}</p>
        <Button size="lg" onClick={onCtaClick}>{ctaLabel}</Button>
      </Container>
    </section>
  );
}
`,
  "/src/components/Footer.tsx": `import React from "react";
import Container from "./Container";

interface FooterProps {
  text?: string;
  style?: React.CSSProperties;
}

export default function Footer({ text, style }: FooterProps) {
  return (
    <footer style={{ borderTop: "1px solid var(--color-border)", padding: "24px 0", ...style }}>
      <Container style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
          {text || \`© \${new Date().getFullYear()} App. All rights reserved.\`}
        </p>
      </Container>
    </footer>
  );
}
`,
  "/src/components/Input.tsx": `import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{label}</label>}
      <input
        style={{
          padding: "10px 14px",
          border: \`1.5px solid \${error ? "var(--color-danger)" : "var(--color-border)"}\`,
          borderRadius: "var(--radius-md)",
          fontSize: 14,
          outline: "none",
          transition: "border-color 0.15s ease",
          fontFamily: "inherit",
          ...style,
        }}
        {...props}
      />
      {error && <span style={{ fontSize: 12, color: "var(--color-danger)" }}>{error}</span>}
    </div>
  );
}
`,
  "/src/components/Badge.tsx": `import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning";
  style?: React.CSSProperties;
}

export default function Badge({ children, variant = "default", style }: BadgeProps) {
  const colors: Record<string, { bg: string; color: string }> = {
    default: { bg: "var(--color-surface)", color: "var(--color-text-muted)" },
    success: { bg: "#dcfce7", color: "#166534" },
    danger: { bg: "#fee2e2", color: "#991b1b" },
    warning: { bg: "#fef3c7", color: "#92400e" },
  };
  const c = colors[variant] || colors.default;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "var(--radius-full)",
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
`,
  "/src/components/Modal.tsx": `import React from "react";
import Button from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-bg)",
          borderRadius: "var(--radius-lg)",
          padding: 32,
          maxWidth: 520,
          width: "100%",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {title && <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700 }}>{title}</h2>}
        <div>{children}</div>
        <div style={{ marginTop: 24, textAlign: "right" }}>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
`,
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
  const normalizedFiles =
    Object.keys(incomingFiles).length === 0
      ? getFallbackTsAppFiles()
      : { ...getFallbackTsAppFiles(), ...incomingFiles };

  console.log("[create_ts_app] normalized files:", Object.keys(normalizedFiles));

  const { upsertArtifact, setCurrentArtifact, addArtifact } =
    useArtifactStore.getState() as any;

  const validResources = Array.isArray(externalResources)
    ? externalResources.filter((u) => typeof u === "string" && u.trim())
    : [];

  const spec: any = {
    entry: typeof entry === "string" && entry.trim() ? entry.trim() : "/src/index.tsx",
    ...(typeof template === "string" && template.trim() ? { template: template.trim() } : {}),
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

  const artifact = {
    id: `ts_app_${Date.now()}`,
    title: typeof title === "string" && title.trim() ? title.trim() : "TypeScript App",
    type: "ts_app",
    language: "ts_app",
    code: JSON.stringify(spec, null, 2),
    revision: Date.now(),
  };

  // Use addArtifact to both add to history AND set as current in one call
  if (typeof addArtifact === "function") {
    addArtifact(artifact);
  } else {
    if (typeof upsertArtifact === "function") upsertArtifact(artifact);
    if (typeof setCurrentArtifact === "function") setCurrentArtifact(artifact);
  }

  console.log("[create_ts_app] artifact created:", artifact.id);
  return { ok: true, artifactId: artifact.id };
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

  if (!hasTsAppChange({ files: normalizedFiles, deleteFiles, dependencies, devDependencies, externalResources, entry })) {
    return { ok: true, message: "No changes detected — the app is already up to date." };
  }

  if (mode === "replace" && Object.keys(normalizedFiles).length === 0) {
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
            ...inferTsAppDependencies(normalizedFiles),
            ...(dependencies && typeof dependencies === "object" ? dependencies : {}),
          },
          ...(devDependencies && typeof devDependencies === "object" && Object.keys(devDependencies).length > 0
            ? { devDependencies }
            : {}),
          ...(validResources.length > 0 ? { externalResources: validResources } : {}),
          files: normalizedFiles,
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
            ...inferTsAppDependencies({ ...(base?.files || {}), ...normalizedFiles }),
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
            ...normalizedFiles,
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
  };

  if (typeof upsertArtifact === "function") upsertArtifact(nextArtifact);
  if (typeof setCurrentArtifact === "function") setCurrentArtifact(nextArtifact);

  console.log("[update_ts_app] updated artifact:", nextArtifact.id, "files:", Object.keys(nextSpec.files));
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
