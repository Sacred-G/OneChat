"use client";
import React, { useEffect, useMemo, useState } from "react";
import useToolsStore from "@/stores/useToolsStore";
import FileUpload from "@/components/file-upload";
import { Input } from "./ui/input";
import { CircleX } from "lucide-react";
import { TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Tooltip } from "./ui/tooltip";
import { TooltipProvider } from "./ui/tooltip";

export default function FileSearchSetup() {
  const { vectorStore, setVectorStore, selectedProjectId } = useToolsStore();
  const [newStoreId, setNewStoreId] = useState<string>("");
  const [files, setFiles] = useState<Array<{ id: string; fileId: string; filename: string; status?: string }>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isRemovingFileId, setIsRemovingFileId] = useState<string | null>(null);

  const activeVectorStoreId = useMemo(() => (vectorStore?.id ? String(vectorStore.id) : ""), [vectorStore?.id]);

  const unlinkStore = async () => {
    setVectorStore({
      id: "",
      name: "",
    });

    if (selectedProjectId) {
      fetch(`/api/projects?id=${encodeURIComponent(selectedProjectId)}`)
        .then((r) => r.json())
        .then((d) => {
          const p = d?.project;
          const projectName = typeof p?.name === "string" && p.name.trim() ? p.name.trim() : "Project";
          return fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: selectedProjectId, name: projectName, vectorStoreId: "", vectorStoreName: "" }),
          });
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeVectorStoreId) {
      setFiles([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoadingFiles(true);
      try {
        const res = await fetch(
          `/api/vector_stores/list_files?vector_store_id=${encodeURIComponent(activeVectorStoreId)}`
        );
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data?.files) ? data.files : [];
        if (!cancelled) {
          setFiles(
            list
              .filter((f: any) => typeof f?.fileId === "string")
              .map((f: any) => ({
                id: typeof f?.id === "string" ? f.id : "",
                fileId: String(f.fileId),
                filename: typeof f?.filename === "string" ? f.filename : "",
                status: typeof f?.status === "string" ? f.status : "",
              }))
          );
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsLoadingFiles(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [activeVectorStoreId]);

  const removeFile = async (fileId: string) => {
    if (!activeVectorStoreId) return;
    if (!fileId) return;
    if (isRemovingFileId) return;
    const ok = window.confirm("Remove this document from the project knowledge base?");
    if (!ok) return;

    setIsRemovingFileId(fileId);
    try {
      const res = await fetch("/api/vector_stores/remove_file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vectorStoreId: activeVectorStoreId, fileId }),
      });
      if (!res.ok) return;
      setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
    } catch {
      // ignore
    } finally {
      setIsRemovingFileId(null);
    }
  };

  const handleAddStore = async (storeId: string) => {
    if (storeId.trim()) {
      const newStore = await fetch(
        `/api/vector_stores/retrieve_store?vector_store_id=${storeId}`
      ).then((res) => res.json());
      if (newStore.id) {
        console.log("Retrieved store:", newStore);
        setVectorStore(newStore);

        if (selectedProjectId) {
          fetch(`/api/projects?id=${encodeURIComponent(selectedProjectId)}`)
            .then((r) => r.json())
            .then((d) => {
              const p = d?.project;
              const projectName = typeof p?.name === "string" && p.name.trim() ? p.name.trim() : "Project";
              return fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: selectedProjectId,
                  name: projectName,
                  vectorStoreId: String(newStore.id || ""),
                  vectorStoreName: typeof newStore?.name === "string" ? newStore.name : "",
                }),
              });
            })
            .catch(() => {});
        }
      } else {
        alert("Vector store not found");
      }
    }
  };

  return (
    <div>
      <div className="text-sm text-zinc-500">
        Upload a file to create a new vector store, or use an existing one.
      </div>
      <div className="flex items-center gap-2 mt-2 h-10">
        <div className="flex items-center gap-2 w-full">
          <div className="text-sm font-medium w-24 text-nowrap">
            Vector store
          </div>
          {vectorStore?.id ? (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-zinc-400  text-xs font-mono flex-1 text-ellipsis truncate">
                  {vectorStore.id}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleX
                        onClick={() => unlinkStore()}
                        size={16}
                        className="cursor-pointer text-zinc-400 mb-0.5 shrink-0 mt-0.5 hover:text-zinc-700 transition-all"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="mr-2">
                      <p>Unlink vector store</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="ID (vs_XXXX...)"
                value={newStoreId}
                onChange={(e) => setNewStoreId(e.target.value)}
                className="border border-zinc-300 rounded text-sm bg-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddStore(newStoreId);
                  }
                }}
              />
              <div
                className="text-zinc-400 text-sm px-1 transition-colors hover:text-zinc-600 cursor-pointer"
                onClick={() => handleAddStore(newStoreId)}
              >
                Add
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex mt-4">
        <FileUpload
          vectorStoreId={vectorStore?.id ?? ""}
          vectorStoreName={vectorStore?.name ?? ""}
          onAddStore={(id) => handleAddStore(id)}
          onUnlinkStore={() => unlinkStore()}
        />
      </div>

      {activeVectorStoreId ? (
        <div className="mt-6">
          <div className="text-sm font-medium">Project documents</div>
          <div className="text-xs text-zinc-500 mt-1">
            These files are available to the assistant when File Search is enabled.
          </div>

          <div className="mt-3 space-y-2">
            {isLoadingFiles ? (
              <div className="text-sm text-zinc-500">Loading...</div>
            ) : files.length === 0 ? (
              <div className="text-sm text-zinc-500">No documents uploaded yet.</div>
            ) : (
              files.map((f) => (
                <div
                  key={f.fileId}
                  className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-zinc-900 truncate">
                      {f.filename || f.fileId}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {f.status ? `Status: ${f.status}` : f.fileId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(f.fileId)}
                    disabled={isRemovingFileId === f.fileId}
                    className="text-xs text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 text-xs text-zinc-500">
          Select a Project and link a vector store to manage company documents.
        </div>
      )}
    </div>
  );
}
