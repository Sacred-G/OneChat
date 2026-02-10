import { NextRequest, NextResponse } from "next/server";
import { getFreshMsAccessToken } from "@/lib/microsoft-auth";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function graphFetch(path: string, accessToken: string, options?: RequestInit) {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  return res;
}

// GET /api/microsoft/calendar?start=2024-01-01&end=2024-01-31&view=month
// GET /api/microsoft/calendar?id=eventId — fetch single event
export async function GET(request: NextRequest) {
  const { accessToken } = await getFreshMsAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const eventId = url.searchParams.get("id");

  // Fetch single event
  if (eventId) {
    const res = await graphFetch(
      `/me/events/${eventId}?$select=id,subject,start,end,location,body,attendees,organizer,isAllDay,recurrence,showAs,importance,webLink`,
      accessToken
    );
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const event = await res.json();
    return NextResponse.json({ event });
  }

  const start = url.searchParams.get("start") || new Date().toISOString().split('T')[0];
  const end = url.searchParams.get("end") || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const view = url.searchParams.get("view") || "month";
  const top = url.searchParams.get("top") || "50";

  // Build calendar view query
  const startTime = new Date(start).toISOString();
  const endTime = new Date(end + 'T23:59:59').toISOString();

  let path = `/me/calendarView?startDateTime=${startTime}&endDateTime=${endTime}&$top=${top}&$orderby=start/dateTime&$select=id,subject,start,end,location,body,attendees,organizer,isAllDay,recurrence,showAs,importance,webLink`;

  const res = await graphFetch(path, accessToken);
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({
    events: data.value || [],
    nextLink: data["@odata.nextLink"] || null,
  });
}

// POST /api/microsoft/calendar
// Actions: create, update, delete, accept, decline, tentativelyAccept
export async function POST(request: NextRequest) {
  const { accessToken } = await getFreshMsAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  switch (action) {
    case "create": {
      const { 
        subject, 
        body, 
        startTime, 
        endTime, 
        isAllDay, 
        location, 
        attendees, 
        recurrence,
        showAs,
        importance
      } = body;

      const event: any = {
        subject,
        body: {
          contentType: "HTML",
          content: body || "",
        },
        start: {
          dateTime: startTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        isAllDay: isAllDay || false,
        showAs: showAs || "busy",
      };

      if (location) {
        event.location = {
          displayName: location,
        };
      }

      if (attendees && attendees.length > 0) {
        event.attendees = attendees.map((email: string) => ({
          emailAddress: { address: email },
          type: "required",
        }));
      }

      if (recurrence) {
        event.recurrence = recurrence;
      }

      if (importance) {
        event.importance = importance;
      }

      const res = await graphFetch("/me/events", accessToken, {
        method: "POST",
        body: JSON.stringify(event),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      const createdEvent = await res.json();
      return NextResponse.json({ event: createdEvent });
    }

    case "update": {
      const { eventId, updates } = body;
      if (!eventId) {
        return NextResponse.json({ error: "eventId required" }, { status: 400 });
      }

      const res = await graphFetch(`/me/events/${eventId}`, accessToken, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      const updatedEvent = await res.json();
      return NextResponse.json({ event: updatedEvent });
    }

    case "delete": {
      const { eventId } = body;
      if (!eventId) {
        return NextResponse.json({ error: "eventId required" }, { status: 400 });
      }

      const res = await graphFetch(`/me/events/${eventId}`, accessToken, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      return NextResponse.json({ success: true });
    }

    case "accept": {
      const { eventId, comment, sendResponse } = body;
      if (!eventId) {
        return NextResponse.json({ error: "eventId required" }, { status: 400 });
      }

      const res = await graphFetch(`/me/events/${eventId}/accept`, accessToken, {
        method: "POST",
        body: JSON.stringify({
          comment: comment || "",
          sendResponse: sendResponse !== false,
        }),
      });

      if (!res.ok && res.status !== 202) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      return NextResponse.json({ success: true });
    }

    case "decline": {
      const { eventId, comment, sendResponse } = body;
      if (!eventId) {
        return NextResponse.json({ error: "eventId required" }, { status: 400 });
      }

      const res = await graphFetch(`/me/events/${eventId}/decline`, accessToken, {
        method: "POST",
        body: JSON.stringify({
          comment: comment || "",
          sendResponse: sendResponse !== false,
        }),
      });

      if (!res.ok && res.status !== 202) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      return NextResponse.json({ success: true });
    }

    case "tentativelyAccept": {
      const { eventId, comment, sendResponse } = body;
      if (!eventId) {
        return NextResponse.json({ error: "eventId required" }, { status: 400 });
      }

      const res = await graphFetch(`/me/events/${eventId}/tentativelyAccept`, accessToken, {
        method: "POST",
        body: JSON.stringify({
          comment: comment || "",
          sendResponse: sendResponse !== false,
        }),
      });

      if (!res.ok && res.status !== 202) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
