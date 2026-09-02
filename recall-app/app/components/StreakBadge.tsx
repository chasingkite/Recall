"use client";

import { useEffect, useState } from "react";

interface StreakData {
  current_streak: number;
  longest_streak: number;
  streak_freezes_owned: number;
  freeze_used_date: string | null;
}

export default function StreakBadge({ userId }: { userId: string }) {
  const [streak, setStreak] = useState<StreakData | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/streaks?userId=${userId}`)
      .then((r) => r.json())
      .then(setStreak)
      .catch(() => {});
  }, [userId]);

  if (!streak) return null;

  const isMilestone = streak.current_streak > 0 && streak.current_streak % 7 === 0;
  const today = new Date().toISOString().split("T")[0];
  const freezeUsedToday = streak.freeze_used_date === today;

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
        streak.current_streak > 0
          ? isMilestone ? "bg-orange-100 border border-orange-300" : "bg-amber-50 border border-amber-200"
          : "bg-gray-100 border border-gray-200"
      }`}>
        <span className={`text-sm ${streak.current_streak > 0 ? (isMilestone ? "animate-bounce" : "") : ""}`}>
          🔥
        </span>
        <span className={`text-sm font-bold ${
          streak.current_streak > 0 ? "text-amber-700" : "text-gray-400"
        }`}>
          {streak.current_streak}
        </span>
      </div>
      {freezeUsedToday && (
        <span className="text-xs text-blue-500 font-medium">🛡️ Freeze used</span>
      )}
      {streak.streak_freezes_owned > 0 && !freezeUsedToday && (
        <span className="text-xs text-gray-400">🛡️ {streak.streak_freezes_owned}</span>
      )}
    </div>
  );
}
