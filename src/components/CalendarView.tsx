import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  UserCheck,
  CheckCircle2,
  Trash2,
  Sparkles,
  Download,
  CalendarDays,
  Globe,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { CalendarEvent } from "../types";
import { exportToCSV } from "../utils/export";

export const CalendarView: React.FC = () => {
  const { calendarEvents, addCalendarEvent, deleteCalendarEvent, sendMessageToAI, tr } = useApp();

  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventCategory, setEventCategory] = useState<CalendarEvent["category"]>("meeting");
  const [eventSource, setEventSource] = useState<CalendarEvent["source"]>("Google Calendar");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    let startIso = new Date().toISOString();
    try {
      if (eventDate) {
        const timePart = eventTime ? eventTime : "09:00";
        const parsed = new Date(`${eventDate}T${timePart}`);
        if (!isNaN(parsed.getTime())) {
          startIso = parsed.toISOString();
        }
      }
    } catch {
      startIso = new Date().toISOString();
    }
    const endIso = new Date(new Date(startIso).getTime() + 3600000).toISOString();

    addCalendarEvent({
      title: eventTitle.trim(),
      description: eventDesc.trim() || "Synced calendar event.",
      startTime: startIso,
      endTime: endIso,
      category: eventCategory,
      source: eventSource,
      synced: true,
      attendees: ["alex@omnisync.ai"],
    });

    setEventTitle("");
    setEventDesc("");
  };

  const handleAISchedulePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    // Call AI to schedule
    sendMessageToAI(`Schedule calendar event: ${aiPrompt}`);

    // Create event state locally
    addCalendarEvent({
      title: aiPrompt.length > 30 ? aiPrompt.substring(0, 30) + "..." : aiPrompt,
      description: `AI Scheduled Event: "${aiPrompt}"`,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
      category: "meeting",
      source: "Google Calendar",
      synced: true,
    });

    setAiPrompt("");
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Title", "Category", "Source", "Start Time", "End Time", "Synced"];
    const rows = calendarEvents.map((e) => [
      e.id,
      e.title,
      e.category,
      e.source,
      e.startTime,
      e.endTime,
      e.synced ? "Synced" : "Local",
    ]);
    exportToCSV("Calendar_Events_Export", headers, rows);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-purple-500" />
            Study Schedule, Exams & Calendar Integration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time study session scheduling, board exam revision plans, and personal student timetable planner.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors shrink-0"
        >
          <Download className="w-4 h-4" /> Export Calendar CSV
        </button>
      </div>

      {/* Connected Provider Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { name: "Student Revision Planner", status: "Active & Synced", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/50" },
          { name: "Exam Timetable Engine", status: "Board Syllabus Ready", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/50" },
          { name: "Daily Study Routine", status: "Smart Reminders Active", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/50" },
        ].map((prov, i) => (
          <div
            key={i}
            className={`p-4 rounded-2xl border border-slate-200 dark:border-slate-800 ${prov.bg} flex items-center justify-between`}
          >
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{prov.name}</h4>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{prov.status}</p>
            </div>
            <Globe className={`w-5 h-5 ${prov.color}`} />
          </div>
        ))}
      </div>

      {/* Main Row: Quick AI Scheduler & Create Event */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Quick Scheduler & Manual Form */}
        <div className="space-y-6">
          {/* AI Quick Scheduler */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/60 text-white shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold">Natural Language AI Scheduler</h3>
            </div>
            <p className="text-xs text-slate-300">
              Type any schedule command in natural language:
            </p>

            <form onSubmit={handleAISchedulePrompt} className="space-y-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Schedule team sync tomorrow at 3 PM..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-purple-800/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
              >
                Auto-Schedule Event
              </button>
            </form>
          </div>

          {/* Manual Event Creator */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" /> Create Detailed Event
            </h3>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Q3 Financial Review"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Time</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Calendar Source</label>
                  <select
                    value={eventSource}
                    onChange={(e) => setEventSource(e.target.value as CalendarEvent["source"])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Google Calendar">Google Calendar</option>
                    <option value="Outlook">Outlook</option>
                    <option value="Apple iCal">Apple iCal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as CalendarEvent["category"])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="deadline">Deadline</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                + Add Event & Sync
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Events Feed & Calendar Board */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-500" /> Synced Workspace Schedule
          </h3>

          <div className="space-y-3">
            {calendarEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{ev.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      {ev.source}
                    </span>
                    {ev.synced && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Synced
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">{ev.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(ev.startTime).toLocaleDateString()} at{" "}
                      {new Date(ev.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteCalendarEvent(ev.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
                  title="Remove event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
