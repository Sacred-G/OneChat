"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Terminal } from "xterm";

import useThemeStore from "@/stores/useThemeStore";

export default function TerminalPanel({ onClose }: { onClose: () => void }) {
  const { theme } = useThemeStore();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const aliveRef = useRef(true);

  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">(
    "disconnected"
  );

  const wsUrl = useMemo(() => {
    const port = Number(process.env.NEXT_PUBLIC_LOCAL_AGENT_PORT || 4001);
    const token = process.env.NEXT_PUBLIC_LOCAL_AGENT_TOKEN || "";
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : "";
    const cwd = process.env.NEXT_PUBLIC_LOCAL_AGENT_CWD || "/";
    return `ws://127.0.0.1:${port}/pty?cwd=${encodeURIComponent(cwd)}${tokenParam}`;
  }, []);

  const connect = () => {
    const term = termRef.current;
    if (!term) return;

    try {
      wsRef.current?.close();
    } catch {
      // ignore
    }

    setStatus("connecting");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.addEventListener("open", () => {
      if (!aliveRef.current) return;
      setStatus("connected");
      try {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      } catch {
        // ignore
      }
    });

    ws.addEventListener("message", (evt) => {
      if (!aliveRef.current) return;
      if (typeof evt.data === "string") {
        term.write(evt.data);
      }
    });

    ws.addEventListener("close", () => {
      if (!aliveRef.current) return;
      setStatus("disconnected");
    });

    ws.addEventListener("error", () => {
      if (!aliveRef.current) return;
      setStatus("error");
    });
  };

  useEffect(() => {
    aliveRef.current = true;
    const el = containerRef.current;
    if (!el) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      theme:
        theme === "dark"
          ? { background: "#0b0b0c", foreground: "#e5e7eb", cursor: "#e5e7eb" }
          : { background: "#ffffff", foreground: "#111827", cursor: "#111827" },
    });

    term.open(el);
    // Fixed initial size; avoids FitAddon renderer timing issues.
    try {
      term.resize(120, 30);
    } catch {
      // ignore
    }

    termRef.current = term;

    const onDataDispose = term.onData((data: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(data);
    });

    connect();

    return () => {
      aliveRef.current = false;
      try {
        onDataDispose.dispose();
      } catch {
        // ignore
      }
      try {
        wsRef.current?.close();
      } catch {
        // ignore
      }
      try {
        term.dispose();
      } catch {
        // ignore
      }

      wsRef.current = null;
      termRef.current = null;
    };
  }, [theme]);

  const panelClass = theme === "dark" ? "border-white/10 bg-[#141414]" : "border-stone-200 bg-white";
  const textMain = theme === "dark" ? "text-stone-100" : "text-stone-900";
  const textDim = theme === "dark" ? "text-stone-400" : "text-stone-600";

  return (
    <div className={`w-full h-full overflow-hidden ${panelClass}`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${theme === "dark" ? "border-white/10" : "border-black/10"}`}>
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${textMain}`}>Terminal</div>
          <div className={`text-xs ${textDim}`}>{status === "connected" ? "Connected" : status === "connecting" ? "Connecting…" : status === "error" ? "Error connecting" : "Disconnected"}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={connect}
            className={`h-8 px-3 rounded-md border text-xs font-semibold ${
              theme === "dark"
                ? "border-white/10 text-stone-200 hover:bg-white/10"
                : "border-black/10 text-stone-700 hover:bg-black/5"
            }`}
            title="Reconnect"
          >
            Reconnect
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded transition-colors ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-stone-100"}`}
            title="Close"
          >
            <X size={20} className={theme === "dark" ? "text-stone-300" : "text-stone-700"} />
          </button>
        </div>
      </div>
      <div className="h-[calc(100%-52px)]">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
