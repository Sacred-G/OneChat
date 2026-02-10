import { NextRequest, NextResponse } from "next/server";
import { getFreshMsAccessToken } from "@/lib/microsoft-auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// Helper function to format events for AI
function formatEventForAI(event: any): string {
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);
  const attendees = event.attendees?.map((a: any) => a.emailAddress.address).join(", ") || "No attendees";
  const location = event.location?.displayName || "No location";
  
  return `- ${event.subject || "No subject"}
  Time: ${start.toLocaleString()} - ${end.toLocaleString()}
  Location: ${location}
  Attendees: ${attendees}
  All day: ${event.isAllDay ? "Yes" : "No"}
  Show as: ${event.showAs}
  Importance: ${event.importance || "normal"}`;
}

// POST /api/microsoft/ai-calendar
// Actions: suggest-times, summarize-day, find-conflicts, schedule-meeting, improve-event
export async function POST(request: NextRequest) {
  const { accessToken } = await getFreshMsAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case "suggest-times": {
        const { duration, attendees, preferredDays, timeRange } = body;
        
        // Get user's calendar for the next few weeks
        const endTime = new Date();
        endTime.setDate(endTime.getDate() + 21);
        
        const calendarRes = await graphFetch(
          `/me/calendarView?startDateTime=${new Date().toISOString()}&endDateTime=${endTime.toISOString()}&$select=start,end,subject,showAs`,
          accessToken
        );
        
        if (!calendarRes.ok) {
          throw new Error("Failed to fetch calendar");
        }
        
        const calendarData = await calendarRes.json();
        const existingEvents = calendarData.value || [];
        
        const prompt = `Based on the following existing calendar events, suggest 3-5 optimal meeting times for a ${duration || "60"}-minute meeting.

Existing events:
${existingEvents.map(formatEventForAI).join("\n")}

Requirements:
- Duration: ${duration || "60"} minutes
- Attendees: ${attendees?.join(", ") || "Just me"}
- Preferred days: ${preferredDays || "Any day"}
- Time range: ${timeRange || "9 AM - 5 PM"}

Please suggest specific date and time combinations that avoid conflicts. Format your response as a JSON array with objects containing:
{
  "dateTime": "2024-01-15T10:00:00",
  "reason": "Brief explanation of why this time works well"
}

Consider:
- Avoiding back-to-back meetings when possible
- Preferred days of the week
- Reasonable business hours
- Buffer time between meetings`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        const suggestions = JSON.parse(completion.choices[0].message.content || "[]");
        return NextResponse.json({ suggestions });
      }

      case "summarize-day": {
        const { date } = body;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const startOfDay = new Date(targetDate + "T00:00:00");
        const endOfDay = new Date(targetDate + "T23:59:59");

        const calendarRes = await graphFetch(
          `/me/calendarView?startDateTime=${startOfDay.toISOString()}&endDateTime=${endOfDay.toISOString()}&$select=*`,
          accessToken
        );
        
        if (!calendarRes.ok) {
          throw new Error("Failed to fetch calendar");
        }
        
        const calendarData = await calendarRes.json();
        const events = calendarData.value || [];

        const prompt = `Please provide a concise summary of my day on ${targetDate}. Here are my events:

${events.map(formatEventForAI).join("\n")}

Please provide:
1. A brief overview of the day (busy/light/mixed)
2. Key meetings or important events
3. Any potential scheduling concerns
4. A friendly, encouraging tone

Keep it under 150 words and format it nicely.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        const summary = completion.choices[0].message.content || "No summary available";
        return NextResponse.json({ summary, events });
      }

      case "find-conflicts": {
        const { startDate, endDate } = body;
        const start = startDate || new Date().toISOString().split('T')[0];
        const end = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const calendarRes = await graphFetch(
          `/me/calendarView?startDateTime=${new Date(start).toISOString()}&endDateTime=${new Date(end + "T23:59:59").toISOString()}&$select=*`,
          accessToken
        );
        
        if (!calendarRes.ok) {
          throw new Error("Failed to fetch calendar");
        }
        
        const calendarData = await calendarRes.json();
        const events = calendarData.value || [];

        const prompt = `Analyze these calendar events and identify any scheduling conflicts or issues:

${events.map(formatEventForAI).join("\n")}

Look for:
1. Overlapping events
2. Events scheduled outside reasonable hours (before 7 AM or after 9 PM unless marked as all-day)
3. Back-to-back meetings with no breaks
4. Double bookings
5. Events that might need travel time between locations

Return a JSON array of conflicts found, each with:
{
  "type": "overlap|late_early|no_break|double_booking|travel_time",
  "events": ["Event 1", "Event 2"],
  "description": "Human-readable description of the issue",
  "suggestion": "How to resolve it"
}

If no conflicts are found, return an empty array.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        });

        const conflicts = JSON.parse(completion.choices[0].message.content || "[]");
        return NextResponse.json({ conflicts });
      }

      case "schedule-meeting": {
        const { description, attendees, duration, constraints } = body;
        
        // Get calendar for context
        const endTime = new Date();
        endTime.setDate(endTime.getDate() + 14);
        
        const calendarRes = await graphFetch(
          `/me/calendarView?startDateTime=${new Date().toISOString()}&endDateTime=${endTime.toISOString()}&$select=start,end,subject`,
          accessToken
        );
        
        if (!calendarRes.ok) {
          throw new Error("Failed to fetch calendar");
        }
        
        const calendarData = await calendarRes.json();
        const existingEvents = calendarData.value || [];

        const prompt = `Help me schedule a meeting based on this description:

Meeting description: ${description}
Attendees: ${attendees?.join(", ") || "Just me"}
Duration: ${duration || "60"} minutes
Constraints: ${constraints || "None"}

Here's my existing schedule:
${existingEvents.map(formatEventForAI).join("\n")}

Please create a complete event object that I can use to create this meeting. Return JSON in this format:
{
  "subject": "Clear meeting title",
  "body": "HTML description with details and agenda",
  "startTime": "2024-01-15T10:00:00",
  "endTime": "2024-01-15T11:00:00",
  "location": "Location or meeting link",
  "attendees": ["email1@example.com", "email2@example.com"],
  "showAs": "busy",
  "importance": "normal",
  "reason": "Why this time was chosen"
}

Choose a time that avoids conflicts and respects the constraints. If specific people are mentioned, include them as attendees.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        const meetingPlan = JSON.parse(completion.choices[0].message.content || "{}");
        return NextResponse.json({ meetingPlan });
      }

      case "improve-event": {
        const { event } = body;
        
        const prompt = `Please suggest improvements for this calendar event:

Current event:
${formatEventForAI(event)}

Suggest improvements for:
1. Subject line (make it clearer/more professional)
2. Description content (add agenda, objectives, preparation)
3. Attendee list (anyone missing?)
4. Timing (is the duration appropriate?)
5. Location details (add directions if needed)

Return your suggestions as JSON:
{
  "subject": "Improved subject line",
  "body": "Improved HTML description",
  "duration": "Suggested duration in minutes",
  "attendees": ["suggested additional attendees"],
  "location": "Improved location details",
  "suggestions": ["General improvement suggestions"]
}

If the event looks good as-is, you can return the original values with minimal changes.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        const improvements = JSON.parse(completion.choices[0].message.content || "{}");
        return NextResponse.json({ improvements });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("AI Calendar error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
