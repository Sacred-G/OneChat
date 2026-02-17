import { NextRequest, NextResponse } from 'next/server';
import { setApiKeyConnector } from '@/lib/composio/client';
import { ApiKeyConnector } from '@/lib/composio/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, apiKey } = body;
    
    if (!userId || !apiKey) {
      return NextResponse.json({ error: 'User ID and API key required' }, { status: 400 });
    }

    const connection = await setApiKeyConnector('tavily' as ApiKeyConnector, apiKey, userId);
    
    return NextResponse.json({
      success: true,
      connector: 'tavily',
      type: 'api_key',
      connection,
      message: 'Tavily connected successfully with API key'
    });
  } catch (error) {
    console.error('Tavily API key error:', error);
    return NextResponse.json(
      { error: 'Failed to connect Tavily with API key' },
      { status: 500 }
    );
  }
}
