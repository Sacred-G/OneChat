import { getDeveloperPrompt, MODEL } from "@/config/constants";
import { getTools } from "@/lib/tools/tools";
import { getSkill, listSkills } from "@/lib/skills-registry";
import OpenAI from "openai";

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
    for (const t of queryTokens) {
      if (skillTokens.has(t)) score += 2;
    }

    if (!best || score > best.score) best = { name: s.name, score };
  }

  // Require at least a small signal to avoid injecting unrelated skills.
  if (!best || best.score < 6) return null;
  return best.name;
}

// Sanitize messages to ensure all annotations have required fields and images are properly formatted
function sanitizeMessages(messages: any[]): any[] {
  return messages.map((msg) => {
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

function removeDanglingFunctionCalls(items: any[]): any[] {
  const callIdsWithOutput = new Set<string>();
  for (const item of items ?? []) {
    if (!item || typeof item !== "object") continue;
    if (item.type === "function_call_output" && typeof item.call_id === "string") {
      callIdsWithOutput.add(item.call_id);
    }
  }

  return (items ?? []).filter((item: any) => {
    if (!item || typeof item !== "object") return false;
    if (item.type === "function_call") {
      const callId = item.call_id;
      if (typeof callId !== "string" || !callId.trim()) return false;
      return callIdsWithOutput.has(callId);
    }
    return true;
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

export async function POST(request: Request) {
  try {
    const { messages, toolsState, selectedSkill, provider, apipieModel, agentPrompt, agentName, agentTemperature } = await request.json();

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
      const apipieMessages = [
        { role: "system", content: instructions },
        ...toApipieChatMessages(messages),
      ];

      const apipieRes = await fetch("https://apipie.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: apipieMessages,
          model: typeof apipieModel === "string" && apipieModel.trim() ? apipieModel.trim() : "gpt-3.5-turbo",
          provider: "openai",
          stream: false,
          temperature: typeof agentTemperature === "number" ? agentTemperature : 1,
          top_p: 1,
          max_tokens: 800,
          ...(toolsForApipie.length > 0 ? { tools: toolsForApipie, tool_choice: "auto" } : {}),
        }),
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

      const completion = await apipieRes.json().catch(() => null);
      const apipieMessage = completion?.choices?.[0]?.message;
      const assistantText = typeof apipieMessage?.content === "string" ? apipieMessage.content : "";

      const toolCalls = Array.isArray(apipieMessage?.tool_calls)
        ? apipieMessage.tool_calls
        : apipieMessage?.function_call
          ? [
              {
                id: completion?.id ? String(completion.id) : `apipie-toolcall-${Date.now()}`,
                type: "function",
                function: apipieMessage.function_call,
              },
            ]
          : [];

      const stream = new ReadableStream({
        start(controller) {
          const itemId = completion?.id ?? "apipie-message";

          if (assistantText) {
            const deltaPayload = JSON.stringify({
              event: "response.output_text.delta",
              data: {
                delta: assistantText,
                item_id: itemId,
              },
            });
            controller.enqueue(`data: ${deltaPayload}\n\n`);
          }

          for (let i = 0; i < toolCalls.length; i++) {
            const tc = toolCalls[i];
            const name = typeof tc?.function?.name === "string" ? tc.function.name : "";
            const args = typeof tc?.function?.arguments === "string" ? tc.function.arguments : "";
            const callId = typeof tc?.id === "string" && tc.id.trim()
              ? tc.id.trim()
              : `apipie-call-${Date.now()}-${i + 1}`;
            const toolItemId = callId;

            if (!name) continue;

            controller.enqueue(
              `data: ${JSON.stringify({
                event: "response.output_item.added",
                data: {
                  item: {
                    type: "function_call",
                    id: toolItemId,
                    call_id: callId,
                    name,
                    arguments: args,
                  },
                },
              })}\n\n`
            );

            controller.enqueue(
              `data: ${JSON.stringify({
                event: "response.function_call_arguments.done",
                data: {
                  item_id: toolItemId,
                  arguments: args,
                },
              })}\n\n`
            );

            controller.enqueue(
              `data: ${JSON.stringify({
                event: "response.output_item.done",
                data: {
                  item: {
                    type: "function_call",
                    id: toolItemId,
                    call_id: callId,
                    name,
                    arguments: args,
                  },
                },
              })}\n\n`
            );
          }

          const completedPayload = JSON.stringify({
            event: "response.completed",
            data: {
              response: {
                output: [],
              },
            },
          });
          controller.enqueue(`data: ${completedPayload}\n\n`);
          controller.enqueue("data: [DONE]\n\n");
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

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
    const sanitizedMessages = sanitizeToolOutputs(
      removeDanglingFunctionCalls(sanitizeMessages(messages))
    );
    
    if (process.env.DEBUG_TURN_RESPONSE === "true") {
      console.log("Sanitized messages:", JSON.stringify(sanitizedMessages, null, 2));
    }

    const openai = new OpenAI();

    let instructions = getDeveloperPrompt();
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
        console.error("MCP tool listing failed; retrying without MCP tools", error);
        const toolsWithoutMcp = tools.filter((t: any) => t?.type !== "mcp");
        events = await createEvents(toolsWithoutMcp);
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
                  console.error("MCP tool listing failed mid-stream; retrying without MCP tools", error);
                  const toolsWithoutMcp = tools.filter((t: any) => t?.type !== "mcp");
                  events = await createEvents(toolsWithoutMcp);
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
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
