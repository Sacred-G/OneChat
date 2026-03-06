"use client";
import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy, vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ShieldAlert } from "lucide-react";

import { Button } from "./ui/button";
import useThemeStore from "@/stores/useThemeStore";
import { FunctionApprovalAction, FunctionApprovalRequestItem } from "@/lib/assistant";

interface Props {
  item: FunctionApprovalRequestItem;
  onRespond: (action: FunctionApprovalAction, id: string) => void;
}

export default function FunctionApproval({ item, onRespond }: Props) {
  const [disabled, setDisabled] = useState(false);
  const { theme } = useThemeStore();
  const syntaxStyle = theme === "dark" ? vscDarkPlus : coy;

  const handle = (action: FunctionApprovalAction) => {
    setDisabled(true);
    onRespond(action, item.id);
  };

  return (
    <div className="flex justify-start pt-1.5">
      <div className="w-full max-w-3xl">
        <div
          className={`rounded-2xl border shadow-sm ${
            theme === "dark"
              ? "border-white/10 bg-[#1a1a1a]/80 hover:border-white/20"
              : "border-black/10 bg-white hover:border-black/20"
          }`}
        >
          <div
            className={`flex items-center justify-between gap-3 px-3.5 py-2.5 ${
              theme === "dark" ? "text-stone-200" : "text-stone-800"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  theme === "dark" ? "bg-white/10" : "bg-black/5"
                }`}
              >
                <ShieldAlert
                  size={14}
                  className={theme === "dark" ? "text-stone-200" : "text-stone-800"}
                />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {`Approval required`}
                </div>
                <div
                  className={`truncate font-mono text-[11px] ${
                    theme === "dark" ? "text-stone-400" : "text-stone-500"
                  }`}
                >
                  {`tool:${item.name}`}
                </div>
              </div>
            </div>

            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                theme === "dark"
                  ? "border-amber-500/30 bg-amber-500/20 text-amber-200"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700"
              }`}
            >
              Pending
            </span>
          </div>

          <div className="px-3.5 pb-3.5">
            {item.arguments && (
              <div className="mb-3">
                <div
                  className={`text-xs mb-1 ${
                    theme === "dark" ? "text-stone-400" : "text-stone-500"
                  }`}
                >
                  Request
                </div>
                <div
                  className={`rounded-xl border shadow-inner ${
                    theme === "dark"
                      ? "border-white/10 bg-black/35 shadow-black/20"
                      : "border-black/10 bg-white shadow-black/5"
                  }`}
                >
                  <SyntaxHighlighter
                    customStyle={{
                      backgroundColor: "transparent",
                      padding: "10px 12px",
                      margin: 0,
                      fontSize: "12px",
                      lineHeight: "1.45",
                    }}
                    language="json"
                    style={syntaxStyle}
                  >
                    {item.arguments}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                size="sm"
                className="h-7 px-2.5 text-[11px]"
                disabled={disabled}
                variant="secondary"
                onClick={() => handle("deny")}
              >
                Deny
              </Button>
              <Button
                size="sm"
                className="h-7 px-2.5 text-[11px]"
                disabled={disabled}
                variant="secondary"
                onClick={() => handle("always_allow")}
              >
                Always allow
              </Button>
              <Button
                size="sm"
                className="h-7 px-2.5 text-[11px]"
                disabled={disabled}
                onClick={() => handle("allow_once")}
              >
                Allow once
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
