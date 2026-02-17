"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { McpApprovalRequestItem } from "@/lib/assistant";
import useThemeStore from "@/stores/useThemeStore";
import { ChevronDown, ShieldAlert } from "lucide-react";

interface Props {
  item: McpApprovalRequestItem;
  onRespond: (approve: boolean, id: string) => void;
}

export default function McpApproval({ item, onRespond }: Props) {
  const [disabled, setDisabled] = useState(false);
  const { theme } = useThemeStore();

  const handle = (approve: boolean) => {
    setDisabled(true);
    onRespond(approve, item.id);
  };

  return (
    <div className="flex justify-start pt-2">
      <div className="w-full max-w-3xl">
        <details
          className={`group rounded-xl border ${
            theme === "dark" ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-black/[0.02]"
          }`}
          open
        >
          <summary
            className={`flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 ${
              theme === "dark" ? "text-stone-200" : "text-stone-800"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md ${
                  theme === "dark" ? "bg-white/10" : "bg-black/5"
                }`}
              >
                <ShieldAlert size={16} className={theme === "dark" ? "text-stone-200" : "text-stone-800"} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">Approval required</div>
                <div className={`text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
                  {item.server_label} · {item.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  theme === "dark" ? "bg-amber-500/20 text-amber-200" : "bg-amber-500/10 text-amber-700"
                }`}
              >
                Pending
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform group-open:rotate-180 ${
                  theme === "dark" ? "text-stone-400" : "text-stone-500"
                }`}
              />
            </div>
          </summary>

          <div className="px-4 pb-4">
            {item.arguments && (
              <div className="mb-3">
                <div className={`text-xs mb-1 ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>Request</div>
                <div
                  className={`rounded-lg border px-3 py-2 text-xs whitespace-pre-wrap ${
                    theme === "dark" ? "border-white/10 bg-black/20 text-stone-200" : "border-black/10 bg-white text-stone-800"
                  }`}
                >
                  {item.arguments}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" disabled={disabled} onClick={() => handle(true)}>
                Approve
              </Button>
              <Button
                size="sm"
                disabled={disabled}
                onClick={() => handle(false)}
                variant="secondary"
              >
                Decline
              </Button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
