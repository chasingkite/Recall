"use client";

import { useEffect, useState } from "react";
import { loadStats, StudyStats } from "../lib/study-stats";

const SUBJECT_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  spanish: { bg: "bg-orange-50", text: "text-orange-700", bar: "bg-orange-500" },
  biology: { bg: "bg-green-50", text: "text-green-700", bar: "bg-green-500" },
  english: { bg: "bg-purple-50", text: "text-purple-700", bar: "bg-purple-500" },
  math: { bg: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-500" },
};

const SUBJECTS = ["spanish", "biology", "english", "math"];

export default function ProgressTab() {
  const [stats, setStats] = useState<StudyStats | null>(null);

  useEffect(() => {
    setStats(loadStats());
  }, []);

  const totalReviewed = stats?.totalCardsReviewed ?? 0;
  const totalCorrect = stats?.totalCorrect ?? 0;
  const overallAccuracy = totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : 0;

  return (
    <div className="w-full">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Progress</h1>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{stats?.totalSessions ?? 0}</div>
          <div className="text-xs text-gray-500">Sessions</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{totalReviewed}</div>
          <div className="text-xs text-gray-500">Cards Reviewed</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{overallAccuracy}%</div>
          <div className="text-xs text-gray-500">Accuracy</div>
        </div>
      </div>

      {/* Mastery Per Subject */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Mastery by Subject</h2>
      <div className="space-y-3 mb-8">
        {SUBJECTS.map((subject) => {
          const s = stats?.subjects[subject];
          const reviews = s?.totalReviews ?? 0;
          const correct = s?.correctReviews ?? 0;
          const mastery = reviews > 0 ? Math.round((correct / reviews) * 100) : 0;
          const colors = SUBJECT_COLORS[subject];

          return (
            <div key={subject} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors.bg} ${colors.text}`}>
                  {subject}
                </span>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">{mastery}%</span>
                  <span className="text-xs text-gray-400 ml-1">mastery</span>
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                  style={{ width: `${mastery}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{correct}/{reviews} correct</span>
                {reviews === 0 && <span className="italic">Not started</span>}
              </div>
            </div>
          );
        })}
      </div>

      {stats?.lastStudiedAt && (
        <p className="text-xs text-gray-400 text-center mt-6">
          Last studied: {new Date(stats.lastStudiedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}
