import { getDeveloperPrompt, MODEL } from "@/config/constants";
import { getTools } from "@/lib/tools/tools";
import { getSkill, listSkills } from "@/lib/skills-registry";
import OpenAI from "openai";
import { withSentryAppRouter, reportApiError } from "@/lib/sentry-server";

function extractTextFromMessages(messages: any[]): string {
  const arr = Array.isArray(messages) ? messages : [];
  for (let i = arr.length - 1; i >= 0; i--) {
    const m = arr[i];
    if (!m || typeof m !== "object") continue;
    if (m.role !== "user") continue;

    const content = (m as any).content;
    if (typeof content === "string") return content;

    if (Array.isArray(content)) {
      const texts: string[] = [];
      for (const part of content ) {
        if (!part || typeof part !== "object") continue;
        if (typeof (part as any).text === "string") texts.push(String((part as any).text));
      }
      if (texts.length) return texts.join("\n");
    }
  }
  return "";
}

function normalizeTokens(s: string): string[] {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);
}

async function inferSkillName(messages: any[]): Promise<string | null> {
  const query = extractTextFromMessages(messages).toLowerCase();
  if (!query.trim()) return null;

  const skills = await listSkills();
  if (!skills.length) return null;

  // Targeted aliases for common intents.
  const aliasBoosts: Array<{ name: string; patterns: RegExp[] }> = [
    {
      name: "hr-supported-living",
      patterns: [
        /\bhr\b/i,
        /human\s+resources/i,
        /supported\s+living/i,
        /title\s*17/i,
      ],
    },
    {
      name: "web-artifacts-builder",
      patterns: [
        /\bshadcn\b/i,
        /shadcn\/ui/i,
        /\btailwind\b/i,
        /\bradix\b/i,
        /\breact\b/i,
        /\bvite\b/i,
        /\bartifact\b/i,
      ],
    },
    {
      name: "frontend-design",
      patterns: [
        /\bfrontend\b/i,
        /\bui\b/i,
        /\blanding\s+page\b/i,
        /\bweb\s*page\b/i,
        /\bwebsite\b/i,
        /\bhtml\b/i,
        /\bcss\b/i,
        /\bjavascript\b/i,
        /\bsingle\s*file\b/i,
        /\bone\s+file\b/i,
        /\bone\s+html\b/i,
        /single\s+html\s+file/i,
        /html\s*\+\s*css\s*\+\s*js/i,
      ],
    },
  ];

  const queryTokens = new Set(normalizeTokens(query));

  let best: { name: string; score: number } | null = null;
  for (const s of skills) {
    let score = 0;

    const nameLc = String(s.name || "").toLowerCase();
    const descLc = String(s.description || "").toLowerCase();

    for (const alias of aliasBoosts) {
      if (alias.name === nameLc && alias.patterns.some((p) => p.test(query))) {
        score += 50;
      }
    }

    // Direct name mention.
    if (nameLc && query.includes(nameLc.replace(/-/g, " "))) score += 20;

    // Token overlap with name/description.
    const skillTokens = new Set([...normalizeTokens(nameLc), ...normalizeTokens(descLc)]);
    for (const t of Array.from(queryTokens)) {
      if (skillTokens.has(t)) score += 2;
    }

    if (!best || score > best.score) best = { name: s.name, score };
  }

  // Require at least a small signal to avoid injecting unrelated skills.
  if (!best || best.score < 6) return null;
  return best.name;
}

// Helper function to generate consistent safe IDs
function generateSafeId(originalId: string): string {
  // Already safe if starts with fc_ and contains only valid characters
  if (/^fc_[a-zA-Z0-9_]+$/.test(originalId)) {
    return originalId;
  }
  const safeId = `fc_${originalId.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20)}`;
  return safeId;
}

