import { Composio } from '@composio/core';
import { COMPOSIO_CONFIG, SupportedConnector, ApiKeyConnector } from './config';

// Initialize Composio client
const composio = new Composio({
  apiKey: COMPOSIO_CONFIG.API_KEY,
  baseURL: COMPOSIO_CONFIG.BASE_URL
});

export interface ConnectedAccount {
  id: string;
  connectorName: SupportedConnector;
  userId: string;
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
  lastUsed?: string;
}

export interface ConnectorAuth {
  type: 'oauth2' | 'api_key';
  isConnected: boolean;
  account?: ConnectedAccount;
  error?: string;
}

// Get OAuth authorization URL for a connector
export async function getOAuthUrl(connector: SupportedConnector, userId: string): Promise<string> {
  try {
    const config = COMPOSIO_CONFIG.OAUTH_CONFIG[connector as keyof typeof COMPOSIO_CONFIG.OAUTH_CONFIG];
    if (!config) {
      throw new Error(`OAuth not configured for ${connector}`);
    }

    // For now, we'll create a mock implementation until we understand the exact SDK API
    // In production, this would use the actual Composio SDK methods
    const authUrl = `https://api.composio.dev/oauth/${connector}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&user_id=${userId}`;
    
    return authUrl;
  } catch (error) {
    console.error(`Error getting OAuth URL for ${connector}:`, error);
    throw new Error(`Failed to get authorization URL for ${connector}`);
  }
}

// Handle OAuth callback and save connection
export async function handleOAuthCallback(
  connector: SupportedConnector, 
  code: string, 
  userId: string
): Promise<ConnectedAccount> {
  try {
    // Mock implementation - in production this would use Composio SDK
    const connection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      connectorName: connector,
      userId: userId,
      status: 'active' as const,
      createdAt: new Date().toISOString()
    };

    return connection;
  } catch (error) {
    console.error(`Error handling OAuth callback for ${connector}:`, error);
    throw new Error(`Failed to connect ${connector}`);
  }
}

// Set up API key connector
export async function setApiKeyConnector(
  connector: ApiKeyConnector,
  apiKey: string,
  userId: string
): Promise<ConnectedAccount> {
  try {
    // Mock implementation - in production this would use Composio SDK
    const connection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      connectorName: connector,
      userId: userId,
      status: 'active' as const,
      createdAt: new Date().toISOString()
    };

    return connection;
  } catch (error) {
    console.error(`Error setting API key for ${connector}:`, error);
    throw new Error(`Failed to connect ${connector}`);
  }
}

// Get connected accounts for a user
export async function getConnectedAccounts(userId: string): Promise<ConnectedAccount[]> {
  try {
    // Mock implementation - in production this would use Composio SDK
    // For now, return empty array - will be populated when actual connections are made
    return [];
  } catch (error) {
    console.error('Error getting connected accounts:', error);
    return [];
  }
}

// Check if a connector is connected for a user
export async function getConnectorStatus(
  connector: SupportedConnector | ApiKeyConnector,
  userId: string
): Promise<ConnectorAuth> {
  try {
    const accounts = await getConnectedAccounts(userId);
    const account = accounts.find((acc: ConnectedAccount) => acc.connectorName === connector);

    if (!account) {
      return {
        type: COMPOSIO_CONFIG.API_KEY_CONNECTORS.includes(connector as ApiKeyConnector) ? 'api_key' : 'oauth2',
        isConnected: false
      };
    }

    return {
      type: COMPOSIO_CONFIG.API_KEY_CONNECTORS.includes(connector as ApiKeyConnector) ? 'api_key' : 'oauth2',
      isConnected: account.status === 'active',
      account,
      error: account.status !== 'active' ? `Connection ${account.status}` : undefined
    };
  } catch (error) {
    console.error(`Error checking connector status for ${connector}:`, error);
    return {
      type: COMPOSIO_CONFIG.API_KEY_CONNECTORS.includes(connector as ApiKeyConnector) ? 'api_key' : 'oauth2',
      isConnected: false,
      error: 'Failed to check connection status'
    };
  }
}

// Delete a connected account
export async function deleteConnectedAccount(accountId: string): Promise<void> {
  try {
    // Mock implementation - in production this would use Composio SDK
    console.log(`Deleting account: ${accountId}`);
  } catch (error) {
    console.error('Error deleting connected account:', error);
    throw new Error('Failed to disconnect account');
  }
}

export default composio;
