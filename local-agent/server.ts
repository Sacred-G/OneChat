import http from "node:http";
import { URL } from "node:url";
import path from "node:path";
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import { WebSocketServer, WebSocket } from "ws";
import type { RawData } from "ws";
import * as pty from "node-pty";

type Json = Record<string, any>;

const PORT = Number(process.env.LOCAL_AGENT_PORT || 4001);
const ROOT = process.env.LOCAL_AGENT_ROOT || "/Volumes/Development";
const TOKEN = process.env.LOCAL_AGENT_TOKEN || "";
const UNSAFE_MODE = process.env.LOCAL_AGENT_UNSAFE_MODE === "1";
const ENABLE_PTY = process.env.LOCAL_AGENT_ENABLE_PTY === "1";

if (UNSAFE_MODE && !TOKEN) {
  // eslint-disable-next-line no-console
  console.error("[local-agent] Refusing to start: LOCAL_AGENT_UNSAFE_MODE=1 requires LOCAL_AGENT_TOKEN to be set");
  process.exit(1);
}

if (ENABLE_PTY && !TOKEN) {
  // eslint-disable-next-line no-console
  console.error("[local-agent] Refusing to start: LOCAL_AGENT_ENABLE_PTY=1 requires LOCAL_AGENT_TOKEN to be set");
  process.exit(1);
}

const ALLOWED_COMMANDS = new Set(
  (process.env.LOCAL_AGENT_ALLOWED_COMMANDS || "/bin/ls,/bin/pwd,/bin/cat,/usr/bin/head,/usr/bin/tail,/usr/bin/grep,/usr/local/bin/rg,/usr/bin/git,/usr/local/bin/node,/usr/local/bin/npm,/usr/local/bin/pnpm,/usr/local/bin/yarn,/usr/local/bin/bun,/usr/bin/python3,/usr/bin/python,/usr/local/bin/pytest")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

function sendJson(res: http.ServerResponse, status: number, body: Json) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(payload);
}

function unauthorized(res: http.ServerResponse) {
  sendJson(res, 401, { ok: false, error: "Unauthorized" });
}

function badRequest(res: http.ServerResponse, message: string) {
  sendJson(res, 400, { ok: false, error: message });
}

function normalizeWithinRoot(userPath: string): string {
  if (UNSAFE_MODE) {
    const p = userPath && userPath.trim() ? userPath.trim() : "/";
    if (path.isAbsolute(p)) return path.resolve(p);
    return path.resolve(ROOT, p);
  }

  const rel = userPath && userPath !== "/" ? userPath : "";
  const resolved = path.resolve(ROOT, rel.replace(/^\/+/, ""));
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
    throw new Error("Path escapes workspace root");
  }
  return resolved;
}

async function readJsonBody(req: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return null;
  return JSON.parse(raw);
}

async function handleList(res: http.ServerResponse, url: URL) {
  const p = url.searchParams.get("path") || "";
  let full: string;
  try {
    full = normalizeWithinRoot(p);
  } catch (e) {
    return badRequest(res, e instanceof Error ? e.message : "Invalid path");
  }

  try {
    const entries = await fs.readdir(full, { withFileTypes: true });
    const out = entries
      .map((d) => ({
        name: d.name,
        type: d.isDirectory() ? "directory" : d.isFile() ? "file" : "other",
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    return sendJson(res, 200, { ok: true, root: ROOT, path: p || "/", entries: out });
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : "List failed" });
  }
}

async function handleRead(res: http.ServerResponse, url: URL) {
  const p = url.searchParams.get("path") || "";
  let full: string;
  try {
    full = normalizeWithinRoot(p);
  } catch (e) {
    return badRequest(res, e instanceof Error ? e.message : "Invalid path");
  }

  try {
    const stat = await fs.stat(full);
    if (!stat.isFile()) return badRequest(res, "Not a file");
    const content = await fs.readFile(full, "utf8");
    return sendJson(res, 200, { ok: true, path: p, content });
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : "Read failed" });
  }
}

async function handleWrite(req: http.IncomingMessage, res: http.ServerResponse) {
  const body = await readJsonBody(req).catch(() => null);
  const p = typeof body?.path === "string" ? body.path : "";
  const content = typeof body?.content === "string" ? body.content : null;
  if (!p) return badRequest(res, "Missing path");
  if (content === null) return badRequest(res, "Missing content");

  let full: string;
  try {
    full = normalizeWithinRoot(p);
  } catch (e) {
    return badRequest(res, e instanceof Error ? e.message : "Invalid path");
  }

  try {
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content, "utf8");
    return sendJson(res, 200, { ok: true, path: p });
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : "Write failed" });
  }
}

