import { NextRequest, NextResponse } from 'next/server';
import { getConnectedAccounts, getConnectorStatus, deleteConnectedAccount } from '@/lib/composio/client';

// Get all connected accounts for the user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const connector = searchParams.get('connector');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (connector) {
      // Get status for specific connector
      const status = await getConnectorStatus(connector as any, userId);
      return NextResponse.json({ connector, status });
    }

    // Get all connected accounts
    const accounts = await getConnectedAccounts(userId);
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Connector status error:', error);
    return NextResponse.json(
      { error: 'Failed to get connector status' },
      { status: 500 }
    );
  }
}

// Delete a connected account
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    await deleteConnectedAccount(accountId);
    
    return NextResponse.json({
      success: true,
      message: 'Account disconnected successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
