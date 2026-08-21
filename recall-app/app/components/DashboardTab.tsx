"use client";

import { useEffect, useState } from "react";

interface Assignment {
  name: string;
  dueAt: string | null;
  status: string;
  score: number | null;
  pointsPossible: number | null;
  submittedAt: string | null;
  submissionType: "on_paper" | "online";
  courseName: string;
  courseId: number;
}

interface Course {
  id: number;
  name: string;
  grade: string | null;
  score: number | null;
  assignments: Assignment[];
}

type Filter = "all" | "overdue" | "today" | "week" | "upcoming";

function getTimeBucket(dueAt: string | null, status: string): string {
  if (!dueAt) return "no-date";
  // Already submitted/graded — not actionable
  if (status === "graded" || status === "submitted") return "upcoming";

  const now = new Date();
  const due = new Date(dueAt);

  // Use end of due date (give full day to submit)
  const endOfDueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate() + 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000);

  // Overdue: due date has fully passed AND not submitted
  if (endOfDueDay <= startOfToday && status === "unsubmitted") return "overdue";
  // Due today: due date is today
  if (due >= startOfToday && due < endOfToday) return "today";
  // This week
  if (due >= endOfToday && due < endOfWeek) return "week";
  return "upcoming";
}

function bucketLabel(bucket: string) {
  switch (bucket) {
    case "overdue": return "Overdue";
    case "today": return "Due Today";
    case "week": return "This Week";
    case "upcoming": return "Upcoming";
    case "no-date": return "No Due Date";
    default: return bucket;
  }
}

function bucketColor(bucket: string) {
  switch (bucket) {
    case "overdue": return "border-red-500 bg-red-50";
    case "today": return "border-amber-500 bg-amber-50";
    case "week": return "border-blue-500 bg-blue-50";
    default: return "border-gray-300 bg-gray-50";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "graded": return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Graded</span>;
    case "submitted": return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Submitted</span>;
    case "unsubmitted": return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">Not Submitted</span>;
    default: return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{status}</span>;
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "No due date";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [courseFilter, setCourseFilter] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/canvas-sync?studentId=81991")
      .then((r) => r.json())
      .then((res) => {
        setCourses(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const allAssignments = courses.flatMap((c) => c.assignments);
  const filtered = allAssignments.filter((a) => {
    const bucket = getTimeBucket(a.dueAt, a.status);
    if (courseFilter && a.courseId !== courseFilter) return false;
    if (filter === "overdue") return bucket === "overdue";
    if (filter === "today") return bucket === "today";
    if (filter === "week") return bucket === "week";
    if (filter === "upcoming") return bucket === "upcoming" || bucket === "no-date";
    return true;
  });

  const grouped: Record<string, Assignment[]> = {};
  const order = ["overdue", "today", "week", "upcoming", "no-date"];
  for (const a of filtered) {
    const bucket = getTimeBucket(a.dueAt, a.status);
    if (!grouped[bucket]) grouped[bucket] = [];
    grouped[bucket].push(a);
  }

  const overdueCount = allAssignments.filter((a) => getTimeBucket(a.dueAt, a.status) === "overdue").length;
  const todayCount = allAssignments.filter((a) => getTimeBucket(a.dueAt, a.status) === "today").length;
  const weekCount = allAssignments.filter((a) => getTimeBucket(a.dueAt, a.status) === "week").length;

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "overdue", label: `Overdue (${overdueCount})` },
    { key: "today", label: `Today (${todayCount})` },
    { key: "week", label: `This Week (${weekCount})` },
    { key: "upcoming", label: "Upcoming" },
  ];

  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Hailey&apos;s Dashboard</h1>
        <p className="text-sm text-gray-500">
          {overdueCount > 0 && <span className="text-red-600 font-medium">{overdueCount} overdue</span>}
          {overdueCount > 0 && weekCount > 0 && " · "}
          {weekCount > 0 && <span>{weekCount} due this week</span>}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <button
          onClick={() => setCourseFilter(null)}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full border ${
            !courseFilter ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          All Classes
        </button>
        {courses.map((c) => (
          <button
            key={c.id}
            onClick={() => setCourseFilter(c.id === courseFilter ? null : c.id)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border ${
              courseFilter === c.id ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {c.name.split("-")[0].replace(/^\d+\s*/, "").trim()}
            {c.grade && <span className="ml-1 font-medium">{c.grade}</span>}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border ${
              filter === f.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {order.map((bucket) => {
        const items = grouped[bucket];
        if (!items || items.length === 0) return null;
        return (
          <div key={bucket} className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {bucketLabel(bucket)}
            </h2>
            <div className="space-y-2">
              {items.map((a, i) => (
                <div
                  key={`${a.courseId}-${a.name}-${i}`}
                  className={`border-l-4 rounded-lg p-3 ${bucketColor(bucket)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 font-medium truncate max-w-[60%]">
                      {a.courseName.split("-")[0].replace(/^\d+\s*/, "").trim()}
                    </span>
                    {a.score !== null && a.pointsPossible ? (
                      <span className="text-xs font-medium text-gray-700">
                        {a.score}/{a.pointsPossible}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{a.name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{formatDate(a.dueAt)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${a.submissionType === "on_paper" ? "bg-yellow-100 text-yellow-700" : "bg-purple-100 text-purple-700"}`}>
                        {a.submissionType === "on_paper" ? "Paper" : "Online"}
                      </span>
                    </div>
                    {statusBadge(a.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12">No assignments match this filter.</p>
      )}
    </>
  );
}
