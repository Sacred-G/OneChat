"use client";
import React from "react";
import FileSearchSetup from "./file-search-setup";
import WebSearchConfig from "./websearch-config";
import FunctionsView from "./functions-view";
import McpConfig from "./mcp-config";
import PanelConfig from "./panel-config";
import useToolsStore from "@/stores/useToolsStore";
import GoogleIntegrationPanel from "@/components/google-integration";
import { Mic, Trash2 } from "lucide-react";
import useConversationStore from "@/stores/useConversationStore";

export default function ContextPanel() {
  const { resetConversation, setAssistantLoading } = useConversationStore();
  const {
    fileSearchEnabled,
    setFileSearchEnabled,
    webSearchEnabled,
    setWebSearchEnabled,
    functionsEnabled,
    setFunctionsEnabled,
    googleIntegrationEnabled,
    setGoogleIntegrationEnabled,
    geminiImageEnabled,
    setGeminiImageEnabled,
    mcpEnabled,
    setMcpEnabled,
    codeInterpreterEnabled,
    setCodeInterpreterEnabled,
    voiceModeEnabled,
    setVoiceModeEnabled,
  } = useToolsStore();
  const [oauthConfigured, setOauthConfigured] = React.useState<boolean>(false);
  const [isClearingHistory, setIsClearingHistory] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/google/status")
      .then((r) => r.json())
      .then((d) => setOauthConfigured(Boolean(d.oauthConfigured)))
      .catch(() => setOauthConfigured(false));
  }, []);

  const handleClearHistory = async () => {
    if (isClearingHistory) return;
    const ok = window.confirm("Clear conversation history? This cannot be undone.");
    if (!ok) return;

    setIsClearingHistory(true);
    try {
      await fetch("/api/conversation", { method: "DELETE" });
    } catch {
      // ignore
    } finally {
      resetConversation();
      setAssistantLoading(false);
      setIsClearingHistory(false);
    }
  };

  return (
    <div className="h-full p-8 w-full bg-[#f9f9f9] rounded-t-xl md:rounded-none border-l-1 border-stone-100">
      <div className="flex flex-col overflow-y-scroll h-full">
        <PanelConfig
          title="File Search"
          tooltip="Allows to search a knowledge base (vector store)"
          enabled={fileSearchEnabled}
          setEnabled={setFileSearchEnabled}
        >
          <FileSearchSetup />
        </PanelConfig>
        <PanelConfig
          title="Web Search"
          tooltip="Allows to search the web"
          enabled={webSearchEnabled}
          setEnabled={setWebSearchEnabled}
        >
          <WebSearchConfig />
        </PanelConfig>
        <PanelConfig
          title="Code Interpreter"
          tooltip="Allows the assistant to run Python code"
          enabled={codeInterpreterEnabled}
          setEnabled={setCodeInterpreterEnabled}
        />
        <PanelConfig
          title="Gemini 3 Pro Image"
          tooltip="Use Gemini 3 Pro Image (gemini-3-pro-image-preview) for image generation"
          enabled={geminiImageEnabled}
          setEnabled={setGeminiImageEnabled}
        />
        <PanelConfig
          title="Functions"
          tooltip="Allows to use locally defined functions"
          enabled={functionsEnabled}
          setEnabled={setFunctionsEnabled}
        >
          <FunctionsView />
        </PanelConfig>
        <PanelConfig
          title="MCP"
          tooltip="Allows to call tools via remote MCP server"
          enabled={mcpEnabled}
          setEnabled={setMcpEnabled}
        >
          <McpConfig />
        </PanelConfig>
        <PanelConfig
          title="Google Integration"
          tooltip="Connect your Google account to enable Gmail and Calendar features."
          enabled={oauthConfigured && googleIntegrationEnabled}
          setEnabled={setGoogleIntegrationEnabled}
          disabled={!oauthConfigured}
        >
          <GoogleIntegrationPanel />
        </PanelConfig>
        <PanelConfig
          title="Voice Mode"
          tooltip="Enable real-time voice conversation with the assistant using OpenAI Realtime API"
          enabled={voiceModeEnabled}
          setEnabled={setVoiceModeEnabled}
        >
          <div className="text-sm text-stone-500 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <Mic size={16} />
              <span>Talk directly with the assistant</span>
            </div>
            <p>When enabled, a voice chat interface will appear allowing you to have real-time audio conversations.</p>
          </div>
        </PanelConfig>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-black font-medium">Conversation</h1>
          </div>
          <div className="mt-1">
            <button
              type="button"
              onClick={handleClearHistory}
              disabled={isClearingHistory}
              className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 hover:bg-stone-50 disabled:opacity-50"
            >
              <Trash2 size={16} />
              Clear history
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
