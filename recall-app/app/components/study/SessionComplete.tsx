"use client";

import { useState } from "react";

interface SessionCompleteProps {
  total: number;
  correctCount: number;
  onRestart: () => void;
  pointsEarned?: number;
  bonuses?: string[];
}

export default function SessionComplete({ total, correctCount, onRestart, pointsEarned, bonuses }: SessionCompleteProps) {
  const accuracy = total > 0 ? correctCount / total : 0;
  const accuracyPct = Math.round(accuracy * 100);

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-5xl mb-4">{accuracyPct >= 80 ? "🎉" : accuracyPct >= 50 ? "👍" : "💪"}</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Session Complete!</h2>

      <div className="grid grid-cols-3 gap-4 my-4 w-full max-w-xs">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-500">Cards</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-700">{correctCount}</div>
          <div className="text-xs text-gray-500">Correct</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-700">{accuracyPct}%</div>
          <div className="text-xs text-gray-500">Accuracy</div>
        </div>
      </div>

      {pointsEarned !== undefined && pointsEarned > 0 && (
        <div className="w-full max-w-xs bg-amber-50 border border-amber-200 rounded-xl p-4 my-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">⭐</span>
            <span className="text-xl font-bold text-amber-700">+{pointsEarned} pts</span>
          </div>
          <p className="text-xs text-amber-600">10 pts for completing session</p>
          {bonuses?.map((b, i) => (
            <p key={i} className="text-xs text-amber-700 font-medium">{b}</p>
          ))}
        </div>
      )}

      <button
        onClick={onRestart}
        className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
      >
        Study Again
      </button>
    </div>
  );
}
