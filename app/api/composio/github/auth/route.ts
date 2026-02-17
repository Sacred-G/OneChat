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

    const authUrl = await getOAuthUrl('github' as SupportedConnector, userId);
    
    return NextResponse.json({ 
      authUrl,
      connector: 'github',
      message: 'Navigate to the authorization URL to connect GitHub'
    });
  } catch (error) {
    console.error('GitHub auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate GitHub authorization URL' },
      { status: 500 }
    );
  }
}