async function handleRun(req: http.IncomingMessage, res: http.ServerResponse) {
  const body = await readJsonBody(req).catch(() => null);
  const command = typeof body?.command === "string" ? body.command.trim() : "";
  const cwd = typeof body?.cwd === "string" ? body.cwd : "/";

  if (!command) return badRequest(res, "Missing command");

  let fullCwd: string;
  try {
    fullCwd = normalizeWithinRoot(cwd);
  } catch (e) {
    return badRequest(res, e instanceof Error ? e.message : "Invalid cwd");
  }

  const timeoutMs = Math.min(Math.max(Number(body?.timeoutMs) || 15000, 1000), 60000);
  const maxOutput = Math.min(Math.max(Number(body?.maxOutputBytes) || 200000, 1000), 2_000_000);

  try {
    if (!UNSAFE_MODE) {
      const [bin, ...args] = command.split(/\s+/);
      if (!bin || !ALLOWED_COMMANDS.has(bin)) {
        return badRequest(res, `Command not allowed: ${bin || ""}`);
      }

      const child = spawn(bin, args, {
        cwd: fullCwd,
        env: process.env,
        shell: false,
      });

      const bufs: Buffer[] = [];
      const push = (b: Buffer) => {
        if (bufs.reduce((acc, x) => acc + x.length, 0) >= maxOutput) return;
        bufs.push(b);
      };

      child.stdout.on("data", (d: Buffer) => push(d));
      child.stderr.on("data", (d: Buffer) => push(d));

      const exitCode: number = await new Promise((resolve) => {
        const t = setTimeout(() => {
          try {
            child.kill("SIGKILL");
          } catch {
            // ignore
          }
          resolve(124);
        }, timeoutMs);

        child.on("close", (code) => {
          clearTimeout(t);
          resolve(typeof code === "number" ? code : 0);
        });
      });

      const output = Buffer.concat(bufs).toString("utf8");
      return sendJson(res, 200, {
        ok: true,
        cwd,
        command,
        exitCode,
        output,
        truncated: Buffer.byteLength(output, "utf8") >= maxOutput,
        timeoutMs,
      });
    }

    const child = spawn(command, [], {
      cwd: fullCwd,
      env: process.env,
      shell: true,
    });

    const bufs: Buffer[] = [];
    const push = (b: Buffer) => {
      if (bufs.reduce((acc, x) => acc + x.length, 0) >= maxOutput) return;
      bufs.push(b);
    };

    child.stdout.on("data", (d: Buffer) => push(d));
    child.stderr.on("data", (d: Buffer) => push(d));

    const exitCode: number = await new Promise((resolve) => {
      const t = setTimeout(() => {
        try {
          child.kill("SIGKILL");
        } catch {
          // ignore
        }
        resolve(124);
      }, timeoutMs);

      child.on("close", (code) => {
        clearTimeout(t);
        resolve(typeof code === "number" ? code : 0);
      });
    });

    const output = Buffer.concat(bufs).toString("utf8");
    return sendJson(res, 200, {
      ok: true,
      cwd,
      command,
      exitCode,
      output,
      truncated: Buffer.byteLength(output, "utf8") >= maxOutput,
      timeoutMs,
    });
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : "Command failed" });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const method = (req.method || "GET").toUpperCase();
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (TOKEN) {
      const auth = String(req.headers.authorization || "");
      if (auth !== `Bearer ${TOKEN}`) return unauthorized(res);
    }

    if (method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, { ok: true, root: ROOT });
    }

    if (method === "GET" && url.pathname === "/fs/list") return handleList(res, url);
    if (method === "GET" && url.pathname === "/fs/read") return handleRead(res, url);
    if (method === "POST" && url.pathname === "/fs/write") return handleWrite(req, res);
    if (method === "POST" && url.pathname === "/cmd/run") return handleRun(req, res);

    return sendJson(res, 404, { ok: false, error: "Not found" });
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : "Server error" });
  }
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname !== "/pty") {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return;
    }

    if (!ENABLE_PTY || !TOKEN) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    const queryToken = String(url.searchParams.get("token") || "");
    const auth = String(req.headers.authorization || "");
    const ok = queryToken ? queryToken === TOKEN : auth === `Bearer ${TOKEN}`;
    if (!ok) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, url);
    });
  } catch {
    try {
      socket.destroy();
    } catch {
      // ignore
    }
  }
});

wss.on("connection", (ws: WebSocket, _req: http.IncomingMessage, url: URL) => {
  const cwd = url.searchParams.get("cwd") || "/";

  let fullCwd: string;
  try {
    fullCwd = normalizeWithinRoot(cwd);
  } catch {
    try {
      ws.close();
    } catch {
      // ignore
    }
    return;
  }

  const shell = process.env.LOCAL_AGENT_PTY_SHELL || process.env.SHELL || "/bin/zsh";
  const env = { ...process.env, TERM: "xterm-256color" } as Record<string, string>;

  const proc = pty.spawn(shell, [], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: fullCwd,
    env,
  });

  const send = (data: string) => {
    try {
      if (ws.readyState === ws.OPEN) ws.send(data);
    } catch {
      // ignore
    }
  };

  proc.onData((data: string) => send(data));
  proc.onExit(() => {
    try {
      ws.close();
    } catch {
      // ignore
    }
  });

  ws.on("message", (msg: RawData) => {
    const text = typeof msg === "string" ? msg : Buffer.isBuffer(msg) ? msg.toString("utf8") : "";
    if (!text) return;

    if (text.startsWith("{")) {
      try {
        const parsed = JSON.parse(text);
        if (parsed && parsed.type === "resize") {
          const cols = Number(parsed.cols);
          const rows = Number(parsed.rows);
          if (Number.isFinite(cols) && Number.isFinite(rows) && cols > 0 && rows > 0 && cols <= 400 && rows <= 200) {
            proc.resize(cols, rows);
            return;
          }
        }
      } catch {
        // fall through
      }
    }

    proc.write(text);
  });

  ws.on("close", () => {
    try {
      proc.kill();
    } catch {
      // ignore
    }
  });

  ws.on("error", () => {
    try {
      proc.kill();
    } catch {
      // ignore
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`[local-agent] listening on http://127.0.0.1:${PORT} (root=${ROOT})`);
});
