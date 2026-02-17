import { NextRequest, NextResponse } from 'next/server';
import { getOAuthUrl, handleOAuthCallback, setApiKeyConnector } from '@/lib/composio/client';
import { SupportedConnector, ApiKeyConnector } from '@/lib/composio/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'oauth' or 'apikey'
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (type === 'apikey') {
      return NextResponse.json({ 
        message: 'Use POST endpoint to set API key for Notion',
        connector: 'notion',
        type: 'api_key'
      });
    }

    const authUrl = await getOAuthUrl('notion' as SupportedConnector, userId);
    
    return NextResponse.json({ 
      authUrl,
      connector: 'notion',
      type: 'oauth2',
      message: 'Navigate to the authorization URL to connect Notion'
    });
  } catch (error) {
    console.error('Notion auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Notion authorization URL' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, apiKey } = body;
    
    if (!userId || !apiKey) {
      return NextResponse.json({ error: 'User ID and API key required' }, { status: 400 });
    }

    const connection = await setApiKeyConnector('notion' as ApiKeyConnector, apiKey, userId);
    
    return NextResponse.json({
      success: true,
      connector: 'notion',
      type: 'api_key',
      connection,
      message: 'Notion connected successfully with API key'
    });
  } catch (error) {
    console.error('Notion API key error:', error);
    return NextResponse.json(
      { error: 'Failed to connect Notion with API key' },
      { status: 500 }
    );
  }
}
