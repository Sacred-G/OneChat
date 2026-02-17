import { NextRequest, NextResponse } from 'next/server';
import { getOAuthUrl } from '@/lib/composio/client';
import { SupportedConnector } from '@/lib/composio/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const authUrl = await getOAuthUrl('slack' as SupportedConnector, userId);
    
    return NextResponse.json({ 
      authUrl,
      connector: 'slack',
      message: 'Navigate to the authorization URL to connect Slack'
    });
  } catch (error) {
    console.error('Slack auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Slack authorization URL' },
      { status: 500 }
    );
  }
}
