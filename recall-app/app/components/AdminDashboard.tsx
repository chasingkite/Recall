"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: string;
  canvas_student_id: string | null;
  subjects: string[];
}

interface StudentData {
  profile: Profile;
  grades: { name: string; grade: string | null; score: number | null }[];
  upcoming: { name: string; dueAt: string; courseName: string }[];
  totalCards: number;
  studiedToday: number;
  stats: {
    totalSessions: number;
    totalCardsReviewed: number;
    totalCorrect: number;
    accuracy: number;
    streak: number;
    lastStudied: string | null;
    thisWeekCards: number;
    topicMastery: { topic: string; reviewed: number; correct: number; pct: number }[];
  };
}

export default function AdminDashboard() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student");

    if (!profiles) { setLoading(false); return; }

    const studentData: StudentData[] = [];

    for (const profile of profiles) {
      let grades: StudentData["grades"] = [];
      let upcoming: StudentData["upcoming"] = [];

      if (profile.canvas_student_id) {
        try {
          const res = await fetch(`/api/canvas-sync?studentId=${profile.canvas_student_id}`);
          const data = await res.json();
          const courses = data.data || [];

          grades = courses.map((c: any) => ({
            name: c.name.split("-")[0].replace(/^\d+\s*/, "").trim(),
            grade: c.grade,
            score: c.score,
          }));

          const now = new Date();
          const weekOut = new Date(now.getTime() + 7 * 86400000);
          for (const course of courses) {
            for (const a of course.assignments || []) {
              if (a.dueAt && a.status === "unsubmitted") {
                const dueStr = a.dueAt.split("T")[0];
                const [y, m, d] = dueStr.split("-").map(Number);
                const due = new Date(y, m - 1, d);
                if (due >= now && due <= weekOut) {
                  upcoming.push({ name: a.name, dueAt: a.dueAt, courseName: course.name.split("-")[0].replace(/^\d+\s*/, "").trim() });
                }
              }
            }
          }
          upcoming.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
        } catch {}
      }

      // Get card count
      const { count } = await supabase.from("cards").select("id", { count: "exact", head: true });

      // Get study sessions for this student
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      const allSessions = sessions || [];
      const totalCardsReviewed = allSessions.reduce((s: number, r: any) => s + (r.cards_reviewed || 0), 0);
      const totalCorrect = allSessions.reduce((s: number, r: any) => s + (r.cards_correct || 0), 0);
      const accuracy = totalCardsReviewed > 0 ? Math.round((totalCorrect / totalCardsReviewed) * 100) : 0;

      // Calculate streak from streaks table
      let streak = 0;
      const { data: streakData } = await supabase
        .from("streaks")
        .select("current_streak, longest_streak")
        .eq("user_id", profile.id)
        .single();
      if (streakData) {
        streak = streakData.current_streak;
      }

      // This week cards
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeekCards = allSessions
        .filter((s: any) => new Date(s.created_at) >= weekAgo)
        .reduce((sum: number, s: any) => sum + (s.cards_reviewed || 0), 0);

      // Last studied
      const lastStudied = allSessions.length > 0 ? allSessions[0].created_at : null;

      // Topic mastery from sessions
      const topicMap: Record<string, { reviewed: number; correct: number }> = {};
      for (const session of allSessions) {
        const topics = session.topics || [];
        const perTopic = topics.length > 0 ? session.cards_reviewed / topics.length : 0;
        const perTopicCorrect = topics.length > 0 ? session.cards_correct / topics.length : 0;
        for (const t of topics) {
          if (!topicMap[t]) topicMap[t] = { reviewed: 0, correct: 0 };
          topicMap[t].reviewed += perTopic;
          topicMap[t].correct += perTopicCorrect;
        }
      }
      const topicMastery = Object.entries(topicMap)
        .map(([topic, data]) => ({
          topic,
          reviewed: Math.round(data.reviewed),
          correct: Math.round(data.correct),
          pct: data.reviewed > 0 ? Math.round((data.correct / data.reviewed) * 100) : 0,
        }))
        .sort((a, b) => a.pct - b.pct);

      studentData.push({
        profile,
        grades,
        upcoming,
        totalCards: count || 0,
        studiedToday: 0,
        stats: {
          totalSessions: allSessions.length,
          totalCardsReviewed,
          totalCorrect,
          accuracy,
          streak,
          lastStudied,
          thisWeekCards,
          topicMastery,
        },
      });
    }

    setStudents(studentData);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Aggregate data
  const allGrades = students.flatMap((s) => s.grades);
  const atRiskGrades = allGrades.filter((g) => g.score !== null && g.score < 93);
  const allUpcoming = students.flatMap((s) => s.upcoming.map((u) => ({ ...u, student: s.profile.display_name })));

  return (
    <div className="w-full">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Family Dashboard</h1>

      {/* Student Cards */}
      <div className="space-y-3 mb-5">
        {students.map((s) => {
          const hasLowGrade = s.grades.some((g) => g.score !== null && g.score < 93);
          const expanded = expandedStudent === s.profile.id;
          const lastStudiedText = s.stats.lastStudied
            ? (() => {
                const diff = Date.now() - new Date(s.stats.lastStudied).getTime();
                const hours = Math.floor(diff / 3600000);
                if (hours < 1) return "just now";
                if (hours < 24) return `${hours}h ago`;
                const days = Math.floor(hours / 24);
                return `${days}d ago`;
              })()
            : "never";

          return (
            <div key={s.profile.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              {/* Collapsed Card */}
              <div
                onClick={() => setExpandedStudent(expanded ? null : s.profile.id)}
                className="p-4 cursor-pointer active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{s.profile.display_name.split(" ")[0]}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs">🔥 {s.stats.streak}-day streak</span>
                      <span className="text-xs">📊 {s.stats.accuracy}% accuracy</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {hasLowGrade && <span className="text-xs text-amber-600 font-medium">⚠️</span>}
                    <p className="text-xs text-gray-400">Last: {lastStudiedText}</p>
                    <p className="text-xs text-gray-400">{s.stats.thisWeekCards} cards this week</p>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {expanded && (
                <div className="border-t border-gray-100 p-4">
                  {/* Grading Period */}
                  {s.profile.canvas_student_id && (
                    <div className="mb-4 p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-700 font-medium">📅 Grading period ends</span>
                        <span className="text-xs text-blue-700 font-bold">Sep 18, 2026</span>
                      </div>
                      {(() => {
                        const end = new Date(2026, 8, 18);
                        const now = new Date();
                        const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
                        return <p className="text-xs text-blue-600 mt-1">{daysLeft} days left · Goal: Straight A&apos;s</p>;
                      })()}
                    </div>
                  )}
                  {!s.profile.canvas_student_id && (
                    <div className="mb-4 p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                      <p className="text-xs text-gray-500">No Canvas linked · No grading period set</p>
                    </div>
                  )}

                  {/* Study Activity */}
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Study Activity</h4>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-blue-700">{s.stats.streak}</div>
                      <div className="text-xs text-gray-500">Streak</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-green-700">{s.stats.accuracy}%</div>
                      <div className="text-xs text-gray-500">Accuracy</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-purple-700">{s.stats.thisWeekCards}</div>
                      <div className="text-xs text-gray-500">This Week</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-amber-700">{s.stats.totalSessions}</div>
                      <div className="text-xs text-gray-500">Sessions</div>
                    </div>
                  </div>

                  {/* Topic Mastery */}
                  {s.stats.topicMastery.length > 0 && (
                    <>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Topic Mastery</h4>
                      <div className="space-y-1.5 mb-4">
                        {s.stats.topicMastery.slice(0, 8).map((t) => (
                          <div key={t.topic} className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-24 truncate">{t.topic}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${t.pct >= 80 ? "bg-green-500" : t.pct >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                                style={{ width: `${t.pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">{t.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Grades */}
                  {s.grades.length > 0 && (
                    <>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Grades</h4>
                      <div className="space-y-1 mb-4">
                        {s.grades.map((g, i) => (
                          <div key={i} className="flex items-center justify-between py-0.5">
                            <span className="text-xs text-gray-600">{g.name}</span>
                            <div className="flex items-center gap-1">
                              <span className={`text-xs font-bold ${g.score && g.score >= 93 ? "text-green-700" : "text-amber-700"}`}>{g.grade || "--"}</span>
                              {g.score !== null && <span className="text-xs text-gray-400">{g.score}%</span>}
                              <span className="text-xs">{g.score && g.score >= 93 ? "✓" : "⚠️"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Upcoming */}
                  {s.upcoming.length > 0 && (
                    <>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Due This Week</h4>
                      <div className="space-y-1">
                        {s.upcoming.slice(0, 5).map((a, i) => {
                          const dueStr = a.dueAt.split("T")[0];
                          const [y, m, d] = dueStr.split("-").map(Number);
                          const due = new Date(y, m - 1, d);
                          return (
                            <div key={i} className="flex items-center justify-between py-0.5">
                              <span className="text-xs text-gray-600 truncate max-w-[60%]">{a.name}</span>
                              <span className="text-xs text-gray-400">{due.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Needs Attention */}
      {atRiskGrades.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-2">⚠️ Needs Attention</h2>
          <div className="space-y-2">
            {atRiskGrades.map((g, i) => {
              const gap = 93 - (g.score || 0);
              return (
                <div key={i} className="rounded-xl bg-red-50 border border-red-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{g.name}</span>
                    <span className="text-sm font-bold text-red-700">{g.grade} ({g.score}%)</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">Needs +{gap.toFixed(1)}% to reach an A</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* This Week */}
      {allUpcoming.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">📋 This Week</h2>
          <div className="space-y-1.5">
            {allUpcoming.slice(0, 8).map((a, i) => {
              const dueStr = a.dueAt.split("T")[0];
              const [y, m, d] = dueStr.split("-").map(Number);
              const due = new Date(y, m - 1, d);
              const dayName = due.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              return (
                <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.courseName} · {a.student}</p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">{dayName}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Grades */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">📈 All Grades</h2>
        <div className="space-y-1.5">
          {students.map((s) => (
            s.grades.length > 0 && (
              <div key={s.profile.id}>
                <p className="text-xs text-gray-400 font-medium mb-1">{s.profile.display_name.split(" ")[0]}</p>
                {s.grades.map((g, i) => (
                  <div key={i} className="flex items-center justify-between py-1 px-2">
                    <span className="text-xs text-gray-600">{g.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${g.score && g.score >= 93 ? "bg-green-500" : g.score && g.score >= 80 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(100, g.score || 0)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${g.score && g.score >= 93 ? "text-green-700" : "text-amber-700"}`}>
                        {g.grade || "--"}
                      </span>
                      <span className="text-xs text-gray-400 w-10 text-right">{g.score !== null ? `${g.score}%` : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-300 text-center">Tap a student to see details</p>
    </div>
  );
}
