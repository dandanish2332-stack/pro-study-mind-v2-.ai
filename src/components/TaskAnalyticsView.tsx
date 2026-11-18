import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  BarChart3,
  Check,
  TrendingUp,
  Download,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { TaskItem } from "../types";
import { exportToCSV } from "../utils/export";

export const TaskAnalyticsView: React.FC = () => {
  const { tasks, addTask, toggleTaskStatus, tr } = useApp();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("Development");
  const [priority, setPriority] = useState<TaskItem["priority"]>("high");
  const [dueDate, setDueDate] = useState(() => {
    return new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  });
  const [estimatedHours, setEstimatedHours] = useState("2");

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const completionRate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const urgentCount = tasks.filter((t) => t.priority === "urgent" && t.status !== "completed").length;
  const totalEstHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      description: desc.trim() || "Workspace task item.",
      category,
      priority,
      status: "todo",
      dueDate,
      estimatedHours: parseFloat(estimatedHours) || 1,
    });

    setTitle("");
    setDesc("");
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Title", "Category", "Priority", "Status", "Due Date", "Est. Hours"];
    const rows = tasks.map((t) => [
      t.id,
      t.title,
      t.category,
      t.priority,
      t.status,
      t.dueDate,
      t.estimatedHours,
    ]);
    exportToCSV("Task_Completion_Analytics", headers, rows);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-500" />
            Task Completion Analytics & Productivity Board
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time completion metrics, urgency tracking, and category velocity.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors shrink-0"
        >
          <Download className="w-4 h-4" /> Export Analytics CSV
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Completion Rate</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{completionRate}%</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Completed Tasks</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {completedCount} / {tasks.length}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
            +{completedCount} completed this week
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Urgent Pending</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{urgentCount} Items</p>
          <p className="text-[11px] text-rose-500 font-semibold mt-2">Priority attention required</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Workload</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{totalEstHours} Hours</p>
          <p className="text-[11px] text-indigo-500 font-semibold mt-2">Estimated total duration</p>
        </div>
      </div>

      {/* Main Row: Add Task & Task Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Form */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-500" /> Add Study Goal / Homework
          </h3>

          <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Task / Homework Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete chapter 4 biology practice questions"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskItem["priority"])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Est. Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              + Add Task to Analytics Board
            </button>
          </form>
        </div>

        {/* Task Board */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Active Workspace Tasks
          </h3>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTaskStatus(task.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  task.status === "completed"
                    ? "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 opacity-60"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      task.status === "completed"
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-400 dark:border-slate-600"
                    }`}
                  >
                    {task.status === "completed" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        task.status === "completed"
                          ? "line-through text-slate-400"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {task.category} • Due {task.dueDate} • {task.estimatedHours}h est.
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    task.priority === "urgent"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
