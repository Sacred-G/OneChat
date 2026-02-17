export function getCalendarConnectorTools(): any[] {
  return [
    {
      name: "list_calendar_events",
      description: "List calendar events from Microsoft Outlook calendar for a specific date range",
      input_schema: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description: "Start date in YYYY-MM-DD format (defaults to today)",
          },
          endDate: {
            type: "string",
            description: "End date in YYYY-MM-DD format (defaults to 30 days from now)",
          },
          view: {
            type: "string",
            enum: ["day", "week", "month"],
            description: "Calendar view type (defaults to week)",
          },
        },
      },
    },
    {
      name: "create_calendar_event",
      description: "Create a new calendar event in Microsoft Outlook",
      input_schema: {
        type: "object",
        properties: {
          subject: {
            type: "string",
            description: "Event title/subject",
          },
          startTime: {
            type: "string",
            description: "Start time in ISO format (e.g., 2024-01-15T10:00:00)",
          },
          endTime: {
            type: "string",
            description: "End time in ISO format (e.g., 2024-01-15T11:00:00)",
          },
          isAllDay: {
            type: "boolean",
            description: "Whether this is an all-day event",
          },
          location: {
            type: "string",
            description: "Event location",
          },
          attendees: {
            type: "array",
            items: { type: "string" },
            description: "List of attendee email addresses",
          },
          body: {
            type: "string",
            description: "Event description in HTML format",
          },
          showAs: {
            type: "string",
            enum: ["free", "tentative", "busy", "oof", "workingElsewhere", "unknown"],
            description: "How to show availability during this event",
          },
          importance: {
            type: "string",
            enum: ["low", "normal", "high"],
            description: "Event importance level",
          },
        },
        required: ["subject", "startTime", "endTime"],
      },
    },
    {
      name: "update_calendar_event",
      description: "Update an existing calendar event in Microsoft Outlook",
      input_schema: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "ID of the event to update",
          },
          updates: {
            type: "object",
            description: "Event fields to update (same schema as create_calendar_event)",
          },
        },
        required: ["eventId", "updates"],
      },
    },
    {
      name: "delete_calendar_event",
      description: "Delete a calendar event from Microsoft Outlook",
      input_schema: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "ID of the event to delete",
          },
        },
        required: ["eventId"],
      },
    },
    {
      name: "get_calendar_event",
      description: "Get details of a specific calendar event",
      input_schema: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "ID of the event to retrieve",
          },
        },
        required: ["eventId"],
      },
    },
    {
      name: "respond_to_event_invitation",
      description: "Accept, decline, or tentatively accept a meeting invitation",
      input_schema: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "ID of the event invitation",
          },
          response: {
            type: "string",
            enum: ["accept", "decline", "tentativelyAccept"],
            description: "Your response to the invitation",
          },
          comment: {
            type: "string",
            description: "Optional comment to include with your response",
          },
          sendResponse: {
            type: "boolean",
            description: "Whether to send the response to the organizer (defaults to true)",
          },
        },
        required: ["eventId", "response"],
      },
    },
    {
      name: "ai_calendar_assist",
      description: "Get AI assistance with calendar management tasks",
      input_schema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [
              "suggest-times",
              "summarize-day",
              "find-conflicts",
              "schedule-meeting",
              "improve-event",
            ],
            description: "Type of AI assistance requested",
          },
          duration: {
            type: "string",
            description: "Meeting duration in minutes (for suggest-times and schedule-meeting)",
          },
          attendees: {
            type: "array",
            items: { type: "string" },
            description: "List of attendee email addresses (for suggest-times and schedule-meeting)",
          },
          preferredDays: {
            type: "string",
            description: "Preferred days of the week (for suggest-times)",
          },
          timeRange: {
            type: "string",
            description: "Preferred time range (for suggest-times, e.g., '9 AM - 5 PM')",
          },
          date: {
            type: "string",
            description: "Date to summarize (for summarize-day, in YYYY-MM-DD format)",
          },
          startDate: {
            type: "string",
            description: "Start date to check for conflicts (for find-conflicts)",
          },
          endDate: {
            type: "string",
            description: "End date to check for conflicts (for find-conflicts)",
          },
          description: {
            type: "string",
            description: "Meeting description (for schedule-meeting)",
          },
          constraints: {
            type: "string",
            description: "Scheduling constraints (for schedule-meeting)",
          },
          event: {
            type: "object",
            description: "Event object to improve (for improve-event)",
          },
        },
        required: ["action"],
      },
    },
  ];
}