// Sanitize messages to ensure all annotations have required fields and images are properly formatted
function sanitizeMessages(messages: any[]): any[] {
  return (messages ?? []).map((msg: any) => {
    if (!msg || typeof msg !== "object") return msg;

    // Fix ID format for OpenAI Realtime API - generate valid IDs
    if (msg.type === "function_call" && typeof msg.id === "string") {
      const safeId = generateSafeId(msg.id);
      const result: any = { ...msg, id: safeId };
      if (typeof msg.call_id === "string") {
        result.call_id = generateSafeId(msg.call_id);
      }
      return result;
    }

    if (msg.type === "function_call_output" && typeof msg.call_id === "string") {
      const safeId = generateSafeId(msg.call_id);
      return {
        ...msg,
        call_id: safeId
      };
    }

    if (msg.content && Array.isArray(msg.content)) {
      return {
        ...msg,
        content: msg.content.map((contentItem: any) => {
          // Handle image content - convert 'image' field to 'image_url' field for API
          if (contentItem.type === "input_image" && contentItem.image) {
            return {
              type: "input_image",
              image_url: contentItem.image, // API expects 'image_url' field with base64 data URL
              detail: contentItem.detail || "high",
            };
          }

          // Strip annotations from content items before sending to the Responses API.
          // The client may include fields (e.g. container_id) that are not accepted in input.
          if (contentItem && typeof contentItem === "object" && "annotations" in contentItem) {
            const rest = { ...contentItem };
            delete (rest as any).annotations;
            return rest;
          }

          // Strip very large base64 data URLs from text content to avoid blowing the model context window.
          // The UI may persist generated images as data: URLs inside markdown.
          if (
            contentItem &&
            typeof contentItem === "object" &&
            typeof (contentItem as any).text === "string"
          ) {
            const text = String((contentItem as any).text);
            const next = text.replace(
              /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g,
              (m) => (m.length > 2048 ? "data:image/*;base64,<omitted>" : m)
            );
            if (next !== text) {
              return { ...contentItem, text: next };
            }
          }

          return contentItem;
        }),
      };
    }
    return msg;
  });
}

// Remove function_call items that have no matching function_call_output.
// The OpenAI Responses API rejects conversations with dangling tool calls.
// This must handle both sanitized IDs (fc_*) and raw OpenAI IDs (call_*).
function stripOrphanedFunctionCalls(items: any[]): any[] {
  if (!Array.isArray(items)) return items;

  // Collect ALL possible call_ids from function_call_output items (both original and safe)
  const outputCallIds = new Set<string>();
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    if (item.type === "function_call_output") {
      if (typeof item.call_id === "string") outputCallIds.add(item.call_id);
    }
  }

  return items.filter((item) => {
    if (!item || typeof item !== "object") return true;
    if (item.type !== "function_call") return true;

    // Gather all possible IDs this function_call might be known by
    const ids: string[] = [];
    if (typeof item.call_id === "string" && item.call_id) ids.push(item.call_id);
    if (typeof item.id === "string" && item.id) ids.push(item.id);

    // Also check the safe-ID versions in case outputs were sanitized but calls weren't
    for (const raw of [...ids]) {
      const safe = `fc_${raw.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20)}`;
      if (safe !== raw) ids.push(safe);
    }

    // Keep only if at least one ID has a matching output
    if (ids.length === 0) return true; // no ID to match, keep it
    return ids.some((id) => outputCallIds.has(id));
  });
}

function sanitizeToolOutputs(items: any[]): any[] {
  return (items ?? []).map((item: any) => {
    if (!item || typeof item !== "object") return item;

    if (item.type === "function_call_output" && typeof item.output === "string") {
      const raw = item.output;
      // Attempt JSON parse so we can surgically replace dataUrl fields.
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && typeof (parsed as any).dataUrl === "string") {
          const dataUrl = String((parsed as any).dataUrl);
          if (dataUrl.startsWith("data:image/") && dataUrl.length > 2048) {
            (parsed as any).dataUrl = "data:image/*;base64,<omitted>";
            return { ...item, output: JSON.stringify(parsed) };
          }
        }
      } catch {
        // ignore
      }

      const compacted = raw.replace(
        /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g,
        (m: string) => (m.length > 2048 ? "data:image/*;base64,<omitted>" : m)
      );
      if (compacted !== raw) {
        return { ...item, output: compacted };
      }
    }

    return item;
  });
}


