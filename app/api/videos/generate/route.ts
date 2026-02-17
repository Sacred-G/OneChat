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

    // Validate model and size compatibility
    const supportedModels = ["sora-2", "sora-2-pro"];
    if (!supportedModels.includes(model)) {
      return NextResponse.json(
        { error: `Model must be one of: ${supportedModels.map(m => `"${m}"`).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate size based on model
    const standardSizes = ["720x1280", "1280x720"];
    const premiumSizes = ["1024x1792", "1792x1024"];
    const allSizes = [...standardSizes, ...premiumSizes];
    
    if (!allSizes.includes(size)) {
      return NextResponse.json(
        { error: `Size must be one of: ${allSizes.map(s => `"${s}"`).join(', ')}` },
        { status: 400 }
      );
    }

    // Check size-model compatibility
    if (model === "sora-2" && premiumSizes.includes(size)) {
      return NextResponse.json(
        { error: `Premium sizes (${premiumSizes.join(', ')}) require sora-2-pro model. Please use sora-2-pro or select a standard size (${standardSizes.join(', ')})` },
        { status: 400 }
      );
    }

    // Validate seconds — Sora API only accepts "4", "8", or "12" (as strings)
    const secondsNum = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
    if (![4, 8, 12].includes(secondsNum)) {
      return NextResponse.json(
        { error: 'Seconds must be one of: 4, 8, or 12' },
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
        seconds: String(secondsNum),
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
