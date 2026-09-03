"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { DAILY_GOAL_CARDS } from "../lib/supabase/db-types";

interface Assignment {
  name: string;
  dueAt: string | null;
  status: string;
  score: number | null;
  pointsPossible: number | null;
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

interface CustomTest {
  id: string;
  name: string;
  subject: string;
  date: string;
  topics: string;
}

function cleanCourseName(name: string) {
  return name.split("-")[0].replace(/^\d+\s*/, "").trim();
}

function getTimeLabel(dueAt: string | null): string {
  if (!dueAt) return "";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateStr = dueAt.split("T")[0];
  const [year, month, day] = dueDateStr.split("-").map(Number);
  const dueDate = new Date(year, month - 1, day);

  const diffDays = Math.round((dueDate.getTime() - startOfToday.getTime()) / 86400000);

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return dueDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isOverdue(a: Assignment): boolean {
  if (!a.dueAt || a.status !== "unsubmitted") return false;
  const dueDateStr = a.dueAt.split("T")[0];
  const [year, month, day] = dueDateStr.split("-").map(Number);
  const dueDate = new Date(year, month - 1, day);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const daysOverdue = Math.round((startOfToday.getTime() - dueDate.getTime()) / 86400000);
  // Only show as overdue if < 14 days past due (older = stale)
  return daysOverdue > 0 && daysOverdue <= 14;
}

function isDueThisWeek(a: Assignment): boolean {
  if (!a.dueAt || a.status !== "unsubmitted") return false;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000);
  const dueDateStr = a.dueAt.split("T")[0];
  const [year, month, day] = dueDateStr.split("-").map(Number);
  const dueDate = new Date(year, month - 1, day);
  return dueDate >= startOfToday && dueDate < endOfWeek;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const TEST_KEYWORDS = /\b(test|quiz|exam|midterm|final|project|essay|presentation|assessment|benchmark)\b/i;

function isTestOrProject(a: Assignment): boolean {
  return TEST_KEYWORDS.test(a.name);
}

export default function DashboardTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyCorrect, setDailyCorrect] = useState(0);
  const [dailyGoalMet, setDailyGoalMet] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [userName, setUserName] = useState("Hailey");
  const [customTests, setCustomTests] = useState<CustomTest[]>([]);
  const [showAddTest, setShowAddTest] = useState(false);
  const [newTestName, setNewTestName] = useState("");
  const [newTestSubject, setNewTestSubject] = useState("");
  const [newTestDate, setNewTestDate] = useState("");
  const [newTestTopics, setNewTestTopics] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    // Load all in parallel
    const [canvasRes, profileRes, progressRes, dismissedRes, testsRes] = await Promise.all([
      fetch("/api/canvas-sync?studentId=81991").then(r => r.json()).catch(() => ({ data: [] })),
      user ? supabase.from("profiles").select("display_name").eq("id", user.id).single() : Promise.resolve({ data: null }),
      user ? fetch(`/api/daily-progress?userId=${user.id}`).then(r => r.json()).catch(() => null) : Promise.resolve(null),
      user ? supabase.from("canvas_cache").select("data").eq("student_id", `dismissed_${user.id}`).single() : Promise.resolve({ data: null }),
      user ? supabase.from("canvas_cache").select("data").eq("student_id", `tests_${user.id}`).single() : Promise.resolve({ data: null }),
    ]);

    setCourses(canvasRes.data || []);
    if (profileRes.data?.display_name) setUserName(profileRes.data.display_name.split(" ")[0]);
    if (progressRes) {
      setDailyCorrect(progressRes.cards_correct || 0);
      setDailyGoalMet(progressRes.goal_met || false);
    }
    if (dismissedRes.data?.data?.ids) {
      setDismissedIds(new Set(dismissedRes.data.data.ids));
    }
    if (testsRes.data?.data?.tests) {
      setCustomTests(testsRes.data.data.tests);
    }

