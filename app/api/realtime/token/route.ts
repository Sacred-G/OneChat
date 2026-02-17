import { NextResponse } from "next/server";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Use the GA endpoint for client secrets
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-realtime-mini-2025-12-15",
          audio: {
            output: { voice: "verse" },
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to create realtime session:", error);
      return NextResponse.json(
        { error: "Failed to create realtime session" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // GA API returns the secret directly with 'value' property
    return NextResponse.json({ 
      client_secret: { value: data.value },
      expires_at: data.expires_at 
    });
  } catch (error) {
    console.error("Error creating realtime token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
