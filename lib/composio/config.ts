// Composio Configuration
export const COMPOSIO_CONFIG = {
  // Get your API key from https://platform.composio.dev/
  API_KEY: process.env.COMPOSIO_API_KEY || '',
  
  // Base URL for Composio API
  BASE_URL: process.env.COMPOSIO_BASE_URL || 'https://backend.composio.dev',
  
  // Supported connectors for production
  SUPPORTED_CONNECTORS: [
    'github',
    'slack', 
    'notion',
    'tavily'
  ] as const,
  
  // OAuth configuration
  OAUTH_CONFIG: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      redirectUri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/composio/github/callback`,
      scopes: ['repo', 'read:org', 'read:user', 'user:email']
    },
    slack: {
      clientId: process.env.SLACK_CLIENT_ID || '',
      redirectUri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/composio/slack/callback`,
      scopes: ['channels:read', 'chat:write', 'users:read', 'files:read']
    },
    notion: {
      clientId: process.env.NOTION_CLIENT_ID || '',
      redirectUri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/composio/notion/callback`,
      scopes: ['pages:read', 'pages:write', 'blocks:read', 'blocks:write', 'databases:read']
    }
  },
  
  // API Key connectors
  API_KEY_CONNECTORS: [
    'tavily',
    'notion' // Notion also supports API key auth
  ] as const,
  
  // Environment variable names for API keys
  API_KEY_ENV_VARS: {
    tavily: 'TAVILY_API_KEY',
    notion: 'NOTION_API_KEY'
  } as const
};

export type SupportedConnector = typeof COMPOSIO_CONFIG.SUPPORTED_CONNECTORS[number];
export type ApiKeyConnector = typeof COMPOSIO_CONFIG.API_KEY_CONNECTORS[number];
