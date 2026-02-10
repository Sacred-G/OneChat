"use client";
import React, { useState } from "react";
import useToolsStore from "@/stores/useToolsStore";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { Plus, Trash2, Edit2, Check, X, Server, Power, Terminal } from "lucide-react";

export default function McpMultiConfig() {
  const { mcpConfigs, commandMcpConfigs, addMcpConfig, updateMcpConfig, removeMcpConfig, toggleMcpConfig, toggleCommandMcpConfig, disableAllCommandMcpConfigs, enableAllCommandMcpConfigs } = useToolsStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newServer, setNewServer] = useState({
    server_label: "",
    server_url: "",
    allowed_tools: "",
    skip_approval: false,
    enabled: true,
  });

  const handleAddServer = () => {
    if (newServer.server_label.trim() && newServer.server_url.trim()) {
      addMcpConfig(newServer);
      setNewServer({
        server_label: "",
        server_url: "",
        allowed_tools: "",
        skip_approval: false,
        enabled: true,
      });
    }
  };

  const handleUpdateServer = (id: string, updates: Partial<typeof newServer>) => {
    updateMcpConfig(id, updates);
    setEditingId(null);
  };

  const handleDeleteServer = (id: string) => {
    removeMcpConfig(id);
  };

  const handleToggleServer = (id: string) => {
    toggleMcpConfig(id);
  };

  return (
    <div className="space-y-4">
      {/* Add new server form */}
      <div className={`rounded-lg border p-4 ${
        document.documentElement.classList.contains('dark')
          ? 'border-white/10 bg-white/[0.03]'
          : 'border-black/10 bg-black/[0.02]'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <Server size={16} />
          <span className="text-sm font-medium">Add MCP Server</span>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Server label (e.g., deepwiki)"
              value={newServer.server_label}
              onChange={(e) => setNewServer({ ...newServer, server_label: e.target.value })}
              className="text-sm"
            />
            <Input
              placeholder="Server URL (e.g., http://localhost:3000)"
              value={newServer.server_url}
              onChange={(e) => setNewServer({ ...newServer, server_url: e.target.value })}
              className="text-sm"
            />
          </div>
          <Input
            placeholder="Allowed tools (comma-separated, leave empty for all)"
            value={newServer.allowed_tools}
            onChange={(e) => setNewServer({ ...newServer, allowed_tools: e.target.value })}
            className="text-sm"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="skip_approval_new"
                checked={newServer.skip_approval}
                onCheckedChange={(checked) => setNewServer({ ...newServer, skip_approval: checked })}
              />
              <label htmlFor="skip_approval_new" className="text-sm">
                Skip approval
              </label>
            </div>
            <Button
              onClick={handleAddServer}
              disabled={!newServer.server_label.trim() || !newServer.server_url.trim()}
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus size={14} />
              Add Server
            </Button>
          </div>
        </div>
      </div>

      {/* Server list */}
      {mcpConfigs.length === 0 ? (
        <div className="text-center py-8 text-sm text-stone-500">
          No MCP servers configured. Add one above to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {mcpConfigs.map((config) => (
            <div
              key={config.id}
              className={`rounded-lg border p-4 ${
                document.documentElement.classList.contains('dark')
                  ? 'border-white/10 bg-white/[0.03]'
                  : 'border-black/10 bg-black/[0.02]'
              } ${!config.enabled ? 'opacity-50' : ''}`}
            >
              {editingId === config.id ? (
                // Edit mode
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      defaultValue={config.server_label}
                      placeholder="Server label"
                      id={`label_${config.id}`}
                      className="text-sm"
                    />
                    <Input
                      defaultValue={config.server_url}
                      placeholder="Server URL"
                      id={`url_${config.id}`}
                      className="text-sm"
                    />
                  </div>
                  <Input
                    defaultValue={config.allowed_tools}
                    placeholder="Allowed tools"
                    id={`tools_${config.id}`}
                    className="text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`skip_approval_${config.id}`}
                        defaultChecked={config.skip_approval}
                      />
                      <label htmlFor={`skip_approval_${config.id}`} className="text-sm">
                        Skip approval
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1"
                      >
                        <X size={14} />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const labelInput = document.getElementById(`label_${config.id}`) as HTMLInputElement;
                          const urlInput = document.getElementById(`url_${config.id}`) as HTMLInputElement;
                          const toolsInput = document.getElementById(`tools_${config.id}`) as HTMLInputElement;
                          const skipApprovalInput = document.getElementById(`skip_approval_${config.id}`) as HTMLInputElement;
                          
                          handleUpdateServer(config.id, {
                            server_label: labelInput?.value || config.server_label,
                            server_url: urlInput?.value || config.server_url,
                            allowed_tools: toolsInput?.value || config.allowed_tools,
                            skip_approval: skipApprovalInput?.checked ?? config.skip_approval,
                          });
                        }}
                        className="flex items-center gap-1"
                      >
                        <Check size={14} />
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // View mode
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Server size={16} />
                      <span className="font-medium text-sm">{config.server_label}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        config.enabled ? 'bg-green-500' : 'bg-stone-400'
                      }`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleServer(config.id)}
                        className="flex items-center gap-1"
                      >
                        <Power size={14} />
                        {config.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(config.id)}
                        className="flex items-center gap-1"
                      >
                        <Edit2 size={14} />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteServer(config.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="text-stone-600 dark:text-stone-400">
                      URL: {config.server_url}
                    </div>
                    {config.allowed_tools && (
                      <div className="text-stone-600 dark:text-stone-400">
                        Tools: {config.allowed_tools}
                      </div>
                    )}
                    <div className="text-stone-600 dark:text-stone-400">
                      Approval: {config.skip_approval ? 'Auto-approve' : 'Require approval'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Command-based MCP Servers (from mcp_config.json) */}
      {commandMcpConfigs && commandMcpConfigs.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal size={16} />
              <span className="text-sm font-medium">MCP Servers</span>
              <span className="text-xs text-stone-500">(from mcp-config.json)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={enableAllCommandMcpConfigs}
                className="text-xs h-7 px-2"
              >
                Enable All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={disableAllCommandMcpConfigs}
                className="text-xs h-7 px-2"
              >
                Disable All
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {commandMcpConfigs.map((config) => (
              <div
                key={config.id}
                className={`rounded-lg border p-4 ${
                  document.documentElement.classList.contains('dark')
                    ? 'border-white/10 bg-white/[0.03]'
                    : 'border-black/10 bg-black/[0.02]'
                } ${config.disabled ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal size={16} />
                    <span className="font-medium text-sm">{config.id}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      !config.disabled ? 'bg-green-500' : 'bg-stone-400'
                    }`} />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleCommandMcpConfig(config.id)}
                    className="flex items-center gap-1"
                  >
                    <Power size={14} />
                    {config.disabled ? 'Enable' : 'Disable'}
                  </Button>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-stone-600 dark:text-stone-400 font-mono text-xs">
                    {config.command} {config.args.join(' ')}
                  </div>
                  {config.disabledTools && config.disabledTools.length > 0 && (
                    <div className="text-stone-500 dark:text-stone-500 text-xs">
                      Disabled tools: {config.disabledTools.length}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Toggle individual servers on/off. Edit mcp-config.json to add or remove servers.
          </p>
        </div>
      )}
    </div>
  );
}
