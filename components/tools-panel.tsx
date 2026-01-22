"use client";
import React from "react";
import FileSearchSetup from "./file-search-setup";
import WebSearchConfig from "./websearch-config";
import FunctionsView from "./functions-view";
import McpConfig from "./mcp-config";
import PanelConfig from "./panel-config";
import DestinationsPanel from "./destinations-panel";
import LocalAgentPanel from "./local-agent-panel";
import useToolsStore from "@/stores/useToolsStore";
import GoogleIntegrationPanel from "@/components/google-integration";
import { Mic, Trash2 } from "lucide-react";
import useConversationStore from "@/stores/useConversationStore";
import useThemeStore from "@/stores/useThemeStore";

export default function ContextPanel() {
  const { resetConversation, setAssistantLoading } = useConversationStore();
  const { theme } = useThemeStore();
  const [destinationsEnabled, setDestinationsEnabled] = React.useState(true);
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
    localAgentEnabled,
    setLocalAgentEnabled,
    hydrateMcpConfigFromFile,
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

  React.useEffect(() => {
    hydrateMcpConfigFromFile();
  }, [hydrateMcpConfigFromFile]);

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
    <div
      className={`h-full w-full rounded-t-xl md:rounded-none border-l p-6 md:p-8 ${
        theme === "dark"
          ? "bg-[#212121] border-stone-700"
          : "bg-white border-stone-200"
      }`}
    >
      <div className="flex flex-col overflow-y-auto h-full">
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
          title="Destinations"
          tooltip="Pick a destination + style prompt and generate 6 images using gpt-image-1.5"
          enabled={destinationsEnabled}
          setEnabled={setDestinationsEnabled}
        >
          {destinationsEnabled ? <DestinationsPanel /> : null}
        </PanelConfig>
        <PanelConfig
          title="Functions"
          tooltip="Allows to use locally defined functions"
          enabled={functionsEnabled}
          setEnabled={setFunctionsEnabled}
        >
          <FunctionsView />
        </PanelConfig>
        <PanelConfig
          title="Local Agent"
          tooltip="Local-only filesystem + command execution (dev mode). Requires running: npm run local-agent"
          enabled={localAgentEnabled}
          setEnabled={setLocalAgentEnabled}
        >
          {localAgentEnabled ? <LocalAgentPanel /> : null}
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
            <h1 className={`font-medium ${theme === "dark" ? "text-white" : "text-stone-900"}`}>
              Conversation
            </h1>
          </div>
          <div className="mt-1">
            <button
              type="button"
              onClick={handleClearHistory}
              disabled={isClearingHistory}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm disabled:opacity-50 ${
                theme === "dark"
                  ? "border-white/10 bg-transparent text-white hover:bg-white/10"
                  : "border-stone-300 bg-white text-stone-900 hover:bg-stone-50"
              }`}
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
