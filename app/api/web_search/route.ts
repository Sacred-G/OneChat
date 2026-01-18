import { MODEL } from "@/config/constants";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  const { query, webSearchConfig } = await request.json();

  if (!query || typeof query !== "string") {
    return new Response("Missing query", { status: 400 });
  }

  const tool: any = { type: "web_search" };
  const user_location = webSearchConfig?.user_location;
  if (
    user_location &&
    (user_location.country || user_location.region || user_location.city)
  ) {
    tool.user_location = {
      type: "approximate",
      country: user_location.country ?? "",
      region: user_location.region ?? "",
      city: user_location.city ?? "",
    };
  }

  try {
    const response = await openai.responses.create({
      model: MODEL,
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: query }],
        },
      ],
      tools: [tool],
    });

    return new Response(
      JSON.stringify({
        query,
        result: response.output_text,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error running web search:", error);
    return new Response("Error running web search", { status: 500 });
  }
}
