import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const contentType = request.headers.get('content-type');
    const body = await request.text();
    
    // Log that we received the monitoring request
    console.log('Sentry monitoring request received:', {
      organization: url.searchParams.get('o'),
      project: url.searchParams.get('p'), 
      region: url.searchParams.get('r'),
      contentType,
      bodyLength: body.length,
    });
    
    // For development, we don't need to actually process Sentry envelopes
    // Just return a successful response to prevent browser errors
    // In production, these would be sent to actual Sentry servers
    
    // Return empty response with 200 status - this is what Sentry expects
    return new NextResponse(null, { 
      status: 200,
    });
  } catch (error) {
    console.error('Monitoring endpoint error:', error);
    return NextResponse.json({ error: 'Monitoring endpoint failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'monitoring endpoint active' });
}
