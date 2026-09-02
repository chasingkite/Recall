"use client";

import { useEffect, useState } from "react";

interface MemoryScoreData {
  avg_retrievability: number;
  cards_measured: number;
  improvement_pct: number;
  yesterday_score?: number;
}

export default function MemoryScoreWidget({ userId }: { userId: string }) {
  const [data, setData] = useState<MemoryScoreData | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/card-review?userId=${userId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [userId]);

  if (!data || data.cards_measured === 0) return null;

  const trendUp = data.improvement_pct > 0;
  const trendDown = data.improvement_pct < 0;

  return (
    <div className="w-full max-w-xs rounded-xl bg-indigo-50 border border-indigo-200 p-3 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-indigo-600 font-medium mb-0.5">Memory Score</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-indigo-700">{data.avg_retrievability}%</span>
            {data.improvement_pct !== 0 && (
              <span className={`text-xs font-medium ${trendUp ? "text-green-600" : "text-red-500"}`}>
                {trendUp ? "↑" : "↓"} {Math.abs(data.improvement_pct)}%
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-indigo-400">{data.cards_measured} cards tracked</p>
          {data.yesterday_score !== undefined && data.yesterday_score > 0 && (
            <p className="text-xs text-indigo-400">Yesterday: {data.yesterday_score}%</p>
          )}
        </div>
      </div>
    </div>
  );
}
