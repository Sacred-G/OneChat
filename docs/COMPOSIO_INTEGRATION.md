# Composio Connectors Integration

This document describes the Composio connectors integration added to the OneChat app.

## Overview

The integration allows users to connect external services (GitHub, Slack, Notion, Tavily) and use them through AI agents for automation and task execution.

## Features

### Supported Connectors

1. **GitHub** (OAuth2)
   - Manage repositories
   - Create and manage issues
   - Review pull requests
   - Automate development workflows

2. **Slack** (OAuth2)
   - Send messages to channels
   - Read channel history
   - Manage files
   - Automate team communication

3. **Notion** (OAuth2 + API Key)
   - Create and manage pages
   - Manage databases
   - Organize content
   - Automate documentation

4. **Tavily Search** (API Key)
   - Advanced web search
   - Real-time data extraction
   - Comprehensive search capabilities

## Architecture

### Core Components

- **`lib/composio/config.ts`** - Configuration and constants
- **`lib/composio/client.ts`** - Composio API client and helper functions
- **`components/connector-manager.tsx`** - UI for managing connections
- **`app/connectors/page.tsx`** - Dedicated connectors management page

### API Endpoints

- **`/api/composio/{connector}/auth`** - Initiate authentication
- **`/api/composio/{connector}/callback`** - Handle OAuth callbacks
- **`/api/composio/connectors`** - Manage connected accounts

### Integration Points

- **Tools System** - Connectors are exposed as MCP tools to AI agents
- **Chat Interface** - Toggle for enabling/disabling connectors
- **Main Client** - Connectors button in toolbar for easy access

## Setup

### Environment Variables

Add these to your `.env` file:

```bash
# Composio Integration
COMPOSIO_API_KEY=your_composio_api_key

# OAuth Apps (create these at each service's developer portal)
GITHUB_CLIENT_ID=your_github_oauth_client_id
SLACK_CLIENT_ID=your_slack_client_id
NOTION_CLIENT_ID=your_notion_client_id

# API Keys (optional - can also be set via UI)
TAVILY_API_KEY=your_tavily_api_key
NOTION_API_KEY=your_notion_api_key
```

### OAuth App Setup

1. **GitHub**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create new OAuth App
   - Set callback URL: `http://localhost:3000/api/composio/github/callback`

2. **Slack**
   - Go to api.slack.com/apps
   - Create new app
   - Add OAuth Permissions & Redirect URL: `http://localhost:3000/api/composio/slack/callback`

3. **Notion**
   - Go to notion.so/my-integrations
   - Create new integration
   - Set redirect URL: `http://localhost:3000/api/composio/notion/callback`

## Usage

### For Users

1. **Enable Connectors**: Toggle "Composio" in the chat tools menu
2. **Connect Services**: 
   - Click the Connectors button (link icon) in toolbar
   - Or visit `/connectors` directly
   - Click "Connect" on desired services
   - Authenticate via OAuth or enter API key
3. **Use in Chat**: Ask the AI to perform actions using connected services

### Examples

```
"Create a GitHub issue in the repo 'my-project' with title 'Bug fix needed'"
"Send a message to #general channel in Slack"
"Create a new page in my Notion workspace called 'Meeting Notes'"
"Search for recent news about AI using Tavily"
```

## Security

- All connections are encrypted and stored securely
- Tokens are managed by Composio with proper rotation
- Users can disconnect services at any time
- Connections are only used with explicit user requests

## Development

### Adding New Connectors

1. Add connector to `lib/composio/config.ts`
2. Create auth endpoints in `app/api/composio/{connector}/`
3. Update connector descriptions in `lib/tools/connectors.ts`
4. Add UI configuration in `components/connector-manager.tsx`

### Testing

```bash
# Test connection flow
npm run dev
# Visit /connectors
# Test each connector's authentication

# Test AI integration
# Enable connectors in chat
# Send test requests
```

## Production Considerations

1. **Environment Variables**: Ensure all required env vars are set
2. **OAuth Apps**: Use production URLs for callbacks
3. **Rate Limits**: Monitor API usage and implement limits
4. **Error Handling**: All connector errors are logged and handled gracefully
5. **Security**: Regular token rotation and secure storage

## Troubleshooting

### Common Issues

1. **"Connection failed" errors**
   - Check API keys and OAuth credentials
   - Verify callback URLs are correct
   - Check Composio API key is valid

2. **"Connector not working in chat"**
   - Ensure Composio toggle is enabled in tools
   - Check connector is connected successfully
   - Verify user has proper permissions

3. **"OAuth redirect errors"**
   - Check redirect URI configuration
   - Ensure app is properly configured at service provider
   - Verify no firewall blocking redirects

### Logs

Check browser console and server logs for detailed error information. All Composio-related errors are prefixed with "Composio:" for easy filtering.

## Future Enhancements

- Add more connectors from Composio's 800+ toolkit library
- Implement connector-specific AI prompts
- Add usage analytics and monitoring
- Create connector templates for common workflows
- Add batch operations for multiple services
