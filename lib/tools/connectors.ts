import composio from '@/lib/composio/client';
import { COMPOSIO_CONFIG } from '@/lib/composio/config';

export function getGoogleConnectorTools(accessToken: string, requireApproval: "always" | "never" = "never"): any[] {
  if (!accessToken) return [];
  return [
    {
      type: "mcp",
      server_label: "GoogleCalendar",
      server_description: "Search the user's calendar and read calendar events",
      connector_id: "connector_googlecalendar",
      authorization: accessToken,
      // change this to "always" if you want to require approval
      require_approval: requireApproval,
    },
    {
      type: "mcp",
      server_label: "GoogleMail",
      server_description: "Search the user's email inbox and read emails",
      connector_id: "connector_gmail",
      authorization: accessToken,
      // change this to "always" if you want to require approval
      require_approval: requireApproval,
    },
  ];
}

export function getMicrosoftConnectorTools(accessToken: string, requireApproval: "always" | "never" = "never"): any[] {
  if (!accessToken) return [];
  return [
    {
      type: "mcp",
      server_label: "MicrosoftMail",
      server_description:
        "Read, send, organize, and manage the user's Microsoft Outlook email. Supports reading inbox, sent items, drafts, and archive folders. Can send new emails, reply, forward, move, flag, and delete messages.",
      connector_id: "connector_outlookemail",
      authorization: accessToken,
      // change this to "always" if you want to require approval
      require_approval: requireApproval,
    },
    {
      type: "mcp",
      server_label: "MicrosoftCalendar",
      server_description:
        "Read, create, update, and manage the user's Microsoft Outlook calendar events. Supports viewing day/week/month calendars, creating meetings, accepting/declining invitations, and AI-powered scheduling assistance.",
      connector_id: "connector_outlookcalendar",
      authorization: accessToken,
      // change this to "always" if you want to require approval
      require_approval: requireApproval,
    },
  ];
}

// Cache for Composio tool router sessions to avoid recreating on every request
const sessionCache = new Map<string, { tools: any[]; expiresAt: number }>();
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get Composio tools via the tool router session.
 * Creates a session scoped to the user's selected toolkits and returns
 * a native MCP tool config that the OpenAI Responses API can connect to directly.
 * The session also provides function-formatted tools for non-MCP providers (e.g. apipie).
 */
export async function getComposioMetaTools(
  selectedToolkits: string[],
  userId?: string,
  requireApproval: "always" | "never" = "never"
): Promise<any[]> {
  if (!COMPOSIO_CONFIG.API_KEY) {
    console.warn('[Composio] No API key configured, skipping meta tools');
    return [];
  }

  if (!selectedToolkits || selectedToolkits.length === 0) {
    console.log('[Composio] No toolkits selected, skipping meta tools');
    return [];
  }

  const effectiveUserId = userId || 'default';
  const cacheKey = `${effectiveUserId}:${requireApproval}:${selectedToolkits.sort().join(',')}`;

  // Check cache
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tools;
  }

  try {
    console.log(`[Composio] Creating tool router session for user=${effectiveUserId} with ${selectedToolkits.length} toolkits: ${selectedToolkits.join(', ')}`);

    const session = await composio.create(effectiveUserId, {
      toolkits: selectedToolkits,
      manageConnections: true,
      workbench: {},
    });

    const tools: any[] = [];

    // The session exposes an MCP server endpoint that the OpenAI Responses API
    // can connect to natively via type:"mcp". This is the preferred approach.
    if (session.mcp?.url) {
      const mcpTool: any = {
        type: "mcp",
        server_label: "composio",
        server_url: session.mcp.url,
        require_approval: "never",
      };
      if (session.mcp.headers && Object.keys(session.mcp.headers).length > 0) {
        mcpTool.headers = session.mcp.headers;
      }
      tools.push(mcpTool);
      console.log(`[Composio] Created MCP tool for session ${session.sessionId} (${session.mcp.type}): ${session.mcp.url}`);
    } else {
      // Fallback: get function-formatted tools from the session
      console.warn('[Composio] No MCP endpoint in session, falling back to session.tools()');
      const fnTools = await session.tools();
      if (Array.isArray(fnTools) && fnTools.length > 0) {
        tools.push(...fnTools);
        console.log(`[Composio] Got ${fnTools.length} function tools from session ${session.sessionId}`);
      } else {
        console.warn('[Composio] Tool router session returned no tools');
      }
    }

    if (tools.length > 0) {
      // Cache the result
      sessionCache.set(cacheKey, {
        tools,
        expiresAt: Date.now() + SESSION_TTL_MS,
      });
    }

    return tools;
  } catch (error: any) {
    console.error('[Composio] Error creating tool router session:', error?.message || error);
    return [];
  }
}

// Legacy export for backward compatibility (returns empty now)
export function getComposioConnectorTools(connectedAccounts: any[], _requireApproval: "always" | "never" = "never"): any[] {
  console.warn('[Composio] getComposioConnectorTools is deprecated, use getComposioMetaTools instead');
  return [];
}
