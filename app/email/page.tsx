"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Send,
  Reply,
  Forward,
  Trash2,
  Archive,
  Search,
  Inbox,
  SendHorizontal,
  FileText,
  Flag,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FolderPlus,
  Pencil,
  Wand2,
  Folder,
  ChevronDown,
  ChevronRight,
  Check,
} from "lucide-react";

interface GraphEmail {
  id: string;
  subject: string;
  from: { emailAddress: { name: string; address: string } };
  toRecipients: Array<{ emailAddress: { name: string; address: string } }>;
  ccRecipients?: Array<{ emailAddress: { name: string; address: string } }>;
  bodyPreview: string;
  body?: { contentType: string; content: string };
  receivedDateTime: string;
  isRead: boolean;
  flag: { flagStatus: string };
  hasAttachments: boolean;
  importance: string;
  parentFolderId?: string;
}

type FolderType = string;

interface FolderDef {
  id: string;
  name: string;
  icon: React.ReactNode;
  isCustom?: boolean;
  unreadCount?: number;
  totalCount?: number;
}

interface GraphFolder {
  id: string;
  displayName: string;
  parentFolderId?: string;
  totalItemCount: number;
  unreadItemCount: number;
  childFolderCount: number;
}

export default function EmailPage() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<GraphEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<GraphEmail | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderType>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [composeData, setComposeData] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
  });
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [fullEmail, setFullEmail] = useState<GraphEmail | null>(null);
  const [customFolders, setCustomFolders] = useState<GraphFolder[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState("");
  const [aiSorting, setAiSorting] = useState(false);
  const [aiSortProgress, setAiSortProgress] = useState("");
  const [showCustomFolders, setShowCustomFolders] = useState(true);

  // Check Microsoft connection status
  useEffect(() => {
    fetch("/api/microsoft/status")
      .then((r) => r.json())
      .then((d) => {
        setConnected(Boolean(d.connected));
        setOauthConfigured(Boolean(d.oauthConfigured));
        setLoading(false);
      })
      .catch(() => {
        setConnected(false);
        setOauthConfigured(false);
        setLoading(false);
      });
  }, []);

  // Show toast
  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch emails
  const fetchEmails = useCallback(async () => {
    if (!connected) return;
    setEmailsLoading(true);
    try {
      const params = new URLSearchParams({
        folder: selectedFolder,
        top: "50",
        skip: "0",
      });
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/microsoft/emails?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch emails");
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load emails");
    } finally {
      setEmailsLoading(false);
    }
  }, [connected, selectedFolder, searchQuery, showToast]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Fetch full email when selected
  const fetchFullEmail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/microsoft/emails?id=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Failed to fetch email");
      const data = await res.json();
      setFullEmail(data.message);
    } catch {
      // fallback to preview
    }
  }, []);

  // Email actions
  const handleEmailAction = async (action: string, payload: Record<string, any>) => {
    setActionLoading(action);
    try {
      const res = await fetch("/api/microsoft/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Action failed" }));
        throw new Error(err.error || "Action failed");
      }
      showToast("success", `${action} successful`);
      return true;
    } catch (err: any) {
      showToast("error", err.message);
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const handleSend = async () => {
    const toList = composeData.to.split(",").map((s) => s.trim()).filter(Boolean);
    const ccList = composeData.cc.split(",").map((s) => s.trim()).filter(Boolean);
    const bccList = composeData.bcc.split(",").map((s) => s.trim()).filter(Boolean);

    if (toList.length === 0) {
      showToast("error", "Please enter at least one recipient");
      return;
    }

    const ok = await handleEmailAction("send", {
      to: toList,
      cc: ccList,
      bcc: bccList,
      subject: composeData.subject,
      bodyContent: composeData.body,
      bodyType: "Text",
    });

    if (ok) {
      setIsComposing(false);
      setComposeData({ to: "", cc: "", bcc: "", subject: "", body: "" });
      fetchEmails();
    }
  };

  const handleReply = async () => {
    if (!selectedEmail) return;
    const ok = await handleEmailAction("reply", {
      messageId: selectedEmail.id,
      comment: composeData.body,
    });
    if (ok) {
      setIsReplying(false);
      setComposeData({ to: "", cc: "", bcc: "", subject: "", body: "" });
    }
  };

  const handleForward = async () => {
    if (!selectedEmail) return;
    const toList = composeData.to.split(",").map((s) => s.trim()).filter(Boolean);
    const ok = await handleEmailAction("forward", {
      messageId: selectedEmail.id,
      toRecipients: toList,
      comment: composeData.body,
    });
    if (ok) {
      setIsForwarding(false);
      setComposeData({ to: "", cc: "", bcc: "", subject: "", body: "" });
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await handleEmailAction("delete", { messageId: id });
    if (ok) {
      setEmails((prev) => prev.filter((e) => e.id !== id));
      if (selectedEmail?.id === id) {
        setSelectedEmail(null);
        setFullEmail(null);
      }
    }
  };

  const handleArchive = async (id: string) => {
    const ok = await handleEmailAction("move", {
      messageId: id,
      destinationFolder: "archive",
    });
    if (ok) {
      setEmails((prev) => prev.filter((e) => e.id !== id));
      if (selectedEmail?.id === id) {
        setSelectedEmail(null);
        setFullEmail(null);
      }
    }
  };

  const handleToggleRead = async (id: string, isRead: boolean) => {
    const ok = await handleEmailAction(isRead ? "markUnread" : "markRead", {
      messageId: id,
    });
    if (ok) {
      setEmails((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isRead: !isRead } : e))
      );
    }
  };

  const handleToggleFlag = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "flagged" ? "notFlagged" : "flagged";
    const ok = await handleEmailAction("flag", {
      messageId: id,
      flagStatus: newStatus,
    });
    if (ok) {
      setEmails((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, flag: { flagStatus: newStatus } } : e
        )
      );
    }
  };

  // AI features
  const handleAiAction = async (
    action: string,
    extraPayload?: Record<string, any>
  ) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/microsoft/ai-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          emailSubject: selectedEmail?.subject || composeData.subject,
          emailBody:
            fullEmail?.body?.content ||
            selectedEmail?.bodyPreview ||
            composeData.body,
          context: selectedEmail?.from?.emailAddress?.address || "",
          ...extraPayload,
        }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      setAiResult(data.result);
    } catch (err: any) {
      showToast("error", err.message || "AI request failed");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    setComposeData((prev) => ({ ...prev, body: aiResult }));
    setAiResult(null);
  };

  // Well-known folder display names to exclude from custom list
  const WELL_KNOWN_NAMES = useMemo(() => new Set([
    "inbox", "sent items", "drafts", "deleted items", "junk email",
    "archive", "outbox", "conversation history", "scheduled",
    "sync issues", "rss feeds", "rss subscriptions",
  ]), []);

  // Fetch custom folders from Microsoft Graph
  const fetchFolders = useCallback(async () => {
    if (!connected) return;
    try {
      const res = await fetch("/api/microsoft/emails?listFolders=true");
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      const all = Array.isArray(data?.folders) ? data.folders : [];
      const custom = all.filter(
        (f: any) => !WELL_KNOWN_NAMES.has(f.displayName?.toLowerCase())
      );
      setCustomFolders(custom);
    } catch {
      // silently fail
    }
  }, [connected, WELL_KNOWN_NAMES]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Create a new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const res = await fetch("/api/microsoft/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createFolder", folderName: newFolderName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to create folder");
      }
      showToast("success", `Folder "${newFolderName.trim()}" created`);
      setNewFolderName("");
      setShowCreateFolder(false);
      fetchFolders();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setCreatingFolder(false);
    }
  };

  // Rename a folder
  const handleRenameFolder = async (folderId: string) => {
    if (!renameFolderValue.trim()) return;
    try {
      const res = await fetch("/api/microsoft/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "renameFolder", folderId, newName: renameFolderValue.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename folder");
      showToast("success", "Folder renamed");
      setRenamingFolderId(null);
      setRenameFolderValue("");
      fetchFolders();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Delete a folder
  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Delete folder "${folderName}"? Emails inside will be moved to Deleted Items.`)) return;
    try {
      const res = await fetch("/api/microsoft/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteFolder", folderId }),
      });
      if (!res.ok) throw new Error("Failed to delete folder");
      showToast("success", `Folder "${folderName}" deleted`);
      if (selectedFolder === folderId) {
        setSelectedFolder("inbox");
        setSelectedEmail(null);
        setFullEmail(null);
      }
      fetchFolders();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // AI Sort Inbox: categorize inbox emails and move them to appropriate folders
  const handleAiSortInbox = async () => {
    if (customFolders.length === 0) {
      showToast("error", "Create some folders first so AI knows where to sort emails");
      return;
    }
    setAiSorting(true);
    setAiSortProgress("Fetching inbox emails...");
    try {
      // 1. Fetch inbox emails
      const emailsRes = await fetch("/api/microsoft/emails?folder=inbox&top=30");
      if (!emailsRes.ok) throw new Error("Failed to fetch inbox");
      const emailsData = await emailsRes.json();
      const inboxEmails = emailsData.emails || [];
      if (inboxEmails.length === 0) {
        showToast("success", "Inbox is empty, nothing to sort");
        return;
      }

      setAiSortProgress(`Analyzing ${inboxEmails.length} emails with AI...`);

      // 2. Ask AI to categorize
      const emailSummaries = inboxEmails.map((e: any) => ({
        id: e.id,
        subject: e.subject || "(no subject)",
        from: e.from?.emailAddress?.address || "unknown",
        preview: (e.bodyPreview || "").substring(0, 150),
      }));

      const folderSummaries = customFolders.map((f) => ({
        id: f.id,
        name: f.displayName,
      }));

      const aiRes = await fetch("/api/microsoft/ai-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sort-inbox",
          emails: emailSummaries,
          folders: folderSummaries,
        }),
      });

      if (!aiRes.ok) throw new Error("AI sorting failed");
      const aiData = await aiRes.json();
      const assignments = aiData.assignments || [];

      // 3. Move emails based on AI assignments
      const toMove = assignments.filter((a: any) => a.folderId && a.folderId !== "skip");
      if (toMove.length === 0) {
        showToast("success", "AI reviewed your inbox — no emails needed sorting");
        return;
      }

      setAiSortProgress(`Moving ${toMove.length} emails to folders...`);

      let moved = 0;
      for (const assignment of toMove) {
        try {
          await fetch("/api/microsoft/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "move",
              messageId: assignment.emailId,
              destinationFolder: assignment.folderId,
            }),
          });
          moved++;
          setAiSortProgress(`Moved ${moved}/${toMove.length} emails...`);
        } catch {
          // skip failed moves
        }
      }

      showToast("success", `AI sorted ${moved} email${moved !== 1 ? "s" : ""} into folders`);
      fetchEmails();
      fetchFolders();
    } catch (err: any) {
      showToast("error", err.message || "AI sort failed");
    } finally {
      setAiSorting(false);
      setAiSortProgress("");
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const mins = Math.floor(diffMs / (1000 * 60));
      return `${mins}m ago`;
    }
    if (diffHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffHours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const folders: FolderDef[] = [
    { id: "inbox", name: "Inbox", icon: <Inbox size={16} /> },
    { id: "sent", name: "Sent", icon: <SendHorizontal size={16} /> },
    { id: "drafts", name: "Drafts", icon: <FileText size={16} /> },
    { id: "archive", name: "Archive", icon: <Archive size={16} /> },
    { id: "deleted", name: "Deleted", icon: <Trash2 size={16} /> },
  ];

  // --- Not connected state ---
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
          <Loader2 className="animate-spin text-blue-400 relative" size={36} />
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-2xl" />

        <div className="relative text-center max-w-md mx-auto p-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
            <Mail size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Microsoft Email
          </h1>
          <p className="text-blue-200/60 mb-8 text-sm leading-relaxed">
            Connect your Microsoft account to read, write, and organize your
            emails with AI assistance.
          </p>
          {oauthConfigured ? (
            <a href="/api/microsoft/auth">
              <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]">
                Connect Microsoft Account
              </button>
            </a>
          ) : (
            <div className="space-y-3">
              <button
                disabled
                className="px-8 py-3 bg-white/10 text-white/30 rounded-xl font-medium cursor-not-allowed border border-white/5"
              >
                Connect Microsoft Account
              </button>
              <p className="text-sm text-amber-400/80 flex items-center justify-center gap-1.5">
                <AlertTriangle size={14} />
                Set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and
                MICROSOFT_TENANT_ID in .env
              </p>
            </div>
          )}
          <button
            onClick={() => router.push("/")}
            className="mt-6 text-sm text-blue-300/50 hover:text-blue-300 flex items-center gap-1.5 mx-auto transition-colors"
          >
            <ArrowLeft size={14} /> Back to chat
          </button>
        </div>
      </div>
    );
  }

  // --- Connected: Full email client ---
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-600/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-3xl pointer-events-none" />
      <div className="absolute top-[50%] left-[40%] w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium backdrop-blur-xl shadow-2xl border ${
            toast.type === "success"
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20 shadow-emerald-500/10"
              : "bg-red-500/15 text-red-300 border-red-500/20 shadow-red-500/10"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {toast.message}
        </div>
      )}

      {/* Sidebar */}
      <div className="w-60 bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col relative z-10">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push("/")}
              className="text-blue-300/50 hover:text-blue-300 transition-colors"
              title="Back to chat"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-sm font-bold text-white/90 tracking-wide">Mail</h1>
            <button
              onClick={fetchEmails}
              className="text-blue-300/50 hover:text-blue-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw
                size={16}
                className={emailsLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
          <button
            onClick={() => {
              setIsComposing(true);
              setIsReplying(false);
              setIsForwarding(false);
              setComposeData({ to: "", cc: "", bcc: "", subject: "", body: "" });
              setAiResult(null);
            }}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Mail size={14} />
            Compose
          </button>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-300/40"
            />
            <input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchEmails()}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white/80 placeholder:text-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
            />
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                setSelectedFolder(folder.id);
                setSelectedEmail(null);
                setFullEmail(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                selectedFolder === folder.id
                  ? "bg-white/10 text-blue-300 font-medium shadow-sm shadow-blue-500/10 border border-white/10"
                  : "text-white/50 hover:bg-white/5 hover:text-white/70 border border-transparent"
              }`}
            >
              {folder.icon}
              {folder.name}
            </button>
          ))}

          {/* Custom Folders Section */}
          <div className="pt-2 mt-2 border-t border-white/10">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setShowCustomFolders(!showCustomFolders)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowCustomFolders(!showCustomFolders); } }}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider hover:text-white/50 transition-colors cursor-pointer"
            >
              <span>Folders</span>
              <div className="flex items-center gap-1">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateFolder(!showCreateFolder);
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); setShowCreateFolder(!showCreateFolder); } }}
                  className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                  title="Create folder"
                >
                  <FolderPlus size={13} />
                </span>
                {showCustomFolders ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </div>
            </div>

            {/* Create folder input */}
            {showCreateFolder && (
              <div className="px-2 py-1.5">
                <div className="flex gap-1">
                  <input
                    placeholder="Folder name..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                    className="flex-1 px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateFolder}
                    disabled={creatingFolder || !newFolderName.trim()}
                    className="px-2 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all border border-blue-500/20 disabled:opacity-40"
                  >
                    {creatingFolder ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  </button>
                  <button
                    onClick={() => { setShowCreateFolder(false); setNewFolderName(""); }}
                    className="px-2 py-1.5 text-xs text-white/30 hover:text-white/60 rounded-lg transition-all hover:bg-white/5"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Custom folder list */}
            {showCustomFolders && customFolders.map((cf) => (
              <div key={cf.id} className="group relative">
                {renamingFolderId === cf.id ? (
                  <div className="flex gap-1 px-2 py-1">
                    <input
                      value={renameFolderValue}
                      onChange={(e) => setRenameFolderValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameFolder(cf.id)}
                      className="flex-1 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameFolder(cf.id)}
                      className="px-1.5 text-xs text-blue-300 hover:bg-blue-500/20 rounded transition-all"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => { setRenamingFolderId(null); setRenameFolderValue(""); }}
                      className="px-1.5 text-xs text-white/30 hover:text-white/60 rounded transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedFolder(cf.id);
                      setSelectedEmail(null);
                      setFullEmail(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedFolder === cf.id
                        ? "bg-white/10 text-blue-300 font-medium shadow-sm shadow-blue-500/10 border border-white/10"
                        : "text-white/50 hover:bg-white/5 hover:text-white/70 border border-transparent"
                    }`}
                  >
                    <Folder size={16} />
                    <span className="flex-1 text-left truncate">{cf.displayName}</span>
                    {cf.unreadItemCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                        {cf.unreadItemCount}
                      </span>
                    )}
                    <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingFolderId(cf.id);
                          setRenameFolderValue(cf.displayName);
                        }}
                        className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
                        title="Rename"
                      >
                        <Pencil size={11} />
                      </span>
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(cf.id, cf.displayName);
                        }}
                        className="p-0.5 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </span>
                    </div>
                  </button>
                )}
              </div>
            ))}

            {showCustomFolders && customFolders.length === 0 && (
              <p className="px-3 py-2 text-[11px] text-white/20 italic">
                No custom folders yet
              </p>
            )}
          </div>
        </nav>

        {/* AI Sort Inbox Button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleAiSortInbox}
            disabled={aiSorting || customFolders.length === 0}
            className="w-full py-2.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 text-purple-200 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 border border-purple-500/25 hover:border-purple-500/35 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:shadow-purple-500/10"
            title={customFolders.length === 0 ? "Create folders first, then AI can sort your inbox" : "AI will analyze inbox emails and sort them into your folders"}
          >
            {aiSorting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Wand2 size={14} />
            )}
            {aiSorting ? "Sorting..." : "AI Sort Inbox"}
          </button>
          {aiSortProgress && (
            <p className="text-[10px] text-purple-300/60 text-center mt-1.5 animate-pulse">
              {aiSortProgress}
            </p>
          )}
        </div>
      </div>

      {/* Email List */}
      <div className="w-80 bg-white/[0.03] backdrop-blur-xl border-r border-white/10 flex flex-col min-h-0 relative z-10">
        <div className="p-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white/90 capitalize">
            {customFolders.find((f) => f.id === selectedFolder)?.displayName || selectedFolder}
          </h2>
          <p className="text-xs text-blue-300/40">
            {emails.length} message{emails.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {emailsLoading && emails.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-400/50" size={24} />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <Mail size={32} className="mb-2" />
              <p className="text-sm">No emails</p>
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                onClick={() => {
                  setSelectedEmail(email);
                  fetchFullEmail(email.id);
                  if (!email.isRead) {
                    handleToggleRead(email.id, false);
                  }
                }}
                className={`px-3 py-3 border-b border-white/5 cursor-pointer transition-all ${
                  selectedEmail?.id === email.id
                    ? "bg-blue-500/10 border-l-2 border-l-blue-400"
                    : "hover:bg-white/5 border-l-2 border-l-transparent"
                } ${!email.isRead ? "bg-blue-500/5" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {!email.isRead && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      )}
                      <p
                        className={`text-sm truncate ${
                          !email.isRead ? "font-semibold text-white" : "font-medium text-white/70"
                        }`}
                      >
                        {email.from?.emailAddress?.name ||
                          email.from?.emailAddress?.address ||
                          "Unknown"}
                      </p>
                    </div>
                    <p
                      className={`text-sm truncate ${
                        !email.isRead ? "font-semibold text-white/90" : "text-white/60"
                      }`}
                    >
                      {email.subject || "(no subject)"}
                    </p>
                    <p className="text-xs text-white/30 truncate mt-0.5">
                      {email.bodyPreview?.substring(0, 80)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-white/25">
                      {formatDate(email.receivedDateTime)}
                    </span>
                    <div className="flex items-center gap-1">
                      {email.importance === "high" && (
                        <AlertTriangle size={12} className="text-red-400/70" />
                      )}
                      {email.hasAttachments && (
                        <FileText size={12} className="text-white/25" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFlag(
                            email.id,
                            email.flag?.flagStatus || "notFlagged"
                          );
                        }}
                        className="text-white/15 hover:text-orange-400 transition-colors"
                      >
                        <Flag
                          size={12}
                          fill={
                            email.flag?.flagStatus === "flagged"
                              ? "currentColor"
                              : "none"
                          }
                          className={
                            email.flag?.flagStatus === "flagged"
                              ? "text-orange-400"
                              : ""
                          }
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Content / Compose */}
      <div className="flex-1 flex flex-col min-h-0 bg-white/[0.02] backdrop-blur-xl relative z-10">
        {isComposing || isReplying || isForwarding ? (
          /* Compose / Reply / Forward */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white/90">
                {isReplying
                  ? "Reply"
                  : isForwarding
                    ? "Forward"
                    : "New Message"}
              </h2>
              <button
                onClick={() => {
                  setIsComposing(false);
                  setIsReplying(false);
                  setIsForwarding(false);
                  setAiResult(null);
                }}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {(isComposing || isForwarding) && (
                <div>
                  <label className="text-xs font-medium text-blue-300/50 mb-1.5 block uppercase tracking-wider">
                    To
                  </label>
                  <input
                    placeholder="recipient@example.com"
                    value={composeData.to}
                    onChange={(e) =>
                      setComposeData({ ...composeData, to: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
                  />
                </div>
              )}
              {isComposing && (
                <>
                  <div>
                    <label className="text-xs font-medium text-blue-300/50 mb-1.5 block uppercase tracking-wider">
                      Cc
                    </label>
                    <input
                      placeholder="cc@example.com"
                      value={composeData.cc}
                      onChange={(e) =>
                        setComposeData({ ...composeData, cc: e.target.value })
                      }
                      className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-blue-300/50 mb-1.5 block uppercase tracking-wider">
                      Subject
                    </label>
                    <input
                      placeholder="Subject"
                      value={composeData.subject}
                      onChange={(e) =>
                        setComposeData({
                          ...composeData,
                          subject: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="text-xs font-medium text-blue-300/50 mb-1.5 block uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  placeholder="Write your message..."
                  value={composeData.body}
                  onChange={(e) =>
                    setComposeData({ ...composeData, body: e.target.value })
                  }
                  rows={12}
                  className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all resize-none"
                />
              </div>

              {/* AI Assist Section */}
              <div className="border-2 border-purple-500/30 rounded-xl p-5 bg-gradient-to-br from-purple-600/15 via-indigo-600/10 to-purple-600/15 backdrop-blur-sm shadow-lg shadow-purple-500/5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-purple-200 block">
                      AI Assistant
                    </span>
                    <span className="text-[11px] text-purple-300/50">
                      Let AI help you write
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() =>
                      handleAiAction("compose", {
                        instructions: composeData.body || composeData.subject,
                      })
                    }
                    disabled={aiLoading}
                    className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500/25 to-indigo-500/25 hover:from-purple-500/40 hover:to-indigo-500/40 text-purple-100 rounded-xl transition-all border border-purple-400/30 hover:border-purple-400/45 disabled:opacity-40 shadow-sm hover:shadow-md hover:shadow-purple-500/15"
                  >
                    ✨ Draft for me
                  </button>
                  <button
                    onClick={() => handleAiAction("improve")}
                    disabled={aiLoading || !composeData.body}
                    className="px-4 py-2 text-sm font-medium bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 rounded-xl transition-all border border-purple-400/25 hover:border-purple-400/40 disabled:opacity-40 shadow-sm hover:shadow-md hover:shadow-purple-500/10"
                  >
                    Improve
                  </button>
                  <button
                    onClick={() =>
                      handleAiAction("compose", {
                        tone: "formal",
                        instructions:
                          composeData.body || composeData.subject,
                      })
                    }
                    disabled={aiLoading}
                    className="px-4 py-2 text-sm font-medium bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 rounded-xl transition-all border border-purple-400/25 hover:border-purple-400/40 disabled:opacity-40 shadow-sm hover:shadow-md hover:shadow-purple-500/10"
                  >
                    Make formal
                  </button>
                  <button
                    onClick={() =>
                      handleAiAction("compose", {
                        tone: "friendly",
                        instructions:
                          composeData.body || composeData.subject,
                      })
                    }
                    disabled={aiLoading}
                    className="px-4 py-2 text-sm font-medium bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 rounded-xl transition-all border border-purple-400/25 hover:border-purple-400/40 disabled:opacity-40 shadow-sm hover:shadow-md hover:shadow-purple-500/10"
                  >
                    Make friendly
                  </button>
                </div>
                {aiLoading && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-purple-300/70">
                    <Loader2 size={14} className="animate-spin" />
                    AI is thinking...
                  </div>
                )}
                {aiResult && (
                  <div className="mt-4">
                    <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 text-sm text-white/80 max-h-48 overflow-y-auto whitespace-pre-wrap shadow-inner">
                      {aiResult}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={applyAiResult}
                        className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white rounded-xl transition-all shadow-md shadow-purple-500/25 hover:shadow-purple-500/35"
                      >
                        Use this
                      </button>
                      <button
                        onClick={() => setAiResult(null)}
                        className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 text-white/40 rounded-xl transition-all border border-white/10"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsComposing(false);
                  setIsReplying(false);
                  setIsForwarding(false);
                  setAiResult(null);
                }}
                className="px-4 py-2 text-sm text-white/40 hover:text-white/60 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={
                  isReplying
                    ? handleReply
                    : isForwarding
                      ? handleForward
                      : handleSend
                }
                disabled={actionLoading === "send"}
                className="px-5 py-2 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                {actionLoading === "send" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Send
              </button>
            </div>
          </div>
        ) : selectedEmail ? (
          /* Email Reader */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-white/90 flex-1 mr-4">
                  {selectedEmail.subject || "(no subject)"}
                </h1>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setIsReplying(true);
                      setComposeData({
                        to: "",
                        cc: "",
                        bcc: "",
                        subject: "",
                        body: "",
                      });
                      setAiResult(null);
                    }}
                    className="p-2 text-white/30 hover:text-blue-300 hover:bg-white/5 rounded-lg transition-all"
                    title="Reply"
                  >
                    <Reply size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setIsForwarding(true);
                      setComposeData({
                        to: "",
                        cc: "",
                        bcc: "",
                        subject: "",
                        body: "",
                      });
                      setAiResult(null);
                    }}
                    className="p-2 text-white/30 hover:text-blue-300 hover:bg-white/5 rounded-lg transition-all"
                    title="Forward"
                  >
                    <Forward size={16} />
                  </button>
                  <button
                    onClick={() => handleArchive(selectedEmail.id)}
                    className="p-2 text-white/30 hover:text-amber-300 hover:bg-white/5 rounded-lg transition-all"
                    title="Archive"
                  >
                    <Archive size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedEmail.id)}
                    className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {(selectedEmail.from?.emailAddress?.name || selectedEmail.from?.emailAddress?.address || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white/90">
                        {selectedEmail.from?.emailAddress?.name ||
                          selectedEmail.from?.emailAddress?.address}
                      </p>
                      <p className="text-white/30 text-xs">
                        {selectedEmail.from?.emailAddress?.address}
                      </p>
                    </div>
                  </div>
                  <p className="text-white/30 text-xs mt-1.5 ml-10">
                    To:{" "}
                    {selectedEmail.toRecipients
                      ?.map(
                        (r) =>
                          r.emailAddress?.name || r.emailAddress?.address
                      )
                      .join(", ")}
                  </p>
                </div>
                <p className="text-xs text-white/20">
                  {new Date(selectedEmail.receivedDateTime).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white/[0.03] rounded-xl border border-white/5 p-6">
                {fullEmail?.body?.content ? (
                  fullEmail.body.contentType === "html" ? (
                    <div
                      className="prose prose-invert prose-sm max-w-none [&_*]:text-white/70 [&_a]:text-blue-400"
                      dangerouslySetInnerHTML={{
                        __html: fullEmail.body.content,
                      }}
                    />
                  ) : (
                    <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
                      {fullEmail.body.content}
                    </p>
                  )
                ) : (
                  <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
                    {selectedEmail.bodyPreview}
                  </p>
                )}
              </div>
            </div>

            {/* AI Actions for reading */}
            <div className="shrink-0 border-t border-purple-500/30 bg-gradient-to-r from-purple-600/15 via-indigo-600/10 to-purple-600/15 backdrop-blur-sm">
              <div className="px-5 py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-bold text-purple-200">
                      AI Assistant
                    </span>
                  </div>
                  <div className="flex gap-2 ml-1">
                    <button
                      onClick={() => handleAiAction("summarize")}
                      disabled={aiLoading}
                      className="px-4 py-2 text-sm font-medium bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 rounded-xl transition-all border border-purple-400/25 hover:border-purple-400/40 disabled:opacity-40 shadow-sm hover:shadow-md hover:shadow-purple-500/10"
                    >
                      Summarize
                    </button>
                    <button
                      onClick={() => handleAiAction("categorize")}
                      disabled={aiLoading}
                      className="px-4 py-2 text-sm font-medium bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 rounded-xl transition-all border border-purple-400/25 hover:border-purple-400/40 disabled:opacity-40 shadow-sm hover:shadow-md hover:shadow-purple-500/10"
                    >
                      Categorize
                    </button>
                    <button
                      onClick={() => {
                        setIsReplying(true);
                        setComposeData({
                          to: "",
                          cc: "",
                          bcc: "",
                          subject: "",
                          body: "",
                        });
                        handleAiAction("reply");
                      }}
                      disabled={aiLoading}
                      className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500/30 to-indigo-500/30 hover:from-purple-500/45 hover:to-indigo-500/45 text-purple-100 rounded-xl transition-all border border-purple-400/30 hover:border-purple-400/45 disabled:opacity-40 shadow-sm hover:shadow-md hover:shadow-purple-500/15"
                    >
                      ✨ AI Reply
                    </button>
                  </div>
                  {aiLoading && (
                    <div className="flex items-center gap-2 text-sm text-purple-300/70">
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                      Thinking...
                    </div>
                  )}
                </div>
              </div>
              {aiResult && (
                <div className="px-5 pb-4">
                  <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 text-sm text-white/80 max-h-48 overflow-y-auto whitespace-pre-wrap shadow-inner">
                    {aiResult}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        setIsReplying(true);
                        setComposeData((prev) => ({ ...prev, body: aiResult }));
                        setAiResult(null);
                      }}
                      className="px-4 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white rounded-lg transition-all shadow-sm shadow-purple-500/20"
                    >
                      Use as reply
                    </button>
                    <button
                      onClick={() => setAiResult(null)}
                      className="px-4 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/40 rounded-lg transition-all border border-white/10"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-xl" />
                <div className="relative w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Mail size={28} className="text-white/15" />
                </div>
              </div>
              <p className="text-white/20 text-sm">
                Select an email to read
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