    setLoading(false);
  }

  function assignmentKey(a: Assignment): string {
    return `${a.courseId}_${a.name}`;
  }

  async function dismissAssignment(a: Assignment) {
    const key = assignmentKey(a);
    const newSet = new Set(dismissedIds);
    newSet.add(key);
    setDismissedIds(newSet);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await supabase.from("canvas_cache").upsert(
        { student_id: `dismissed_${user.id}`, data: { ids: [...newSet] }, updated_at: new Date().toISOString() },
        { onConflict: "student_id" }
      );
    } catch {}
  }

  async function undoDismiss(a: Assignment) {
    const key = assignmentKey(a);
    const newSet = new Set(dismissedIds);
    newSet.delete(key);
    setDismissedIds(newSet);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await supabase.from("canvas_cache").upsert(
        { student_id: `dismissed_${user.id}`, data: { ids: [...newSet] }, updated_at: new Date().toISOString() },
        { onConflict: "student_id" }
      );
    } catch {}
  }

  async function addCustomTest() {
    if (!newTestName.trim() || !newTestDate) return;
    const test: CustomTest = {
      id: `test_${Date.now()}`,
      name: newTestName.trim(),
      subject: newTestSubject.trim(),
      date: newTestDate,
      topics: newTestTopics.trim(),
    };
    const updated = [...customTests, test];
    setCustomTests(updated);
    setShowAddTest(false);
    setNewTestName("");
    setNewTestSubject("");
    setNewTestDate("");
    setNewTestTopics("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await supabase.from("canvas_cache").upsert(
        { student_id: `tests_${user.id}`, data: { tests: updated }, updated_at: new Date().toISOString() },
        { onConflict: "student_id" }
      );
    } catch {}
  }

  async function removeCustomTest(testId: string) {
    const updated = customTests.filter(t => t.id !== testId);
    setCustomTests(updated);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await supabase.from("canvas_cache").upsert(
        { student_id: `tests_${user.id}`, data: { tests: updated }, updated_at: new Date().toISOString() },
        { onConflict: "student_id" }
      );
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-7 w-7 border-[3px] border-gray-200 border-t-blue-500 rounded-full" />
      </div>
    );
  }

  const allAssignments = courses.flatMap(c => c.assignments);
  const currentYear = new Date().getFullYear();

  // Filter out stale assignments and dismissed ones
  const activeAssignments = allAssignments.filter(a => {
    if (!a.dueAt) return false;
    const year = parseInt(a.dueAt.split("-")[0]);
    if (year < currentYear - 1) return false;
    return true;
  });

  const overdue = activeAssignments.filter(a => isOverdue(a) && !dismissedIds.has(assignmentKey(a)));
  const dueThisWeek = activeAssignments.filter(a => isDueThisWeek(a) && !isOverdue(a) && !dismissedIds.has(assignmentKey(a)));

  // Paper assignments that are past due — show with "Done" button
  const paperPastDue = activeAssignments.filter(a => {
    if (a.submissionType !== "on_paper" || a.status !== "unsubmitted" || !a.dueAt) return false;
    if (dismissedIds.has(assignmentKey(a))) return false;
    const dueDateStr = a.dueAt.split("T")[0];
    const [year, month, day] = dueDateStr.split("-").map(Number);
    const dueDate = new Date(year, month - 1, day);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const daysOverdue = Math.round((startOfToday.getTime() - dueDate.getTime()) / 86400000);
    return daysOverdue > 0 && daysOverdue <= 14;
  });

  // Online overdue (exclude paper — those go in paperPastDue with "Done" button)
  const onlineOverdue = overdue.filter(a => a.submissionType !== "on_paper");

  // Recently dismissed (for undo)
  const recentlyDismissed = activeAssignments.filter(a => dismissedIds.has(assignmentKey(a))).slice(0, 3);

  const needsAttention = overdue.filter(a => !dismissedIds.has(assignmentKey(a)));
  const progressPct = Math.min(100, Math.round((dailyCorrect / DAILY_GOAL_CARDS) * 100));

  // Upcoming tests/projects: auto-detected from Canvas + custom
  const now = new Date();
  const monthOut = new Date(now.getTime() + 30 * 86400000);
  const canvasTests = activeAssignments.filter(a => {
    if (!a.dueAt) return false;
    const due = new Date(a.dueAt);
    if (due < now || due > monthOut) return false;
    return isTestOrProject(a);
  }).sort((a, b) => (a.dueAt || "").localeCompare(b.dueAt || ""));

  // Filter out past custom tests
  const todayStr = now.toISOString().split("T")[0];
  const activeCustomTests = customTests.filter(t => t.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));

  // Grades sorted: lowest first (needs attention)
  const sortedCourses = [...courses].sort((a, b) => (a.score ?? 100) - (b.score ?? 100));

  return (
    <div className="w-full">
      {/* Greeting */}
      <h1 className="text-[24px] font-bold text-gray-900 tracking-tight mb-5">
        {getGreeting()}, {userName}
      </h1>

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <div className="mb-5">
          <h2 className="text-[13px] font-semibold text-red-500 uppercase tracking-widest mb-2">Needs Attention</h2>
          <div className="bg-white/80 backdrop-blur-xl rounded-[16px] border border-red-200/60 shadow-sm overflow-hidden">
            {needsAttention.map((a, i) => (
              <div key={assignmentKey(a) + i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-red-100/60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-gray-900 truncate">{a.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[12px] text-gray-400">{cleanCourseName(a.courseName)}</span>
                    <span className="text-[12px] text-red-400 font-medium">{getTimeLabel(a.dueAt)}</span>
                    {a.submissionType === "on_paper" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium">Paper</span>
                    )}
                  </div>
                </div>
                {/* Done button on all overdue + paper assignments */}
                <button
                  onClick={() => dismissAssignment(a)}
                  className="shrink-0 ml-3 text-[12px] font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 active:scale-[0.97] transition-all"
                >
                  Done
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Tests & Projects */}
      {(canvasTests.length > 0 || activeCustomTests.length > 0 || showAddTest) && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[13px] font-semibold text-indigo-500 uppercase tracking-widest">Upcoming Tests</h2>
            <button
              onClick={() => setShowAddTest(!showAddTest)}
              className="text-[12px] font-medium text-indigo-500 active:text-indigo-700"
            >
              {showAddTest ? "Cancel" : "+ Add"}
            </button>
          </div>

          {/* Add test form */}
          {showAddTest && (
            <div className="bg-indigo-50/60 backdrop-blur-xl rounded-[16px] border border-indigo-200/60 p-4 mb-2.5">
              <input
                type="text"
                value={newTestName}
                onChange={e => setNewTestName(e.target.value)}
                placeholder="Test name (e.g., Spanish Quiz Ch.3)"
                className="w-full px-3 py-2.5 rounded-[10px] bg-white border border-gray-200 text-[14px] mb-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTestSubject}
                  onChange={e => setNewTestSubject(e.target.value)}
                  placeholder="Subject"
                  className="flex-1 px-3 py-2.5 rounded-[10px] bg-white border border-gray-200 text-[14px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <input
                  type="date"
                  value={newTestDate}
                  onChange={e => setNewTestDate(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-[10px] bg-white border border-gray-200 text-[14px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <input
                type="text"
                value={newTestTopics}
                onChange={e => setNewTestTopics(e.target.value)}
                placeholder="Topics to study (optional)"
                className="w-full px-3 py-2.5 rounded-[10px] bg-white border border-gray-200 text-[14px] mb-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                onClick={addCustomTest}
                disabled={!newTestName.trim() || !newTestDate}
                className="w-full py-2.5 rounded-[10px] bg-indigo-500 text-white text-[14px] font-semibold disabled:opacity-30 active:scale-[0.98] transition-all"
              >
                Add Test
              </button>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-xl rounded-[16px] border border-indigo-200/40 shadow-sm overflow-hidden">
            {/* Canvas-detected tests */}
            {canvasTests.map((a, i) => {
              const daysUntil = Math.round((new Date(a.dueAt!).getTime() - now.getTime()) / 86400000);
              return (
                <div key={`canvas-${i}`} className={`flex items-center justify-between px-4 py-3 ${i > 0 || activeCustomTests.length > 0 ? "border-t border-indigo-100/40" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-gray-900 truncate">{a.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[12px] text-gray-400">{cleanCourseName(a.courseName)}</span>
                      {a.pointsPossible && <span className="text-[11px] text-indigo-400 font-medium">{a.pointsPossible}pts</span>}
                    </div>
                  </div>
                  <div className="shrink-0 ml-3 text-right">
                    <p className={`text-[13px] font-semibold ${daysUntil <= 3 ? "text-red-500" : "text-indigo-500"}`}>
                      {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
                    </p>
                    <p className="text-[11px] text-gray-400">{new Date(a.dueAt!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                </div>
              );
            })}

            {/* Custom tests */}
            {activeCustomTests.map((t, i) => {
              const daysUntil = Math.round((new Date(t.date).getTime() - now.getTime()) / 86400000) + 1;
              return (
                <div key={t.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 || canvasTests.length > 0 ? "border-t border-indigo-100/40" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-gray-900 truncate">{t.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {t.subject && <span className="text-[12px] text-gray-400">{t.subject}</span>}
                      {t.topics && <span className="text-[11px] text-indigo-400 truncate">{t.topics}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 ml-3 flex items-center gap-2">
                    <div className="text-right">
                      <p className={`text-[13px] font-semibold ${daysUntil <= 3 ? "text-red-500" : "text-indigo-500"}`}>
                        {daysUntil <= 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
                      </p>
                      <p className="text-[11px] text-gray-400">{new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                    <button
                      onClick={() => removeCustomTest(t.id)}
                      className="text-[11px] text-gray-300 hover:text-red-400 active:scale-[0.95] transition-all"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })}

            {canvasTests.length === 0 && activeCustomTests.length === 0 && (
              <div className="px-4 py-4 text-center">
                <p className="text-[13px] text-gray-400">No upcoming tests detected</p>
                <p className="text-[12px] text-gray-300 mt-0.5">Tap &quot;+ Add&quot; to add one manually</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add test button when section is hidden */}
      {canvasTests.length === 0 && activeCustomTests.length === 0 && !showAddTest && (
        <button
          onClick={() => setShowAddTest(true)}
          className="w-full mb-5 py-3 rounded-[14px] border-2 border-dashed border-indigo-200 text-[13px] font-medium text-indigo-400 active:bg-indigo-50 transition-all"
        >
          + Add Upcoming Test or Quiz
        </button>
      )}

      {/* Due This Week */}
      {dueThisWeek.length > 0 && (
        <div className="mb-5">
          <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Due This Week</h2>
          <div className="bg-white/80 backdrop-blur-xl rounded-[16px] border border-gray-200/60 shadow-sm overflow-hidden">
            {dueThisWeek.map((a, i) => (
              <div key={assignmentKey(a) + i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-gray-100/60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-gray-900 truncate">{a.name}</p>
                  <span className="text-[12px] text-gray-400">{cleanCourseName(a.courseName)}</span>
                </div>
                <div className="shrink-0 ml-3 flex items-center gap-2">
                  <button
                    onClick={() => dismissAssignment(a)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 active:scale-[0.97] transition-all"
                  >
                    Done
                  </button>
                  <span className="text-[12px] text-gray-400 font-medium">{getTimeLabel(a.dueAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nothing due */}
      {needsAttention.length === 0 && dueThisWeek.length === 0 && (
        <div className="bg-emerald-50/60 backdrop-blur-xl rounded-[16px] border border-emerald-200/60 p-5 mb-5 text-center">
          <p className="text-[15px] font-semibold text-emerald-600">All caught up!</p>
          <p className="text-[13px] text-emerald-500 mt-0.5">No assignments due this week</p>
        </div>
      )}

      {/* Grades */}
      <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Grades</h2>
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {sortedCourses.map((c) => {
          const needsWork = c.score !== null && c.score < 93;
          const gap = needsWork ? (93 - (c.score || 0)).toFixed(1) : null;
          const gradeColor = !c.score ? "text-gray-400"
            : c.score >= 93 ? "text-emerald-600"
            : c.score >= 80 ? "text-amber-600"
            : "text-red-500";
          const bgColor = !c.score ? "bg-gray-50"
            : c.score >= 93 ? "bg-emerald-50/60"
            : c.score >= 80 ? "bg-amber-50/60"
            : "bg-red-50/60";
          const borderColor = !c.score ? "border-gray-200/60"
            : c.score >= 93 ? "border-emerald-200/60"
            : c.score >= 80 ? "border-amber-200/60"
            : "border-red-200/60";

          return (
            <div key={c.id} className={`${bgColor} backdrop-blur-xl rounded-[16px] border ${borderColor} p-3.5 flex flex-col items-center text-center`}>
              <span className={`text-[28px] font-bold tabular-nums leading-none ${gradeColor}`}>
                {c.grade || "--"}
              </span>
              {c.score !== null && (
                <span className="text-[12px] text-gray-400 tabular-nums mt-0.5">{c.score}%</span>
              )}
              <span className="text-[12px] text-gray-500 font-medium mt-1.5 leading-tight">{cleanCourseName(c.name)}</span>
              {needsWork && (
                <span className="text-[11px] text-amber-500 font-medium mt-1">needs +{gap}%</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Daily Goal */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[16px] border border-gray-200/60 shadow-sm p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold text-gray-500">Today&apos;s Study Goal</span>
          <span className={`text-[13px] font-bold tabular-nums ${dailyGoalMet ? "text-amber-500" : "text-gray-800"}`}>
            {dailyCorrect} / {DAILY_GOAL_CARDS}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              dailyGoalMet ? "bg-gradient-to-r from-amber-400 to-amber-500"
              : progressPct >= 50 ? "bg-gradient-to-r from-blue-400 to-blue-500"
              : "bg-gradient-to-r from-blue-300 to-blue-400"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {dailyGoalMet ? (
          <p className="text-[12px] text-amber-500 mt-1.5">Goal complete!</p>
        ) : (
          <p className="text-[12px] text-gray-400 mt-1.5">{DAILY_GOAL_CARDS - dailyCorrect} more correct to reach your goal</p>
        )}
      </div>

      {/* Recently marked as done (undo) */}
      {recentlyDismissed.length > 0 && (
        <div className="mb-4">
          <h2 className="text-[13px] font-semibold text-gray-300 uppercase tracking-widest mb-2">Marked as Done</h2>
          <div className="space-y-1.5">
            {recentlyDismissed.map((a, i) => (
              <div key={assignmentKey(a) + i} className="flex items-center justify-between px-3 py-2 rounded-[12px] bg-gray-50/60">
                <span className="text-[13px] text-gray-400 line-through truncate flex-1">{a.name}</span>
                <button
                  onClick={() => undoDismiss(a)}
                  className="shrink-0 ml-2 text-[11px] font-medium text-blue-500 active:text-blue-700"
                >
                  Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
