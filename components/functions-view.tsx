"use client";

import { toolsList } from "@/config/tools-list";
import { Code } from "lucide-react";
import React from "react";
import { Switch } from "./ui/switch";
import useToolsStore from "@/stores/useToolsStore";
import useThemeStore from "@/stores/useThemeStore";

type ToolParameter = {
  type: string;
  description?: string;
  enum?: string[];
  properties?: { [key: string]: string | unknown };
};

const getToolArgs = (parameters: {
  [key: string]: ToolParameter | undefined;
}) => {
  return (
    <div className="ml-4">
      {Object.entries(parameters).map(([key, value]) => (
        <div key={key} className="flex items-center text-xs space-x-2 my-1">
          <span className="text-blue-500">{key}:</span>
          <span className="text-zinc-400">{value?.type}</span>
        </div>
      ))}
    </div>
  );
};

export default function FunctionsView() {
  const { disabledFunctions, toggleFunction, enableAllFunctions, disableAllFunctions } = useToolsStore();
  const { theme } = useThemeStore();
  const disabled = Array.isArray(disabledFunctions) ? disabledFunctions : [];
  const enabledCount = toolsList.length - disabled.filter((n) => toolsList.some((t) => t.name === n)).length;

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <span className={`text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
          {enabledCount}/{toolsList.length} enabled
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={enableAllFunctions}
            className={`text-xs px-2 py-0.5 rounded border ${
              theme === "dark"
                ? "border-white/10 text-stone-300 hover:bg-white/10"
                : "border-stone-300 text-stone-600 hover:bg-stone-50"
            }`}
          >
            All on
          </button>
          <button
            type="button"
            onClick={disableAllFunctions}
            className={`text-xs px-2 py-0.5 rounded border ${
              theme === "dark"
                ? "border-white/10 text-stone-300 hover:bg-white/10"
                : "border-stone-300 text-stone-600 hover:bg-stone-50"
            }`}
          >
            All off
          </button>
        </div>
      </div>
      {toolsList.map((tool) => {
        const isEnabled = !disabled.includes(tool.name);
        return (
          <div key={tool.name} className={`flex items-start gap-2 transition-opacity ${isEnabled ? "opacity-100" : "opacity-50"}`}>
            <div className="flex-shrink-0 mt-0.5">
              <Switch
                checked={isEnabled}
                onCheckedChange={() => toggleFunction(tool.name)}
              />
            </div>
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <div className="bg-blue-100 text-blue-500 rounded-md p-1 flex-shrink-0">
                <Code size={16} />
              </div>
              <div className={`font-mono text-sm mt-0.5 ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                {tool.name}(
                {tool.parameters && Object.keys(tool.parameters).length > 0
                  ? getToolArgs(tool.parameters)
                  : ""}
                )
                <div className={`text-xs font-sans mt-0.5 ${theme === "dark" ? "text-stone-400" : "text-stone-500"}`}>
                  {tool.description}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
