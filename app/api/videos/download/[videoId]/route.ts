import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const { searchParams } = new URL(request.url);
    const variant = searchParams.get('variant') || 'video';

    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json(
        { error: 'Valid video ID is required' },
        { status: 400 }
      );
    }

    // Validate variant
    if (!['video', 'thumbnail', 'spritesheet'].includes(variant)) {
      return NextResponse.json(
        { error: 'Variant must be one of: video, thumbnail, spritesheet' },
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

    // Download video content
    const response = await fetch(
      `https://api.openai.com/v1/videos/${videoId}/content?variant=${variant}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI video download error:', errorText);
      return NextResponse.json(
        { error: `Failed to download video: ${errorText}` },
        { status: response.status }
      );
    }

    // Get content type based on variant
    let contentType = 'video/mp4';
    let filename = `video_${videoId}.mp4`;
    
    if (variant === 'thumbnail') {
      contentType = 'image/webp';
      filename = `thumbnail_${videoId}.webp`;
    } else if (variant === 'spritesheet') {
      contentType = 'image/jpeg';
      filename = `spritesheet_${videoId}.jpg`;
    }

    // Return the file content
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Video download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
