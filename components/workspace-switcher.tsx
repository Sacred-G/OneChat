"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import useWorkspaceStore, { Workspace } from "@/stores/useWorkspaceStore";
import useThemeStore from "@/stores/useThemeStore";

const WORKSPACE_ICONS = ["💼", "🚀", "🎨", "📊", "🔬", "📝", "🏠", "⚡", "🌐", "🎯", "💡", "🛠️"];
const WORKSPACE_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6b7280", "#1e293b",
];

interface WorkspaceSwitcherProps {
  onSwitch: (workspaceId: string | null) => void;
}

export default function WorkspaceSwitcher({ onSwitch }: WorkspaceSwitcherProps) {
  const { activeWorkspaceId, workspaces, setActiveWorkspaceId, setWorkspaces } = useWorkspaceStore();
  const { theme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("💼");
  const [newColor, setNewColor] = useState("#6366f1");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  const closeMenu = () => {
    setIsOpen(false);
    setIsCreating(false);
    setEditingId(null);
    setShowIconPicker(false);
    setShowColorPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if ((isCreating || editingId) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating, editingId]);

  const loadWorkspaces = async () => {
    try {
      const res = await fetch("/api/workspaces?list=1");
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      const list = Array.isArray(data?.workspaces) ? data.workspaces : [];
      setWorkspaces(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), icon: newIcon, color: newColor }),
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      const id = data?.id;
      if (id) {
        await loadWorkspaces();
        setActiveWorkspaceId(id);
        onSwitch(id);
      }
    } catch {
      // ignore
    }
    setNewName("");
    setNewIcon("💼");
    setNewColor("#6366f1");
    setIsCreating(false);
    setShowIconPicker(false);
    setShowColorPicker(false);
  };

  const handleRename = async (ws: Workspace) => {
    if (!newName.trim()) return;
    try {
      await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ws.id, name: newName.trim(), icon: newIcon, color: newColor }),
      });
      await loadWorkspaces();
    } catch {
      // ignore
    }
    setEditingId(null);
    setNewName("");
    setShowIconPicker(false);
    setShowColorPicker(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this workspace and all its conversations?")) return;
    try {
      await fetch(`/api/workspaces?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadWorkspaces();
      if (activeWorkspaceId === id) {
        setActiveWorkspaceId(null);
        onSwitch(null);
      }
    } catch {
      // ignore
    }
  };

  const handleSelect = (id: string | null) => {
    setActiveWorkspaceId(id);
    onSwitch(id);
    setIsOpen(false);
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const isDark = theme === "dark";

  const toggleOpen = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isDark
            ? "hover:bg-white/5 text-gray-200"
            : "hover:bg-gray-100 text-gray-800"
        }`}
      >
        <span className="text-base">{activeWorkspace?.icon || "🏠"}</span>
        <span className="flex-1 text-left truncate">
          {activeWorkspace?.name || "Default Workspace"}
        </span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""} ${isDark ? "text-gray-500" : "text-gray-400"}`} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[999]" onClick={closeMenu}>
          <div
            ref={menuRef}
            className={`fixed rounded-lg border shadow-xl overflow-hidden ${
              isDark ? "bg-[#1e1e1e] border-white/10 shadow-black/50" : "bg-white border-gray-200 shadow-black/10"
            }`}
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
            onClick={(e) => e.stopPropagation()}
          >
          <div className="max-h-[300px] overflow-y-auto py-1">
            {/* Default workspace */}
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                !activeWorkspaceId
                  ? isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900"
                  : isDark ? "hover:bg-white/5 text-gray-300" : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span className="text-base">🏠</span>
              <span className="flex-1 text-left truncate">Default Workspace</span>
              {!activeWorkspaceId && <Check size={14} className="text-green-500" />}
            </button>

            {/* Workspace list */}
            {workspaces.map((ws) => (
              <div key={ws.id} className="group relative">
                {editingId === ws.id ? (
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-1 mb-2">
                      <button
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className={`text-base px-1 rounded ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                        title="Change icon"
                      >
                        {newIcon}
                      </button>
                      <input
                        ref={inputRef}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(ws);
                          if (e.key === "Escape") { setEditingId(null); setShowIconPicker(false); setShowColorPicker(false); }
                        }}
                        className={`flex-1 text-sm px-2 py-1 rounded border outline-none ${
                          isDark ? "bg-transparent border-white/20 text-white" : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                      <button onClick={() => handleRename(ws)} className="p-1 text-green-500 hover:text-green-400">
                        <Check size={14} />
                      </button>
                      <button onClick={() => { setEditingId(null); setShowIconPicker(false); setShowColorPicker(false); }} className="p-1 text-gray-400 hover:text-gray-300">
                        <X size={14} />
                      </button>
                    </div>
                    {showIconPicker && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {WORKSPACE_ICONS.map((icon) => (
                          <button
                            key={icon}
                            onClick={() => { setNewIcon(icon); setShowIconPicker(false); }}
                            className={`text-base p-1 rounded ${newIcon === icon ? (isDark ? "bg-white/20" : "bg-gray-200") : (isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {WORKSPACE_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setNewColor(c)}
                          className={`w-5 h-5 rounded-full border-2 ${newColor === c ? "border-white" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelect(ws.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      activeWorkspaceId === ws.id
                        ? isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900"
                        : isDark ? "hover:bg-white/5 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="text-base">{ws.icon || "💼"}</span>
                    <span className="flex-1 text-left truncate">{ws.name}</span>
                    {activeWorkspaceId === ws.id && <Check size={14} className="text-green-500" />}
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(ws.id);
                          setNewName(ws.name);
                          setNewIcon(ws.icon || "💼");
                          setNewColor(ws.color || "#6366f1");
                        }}
                        className={`p-1 rounded ${isDark ? "hover:bg-white/10" : "hover:bg-gray-200"}`}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(ws.id);
                        }}
                        className={`p-1 rounded text-red-400 ${isDark ? "hover:bg-white/10" : "hover:bg-gray-200"}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className={`border-t ${isDark ? "border-white/10" : "border-gray-200"}`} />

          {/* Create new */}
          {isCreating ? (
            <div className="px-3 py-2">
              <div className="flex items-center gap-1 mb-2">
                <button
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className={`text-base px-1 rounded ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                  title="Pick icon"
                >
                  {newIcon}
                </button>
                <input
                  ref={inputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") { setIsCreating(false); setShowIconPicker(false); setShowColorPicker(false); }
                  }}
                  placeholder="Workspace name..."
                  className={`flex-1 text-sm px-2 py-1 rounded border outline-none ${
                    isDark ? "bg-transparent border-white/20 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
                />
                <button onClick={handleCreate} className="p-1 text-green-500 hover:text-green-400">
                  <Check size={14} />
                </button>
                <button onClick={() => { setIsCreating(false); setShowIconPicker(false); setShowColorPicker(false); }} className="p-1 text-gray-400 hover:text-gray-300">
                  <X size={14} />
                </button>
              </div>
              {showIconPicker && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {WORKSPACE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => { setNewIcon(icon); setShowIconPicker(false); }}
                      className={`text-base p-1 rounded ${newIcon === icon ? (isDark ? "bg-white/20" : "bg-gray-200") : (isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {WORKSPACE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-5 h-5 rounded-full border-2 ${newColor === c ? "border-white" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsCreating(true);
                setNewName("");
                setNewIcon("💼");
                setNewColor("#6366f1");
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-50 text-gray-500"
              }`}
            >
              <Plus size={14} />
              <span>New workspace</span>
            </button>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
