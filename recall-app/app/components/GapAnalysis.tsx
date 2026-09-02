"use client";

interface GapAnalysisProps {
  weakTopics: string[];
  strengths: string[];
  recommendations: string[];
  nextSessionFocus: string[];
  summary?: string;
}

export default function GapAnalysis({
  weakTopics,
  strengths,
  recommendations,
  nextSessionFocus,
  summary,
}: GapAnalysisProps) {
  if (weakTopics.length === 0 && strengths.length === 0 && recommendations.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-xs mt-4">
      {/* Summary */}
      {summary && (
        <p className="text-sm text-gray-700 text-center mb-3">{summary}</p>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-3 mb-2">
          <p className="text-xs text-green-600 font-medium mb-1">✅ Strong in</p>
          <div className="flex flex-wrap gap-1">
            {strengths.map((s, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Weak areas */}
      {weakTopics.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 mb-2">
          <p className="text-xs text-red-600 font-medium mb-1">📌 Focus areas</p>
          <div className="flex flex-wrap gap-1">
            {weakTopics.map((t, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 mb-2">
          <p className="text-xs text-blue-600 font-medium mb-1">💡 Recommendations</p>
          <div className="space-y-1">
            {recommendations.map((r, i) => (
              <p key={i} className="text-xs text-blue-700">• {r}</p>
            ))}
          </div>
        </div>
      )}

      {/* Next session focus */}
      {nextSessionFocus.length > 0 && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3">
          <p className="text-xs text-indigo-600 font-medium mb-1">🎯 Tomorrow&apos;s Focus</p>
          <div className="flex flex-wrap gap-1">
            {nextSessionFocus.map((t, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
