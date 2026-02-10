"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import useAgentStore, { CustomAgent } from "@/stores/useAgentStore";
import useThemeStore from "@/stores/useThemeStore";
import AgentCreator from "./agent-creator";
import { Plus, Pencil, Trash2, Bot, Database } from "lucide-react";

const AGENT_ICONS: Record<string, string> = {
  bot: "🤖", brain: "🧠", rocket: "🚀", star: "⭐", fire: "🔥",
  lightning: "⚡", code: "💻", pen: "✍️", palette: "🎨", chart: "📊",
  shield: "🛡️", book: "📚", microscope: "🔬", megaphone: "📣",
  heart: "❤️", globe: "🌍",
};

const AgentSelector: React.FC = () => {
  const { theme } = useThemeStore();
  const { agents, selectedAgentId, setSelectedAgentId, deleteAgent } = useAgentStore();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CustomAgent | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isDark = theme === "dark";
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;

  const handleSelect = (agentId: string | null) => {
    setSelectedAgentId(agentId);
    setPopoverOpen(false);
  };

  const handleEdit = (e: React.MouseEvent, agent: CustomAgent) => {
    e.stopPropagation();
    setEditingAgent(agent);
    setCreatorOpen(true);
    setPopoverOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    if (confirmDeleteId === agentId) {
      deleteAgent(agentId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(agentId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleCreateNew = () => {
    setEditingAgent(null);
    setCreatorOpen(true);
    setPopoverOpen(false);
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`h-9 inline-flex items-center gap-1.5 rounded-md border px-2 text-xs outline-none transition-colors sm:text-sm ${
              selectedAgent
                ? "text-white border-transparent"
                : isDark
                  ? "bg-transparent border-white/10 text-white hover:bg-white/10"
                  : "bg-white border-black/10 text-gray-900 hover:bg-gray-50"
            }`}
            style={
              selectedAgent
                ? { backgroundColor: selectedAgent.color }
                : {}
            }
            title={selectedAgent ? selectedAgent.name : "Select Agent"}
          >
            {selectedAgent ? (
              <>
                <span className="text-sm">{AGENT_ICONS[selectedAgent.icon] ?? "🤖"}</span>
                <span className="hidden sm:inline max-w-[80px] truncate">{selectedAgent.name}</span>
              </>
            ) : (
              <>
                <Bot size={16} />
                <span className="hidden sm:inline">Agent</span>
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={`w-[280px] p-0 ${
            isDark
              ? "bg-[#1b1b1b] border-white/10 text-white"
              : "bg-white border-black/10 text-gray-900"
          }`}
        >
          <div className="p-2">
            <div className={`text-xs font-medium px-2 py-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Agents
            </div>

            {/* Default (no agent) */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors ${
                !selectedAgentId
                  ? isDark ? "bg-white/10" : "bg-gray-100"
                  : isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
                isDark ? "bg-white/10" : "bg-gray-100"
              }`}>
                🤖
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium text-sm">Default</div>
                <div className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Standard assistant
                </div>
              </div>
              {!selectedAgentId && (
                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              )}
            </button>

            {/* Custom agents */}
            {agents.map((agent) => (
              <div
                key={agent.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(agent.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(agent.id); } }}
                className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors group cursor-pointer ${
                  selectedAgentId === agent.id
                    ? isDark ? "bg-white/10" : "bg-gray-100"
                    : isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: agent.color + "20" }}
                >
                  {AGENT_ICONS[agent.icon] ?? "🤖"}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm truncate">{agent.name}</span>
                    {agent.preferredProvider && agent.preferredProvider !== "none" && (
                      <span className={`text-[10px] px-1 py-0.5 rounded font-medium shrink-0 ${
                        isDark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500"
                      }`}>
                        {agent.preferredProvider === "openai" ? "OpenAI" : "APIPie"}
                      </span>
                    )}
                    {agent.vectorStoreId && (
                      <span className={`shrink-0 ${isDark ? "text-blue-400" : "text-blue-500"}`} title={agent.vectorStoreName || "Knowledge Base"}>
                        <Database size={11} />
                      </span>
                    )}
                  </div>
                  {agent.description && (
                    <div className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {agent.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleEdit(e, agent)}
                    className={`p-1 rounded transition-colors ${
                      isDark ? "hover:bg-white/10" : "hover:bg-gray-200"
                    }`}
                    title="Edit"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, agent.id)}
                    className={`p-1 rounded transition-colors ${
                      confirmDeleteId === agent.id
                        ? "text-red-500 bg-red-500/10"
                        : isDark ? "hover:bg-white/10" : "hover:bg-gray-200"
                    }`}
                    title={confirmDeleteId === agent.id ? "Click again to confirm" : "Delete"}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {selectedAgentId === agent.id && (
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: agent.color }} />
                )}
              </div>
            ))}
          </div>

          {/* Create new agent button */}
          <div className={`border-t p-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
            <button
              type="button"
              onClick={handleCreateNew}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                isDark ? "hover:bg-white/5 text-gray-300" : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              <Plus size={16} />
              <span>Create new agent</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <AgentCreator
        open={creatorOpen}
        onOpenChange={setCreatorOpen}
        editingAgent={editingAgent}
      />
    </>
  );
};

export default AgentSelector;
