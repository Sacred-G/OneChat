"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import useThemeStore from "@/stores/useThemeStore";
import { Check } from "lucide-react";

type Org = {
  id: string;
  name: string;
  vanityName?: string;
};

export default function LinkedInIntegrationPanel() {
  const { theme } = useThemeStore();
  const [connected, setConnected] = useState(false);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgError, setOrgError] = useState<string>("");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [draftText, setDraftText] = useState<string>("");
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<string>("");

  useEffect(() => {
    fetch("/api/linkedin/status")
      .then((r) => r.json())
      .then((d) => {
        setConnected(Boolean(d.connected));
        setOauthConfigured(Boolean(d.oauthConfigured));
      })
      .catch(() => {
        setConnected(false);
        setOauthConfigured(false);
      });
  }, []);

  useEffect(() => {
    if (!connected) return;
    setOrgError("");
    fetch("/api/linkedin/organizations")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error || `Failed (${r.status})`);
        return data;
      })
      .then((d) => {
        const list = Array.isArray(d?.organizations) ? (d.organizations as Org[]) : [];
        setOrgs(list);
        if (!selectedOrgId && list[0]?.id) setSelectedOrgId(String(list[0].id));
      })
      .catch((e) => {
        setOrgError(e instanceof Error ? e.message : "Failed to load organizations");
        setOrgs([]);
      });
  }, [connected, selectedOrgId]);

  const canPost = useMemo(() => {
    return connected && selectedOrgId && draftText.trim().length > 0 && !posting;
  }, [connected, selectedOrgId, draftText, posting]);

  const post = async () => {
    if (!canPost) return;
    setPosting(true);
    setPostResult("");
    try {
      const res = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: selectedOrgId, text: draftText }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Post failed (${res.status})`);
      }
      setPostResult("Posted successfully.");
    } catch (e) {
      setPostResult(e instanceof Error ? e.message : "Post failed");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      {!connected ? (
        <div className="space-y-2">
          {oauthConfigured ? (
            <a href="/api/linkedin/auth">
              <Button>Connect LinkedIn (Company Pages)</Button>
            </a>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button disabled>Connect LinkedIn (Company Pages)</Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and
                    LINKEDIN_REDIRECT_URI must be set in .env.local.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={`flex items-center gap-2 rounded-lg shadow-sm border p-3 ${
              theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-stone-200"
            }`}
          >
            <div className={theme === "dark" ? "bg-blue-500/20 text-blue-200 rounded-md p-1" : "bg-blue-100 text-blue-500 rounded-md p-1"}>
              <Check size={16} />
            </div>
            <p className={theme === "dark" ? "text-sm text-stone-200" : "text-sm text-zinc-800"}>
              LinkedIn OAuth set up
            </p>
          </div>

          {orgError ? (
            <div className="text-sm text-red-500">{orgError}</div>
          ) : null}

          <div className="space-y-2">
            <label className={theme === "dark" ? "text-sm text-stone-300" : "text-sm text-stone-700"}>
              Company Page
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                theme === "dark"
                  ? "bg-[#1a1a1a] border-white/10 text-white"
                  : "bg-white border-stone-300 text-stone-900"
              }`}
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className={theme === "dark" ? "text-sm text-stone-300" : "text-sm text-stone-700"}>
              Draft post
            </label>
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={6}
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                theme === "dark"
                  ? "bg-[#1a1a1a] border-white/10 text-white"
                  : "bg-white border-stone-300 text-stone-900"
              }`}
              placeholder="Paste a draft from the assistant, then click Post"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={post} disabled={!canPost}>
              {posting ? "Posting…" : "Post to LinkedIn"}
            </Button>
            {postResult ? (
              <span className={postResult === "Posted successfully." ? (theme === "dark" ? "text-sm text-green-300" : "text-sm text-green-700") : "text-sm text-red-500"}>
                {postResult}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
