"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { DAILY_GOAL_CARDS } from "../lib/supabase/db-types";

const CARD = "bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]";
const SEPARATOR = "border-t border-[#e5e5ea]";
const GRADE_TARGET = 93;

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

function parseDateLocal(dueAt: string): Date {
  const [year, month, day] = dueAt.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getTimeLabel(dueAt: string | null): string {
  if (!dueAt) return "";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = parseDateLocal(dueAt);

  const diffDays = Math.round((dueDate.getTime() - startOfToday.getTime()) / 86400000);

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return dueDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isOverdue(a: Assignment): boolean {
  if (!a.dueAt || a.status !== "unsubmitted") return false;
  const dueDate = parseDateLocal(a.dueAt);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const daysOverdue = Math.round((startOfToday.getTime() - dueDate.getTime()) / 86400000);
  return daysOverdue > 0 && daysOverdue <= 14;
}

function isDueThisWeek(a: Assignment): boolean {
  if (!a.dueAt || a.status !== "unsubmitted") return false;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000);
  const dueDate = parseDateLocal(a.dueAt);
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
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [userName, setUserName] = useState("Hailey");
  const [customTests, setCustomTests] = useState<CustomTest[]>([]);
  const [showAddTest, setShowAddTest] = useState(false);
  const [newTestName, setNewTestName] = useState("");
  const [newTestSubject, setNewTestSubject] = useState("");
  const [newTestDate, setNewTestDate] = useState("");
  const [newTestTopics, setNewTestTopics] = useState("");
  const supabase = createClient();
  const userIdRef = useRef<string | null>(null);

  const dailyGoalMet = dailyCorrect >= DAILY_GOAL_CARDS;

  useEffect(() => {
    loadDashboard();
  }, []);

  async function persistCanvasCache(key: string, data: unknown) {
    const userId = userIdRef.current;
    if (!userId) return;
    try {
      await supabase.from("canvas_cache").upsert(
        { student_id: `${key}_${userId}`, data, updated_at: new Date().toISOString() },
        { onConflict: "student_id" }
      );
    } catch (e) {
      console.error("canvas_cache upsert failed:", e);
    }
  }

  async function loadDashboard() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    userIdRef.current = user?.id ?? null;

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

  function toggleDismiss(a: Assignment, dismiss: boolean) {
    const key = assignmentKey(a);
    const newSet = new Set(dismissedIds);
    dismiss ? newSet.add(key) : newSet.delete(key);
    setDismissedIds(newSet);
    persistCanvasCache("dismissed", { ids: [...newSet] });
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
    persistCanvasCache("tests", { tests: updated });
  }

  function removeCustomTest(testId: string) {
    const updated = customTests.filter(t => t.id !== testId);
    setCustomTests(updated);
    persistCanvasCache("tests", { tests: updated });
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

  const activeAssignments = allAssignments.filter(a => {
    if (!a.dueAt) return false;
    const year = parseInt(a.dueAt.split("-")[0]);
    if (year < currentYear - 1) return false;
    return true;
  });

  const overdue = activeAssignments.filter(a => isOverdue(a) && !dismissedIds.has(assignmentKey(a)));
  const dueThisWeek = activeAssignments.filter(a => isDueThisWeek(a) && !isOverdue(a) && !dismissedIds.has(assignmentKey(a)));
  const recentlyDismissed = activeAssignments.filter(a => dismissedIds.has(assignmentKey(a))).slice(0, 3);
  const progressPct = Math.min(100, Math.round((dailyCorrect / DAILY_GOAL_CARDS) * 100));

  const now = new Date();
  const monthOut = new Date(now.getTime() + 30 * 86400000);
  const canvasTests = activeAssignments.filter(a => {
    if (!a.dueAt) return false;
    const due = new Date(a.dueAt);
    if (due < now || due > monthOut) return false;
    return isTestOrProject(a);
  }).sort((a, b) => (a.dueAt || "").localeCompare(b.dueAt || ""));

  const todayStr = now.toISOString().split("T")[0];
  const activeCustomTests = customTests.filter(t => t.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
  const sortedCourses = [...courses].sort((a, b) => (a.score ?? 100) - (b.score ?? 100));

  return (
    <div className="w-full -mx-4 sm:-mx-6 px-4 sm:px-6 min-h-[80vh] bg-[#f2f2f7]">
      <div className="pt-4 pb-5">
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">{getGreeting()}, {userName}</h1>
      </div>

      {overdue.length > 0 && (
        <div className="mb-4">
          <p className="text-[13px] font-medium text-gray-500 px-1 mb-1.5">{overdue.length} item{overdue.length > 1 ? "s" : ""} need attention</p>
          <div className={`${CARD} overflow-hidden`}>
            {overdue.map((a, i) => (
              <div key={assignmentKey(a) + i} className={`flex items-center px-4 py-[13px] ${i > 0 ? SEPARATOR : ""}`}>
                <div className="w-[6px] h-[6px] rounded-full bg-red-400 shrink-0 mr-3" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-gray-900 truncate">{a.name}</p>
                  <p className="text-[13px] text-gray-500 mt-0.5">{cleanCourseName(a.courseName)} · <span className="text-red-400">{getTimeLabel(a.dueAt)}</span></p>
                </div>
                <button onClick={() => toggleDismiss(a, true)} className="shrink-0 ml-3 text-[13px] font-medium text-[#34c759] bg-[#34c759]/10 px-3 py-1 rounded-full active:opacity-50">Done</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <p className="text-[13px] font-medium text-gray-500">Upcoming Tests</p>
          <button onClick={() => setShowAddTest(!showAddTest)} className="text-[15px] font-normal text-[#007aff] active:opacity-50">{showAddTest ? "Cancel" : "Add"}</button>
        </div>

        {showAddTest && (
          <div className={`${CARD} p-4 mb-2`}>
            <input type="text" value={newTestName} onChange={e => setNewTestName(e.target.value)} placeholder="Test name (e.g., Spanish Quiz Ch.3)" className="w-full px-3 py-[10px] rounded-[8px] bg-[#f2f2f7] text-[15px] mb-2 outline-none" />
            <div className="flex gap-2 mb-2">
              <input type="text" value={newTestSubject} onChange={e => setNewTestSubject(e.target.value)} placeholder="Subject" className="flex-1 px-3 py-[10px] rounded-[8px] bg-[#f2f2f7] text-[15px] outline-none" />
              <input type="date" value={newTestDate} onChange={e => setNewTestDate(e.target.value)} className="flex-1 px-3 py-[10px] rounded-[8px] bg-[#f2f2f7] text-[15px] outline-none" />
            </div>
            <input type="text" value={newTestTopics} onChange={e => setNewTestTopics(e.target.value)} placeholder="Topics to study (optional)" className="w-full px-3 py-[10px] rounded-[8px] bg-[#f2f2f7] text-[15px] mb-3 outline-none" />
            <button onClick={addCustomTest} disabled={!newTestName.trim() || !newTestDate} className="w-full py-[10px] rounded-[8px] bg-[#007aff] text-white text-[15px] font-semibold disabled:opacity-30 active:opacity-80">Add Test</button>
          </div>
        )}

        <div className={`${CARD} overflow-hidden`}>
          {canvasTests.map((a, i) => {
            const daysUntil = Math.round((new Date(a.dueAt!).getTime() - now.getTime()) / 86400000);
            return (
              <div key={`canvas-${i}`} className={`flex items-center px-4 py-[13px] ${i > 0 ? SEPARATOR : ""}`}>
                <div className="w-[6px] h-[6px] rounded-full bg-[#5856d6] shrink-0 mr-3" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-gray-900 truncate">{a.name}</p>
                  <p className="text-[13px] text-gray-500 mt-0.5">{cleanCourseName(a.courseName)}</p>
                </div>
                <span className={`shrink-0 ml-3 text-[13px] ${daysUntil <= 3 ? "text-red-500" : "text-gray-400"}`}>
                  {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : new Date(a.dueAt!).toLocaleDateString("en-US", { weekday: "short" })}
                </span>
              </div>
            );
          })}
          {activeCustomTests.map((t, i) => {
            const daysUntil = Math.round((new Date(t.date).getTime() - now.getTime()) / 86400000) + 1;
            return (
              <div key={t.id} className={`flex items-center px-4 py-[13px] ${(i > 0 || canvasTests.length > 0) ? SEPARATOR : ""}`}>
                <div className="w-[6px] h-[6px] rounded-full bg-[#5856d6] shrink-0 mr-3" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-gray-900 truncate">{t.name}</p>
                  <p className="text-[13px] text-gray-500 mt-0.5">{t.subject}{t.topics ? ` · ${t.topics}` : ""}</p>
                </div>
                <span className={`shrink-0 ml-2 text-[13px] ${daysUntil <= 3 ? "text-red-500" : "text-gray-400"}`}>
                  {daysUntil <= 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : new Date(t.date).toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <button onClick={() => removeCustomTest(t.id)} className="shrink-0 ml-3 text-[17px] text-gray-300 active:text-red-400 leading-none">&times;</button>
              </div>
            );
          })}
          {canvasTests.length === 0 && activeCustomTests.length === 0 && !showAddTest && (
            <div className="px-4 py-4 text-center">
              <p className="text-[15px] text-gray-400">No upcoming tests</p>
            </div>
          )}
        </div>
      </div>

      {dueThisWeek.length > 0 && (
        <div className="mb-4">
          <p className="text-[13px] font-medium text-gray-500 px-1 mb-1.5">Due This Week</p>
          <div className={`${CARD} overflow-hidden`}>
            {dueThisWeek.map((a, i) => (
              <div key={assignmentKey(a) + i} className={`flex items-center px-4 py-[13px] ${i > 0 ? SEPARATOR : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-gray-900 truncate">{a.name}</p>
                  <p className="text-[13px] text-gray-500 mt-0.5">{cleanCourseName(a.courseName)}</p>
                </div>
                <button onClick={() => toggleDismiss(a, true)} className="shrink-0 ml-2 text-[13px] font-medium text-[#34c759] bg-[#34c759]/10 px-3 py-1 rounded-full active:opacity-50">Done</button>
                <span className="shrink-0 ml-3 text-[13px] text-gray-400">{getTimeLabel(a.dueAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {overdue.length === 0 && dueThisWeek.length === 0 && (
        <div className={`${CARD} p-5 mb-4 text-center`}>
          <p className="text-[17px] font-semibold text-gray-900">All caught up</p>
          <p className="text-[13px] text-gray-500 mt-0.5">No assignments due this week</p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-[13px] font-medium text-gray-500 px-1 mb-1.5">Grades</p>
        <div className="grid grid-cols-3 gap-2">
          {sortedCourses.map((c) => {
            const needsWork = c.score !== null && c.score < GRADE_TARGET;
            const gap = needsWork ? (GRADE_TARGET - (c.score || 0)).toFixed(1) : null;
            return (
              <div key={c.id} className={`${CARD} p-3 flex flex-col items-center`}>
                <span className={`text-[22px] font-bold tabular-nums ${needsWork ? "text-[#ff9500]" : "text-gray-900"}`}>{c.grade || "--"}</span>
                {c.score !== null && <span className="text-[11px] text-gray-400 tabular-nums">{c.score}%</span>}
                <span className="text-[11px] text-gray-500 font-medium mt-1 text-center leading-tight">{cleanCourseName(c.name)}</span>
                {needsWork && <span className="text-[10px] text-[#ff9500] font-medium mt-0.5">+{gap}%</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[13px] font-medium text-gray-500 px-1 mb-1.5">Today&apos;s Study Goal</p>
        <div className={`${CARD} p-4`}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[15px] text-gray-900">Cards Mastered</span>
            <span className={`text-[15px] font-bold tabular-nums ${dailyGoalMet ? "text-[#34c759]" : "text-gray-900"}`}>{dailyCorrect} / {DAILY_GOAL_CARDS}</span>
          </div>
          <div className="w-full h-[6px] bg-[#e5e5ea] rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${dailyGoalMet ? "bg-[#34c759]" : "bg-[#007aff]"}`} style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-[13px] text-gray-400 mt-2">{dailyGoalMet ? "Goal complete!" : `${DAILY_GOAL_CARDS - dailyCorrect} more to go`}</p>
        </div>
      </div>

      {recentlyDismissed.length > 0 && (
        <div className="mb-4">
          <p className="text-[13px] font-medium text-gray-400 px-1 mb-1.5">Marked as Done</p>
          <div className={`${CARD} overflow-hidden`}>
            {recentlyDismissed.map((a, i) => (
              <div key={assignmentKey(a) + i} className={`flex items-center px-4 py-[11px] ${i > 0 ? SEPARATOR : ""}`}>
                <span className="text-[15px] text-gray-400 line-through truncate flex-1">{a.name}</span>
                <button onClick={() => toggleDismiss(a, false)} className="shrink-0 ml-2 text-[15px] font-normal text-[#007aff] active:opacity-50">Undo</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
