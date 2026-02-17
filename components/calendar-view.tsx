"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, Users, MapPin, Plus, ChevronLeft, ChevronRight, X, Check, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GraphEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  body?: { contentType: string; content: string };
  attendees?: Array<{ emailAddress: { address: string }; type: string }>;
  isAllDay: boolean;
  showAs: string;
  importance?: string;
  webLink: string;
  recurrence?: any;
  organizer?: { emailAddress: { address: string; name: string } };
}

interface CalendarViewProps {
  isConnected: boolean;
  onConnect: () => void;
}

type ViewType = "day" | "week" | "month";

export default function CalendarView({ isConnected, onConnect }: CalendarViewProps) {
  const [events, setEvents] = useState<GraphEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("week");
  const [selectedEvent, setSelectedEvent] = useState<GraphEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAction, setAiAction] = useState<string>("");
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Form state for creating events
  const [eventForm, setEventForm] = useState({
    subject: "",
    body: "",
    startTime: "",
    endTime: "",
    isAllDay: false,
    location: "",
    attendees: "",
    showAs: "busy",
    importance: "normal",
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      
      if (viewType === "day") {
        endDate.setDate(endDate.getDate() + 1);
      } else if (viewType === "week") {
        startDate.setDate(startDate.getDate() - startDate.getDay());
        endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));
      } else {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      }

      const response = await fetch(
        `/api/microsoft/calendar?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}`
      );
      const data = await response.json();
      
      if (response.ok) {
        setEvents(data.events || []);
      } else {
        console.error("Failed to fetch events:", data.error);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewType]);

  useEffect(() => {
    if (isConnected) {
      fetchEvents();
    }
  }, [isConnected, currentDate, viewType, fetchEvents]);

  const handleCreateEvent = async () => {
    try {
      const attendees = eventForm.attendees
        .split(",")
        .map(email => email.trim())
        .filter(email => email);

      const response = await fetch("/api/microsoft/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          subject: eventForm.subject,
          body: eventForm.body,
          startTime: eventForm.startTime,
          endTime: eventForm.endTime,
          isAllDay: eventForm.isAllDay,
          location: eventForm.location,
          attendees,
          showAs: eventForm.showAs,
          importance: eventForm.importance,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setEventForm({
          subject: "",
          body: "",
          startTime: "",
          endTime: "",
          isAllDay: false,
          location: "",
          attendees: "",
          showAs: "busy",
          importance: "normal",
        });
        fetchEvents();
      } else {
        const error = await response.json();
        alert(`Failed to create event: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event");
    }
  };

  const handleAIAction = async () => {
    setAiLoading(true);
    try {
      let body: any = { action: aiAction };

      switch (aiAction) {
        case "suggest-times":
          body = {
            ...body,
            duration: "60",
            attendees: [],
            preferredDays: "weekdays",
            timeRange: "9 AM - 5 PM",
          };
          break;
        case "summarize-day":
          body = {
            ...body,
            date: currentDate.toISOString().split('T')[0],
          };
          break;
        case "find-conflicts":
          body = {
            ...body,
            startDate: currentDate.toISOString().split('T')[0],
            endDate: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          };
          break;
        case "schedule-meeting":
          body = {
            ...body,
            description: "Team sync meeting",
            attendees: [],
            duration: "60",
            constraints: "Weekdays only",
          };
          break;
      }

      const response = await fetch("/api/microsoft/ai-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        setAiResult(result);
      } else {
        const error = await response.json();
        alert(`AI request failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Error with AI action:", error);
      alert("AI request failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch("/api/microsoft/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", eventId }),
      });

      if (response.ok) {
        setShowEventModal(false);
        setSelectedEvent(null);
        fetchEvents();
      } else {
        const error = await response.json();
        alert(`Failed to delete event: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    
    if (viewType === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (viewType === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const formatEventTime = (event: GraphEvent) => {
    if (event.isAllDay) return "All day";
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    return `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const getEventColor = (event: GraphEvent) => {
    if (event.importance === "high") return "bg-red-100 border-red-300 text-red-900";
    if (event.showAs === "busy") return "bg-blue-100 border-blue-300 text-blue-900";
    if (event.showAs === "tentative") return "bg-yellow-100 border-yellow-300 text-yellow-900";
    return "bg-gray-100 border-gray-300 text-gray-900";
  };

  const renderCalendarGrid = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    if (viewType === "day") {
      days.push(currentDate);
    } else if (viewType === "week") {
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push(day);
      }
    } else {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      
      for (let i = 0; i < 42; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        if (day <= lastDay || day.getMonth() === currentDate.getMonth()) {
          days.push(day);
        }
      }
    }

    return (
      <div className="grid gap-2">
        {viewType !== "day" && (
          <div className={`grid ${viewType === "week" ? "grid-cols-7" : "grid-cols-7"} gap-2 mb-2`}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>
        )}
        
        <div className={`grid ${viewType === "day" ? "grid-cols-1" : viewType === "week" ? "grid-cols-7" : "grid-cols-7"} gap-2`}>
          {days.map((day, index) => {
            const dayEvents = events.filter(event => {
              const eventDate = new Date(event.start.dateTime);
              return eventDate.toDateString() === day.toDateString();
            });

            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`border rounded-lg p-2 min-h-[100px] cursor-pointer transition-colors ${
                  isCurrentMonth ? "bg-white" : "bg-gray-50"
                } ${isToday ? "border-blue-500 border-2" : "border-gray-200"}
                hover:border-blue-300`}
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (viewType === "month") {
                    newDate.setFullYear(day.getFullYear());
                    newDate.setMonth(day.getMonth());
                    newDate.setDate(day.getDate());
                    setCurrentDate(newDate);
                    setViewType("day");
                  }
                }}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-700"}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded truncate cursor-pointer ${getEventColor(event)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                        setShowEventModal(true);
                      }}
                    >
                      {event.subject}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect to Microsoft Calendar</h3>
            <p className="text-gray-600 mb-4">
              Connect your Microsoft account to view and manage your calendar
            </p>
            <Button onClick={onConnect}>
              <Calendar className="w-4 h-4 mr-2" />
              Connect Calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate("prev")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleDateString("en-US", { 
              month: "long", 
              year: "numeric",
              ...(viewType === "day" && { day: "numeric" })
            })}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate("next")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["day", "week", "month"] as ViewType[]).map(view => (
              <Button
                key={view}
                variant={viewType === view ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType(view)}
                className="capitalize"
              >
                {view}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAiAction("summarize-day");
              setShowAIModal(true);
            }}
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Assist
          </Button>

          <Button
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        renderCalendarGrid()
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedEvent.subject}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEventModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatEventTime(selectedEvent)}</span>
              </div>
              
              {selectedEvent.location && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedEvent.location.displayName}</span>
                </div>
              )}

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{selectedEvent.attendees.map(a => a.emailAddress.address).join(", ")}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge variant={selectedEvent.showAs === "busy" ? "default" : "secondary"}>
                  {selectedEvent.showAs}
                </Badge>
                {selectedEvent.importance === "high" && (
                  <Badge variant="destructive">High Priority</Badge>
                )}
              </div>

              {selectedEvent.body && (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEvent.body.content }}
                />
              )}

              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedEvent.webLink, "_blank")}
                >
                  Open in Outlook
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create New Event</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={eventForm.subject}
                  onChange={(e) => setEventForm({ ...eventForm, subject: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    className="w-full p-2 border rounded-md"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    className="w-full p-2 border rounded-md"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={eventForm.isAllDay}
                  onChange={(e) => setEventForm({ ...eventForm, isAllDay: e.target.checked })}
                />
                <label htmlFor="allDay" className="text-sm font-medium">All day event</label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Attendees (comma-separated)</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={eventForm.attendees}
                  onChange={(e) => setEventForm({ ...eventForm, attendees: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows={4}
                  value={eventForm.body}
                  onChange={(e) => setEventForm({ ...eventForm, body: e.target.value })}
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleCreateEvent}>
                  <Check className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Assistant Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI Calendar Assistant
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">What would you like help with?</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={aiAction}
                  onChange={(e) => setAiAction(e.target.value)}
                >
                  <option value="">Select an action...</option>
                  <option value="suggest-times">Suggest meeting times</option>
                  <option value="summarize-day">Summarize my day</option>
                  <option value="find-conflicts">Find scheduling conflicts</option>
                  <option value="schedule-meeting">Schedule a meeting</option>
                  <option value="improve-event">Improve an event</option>
                </select>
              </div>

              {aiAction && (
                <Button onClick={handleAIAction} disabled={aiLoading}>
                  {aiLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Get AI Suggestions
                </Button>
              )}

              {aiResult && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-2">AI Results:</h4>
                  <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(aiResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
