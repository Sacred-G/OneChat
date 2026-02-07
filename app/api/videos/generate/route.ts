import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = "sora-2", size = "1280x720", seconds = 10 } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate size
    if (!["1280x720", "1920x1080"].includes(size)) {
      return NextResponse.json(
        { error: 'Size must be either "1280x720" or "1920x1080"' },
        { status: 400 }
      );
    }

    // Validate seconds
    if (typeof seconds !== 'number' || seconds < 1 || seconds > 60) {
      return NextResponse.json(
        { error: 'Seconds must be a number between 1 and 60' },
        { status: 400 }
      );
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Create video generation request
    const response = await fetch('https://api.openai.com/v1/videos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: prompt.trim(),
        size,
        seconds,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI video generation error:', errorText);
      return NextResponse.json(
        { error: `Video generation failed: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
