import { parse } from "partial-json";
import { handleTool } from "@/lib/tools/tools-handling";
import useConversationStore from "@/stores/useConversationStore";
import useToolsStore, { ToolsState } from "@/stores/useToolsStore";
import useArtifactStore from "@/stores/useArtifactStore";
import useAgentStore from "@/stores/useAgentStore";
import useConnectorsStore from "@/stores/useConnectorsStore";
import { Annotation } from "@/components/annotations";
import { functionsMap } from "@/config/functions";

const normalizeAnnotation = (annotation: any): Annotation => ({
  ...annotation,
  fileId: annotation.file_id ?? annotation.fileId,
  containerId: annotation.container_id ?? annotation.containerId,
});

export interface ContentItem {
  type: "input_text" | "output_text" | "refusal" | "output_audio" | "input_image";
  annotations?: Annotation[];
  text?: string;
  image?: string; // base64 image data
  detail?: "auto" | "low" | "high";
}

// Message items for storing conversation history matching API shape
export interface MessageItem {
  type: "message";
  role: "user" | "assistant" | "system";
  id?: string;
  content: ContentItem[];
}

// Custom items to display in chat
export interface ToolCallItem {
  type: "tool_call";
  tool_type:
    | "file_search_call"
    | "web_search_call"
    | "function_call"
    | "mcp_call"
    | "code_interpreter_call";
  status: "in_progress" | "completed" | "failed" | "searching" | "pending_approval";
  id: string;
  name?: string | null;
  call_id?: string;
  arguments?: string;
  parsedArguments?: any;
  output?: string | null;
  code?: string;
  files?: {
    file_id: string;
    mime_type: string;
    container_id?: string;
    filename?: string;
  }[];
}

export interface McpListToolsItem {
  type: "mcp_list_tools";
  id: string;
  server_label: string;
  tools: { name: string; description?: string }[];
}

export interface McpApprovalRequestItem {
  type: "mcp_approval_request";
  id: string;
  server_label: string;
  name: string;
  arguments?: string;
}

export interface FunctionApprovalRequestItem {
  type: "function_approval_request";
  id: string;
  tool_call_id: string;
  name: string;
  arguments?: string;
}

export type Item =
  | MessageItem
  | ToolCallItem
  | McpListToolsItem
  | McpApprovalRequestItem
  | FunctionApprovalRequestItem;

const shouldRequireFunctionApproval = (toolName: string, parameters: any) => {
  if (!toolName) return false;
  if (toolName === "local_write_file") return true;
  if (toolName === "local_run_command") return true;
  if (toolName === "send_email") {
    return (parameters as any)?.dry_run === false;
  }
  return false;
};

