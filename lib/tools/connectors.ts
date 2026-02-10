export function getGoogleConnectorTools(accessToken: string): any[] {
  if (!accessToken) return [];
  return [
    {
      type: "mcp",
      server_label: "GoogleCalendar",
      server_description: "Search the user's calendar and read calendar events",
      connector_id: "connector_googlecalendar",
      authorization: accessToken,
      // change this to "always" if you want to require approval
      require_approval: "never",
    },
    {
      type: "mcp",
      server_label: "GoogleMail",
      server_description: "Search the user's email inbox and read emails",
      connector_id: "connector_gmail",
      authorization: accessToken,
      // change this to "always" if you want to require approval
      require_approval: "never",
    },
  ];
}

export function getMicrosoftConnectorTools(accessToken: string): any[] {
  if (!accessToken) return [];
  return [
    {
      type: "mcp",
      server_label: "MicrosoftMail",
      server_description:
        "Read, send, organize, and manage the user's Microsoft Outlook email. Supports reading inbox, sent items, drafts, and archive folders. Can send new emails, reply, forward, move, flag, and delete messages.",
      connector_id: "connector_microsoft_mail",
      authorization: accessToken,
      require_approval: "never",
    },
    {
      type: "mcp",
      server_label: "MicrosoftCalendar",
      server_description:
        "Read, create, update, and manage the user's Microsoft Outlook calendar events. Supports viewing day/week/month calendars, creating meetings, accepting/declining invitations, and AI-powered scheduling assistance.",
      connector_id: "connector_microsoft_calendar",
      authorization: accessToken,
      require_approval: "never",
    },
  ];
}
