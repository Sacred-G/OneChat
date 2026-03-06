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
    <div className="flex justify-start pt-1.5">
      <div className="w-full max-w-3xl">
        <details
          className={`group rounded-2xl border shadow-sm ${
            theme === "dark"
              ? "border-white/10 bg-[#1a1a1a]/80 hover:border-white/20"
              : "border-black/10 bg-white hover:border-black/20"
          }`}
          open
        >
          <summary
            className={`flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 ${
              theme === "dark" ? "text-stone-200" : "text-stone-800"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  theme === "dark" ? "bg-white/10" : "bg-black/5"
                }`}
              >
                <ShieldAlert size={14} className={theme === "dark" ? "text-stone-200" : "text-stone-800"} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">Approval required</div>
                <div className={`truncate font-mono text-[11px] ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
                  {item.server_label}:{item.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  theme === "dark"
                    ? "border-amber-500/30 bg-amber-500/20 text-amber-200"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                }`}
              >
                Pending
              </span>
              <ChevronDown
                size={15}
                className={`rounded-md p-0.5 transition-transform group-open:rotate-180 ${
                  theme === "dark" ? "bg-white/5 text-stone-400" : "bg-black/5 text-stone-500"
                }`}
              />
            </div>
          </summary>

          <div className="px-3.5 pb-3.5">
            {item.arguments && (
              <div className="mb-3">
                <div className={`text-xs mb-1 ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>Request</div>
                <div
                  className={`rounded-xl border px-3 py-2 text-xs whitespace-pre-wrap shadow-inner ${
                    theme === "dark"
                      ? "border-white/10 bg-black/35 text-stone-200 shadow-black/20"
                      : "border-black/10 bg-white text-stone-800 shadow-black/5"
                  }`}
                >
                  {item.arguments}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-7 px-2.5 text-[11px]" disabled={disabled} onClick={() => handle(true)}>
                Approve
              </Button>
              <Button
                size="sm"
                className="h-7 px-2.5 text-[11px]"
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
