import "server-only";

export const dynamic = "force-dynamic";

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type StreamlitProcInfo = {
  url: string;
  port: number;
  pid: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __onechat_streamlit__: StreamlitProcInfo | null | undefined;
}

async function isPortOpen(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET" });
    return res.ok || res.status === 403 || res.status === 404;
  } catch {
    return false;
  }
}

async function waitForUp(url: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen(url)) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

async function waitForDown(url: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!(await isPortOpen(url))) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return json(404, { ok: false, error: "streamlit deploy disabled in production" });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  if (!code.trim()) {
    return json(400, { ok: false, error: "Missing code" });
  }

  try {
    const { resolve } = await import("node:path");
    const { promises: fs } = await import("node:fs");

    const targetPath = resolve(process.cwd(), "streamlit-app", "app.py");
    await fs.mkdir(resolve(process.cwd(), "streamlit-app"), { recursive: true });
    await fs.writeFile(targetPath, code, "utf8");
  } catch (e) {
    return json(500, { ok: false, error: e instanceof Error ? e.message : "Failed to write app.py" });
  }

  // Ensure Streamlit is running (reuse same semantics as /launch)
  const port = 8501;
  const baseUrl = `http://127.0.0.1:${port}`;

  // Force restart on deploy to ensure the new app.py is picked up reliably.
  if (globalThis.__onechat_streamlit__?.pid && globalThis.__onechat_streamlit__.pid > 0) {
    try {
      process.kill(globalThis.__onechat_streamlit__.pid, "SIGTERM");
    } catch {
      // ignore
    }
    await waitForDown(baseUrl, 2500).catch(() => false);
    try {
      // If still up, force kill
      if (await isPortOpen(baseUrl)) {
        process.kill(globalThis.__onechat_streamlit__.pid, "SIGKILL");
      }
    } catch {
      // ignore
    }
    await waitForDown(baseUrl, 2500).catch(() => false);
    globalThis.__onechat_streamlit__ = null;
  }

  // If something else is using the port, fail fast.
  if (await isPortOpen(baseUrl)) {
    return json(409, {
      ok: false,
      error: `Port ${port} is already in use. Stop the existing Streamlit process or choose another port.`,
    });
  }

  try {
    const { spawn } = await import("node:child_process");
    const { resolve } = await import("node:path");

    const appPath = resolve(process.cwd(), "streamlit-app", "app.py");

    const child = spawn(
      "python3",
      [
        "-m",
        "streamlit",
        "run",
        appPath,
        "--server.port",
        String(port),
        "--server.address",
        "127.0.0.1",
        "--server.headless",
        "true",
        "--server.runOnSave",
        "true",
        "--server.enableCORS",
        "false",
        "--server.enableXsrfProtection",
        "false",
      ],
      {
        cwd: process.cwd(),
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env,
      }
    );

    let stderr = "";
    child.stderr?.on("data", (d) => {
      if (stderr.length > 4000) return;
      stderr += String(d);
    });

    const up = await waitForUp(baseUrl, 6000);
    if (!up) {
      try {
        child.kill("SIGKILL");
      } catch {
        // ignore
      }
      return json(500, {
        ok: false,
        error:
          "Failed to start Streamlit. Ensure Python has streamlit installed (pip install -r streamlit-app/requirements.txt)." +
          (stderr.trim() ? `\n\n${stderr.trim()}` : ""),
      });
    }

    child.unref();
    globalThis.__onechat_streamlit__ = { url: baseUrl, port, pid: child.pid ?? -1 };

    return json(200, { ok: true, url: baseUrl, reused: false, pid: child.pid ?? -1 });
  } catch (e) {
    return json(500, { ok: false, error: e instanceof Error ? e.message : "Failed to start streamlit" });
  }
}