export const handleTurn = async (
  messages: any[],
  toolsState: ToolsState,
  onMessage: (data: any) => void
) => {
  try {
    const storeState = useToolsStore.getState() as any;
    const { googleIntegrationEnabled, provider: chatProvider, apipieModel } = storeState;
    const { selectedSkill } = useConversationStore.getState();
    const selectedAgent = useAgentStore.getState().getSelectedAgent();
    const agentPref = selectedAgent?.preferredProvider;
    const provider = agentPref && agentPref !== "none" ? agentPref : chatProvider;

    let effectiveToolsState: ToolsState = toolsState;

    // Apply agent-level overrides (vector store, file search, web search, code interpreter)
    if (selectedAgent) {
      const overrides: Partial<ToolsState> = {};
      if (selectedAgent.vectorStoreId) {
        overrides.fileSearchEnabled = true;
        overrides.vectorStore = {
          id: selectedAgent.vectorStoreId,
          name: selectedAgent.vectorStoreName || "",
        } as any;
      } else if (selectedAgent.fileSearchEnabled) {
        overrides.fileSearchEnabled = true;
      }
      if (selectedAgent.webSearchEnabled) {
        overrides.webSearchEnabled = true;
      }
      if (selectedAgent.codeInterpreterEnabled) {
        overrides.codeInterpreterEnabled = true;
      }
      if (Object.keys(overrides).length > 0) {
        effectiveToolsState = { ...effectiveToolsState, ...overrides };
      }
    }
    // Preserve any agent-level overrides when falling back to storeState for MCP
    const agentOverrides = selectedAgent ? (() => {
      const o: Partial<ToolsState> = {};
      if (selectedAgent.vectorStoreId) {
        o.fileSearchEnabled = true;
        o.vectorStore = { id: selectedAgent.vectorStoreId, name: selectedAgent.vectorStoreName || "" } as any;
      } else if (selectedAgent.fileSearchEnabled) {
        o.fileSearchEnabled = true;
      }
      if (selectedAgent.webSearchEnabled) o.webSearchEnabled = true;
      if (selectedAgent.codeInterpreterEnabled) o.codeInterpreterEnabled = true;
      return Object.keys(o).length > 0 ? o : null;
    })() : null;

    if (
      (!effectiveToolsState?.mcpEnabled &&
        Array.isArray(storeState?.mcpConfigs) &&
        storeState.mcpConfigs.length > 0) ||
      (!effectiveToolsState?.mcpEnabled &&
        Array.isArray(storeState?.commandMcpConfigs) &&
        storeState.commandMcpConfigs.some((c: any) => c && c.disabled !== true))
    ) {
      effectiveToolsState = { ...(storeState as ToolsState), ...agentOverrides };
    }

    if (
      !effectiveToolsState?.mcpEnabled &&
      Array.isArray((effectiveToolsState as any)?.mcpConfigs) &&
      (effectiveToolsState as any).mcpConfigs.length === 0 &&
      Array.isArray((effectiveToolsState as any)?.commandMcpConfigs) &&
      (effectiveToolsState as any).commandMcpConfigs.length === 0 &&
      typeof storeState?.hydrateMcpConfigFromFile === "function"
    ) {
      try {
        await storeState.hydrateMcpConfigFromFile();
        effectiveToolsState = { ...(useToolsStore.getState() as ToolsState), ...agentOverrides };
      } catch {
        // ignore
      }
    }

    const { currentArtifact } = useArtifactStore.getState() as any;
    const artifactContextMessage = await (async () => {
      if (!currentArtifact) return null;

      if (currentArtifact.type === "ts_app") {
        const raw = typeof currentArtifact.code === "string" ? currentArtifact.code : "";
        const spec = raw && raw.trim() ? raw.trim() : "";
        const text = `A TypeScript app (ts_app) is currently open in the editor.\n\nIf the user requests changes to the app (pages/components/styles/dependencies), you MUST apply them by calling the function tool update_ts_app.\n\nCurrent ts_app spec JSON (files + dependencies):\n${spec || "<empty>"}`;
        return {
          type: "message",
          role: "system",
          content: [{ type: "input_text", text }],
        };
      }

      if (currentArtifact.type === "html" || currentArtifact.type === "react") {
        const code = typeof currentArtifact.code === "string" ? currentArtifact.code : "";
        if (!code.trim()) return null;
        const title = currentArtifact.title || "Untitled";
        const text = `An HTML artifact titled "${title}" is currently open in the viewer.\n\nIf the user requests changes, you MUST output the COMPLETE updated code as a fenced \`\`\`html code block. Do NOT output only the changed parts — always include the full file so the artifact viewer can replace the previous version.\n\nCurrent artifact code:\n\`\`\`\n${code}\n\`\`\``;
        return {
          type: "message",
          role: "system",
          content: [{ type: "input_text", text }],
        };
      }

      if (currentArtifact.type === "url" && typeof currentArtifact.url === "string" && currentArtifact.url.includes("127.0.0.1:8501")) {
        // Streamlit app is open — fetch the current app.py source so the AI can iterate
        let appSource = "";
        try {
          const res = await fetch("/api/streamlit/source").then((r) => r.json());
          if (res?.ok && typeof res.code === "string") appSource = res.code;
        } catch {
          // ignore — the AI will still know a Streamlit app is open
        }
        const sourceBlock = appSource.trim()
          ? `\n\nCurrent app.py source code:\n\`\`\`python\n${appSource}\n\`\`\``
          : "\n\nThe current app.py source is not available. Look at the most recent deploy_streamlit_app call in the conversation for the code.";
        const text = `A Streamlit app is currently running and displayed in the viewer (${currentArtifact.url}).\n\nIf the user requests changes to the Streamlit app, you MUST call the deploy_streamlit_app function tool with the COMPLETE updated Python code. Do NOT output only the changed parts — always provide the full app.py contents.${sourceBlock}`;
        return {
          type: "message",
          role: "system",
          content: [{ type: "input_text", text }],
        };
      }

      if (currentArtifact.type === "code") {
        const code = typeof currentArtifact.code === "string" ? currentArtifact.code : "";
        if (!code.trim()) return null;
        const lang = currentArtifact.language || "text";
        const title = currentArtifact.title || "Untitled";
        const text = `A code artifact titled "${title}" (${lang}) is currently open in the viewer.\n\nIf the user requests changes, output the COMPLETE updated code as a fenced code block with the same language tag (\`\`\`${lang}). Always include the full file.`;
        return {
          type: "message",
          role: "system",
          content: [{ type: "input_text", text }],
        };
      }

      return null;
    })();

    const effectiveMessages = artifactContextMessage
      ? [artifactContextMessage, ...(Array.isArray(messages) ? messages : [])]
      : messages;

    // Get response from the API (defined in app/api/turn_response/route.ts)
    const { memoryContext } = useConversationStore.getState();
    const { connectors, composioSelectedToolkits } = useConnectorsStore.getState();
    let response;
    try {
      response = await fetch("/api/turn_response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: effectiveMessages,
          toolsState: { ...effectiveToolsState, connectors: { ...connectors, composioSelectedToolkits } },
          googleIntegrationEnabled,
          selectedSkill,
          provider,
          apipieModel,
          agentPrompt: selectedAgent?.prompt ?? null,
          agentName: selectedAgent?.name ?? null,
          agentTemperature: selectedAgent?.temperature ?? null,
          memoryContext: memoryContext ?? null,
        }),
      });
    } catch (error) {
      console.error("Network error during API call:", error);
      onMessage({
        type: "message",
        role: "assistant",
        content: [{
          type: "input_text",
          text: "Sorry, I encountered a network error. Please check your connection and try again."
        }]
      });
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} - ${response.statusText}`);
      console.error(`Error details:`, errorText);
      
      // Try to parse the error JSON for a more useful message
      let errorDetail = `${response.status}: ${response.statusText}`;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed?.error) errorDetail = parsed.error;
        if (parsed?.stack) console.error("Server stack trace:", parsed.stack);
        if (parsed?.details) console.error("Server error details:", parsed.details);
      } catch {
        // not JSON
      }
      
      // Send an error message to the user
      onMessage({
        type: "message",
        role: "assistant",
        content: [{
          type: "input_text",
          text: `Sorry, I encountered an error: ${errorDetail}`
        }]
      });
      return;
    }

    // Reader for streaming data
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      buffer += chunkValue;

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6);
          if (dataStr === "[DONE]") {
            done = true;
            break;
          }
          try {
            const data = JSON.parse(dataStr);
            onMessage(data);
          } catch (parseError) {
            console.error("Error parsing streaming data:", parseError, "Data:", dataStr);
          }
        }
      }
    }

    // Handle any remaining data in buffer
    if (buffer && buffer.startsWith("data: ")) {
      const dataStr = buffer.slice(6);
      if (dataStr !== "[DONE]") {
        try {
          const data = JSON.parse(dataStr);
          onMessage(data);
        } catch (parseError) {
          console.error("Error parsing final buffer data:", parseError, "Data:", dataStr);
        }
      }
    }
  } catch (error) {
    console.error("Error handling turn:", error);
  }
};

export const processMessages = async () => {
  const {
    chatMessages,
    conversationItems,
    setChatMessages,
    setConversationItems,
    setAssistantLoading,
  } = useConversationStore.getState();

  const toolsState = useToolsStore.getState() as ToolsState;

  const allConversationItems = conversationItems;

  let assistantMessageContent = "";
  let functionArguments = "";
  // For streaming MCP tool call arguments
  let mcpArguments = "";

  await handleTurn(
    allConversationItems,
    toolsState,
    async ({ event, data }) => {
      switch (event) {
        case "response.output_text.delta":
        case "response.output_text.annotation.added": {
          const { delta, item_id, annotation } = data;

          let partial = "";
          if (typeof delta === "string") {
            partial = delta;
          }
          assistantMessageContent += partial;

          // If the last message isn't an assistant message, create a new one
          const lastItem = chatMessages[chatMessages.length - 1];
          if (
            !lastItem ||
            lastItem.type !== "message" ||
            lastItem.role !== "assistant" ||
            (lastItem.id && lastItem.id !== item_id)
          ) {
            chatMessages.push({
              type: "message",
              role: "assistant",
              id: item_id,
              content: [
                {
                  type: "output_text",
                  text: assistantMessageContent,
                },
              ],
            } as MessageItem);
          } else {
            const contentItem = lastItem.content[0];
            if (contentItem && contentItem.type === "output_text") {
              contentItem.text = assistantMessageContent;
              if (annotation) {
                contentItem.annotations = [
                  ...(contentItem.annotations ?? []),
                  normalizeAnnotation(annotation),
                ];
              }
            }
          }

          setChatMessages([...chatMessages]);
          setAssistantLoading(false);
          break;
        }

        case "response.output_item.added": {
          const { item } = data || {};
          // New item coming in
          if (!item || !item.type) {
            break;
          }
          setAssistantLoading(false);
          // Handle differently depending on the item type
          switch (item.type) {
            case "message": {
              const text = item.content?.text || "";
              const annotations =
                item.content?.annotations?.map(normalizeAnnotation) || [];
              chatMessages.push({
                type: "message",
                role: "assistant",
                content: [
                  {
                    type: "output_text",
                    text,
                    ...(annotations.length > 0 ? { annotations } : {}),
                  },
                ],
              });
              conversationItems.push({
                role: "assistant",
                content: [
                  {
                    type: "output_text",
                    text,
                    ...(annotations.length > 0 ? { annotations } : {}),
                  },
                ],
              });
              setChatMessages([...chatMessages]);
              setConversationItems([...conversationItems]);
              break;
            }
            case "function_call": {
              functionArguments += item.arguments || "";
              chatMessages.push({
                type: "tool_call",
                tool_type: "function_call",
                status: "in_progress",
                id: item.id,
                name: item.name, // function name,e.g. "get_weather"
                arguments: item.arguments || "",
                parsedArguments: {},
                output: null,
              });
              setChatMessages([...chatMessages]);
              break;
            }
            case "web_search_call": {
              chatMessages.push({
                type: "tool_call",
                tool_type: "web_search_call",
                status: item.status || "in_progress",
                id: item.id,
              });
              setChatMessages([...chatMessages]);
              break;
            }
            case "file_search_call": {
              chatMessages.push({
                type: "tool_call",
                tool_type: "file_search_call",
                status: item.status || "in_progress",
                id: item.id,
              });
              setChatMessages([...chatMessages]);
              break;
            }
            case "mcp_call": {
              mcpArguments = item.arguments || "";
              chatMessages.push({
                type: "tool_call",
                tool_type: "mcp_call",
                status: "in_progress",
                id: item.id,
                name: item.name,
                arguments: item.arguments || "",
                parsedArguments: item.arguments ? parse(item.arguments) : {},
                output: null,
              });
              setChatMessages([...chatMessages]);
              break;
            }
            case "code_interpreter_call": {
              chatMessages.push({
                type: "tool_call",
                tool_type: "code_interpreter_call",
                status: item.status || "in_progress",
                id: item.id,
                code: "",
                files: [],
              });
              setChatMessages([...chatMessages]);
              break;
            }
          }
          break;
        }

        case "response.output_item.done": {
          // After output item is done, adding tool call ID
          const { item } = data || {};
          const toolCallMessage = chatMessages.find((m) => m.id === item.id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.call_id = item.call_id;
            setChatMessages([...chatMessages]);
          }
          conversationItems.push(item);
          setConversationItems([...conversationItems]);

          if (
            toolCallMessage &&
            toolCallMessage.type === "tool_call" &&
            toolCallMessage.tool_type === "code_interpreter_call"
          ) {
            // Attempt to extract generated files from various possible Shapes.
            // Different SDK/event versions may nest this differently.
            const rawFiles: any[] =
              (Array.isArray((item as any)?.files) && (item as any).files) ||
              (Array.isArray((item as any)?.output?.files) && (item as any).output.files) ||
              (Array.isArray((item as any)?.outputs) && (item as any).outputs) ||
              (Array.isArray((item as any)?.output) && (item as any).output) ||
              [];

            const files = rawFiles
              .map((f: any) => {
                const fileId = (f?.file_id ?? f?.fileId ?? f?.id) as any;
                if (!fileId) return null;
                const containerId = (f?.container_id ?? f?.containerId ?? f?.container?.id) as any;
                const mime = ((f?.mime_type ?? f?.mimeType ?? f?.mime) || "application/octet-stream") as any;
                const filename = (f?.filename ?? f?.name) as any;
                return {
                  file_id: String(fileId),
                  mime_type: String(mime),
                  ...(containerId ? { container_id: String(containerId) } : {}),
                  ...(filename ? { filename: String(filename) } : {}),
                };
              })
              .filter(Boolean);

            if (files.length > 0) {
              toolCallMessage.files = files as any;
              setChatMessages([...chatMessages]);

              try {
                const { currentArtifact, addArtifact } = useArtifactStore.getState() as any;
                if (!currentArtifact && typeof addArtifact === "function") {
                  const first = (files as any[])[0];
                  if (first?.file_id) {
                    const url = `/api/container_files/content?file_id=${encodeURIComponent(first.file_id)}${
                      first.container_id ? `&container_id=${encodeURIComponent(first.container_id)}` : ""
                    }${first.filename ? `&filename=${encodeURIComponent(first.filename)}` : ""}`;
                    addArtifact({
                      id: `file-${first.file_id}`,
                      type: "file",
                      title: first.filename || "File",
                      file_id: String(first.file_id),
                      ...(first.container_id ? { container_id: String(first.container_id) } : {}),
                      ...(first.filename ? { filename: String(first.filename) } : {}),
                      mime_type: String(first.mime_type || "application/octet-stream"),
                      url,
                    } as any);
                  }
                }
              } catch {
              }
            }
          }

          if (
            toolCallMessage &&
            toolCallMessage.type === "tool_call" &&
            toolCallMessage.tool_type === "function_call"
          ) {
            const toolName = typeof toolCallMessage.name === "string" ? toolCallMessage.name : "";
            const { approvedFunctionTools } = useToolsStore.getState();
            const alwaysApproved =
              Array.isArray(approvedFunctionTools) &&
              toolName &&
              approvedFunctionTools.includes(toolName);
            const needsApproval = shouldRequireFunctionApproval(toolName, toolCallMessage.parsedArguments);

            if (needsApproval && !alwaysApproved) {
              toolCallMessage.status = "pending_approval" as any;
              setChatMessages([...chatMessages]);
              chatMessages.push({
                type: "function_approval_request",
                id: `function-approval-${toolCallMessage.id}`,
                tool_call_id: toolCallMessage.id,
                name: toolName,
                arguments:
                  typeof toolCallMessage.arguments === "string" && toolCallMessage.arguments.trim()
                    ? toolCallMessage.arguments
                    : (() => {
                        try {
                          return JSON.stringify(toolCallMessage.parsedArguments ?? {}, null, 2);
                        } catch {
                          return "";
                        }
                      })(),
              });
              setChatMessages([...chatMessages]);
              break;
            }

            // Handle tool call (execute function)
            toolCallMessage.status = "in_progress";
            setChatMessages([...chatMessages]);
            const toolResult = await handleTool(
              toolCallMessage.name as keyof typeof functionsMap,
              toolCallMessage.parsedArguments
            );

            // Record tool output
            toolCallMessage.status = "completed";
            toolCallMessage.output = JSON.stringify(toolResult);
            setChatMessages([...chatMessages]);

            if (toolName === "launch_streamlit_app" || toolName === "deploy_streamlit_app") {
              try {
                const ok = (toolResult as any)?.ok === true;
                const baseUrl = typeof (toolResult as any)?.url === "string" ? String((toolResult as any).url) : "";
                if (ok && baseUrl) {
                  // Use cache-busting param for the iframe URL but keep a stable artifact ID
                  const url = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
                  const stableId = "streamlit-app";
                  const artifact = {
                    id: stableId,
                    type: "url",
                    title: "Streamlit App",
                    url,
                  } as any;
                  const { upsertArtifact, setCurrentArtifact } = useArtifactStore.getState() as any;
                  if (typeof upsertArtifact === "function") upsertArtifact(artifact);
                  if (typeof setCurrentArtifact === "function") setCurrentArtifact(artifact);
                }
              } catch {
                // ignore
              }
            }

            conversationItems.push({
              type: "function_call_output",
              call_id: toolCallMessage.call_id,
              status: "completed",
              output: JSON.stringify(toolResult),
            });
            setConversationItems([...conversationItems]);

            // Create another turn after tool output has been added
            await processMessages();
          }
          if (
            toolCallMessage &&
            toolCallMessage.type === "tool_call" &&
            toolCallMessage.tool_type === "mcp_call"
          ) {
            toolCallMessage.output = item.output;
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.function_call_arguments.delta": {
          // Streaming arguments delta to show in the chat
          functionArguments += data.delta || "";
          let parsedFunctionArguments = {};

          const toolCallMessage = chatMessages.find(
            (m) => m.id === data.item_id
          );
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.arguments = functionArguments;
            try {
              if (functionArguments.length > 0) {
                parsedFunctionArguments = parse(functionArguments);
              }
              toolCallMessage.parsedArguments = parsedFunctionArguments;
            } catch {
              // partial JSON can fail parse; ignore
            }
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.function_call_arguments.done": {
          // This has the full final arguments string
          const { item_id, arguments: finalArgs } = data;

          functionArguments = finalArgs;

          // Mark the tool_call as "completed" and parse the final JSON
          const toolCallMessage = chatMessages.find((m) => m.id === item_id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.arguments = finalArgs;
            toolCallMessage.parsedArguments = parse(finalArgs);
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }
        // Streaming MCP tool call arguments
        case "response.mcp_call_arguments.delta": {
          // Append delta to MCP arguments
          mcpArguments += data.delta || "";
          let parsedMcpArguments: any = {};
          const toolCallMessage = chatMessages.find(
            (m) => m.id === data.item_id
          );
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.arguments = mcpArguments;
            try {
              if (mcpArguments.length > 0) {
                parsedMcpArguments = parse(mcpArguments);
              }
              toolCallMessage.parsedArguments = parsedMcpArguments;
            } catch {
              // partial JSON can fail parse; ignore
            }
            setChatMessages([...chatMessages]);
          }
          break;
        }
        case "response.mcp_call_arguments.done": {
          // Final MCP arguments string received
          const { item_id, arguments: finalArgs } = data;
          mcpArguments = finalArgs;
          const toolCallMessage = chatMessages.find((m) => m.id === item_id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.arguments = finalArgs;
            toolCallMessage.parsedArguments = parse(finalArgs);
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.web_search_call.completed": {
          const { item_id, output } = data;
          const toolCallMessage = chatMessages.find((m) => m.id === item_id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.output = output;
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.file_search_call.completed": {
          const { item_id, output } = data;
          const toolCallMessage = chatMessages.find((m) => m.id === item_id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.output = output;
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.code_interpreter_call_code.delta": {
          const { delta, item_id } = data;
          const toolCallMessage = [...chatMessages]
            .reverse()
            .find(
              (m) =>
                m.type === "tool_call" &&
                m.tool_type === "code_interpreter_call" &&
                m.status !== "completed" &&
                m.id === item_id
            ) as ToolCallItem | undefined;
          // Accumulate deltas to show the code streaming
          if (toolCallMessage) {
            toolCallMessage.code = (toolCallMessage.code || "") + delta;
            setChatMessages([...chatMessages]);
            try {
              const { upsertArtifact } = useArtifactStore.getState() as any;
              if (typeof upsertArtifact === "function") {
                upsertArtifact(
                  {
                    id: `code-interpreter-${item_id}`,
                    type: "code",
                    title: "Code interpreter",
                    code: toolCallMessage.code || "",
                    language: "python",
                  } as any,
                  { onlyIfExists: true }
                );
              }
            } catch {
            }
          }
          break;
        }

        case "response.code_interpreter_call_code.done": {
          const { code, item_id } = data;
          const toolCallMessage = [...chatMessages]
            .reverse()
            .find(
              (m) =>
                m.type === "tool_call" &&
                m.tool_type === "code_interpreter_call" &&
                m.status !== "completed" &&
                m.id === item_id
            ) as ToolCallItem | undefined;

          // Mark the call as completed and set the code
          if (toolCallMessage) {
            toolCallMessage.code = code;
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);

            try {
              const { upsertArtifact } = useArtifactStore.getState() as any;
              if (typeof upsertArtifact === "function") {
                upsertArtifact(
                  {
                    id: `code-interpreter-${item_id}`,
                    type: "code",
                    title: "Code interpreter",
                    code: toolCallMessage.code || "",
                    language: "python",
                  } as any,
                  { onlyIfExists: true }
                );
              }
            } catch {
              // ignore
            }
          }
          break;
        }

        case "response.code_interpreter_call.completed": {
          const { item_id } = data;
          const toolCallMessage = chatMessages.find(
            (m) => m.type === "tool_call" && m.id === item_id
          ) as ToolCallItem | undefined;
          if (toolCallMessage) {
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.completed": {
          console.log("response completed", data);
          const { response } = data;

          // Handle MCP tools list (append all lists, not just the first)
          const mcpListToolsMessages = response.output.filter(
            (m: Item) => m.type === "mcp_list_tools"
          ) as McpListToolsItem[];

          if (mcpListToolsMessages && mcpListToolsMessages.length > 0) {
            for (const msg of mcpListToolsMessages) {
              chatMessages.push({
                type: "mcp_list_tools",
                id: msg.id,
                server_label: msg.server_label,
                tools: msg.tools || [],
              });
            }
            setChatMessages([...chatMessages]);
          }

          // Handle MCP approval request
          const mcpApprovalRequestMessage = response.output.find(
            (m: Item) => m.type === "mcp_approval_request"
          );

          if (mcpApprovalRequestMessage) {
            chatMessages.push({
              type: "mcp_approval_request",
              id: mcpApprovalRequestMessage.id,
              server_label: mcpApprovalRequestMessage.server_label,
              name: mcpApprovalRequestMessage.name,
              arguments: mcpApprovalRequestMessage.arguments,
            });
            setChatMessages([...chatMessages]);
          }

          try {
            const { selectedSkill, activeConversationId, setActiveConversationId } =
              useConversationStore.getState();

            const firstUserMessage = chatMessages.find(
              (m: any) => m?.type === "message" && m?.role === "user" && m?.content?.[0]?.text
            ) as any;
            const title =
              typeof firstUserMessage?.content?.[0]?.text === "string"
                ? String(firstUserMessage.content[0].text).slice(0, 60)
                : undefined;

            const res = await fetch("/api/conversation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: activeConversationId,
                title,
                state: {
                  chatMessages,
                  conversationItems,
                  selectedSkill,
                },
              }),
            });

            const saved = await res.json().catch(() => null);
            const returnedId = typeof saved?.id === "string" ? saved.id : null;
            if (!activeConversationId && returnedId) {
              setActiveConversationId(returnedId);
              try {
                if (typeof window !== "undefined") {
                  localStorage.setItem("activeConversationId", returnedId);
                }
              } catch {
                // ignore storage failures
              }
            }
          } catch {
            // ignore persistence failures
          }

          break;
        }

        // Handle other events as needed
      }
    }
  );
};

export type FunctionApprovalAction = "deny" | "allow_once" | "always_allow";

export const handleFunctionApprovalResponse = async (
  action: FunctionApprovalAction,
  approvalRequestId: string
) => {
  const {
    chatMessages,
    conversationItems,
    setChatMessages,
    setConversationItems,
  } = useConversationStore.getState();

  const approvalIndex = chatMessages.findIndex(
    (m) => m?.type === "function_approval_request" && m?.id === approvalRequestId
  );
  const approval = (approvalIndex >= 0 ? chatMessages[approvalIndex] : undefined) as
    | FunctionApprovalRequestItem
    | undefined;
  if (!approval) return;

  const toolCall = chatMessages.find(
    (m) => m?.type === "tool_call" && m?.id === approval.tool_call_id
  ) as ToolCallItem | undefined;
  if (!toolCall) return;

  if (approvalIndex >= 0) {
    chatMessages.splice(approvalIndex, 1);
    setChatMessages([...chatMessages]);
  }

  const toolName = typeof approval.name === "string" ? approval.name : "";
  const callId = typeof toolCall.call_id === "string" ? toolCall.call_id : "";
  if (!callId) return;

  if (action === "always_allow") {
    try {
      const { approveFunctionTool } = useToolsStore.getState();
      if (typeof approveFunctionTool === "function") {
        approveFunctionTool(toolName);
      }
    } catch {
      // ignore
    }
  }

  if (action === "deny") {
    const denied = { error: "User denied tool execution" };
    toolCall.status = "failed";
    toolCall.output = JSON.stringify(denied);
    setChatMessages([...chatMessages]);
    conversationItems.push({
      type: "function_call_output",
      call_id: callId,
      status: "completed",
      output: JSON.stringify(denied),
    });
    setConversationItems([...conversationItems]);
    await processMessages();
    return;
  }

  toolCall.status = "in_progress";
  setChatMessages([...chatMessages]);

  try {
    const toolResult = await handleTool(
      toolCall.name as keyof typeof functionsMap,
      toolCall.parsedArguments
    );

    toolCall.status = "completed";
    toolCall.output = JSON.stringify(toolResult);
    setChatMessages([...chatMessages]);
    conversationItems.push({
      type: "function_call_output",
      call_id: callId,
      status: "completed",
      output: JSON.stringify(toolResult),
    });
    setConversationItems([...conversationItems]);
    await processMessages();
  } catch (e) {
    const err = {
      error: e instanceof Error ? e.message : "Tool execution failed",
    };
    toolCall.status = "failed";
    toolCall.output = JSON.stringify(err);
    setChatMessages([...chatMessages]);
    conversationItems.push({
      type: "function_call_output",
      call_id: callId,
      status: "completed",
      output: JSON.stringify(err),
    });
    setConversationItems([...conversationItems]);
    await processMessages();
  }
};