function toApipieChatMessages(messages: any[]): Array<{ role: string; content: any }> {
  const out: Array<{ role: string; content: any }> = [];
  for (const msg of messages ?? []) {
    if (!msg || typeof msg !== "object") continue;

    if (msg.type === "function_call") {
      const name = typeof msg.name === "string" ? msg.name : "";
      const rawArgs = typeof msg.arguments === "string" ? msg.arguments : "";
      const id = typeof msg.call_id === "string" && msg.call_id.trim() ? msg.call_id.trim() : (typeof msg.id === "string" ? msg.id : "");
      if (name && id) {
        out.push({
          role: "assistant",
          content: "",
          tool_calls: [
            {
              id,
              type: "function",
              function: {
                name,
                arguments: rawArgs || "{}",
              },
            },
          ],
        } as any);
      }
      continue;
    }

    if (msg.type === "function_call_output") {
      const toolCallId = typeof msg.call_id === "string" ? msg.call_id : "";
      const content = typeof msg.output === "string" ? msg.output : "";
      if (toolCallId) {
        out.push({ role: "tool", content, tool_call_id: toolCallId } as any);
      }
      continue;
    }

    const role = typeof msg.role === "string" ? msg.role : "user";

    if (typeof msg.content === "string") {
      out.push({ role, content: msg.content });
      continue;
    }

    if (Array.isArray(msg.content)) {
      const parts: any[] = [];
      for (const c of msg.content) {
        if (!c || typeof c !== "object") continue;

        if ((c.type === "input_text" || c.type === "output_text" || c.type === "text") && typeof c.text === "string") {
          const t = c.text.trim();
          if (t) parts.push({ type: "text", text: t });
          continue;
        }

        if (c.type === "input_image") {
          const url =
            (typeof c.image_url === "object" && typeof c.image_url?.url === "string" && c.image_url.url) ||
            (typeof c.image_url === "string" && c.image_url) ||
            (typeof c.image === "string" && c.image) ||
            (typeof c.url === "string" && c.url) ||
            "";
          if (url) {
            parts.push({ type: "image_url", image_url: { url } });
          }
          continue;
        }

        if (c.type === "image_url") {
          const url =
            (typeof c.image_url === "object" && typeof c.image_url?.url === "string" && c.image_url.url) ||
            (typeof c.image_url === "string" && c.image_url) ||
            "";
          if (url) {
            parts.push({ type: "image_url", image_url: { url } });
          }
          continue;
        }
      }

      out.push({ role, content: parts.length ? parts : "" });
      continue;
    }

    out.push({ role, content: "" });
  }
  return out;
}

