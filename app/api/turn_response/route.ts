import { getDeveloperPrompt, MODEL } from "@/config/constants";
import { getTools } from "@/lib/tools/tools";
import { getSkill } from "@/lib/skills-registry";
import { getSkillsEnhancedPrompt } from "@/lib/skills-integration";
import OpenAI from "openai";

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
          
          // Handle annotations
          if (contentItem.annotations && Array.isArray(contentItem.annotations)) {
            return {
              ...contentItem,
              annotations: contentItem.annotations.map((annotation: any, idx: number) => {
                // Ensure each annotation has an index field
                return {
                  ...annotation,
                  index: annotation.index ?? idx,
                };
              }),
            };
          }
          return contentItem;
        }),
      };
    }
    return msg;
  });
}

function toApipieChatMessages(messages: any[]): Array<{ role: string; content: any }> {
  const out: Array<{ role: string; content: any }> = [];
  for (const msg of messages ?? []) {
    if (!msg || typeof msg !== "object") continue;
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
    const { messages, toolsState, selectedSkill, provider, apipieModel } = await request.json();

    if (provider === "apipie") {
      const apiKey = process.env.APIPIE_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Missing APIPIE_API_KEY" }),
          { status: 500 }
        );
      }

      let instructions = getDeveloperPrompt();
      if (selectedSkill && typeof selectedSkill === "string") {
        // Add general skills/artifact guidance
        instructions = `${instructions}\n\n${getSkillsEnhancedPrompt()}`;
        try {
          const skill = await getSkill(selectedSkill);
          if (skill?.content) {
            instructions = `${instructions}\n\n# Active Skill: ${skill.name}\n\nYou MUST follow the instructions in this skill. Create artifacts as specified.\n\n${skill.content}`;
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
          temperature: 1,
          top_p: 1,
          max_tokens: 800,
        }),
      });

      if (!apipieRes.ok) {
        const errText = await apipieRes.text().catch(() => "");
        return new Response(errText || "apipie.ai request failed", {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }

      const completion = await apipieRes.json().catch(() => null);
      const assistantText =
        typeof completion?.choices?.[0]?.message?.content === "string"
          ? completion.choices[0].message.content
          : "";

      const stream = new ReadableStream({
        start(controller) {
          const itemId = completion?.id ?? "apipie-message";
          const deltaPayload = JSON.stringify({
            event: "response.output_text.delta",
            data: {
              delta: assistantText,
              item_id: itemId,
            },
          });
          controller.enqueue(`data: ${deltaPayload}\n\n`);

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

    console.log("Tools:", tools);

    console.log("Received messages:", JSON.stringify(messages, null, 2));

    // Sanitize messages to ensure annotations have required fields
    const sanitizedMessages = sanitizeMessages(messages);
    
    console.log("Sanitized messages:", JSON.stringify(sanitizedMessages, null, 2));

    const openai = new OpenAI();

    let instructions = getDeveloperPrompt();
    if (selectedSkill && typeof selectedSkill === "string") {
      // Add general skills/artifact guidance
      instructions = `${instructions}\n\n${getSkillsEnhancedPrompt()}`;
      try {
        const skill = await getSkill(selectedSkill);
        if (skill?.content) {
          instructions = `${instructions}\n\n# Active Skill: ${skill.name}\n\nYou MUST follow the instructions in this skill. Create artifacts as specified.\n\n${skill.content}`;
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
