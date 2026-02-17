import { NextRequest, NextResponse } from 'next/server';
import { handleOAuthCallback } from '@/lib/composio/client';
import { SupportedConnector } from '@/lib/composio/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This contains the userId
    
    if (!code) {
      return NextResponse.json({ error: 'Authorization code required' }, { status: 400 });
    }

    if (!state) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const connection = await handleOAuthCallback('slack' as SupportedConnector, code, state);
    
    return NextResponse.json({
      success: true,
      connector: 'slack',
      connection,
      message: 'Slack connected successfully'
    });
  } catch (error) {
    console.error('Slack callback error:', error);
    return NextResponse.json(
      { error: 'Failed to connect Slack' },
      { status: 500 }
    );
  }
}
