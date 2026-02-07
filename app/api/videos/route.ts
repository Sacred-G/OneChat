import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const after = searchParams.get('after');
    const order = searchParams.get('order') || 'desc';

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (!['asc', 'desc'].includes(order)) {
      return NextResponse.json(
        { error: 'Order must be either "asc" or "desc"' },
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

    // Build URL with query parameters
    let url = 'https://api.openai.com/v1/videos';
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      order,
    });

    if (after) {
      queryParams.append('after', after);
    }

    url += `?${queryParams.toString()}`;

    // Fetch videos
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI videos list error:', errorText);
      return NextResponse.json(
        { error: `Failed to list videos: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Videos list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json(
        { error: 'Video ID is required for deletion' },
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

    // Delete video
    const response = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI video delete error:', errorText);
      return NextResponse.json(
        { error: `Failed to delete video: ${errorText}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Video deleted successfully' });

  } catch (error) {
    console.error('Video delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
