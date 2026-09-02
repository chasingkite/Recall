"use client";

import { useEffect, useState } from "react";
import { DIFFICULTY_LEVELS } from "../lib/supabase/db-types";

interface TopicLevelData {
  topic: string;
  current_level: number;
  cards_at_level: number;
  cards_correct_at_level: number;
}

export default function LearningLadder({ userId }: { userId: string }) {
  const [levels, setLevels] = useState<TopicLevelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/topic-levels?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setLevels(data.levels || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-5 w-5 border-3 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (levels.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">Start studying to see your learning ladder!</p>
        <p className="text-xs text-gray-300 mt-1">Your level per topic will appear here as you review cards.</p>
      </div>
    );
  }

  const LEVEL_COLORS = [
    "bg-gray-200 text-gray-600",
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
  ];

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Learning Ladder</h3>
      <div className="space-y-2">
        {levels.map((tl) => {
          const levelInfo = DIFFICULTY_LEVELS[tl.current_level - 1];
          const accuracy = tl.cards_at_level > 0
            ? Math.round((tl.cards_correct_at_level / tl.cards_at_level) * 100)
            : 0;
          const progressToNext = tl.current_level < 5
            ? Math.min(100, Math.round(
                Math.min(tl.cards_at_level / 10, accuracy / 80) * 100
              ))
            : 100;
          const expanded = expandedTopic === tl.topic;

          return (
            <div key={tl.topic} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div
                onClick={() => setExpandedTopic(expanded ? null : tl.topic)}
                className="p-3 cursor-pointer active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[tl.current_level - 1]}`}>
                      L{tl.current_level}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">{tl.topic}</span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">{levelInfo?.name}</span>
                </div>
                {tl.current_level < 5 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-400 transition-all"
                        style={{ width: `${progressToNext}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{progressToNext}%</span>
                  </div>
                )}
              </div>

              {expanded && (
                <div className="border-t border-gray-100 p-3 bg-gray-50">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-700">{tl.cards_at_level}</div>
                      <div className="text-xs text-gray-400">Cards</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-green-600">{accuracy}%</div>
                      <div className="text-xs text-gray-400">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-indigo-600">{tl.current_level}/5</div>
                      <div className="text-xs text-gray-400">Level</div>
                    </div>
                  </div>
                  {/* Level progression */}
                  <div className="flex gap-1 mt-2">
                    {DIFFICULTY_LEVELS.map((dl) => (
                      <div
                        key={dl.level}
                        className={`flex-1 py-1 rounded text-center text-xs ${
                          dl.level <= tl.current_level
                            ? LEVEL_COLORS[dl.level - 1]
                            : "bg-gray-100 text-gray-300"
                        }`}
                        title={dl.description}
                      >
                        {dl.level <= tl.current_level ? dl.name.slice(0, 3) : "🔒"}
                      </div>
                    ))}
                  </div>
                  {tl.current_level < 5 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Next level: {DIFFICULTY_LEVELS[tl.current_level]?.name} — need 80%+ accuracy on 10+ cards
                    </p>
                  )}
                  {tl.current_level === 5 && (
                    <p className="text-xs text-amber-600 mt-2 font-medium">Max level reached!</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
