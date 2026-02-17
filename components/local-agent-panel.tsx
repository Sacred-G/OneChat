"use client";

import React from "react";
import useThemeStore from "@/stores/useThemeStore";
import useToolsStore from "@/stores/useToolsStore";

type DirEntry = { name: string; type: "directory" | "file" | "other" };

export default function LocalAgentPanel() {
  const { theme } = useThemeStore();
  const {
    localAgentUrl,
    setLocalAgentUrl,
    localAgentCwd,
    setLocalAgentCwd,
  } = useToolsStore();

  const [status, setStatus] = React.useState<string>("");
  const [entries, setEntries] = React.useState<DirEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<string>("");
  const [fileContent, setFileContent] = React.useState<string>("");
  const [cmd, setCmd] = React.useState<string>("ls");
  const [cmdOutput, setCmdOutput] = React.useState<string>("");

  const inputClass = `h-9 w-full rounded-md border px-2 text-sm outline-none ${
    theme === "dark"
      ? "bg-transparent border-white/10 text-white"
      : "bg-white border-black/10 text-gray-900"
  }`;

  const textareaClass = `w-full rounded-md border px-3 py-2 text-sm outline-none min-h-[96px] font-mono ${
    theme === "dark"
      ? "bg-transparent border-white/10 text-white"
      : "bg-white border-black/10 text-gray-900"
  }`;

  const buttonClass = `inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm disabled:opacity-50 ${
    theme === "dark"
      ? "border-white/10 bg-transparent text-white hover:bg-white/10"
      : "border-stone-300 bg-white text-stone-900 hover:bg-stone-50"
  }`;

  const fetchHealth = React.useCallback(async () => {
    try {
      const res = await fetch("/api/local_agent/health", {
        headers: { "x-local-agent-url": localAgentUrl },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus(typeof data?.error === "string" ? data.error : `Health failed (${res.status})`);
        return;
      }
      setStatus(`Connected (root: ${data?.root || "?"})`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Health failed");
    }
  }, [localAgentUrl]);

  const listDir = React.useCallback(
    async (path: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/local_agent/fs/list?path=${encodeURIComponent(path)}`, {
          headers: { "x-local-agent-url": localAgentUrl },
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setStatus(typeof data?.error === "string" ? data.error : `List failed (${res.status})`);
          return;
        }
        setEntries(Array.isArray(data?.entries) ? (data.entries as DirEntry[]) : []);
        setStatus("OK");
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "List failed");
      } finally {
        setIsLoading(false);
      }
    },
    [localAgentUrl]
  );

  const openFile = React.useCallback(async (p: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/local_agent/fs/read?path=${encodeURIComponent(p)}`, {
        headers: { "x-local-agent-url": localAgentUrl },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus(typeof data?.error === "string" ? data.error : `Read failed (${res.status})`);
        return;
      }
      setSelectedFile(p);
      setFileContent(typeof data?.content === "string" ? data.content : "");
      setStatus("OK");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Read failed");
    } finally {
      setIsLoading(false);
    }
  }, [localAgentUrl]);

  const saveFile = React.useCallback(async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/local_agent/fs/write", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-local-agent-url": localAgentUrl },
        body: JSON.stringify({ path: selectedFile, content: fileContent }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus(typeof data?.error === "string" ? data.error : `Write failed (${res.status})`);
        return;
      }
      setStatus("Saved");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Write failed");
    } finally {
      setIsLoading(false);
    }
  }, [fileContent, selectedFile, localAgentUrl]);

  const runCmd = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/local_agent/cmd/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-local-agent-url": localAgentUrl },
        body: JSON.stringify({ command: cmd, cwd: localAgentCwd }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setCmdOutput(typeof data?.error === "string" ? data.error : `Command failed (${res.status})`);
        return;
      }
      const out = typeof data?.output === "string" ? data.output : "";
      setCmdOutput(out);
    } catch (e) {
      setCmdOutput(e instanceof Error ? e.message : "Command failed");
    } finally {
      setIsLoading(false);
    }
  }, [cmd, localAgentCwd, localAgentUrl]);

  React.useEffect(() => {
    fetchHealth();
    listDir(localAgentCwd);
  }, [fetchHealth, listDir, localAgentCwd]);

  const goUp = () => {
    const p = (localAgentCwd || "/").replace(/\/+$/, "") || "/";
    if (p === "/") return;
    const parts = p.split("/").filter(Boolean);
    parts.pop();
    setLocalAgentCwd("/" + parts.join("/"));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className={`text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
          Agent URL (dev only)
        </div>
        <input className={inputClass} value={localAgentUrl} onChange={(e) => setLocalAgentUrl(e.target.value)} />
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className={buttonClass} onClick={fetchHealth} disabled={isLoading}>
          Test
        </button>
        <div className={`text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>{status}</div>
      </div>

      <div className="space-y-2">
        <div className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-stone-900"}`}>
          Files
        </div>
        <div className="flex items-center gap-2">
          <input className={inputClass} value={localAgentCwd} onChange={(e) => setLocalAgentCwd(e.target.value)} />
          <button type="button" className={buttonClass} onClick={() => listDir(localAgentCwd)} disabled={isLoading}>
            Refresh
          </button>
          <button type="button" className={buttonClass} onClick={goUp} disabled={isLoading}>
            Up
          </button>
        </div>

        <div
          className={`rounded-md border p-2 max-h-64 overflow-auto text-sm ${
            theme === "dark" ? "border-white/10" : "border-black/10"
          }`}
        >
          {entries.length === 0 ? (
            <div className={`${theme === "dark" ? "text-stone-400" : "text-stone-500"} text-xs`}>No entries</div>
          ) : (
            <div className="space-y-1">
              {entries.map((e) => (
                <button
                  key={e.name}
                  type="button"
                  className={`block w-full text-left rounded px-2 py-1 ${
                    theme === "dark" ? "hover:bg-white/10" : "hover:bg-stone-100"
                  }`}
                  onClick={() => {
                    const base = (localAgentCwd || "/").replace(/\/+$/, "") || "/";
                    const next = base === "/" ? `/${e.name}` : `${base}/${e.name}`;
                    if (e.type === "directory") {
                      setSelectedFile("");
                      setFileContent("");
                      setLocalAgentCwd(next);
                    } else if (e.type === "file") {
                      openFile(next);
                    }
                  }}
                  disabled={isLoading}
                >
                  <span className="font-mono text-xs">
                    {e.type === "directory" ? "[D]" : e.type === "file" ? "[F]" : "[?]"}
                  </span>{" "}
                  {e.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-stone-900"}`}>
          Editor
        </div>
        <div className={`text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
          {selectedFile || "(select a file)"}
        </div>
        <textarea className={textareaClass} value={fileContent} onChange={(e) => setFileContent(e.target.value)} />
        <button type="button" className={buttonClass} onClick={saveFile} disabled={isLoading || !selectedFile}>
          Save
        </button>
      </div>

      <div className="space-y-2">
        <div className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-stone-900"}`}>
          Command
        </div>
        <input className={inputClass} value={cmd} onChange={(e) => setCmd(e.target.value)} />
        <button type="button" className={buttonClass} onClick={runCmd} disabled={isLoading}>
          Run
        </button>
        <textarea className={textareaClass} value={cmdOutput} onChange={(e) => setCmdOutput(e.target.value)} />
      </div>
    </div>
  );
}
