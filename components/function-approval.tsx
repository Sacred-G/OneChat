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
    <div className="flex justify-start pt-2">
      <div className="w-full max-w-3xl">
        <div
          className={`rounded-xl border ${
            theme === "dark"
              ? "border-white/10 bg-white/[0.04]"
              : "border-black/10 bg-black/[0.02]"
          }`}
        >
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 ${
              theme === "dark" ? "text-stone-200" : "text-stone-800"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md ${
                  theme === "dark" ? "bg-white/10" : "bg-black/5"
                }`}
              >
                <ShieldAlert
                  size={16}
                  className={theme === "dark" ? "text-stone-200" : "text-stone-800"}
                />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {`Approval required`}
                </div>
                <div
                  className={`text-xs ${
                    theme === "dark" ? "text-stone-400" : "text-stone-500"
                  }`}
                >
                  {`Tool: ${item.name}`}
                </div>
              </div>
            </div>

            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                theme === "dark"
                  ? "bg-amber-500/20 text-amber-200"
                  : "bg-amber-500/10 text-amber-700"
              }`}
            >
              Pending
            </span>
          </div>

          <div className="px-4 pb-4">
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
                  className={`rounded-lg border ${
                    theme === "dark"
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-black/10 bg-black/[0.02]"
                  }`}
                >
                  <SyntaxHighlighter
                    customStyle={{
                      backgroundColor: "transparent",
                      padding: "12px",
                      margin: 0,
                      fontSize: "12px",
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
                disabled={disabled}
                variant="secondary"
                onClick={() => handle("deny")}
              >
                Deny
              </Button>
              <Button
                size="sm"
                disabled={disabled}
                variant="secondary"
                onClick={() => handle("always_allow")}
              >
                Always allow
              </Button>
              <Button
                size="sm"
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
