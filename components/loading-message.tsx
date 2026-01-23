"use client";

import React from "react";
import useThemeStore from "@/stores/useThemeStore";
import { Loader2 } from "lucide-react";

const LoadingMessage: React.FC = () => {
  const { theme } = useThemeStore();

  return (
    <div className="text-sm">
      <div className="flex justify-start pt-2">
        <div
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 ${
            theme === "dark"
              ? "border-white/10 bg-white/[0.04] text-stone-200"
              : "border-black/10 bg-black/[0.02] text-stone-800"
          }`}
        >
          <Loader2 size={14} className="animate-spin" />
          <span className="text-sm">Thinking…</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingMessage;
