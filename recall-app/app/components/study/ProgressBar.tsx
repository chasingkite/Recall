"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  correctCount: number;
}

export default function ProgressBar({ current, total, correctCount }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
        <span>{current}/{total} cards</span>
        <span>{correctCount} correct</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
