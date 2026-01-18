import { getDeveloperPrompt, MODEL } from "@/config/constants";
import { getTools } from "@/lib/tools/tools";
import { getSkill } from "@/lib/skills-registry";
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

export async function POST(request: Request) {
  try {
    const { messages, toolsState, selectedSkill } = await request.json();

    const tools = await getTools(toolsState);

    console.log("Tools:", tools);

    console.log("Received messages:", JSON.stringify(messages, null, 2));

    // Sanitize messages to ensure annotations have required fields
    const sanitizedMessages = sanitizeMessages(messages);
    
    console.log("Sanitized messages:", JSON.stringify(sanitizedMessages, null, 2));

    const openai = new OpenAI();

    let instructions = getDeveloperPrompt();
    if (selectedSkill && typeof selectedSkill === "string") {
      try {
        const skill = await getSkill(selectedSkill);
        if (skill?.content) {
          instructions = `${instructions}\n\n# Skill: ${skill.name}\n\n${skill.content}`;
        }
      } catch (e) {
        console.error("Failed to load selected skill", e);
      }
    }

    const events = await openai.responses.create({
      model: MODEL,
      input: sanitizedMessages,
      instructions,
      tools,
      stream: true,
      parallel_tool_calls: false,
    });

    // Create a ReadableStream that emits SSE data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            // Sending all events to the client
            const data = JSON.stringify({
              event: event.type,
              data: event,
            });
            controller.enqueue(`data: ${data}\n\n`);
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