export const POST = withSentryAppRouter(async (request: Request) => {
  const { messages, toolsState, selectedSkill, provider, apipieModel, agentPrompt, agentName, agentTemperature, memoryContext } = await request.json();
  
  try {
    if (provider === "apipie") {
      const apiKey = process.env.APIPIE_API_KEY;
      
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Missing APIPIE_API_KEY" }),
          { status: 500 }
        );
      }

      const toolsForApipie = await (async () => {
        try {
          const tools = await getTools(toolsState);
          const functionTools = (tools ?? [])
            .filter((t: any) => t && typeof t === "object" && t.type === "function")
            .map((t: any) => ({
              type: "function",
              function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              },
            }))
            .filter((t: any) => t?.function?.name);

          // Apipie uses Chat Completions API which only supports function tools.
          // The native web_search tool (type "web_search") gets filtered out above.
          // Add a web_search_query function tool so apipie models can search the web.
          if (toolsState?.webSearchEnabled) {
            const hasWebSearch = functionTools.some(
              (t: any) => t?.function?.name === "web_search_query"
            );
            if (!hasWebSearch) {
              functionTools.push({
                type: "function",
                function: {
                  name: "web_search_query",
                  description:
                    "Search the web for current information. Use this when the user asks about recent events, news, real-time data, or anything that requires up-to-date information from the internet.",
                  parameters: {
                    type: "object",
                    properties: {
                      query: {
                        type: "string",
                        description: "The search query to look up on the web",
                      },
                    },
                    required: ["query"],
                    additionalProperties: false,
                  },
                },
              });
            }
          }

          return functionTools;
        } catch {
          return [];
        }
      })();

      let instructions = getDeveloperPrompt();
      if (typeof memoryContext === "string" && memoryContext.trim()) {
        instructions = `${instructions}\n\n# User Memory Context\n\nHere is what you know about this user from previous conversations:\n${memoryContext.trim()}`;
      }
      if (typeof agentPrompt === "string" && agentPrompt.trim()) {
        const label = typeof agentName === "string" && agentName.trim() ? agentName.trim() : "Custom Agent";
        instructions = `# Agent: ${label}\n\n${agentPrompt.trim()}\n\n---\n\n${instructions}`;
      }
      const effectiveSkill =
        selectedSkill && typeof selectedSkill === "string"
          ? selectedSkill
          : await inferSkillName(messages);
      if (effectiveSkill && typeof effectiveSkill === "string") {
        try {
          const skill = await getSkill(effectiveSkill);
          if (skill?.content) {
            instructions = `${instructions}\n\n# Skill: ${skill.name}\n\n${skill.content}`;
          }
        } catch (e) {
          console.error("Failed to load selected skill", e);
        }
      }

      // Prepend developer instructions as a system message
      // Sanitize messages and strip orphaned function calls to prevent tool output errors
      const sanitizedMessages = stripOrphanedFunctionCalls(sanitizeToolOutputs(sanitizeMessages(messages)));
      const apipieMessages = [
        { role: "system", content: instructions },
        ...toApipieChatMessages(sanitizedMessages),
      ];

      // Extract provider from model name, but use only the model name for the API
      const providerName = apipieModel.split("::")[0];
      const modelName = apipieModel.split("::")[1] || apipieModel;
      
      // APIPie expects just the model name without provider prefix
      const finalModelName = modelName || apipieModel;
      
      const requestBody = {
        messages: apipieMessages,
        model: finalModelName,
        stream: true,
        temperature: typeof agentTemperature === "number" ? agentTemperature : 1,
        top_p: 1,
        max_tokens: 4096,
        ...(toolsForApipie.length > 0 ? { tools: toolsForApipie, tool_choice: "auto" } : {}),
      };

      const apipieRes = await fetch("https://apipie.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!apipieRes.ok) {
        const errText = await apipieRes.text().catch(() => "");
        const status = typeof apipieRes.status === "number" && apipieRes.status >= 400 ? apipieRes.status : 502;
        return new Response(
          JSON.stringify({
            error: "apipie.ai request failed",
            upstream_status: apipieRes.status,
            upstream_body: errText || null,
          }),
          {
            status,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Stream APIPie SSE chunks and translate to our event format
      const encoder = new TextEncoder();
      const itemId = `apipie-${Date.now()}`;
      // Track tool calls being assembled across chunks
      const pendingToolCalls: Record<number, { id: string; name: string; arguments: string }> = {};

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const reader = apipieRes.body!.getReader();
            const decoder = new TextDecoder();
            let sseBuffer = "";
            let textStarted = false;

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              sseBuffer += decoder.decode(value, { stream: true });

              const lines = sseBuffer.split("\n");
              sseBuffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data: ")) continue;
                const payload = trimmed.slice(6);
                if (payload === "[DONE]") continue;

                let chunk: any;
                try { chunk = JSON.parse(payload); } catch { continue; }

                const delta = chunk?.choices?.[0]?.delta;
                if (!delta) continue;

                // Handle text content deltas
                const textDelta = typeof delta.content === "string" ? delta.content : "";
                if (textDelta) {
                  if (!textStarted) {
                    textStarted = true;
                  }
                  controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({
                      event: "response.output_text.delta",
                      data: { delta: textDelta, item_id: itemId },
                    })}\n\n`
                  ));
                }

                // Handle tool call deltas (streamed incrementally)
                if (Array.isArray(delta.tool_calls)) {
                  for (const tc of delta.tool_calls) {
                    const idx = typeof tc.index === "number" ? tc.index : 0;
                    if (!pendingToolCalls[idx]) {
                      pendingToolCalls[idx] = {
                        id: tc.id || `apipie-call-${Date.now()}-${idx}`,
                        name: tc.function?.name || "",
                        arguments: "",
                      };
                    }
                    if (tc.id) pendingToolCalls[idx].id = tc.id;
                    if (tc.function?.name) pendingToolCalls[idx].name = tc.function.name;
                    if (tc.function?.arguments) pendingToolCalls[idx].arguments += tc.function.arguments;
                  }
                }
              }
            }

            // Emit assembled tool calls after stream ends
            const toolCallEntries = Object.values(pendingToolCalls).filter(tc => tc.name);
            for (const tc of toolCallEntries) {
              const callId = tc.id || `apipie-call-${Date.now()}`;
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({
                  event: "response.output_item.added",
                  data: {
                    item: {
                      type: "function_call",
                      id: callId,
                      call_id: callId,
                      name: tc.name,
                      arguments: tc.arguments || "{}",
                    },
                  },
                })}\n\n`
              ));
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({
                  event: "response.function_call_arguments.done",
                  data: { item_id: callId, arguments: tc.arguments || "{}" },
                })}\n\n`
              ));
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({
                  event: "response.output_item.done",
                  data: {
                    item: {
                      type: "function_call",
                      id: callId,
                      call_id: callId,
                      name: tc.name,
                      arguments: tc.arguments || "{}",
                    },
                  },
                })}\n\n`
              ));
            }

            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({
                event: "response.completed",
                data: { response: { output: [] } },
              })}\n\n`
            ));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            console.error("APIPie streaming error:", err);
            controller.error(err);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    console.log("Using OpenAI provider - Processing request...");
    
    const tools = await getTools(toolsState);

    if (process.env.DEBUG_TURN_RESPONSE === "true") {
      console.log("Tools:", tools);
      console.log("Received messages:", JSON.stringify(messages, null, 2));
    } else {
      console.log(
        "Tools:",
        (tools ?? [])
          .map((t: any) => (t?.type === "function" ? `function:${t.name}` : t?.type))
          .filter(Boolean)
      );
    }

    // Sanitize messages to ensure annotations have required fields
    // Strip orphaned function calls (no matching output) to prevent 400 errors
    const sanitizedMessages = stripOrphanedFunctionCalls(sanitizeToolOutputs(sanitizeMessages(messages)));
    
    if (process.env.DEBUG_TURN_RESPONSE === "true") {
      console.log("Sanitized messages:", JSON.stringify(sanitizedMessages, null, 2));
    }

    const openai = new OpenAI();

    let instructions = getDeveloperPrompt();
    if (typeof memoryContext === "string" && memoryContext.trim()) {
      instructions = `${instructions}\n\n# User Memory Context\n\nHere is what you know about this user from previous conversations:\n${memoryContext.trim()}`;
    }
    if (typeof agentPrompt === "string" && agentPrompt.trim()) {
      const label = typeof agentName === "string" && agentName.trim() ? agentName.trim() : "Custom Agent";
      instructions = `# Agent: ${label}\n\n${agentPrompt.trim()}\n\n---\n\n${instructions}`;
    }
    const effectiveSkill =
      selectedSkill && typeof selectedSkill === "string"
        ? selectedSkill
        : await inferSkillName(messages);
    if (effectiveSkill && typeof effectiveSkill === "string") {
      try {
        const skill = await getSkill(effectiveSkill);
        if (skill?.content) {
          instructions = `${instructions}\n\n# Skill: ${skill.name}\n\n${skill.content}`;
        }
      } catch (e) {
        console.error("Failed to load selected skill", e);
      }
    }

    const createEvents = async (toolsForCall: any[]) => {
      return openai.responses.create({
        model: MODEL,
        input: sanitizedMessages,
        instructions,
        tools: toolsForCall,
        stream: true,
        parallel_tool_calls: false,
      });
    };

    const isMcpToolsFailure = (error: any) => {
      const msg =
        (typeof error?.message === "string" && error.message) ||
        (typeof error?.error?.message === "string" && error.error.message) ||
        "";
      const param = error?.param || error?.error?.param;
      return (
        param === "tools" &&
        typeof msg === "string" &&
        msg.toLowerCase().includes("mcp") &&
        msg.toLowerCase().includes("retrieving tool list")
      );
    };

    // Extract the failing MCP server label from the error message so we can
    // surgically remove only that server instead of dropping ALL MCP tools.
    const getFailingMcpServer = (error: any): string | null => {
      const msg =
        (typeof error?.message === "string" && error.message) ||
        (typeof error?.error?.message === "string" && error.error.message) ||
        "";
      const match = msg.match(/MCP server:\s*'([^']+)'/i);
      return match ? match[1] : null;
    };

    const removeFailingMcpTools = (allTools: any[], error: any): any[] => {
      const failingServer = getFailingMcpServer(error);
      if (failingServer) {
        console.log(`[MCP] Removing only failing server: '${failingServer}', keeping other MCP tools`);
        return allTools.filter((t: any) => {
          if (t?.type !== "mcp") return true;
          return t.server_label !== failingServer;
        });
      }
      // Can't identify the failing server — remove all MCP tools as last resort
      console.warn("[MCP] Could not identify failing server, removing all MCP tools");
      return allTools.filter((t: any) => t?.type !== "mcp");
    };

    // Preflight the stream by reading the first event. If MCP tool listing fails,
    // retry automatically without MCP tools (keeps local function tools working).
    let events = await createEvents(tools);
    let iterator = events[Symbol.asyncIterator]();
    let firstResult: IteratorResult<any> | null = null;
    let retriedWithoutMcp = false;

    try {
      firstResult = await iterator.next();
    } catch (error) {
      if (isMcpToolsFailure(error)) {
        console.error("MCP tool listing failed; retrying without failing server", error);
        const fixedTools = removeFailingMcpTools(tools, error);
        events = await createEvents(fixedTools);
        iterator = events[Symbol.asyncIterator]();
        firstResult = await iterator.next();
        retriedWithoutMcp = true;
      } else {
        throw error;
      }
    }

    // Create a ReadableStream that emits SSE data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (firstResult && !firstResult.done) {
            const firstEvent = firstResult.value;
            const firstData = JSON.stringify({
              event: firstEvent.type,
              data: firstEvent,
            });
            controller.enqueue(`data: ${firstData}\n\n`);
          }

          if (!firstResult?.done) {
            // Stream the remaining events. If MCP listing fails mid-stream, retry once without MCP tools.
            while (true) {
              let next: IteratorResult<any>;
              try {
                next = await iterator.next();
              } catch (error) {
                if (!retriedWithoutMcp && isMcpToolsFailure(error)) {
                  console.error("MCP tool listing failed mid-stream; retrying without failing server", error);
                  const fixedTools = removeFailingMcpTools(tools, error);
                  events = await createEvents(fixedTools);
                  iterator = events[Symbol.asyncIterator]();
                  retriedWithoutMcp = true;
                  firstResult = await iterator.next();
                  if (firstResult && !firstResult.done) {
                    const firstEvent = firstResult.value;
                    const firstData = JSON.stringify({
                      event: firstEvent.type,
                      data: firstEvent,
                    });
                    controller.enqueue(`data: ${firstData}\n\n`);
                  }
                  continue;
                }
                throw error;
              }

              if (next.done) break;
              const event = next.value;
              const data = JSON.stringify({
                event: event.type,
                data: event,
              });
              controller.enqueue(`data: ${data}\n\n`);
            }
          }

          // End of stream
          controller.close();
        } catch (error) {
          console.error("Error in streaming loop:", error);
          controller.error(error);
        }
      },
    });

    // Return the ReadableStream as SSE
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    
    // Report to Sentry with context
    reportApiError(error instanceof Error ? error : new Error(String(error)), '/api/turn_response', 'POST');
    
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    const errStack = error instanceof Error ? error.stack : undefined;
    const errDetails = typeof (error as any)?.error === "object" ? (error as any).error : undefined;
    
    return new Response(
      JSON.stringify({
        error: errMsg,
        stack: errStack,
        details: errDetails,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
