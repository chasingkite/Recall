"use client";

import { useState } from "react";

interface StudySheetProps {
  sheet: string;
  onStartQuiz: () => void;
  loading?: boolean;
}

export default function StudySheet({ sheet, onStartQuiz, loading }: StudySheetProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
        <div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm text-gray-500">Generating your study sheet...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">📝 Quick Review</h2>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-4">Review this before starting. Take 2-3 minutes to scan the key points.</p>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto mb-6">
          <div className="prose prose-sm max-w-none bg-white rounded-xl border border-gray-200 p-4">
            {sheet.split("\n").map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return <br key={i} />;

              if (trimmed.startsWith("### ")) {
                return <h3 key={i} className="text-sm font-bold text-gray-900 mt-3 mb-1">{trimmed.replace("### ", "")}</h3>;
              }
              if (trimmed.startsWith("## ")) {
                return <h3 key={i} className="text-sm font-bold text-indigo-700 mt-4 mb-1">{trimmed.replace("## ", "")}</h3>;
              }
              if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
                return <p key={i} className="text-sm font-bold text-gray-800 mt-3 mb-1">{trimmed.replace(/\*\*/g, "")}</p>;
              }
              if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
                return (
                  <div key={i} className="flex gap-2 ml-2 mb-0.5">
                    <span className="text-indigo-400 shrink-0">•</span>
                    <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{
                      __html: trimmed.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    }} />
                  </div>
                );
              }
              if (/^\d+\.\s/.test(trimmed)) {
                const num = trimmed.match(/^(\d+)\./)?.[1];
                return (
                  <div key={i} className="flex gap-2 ml-2 mb-0.5">
                    <span className="text-indigo-400 shrink-0 text-sm font-medium">{num}.</span>
                    <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{
                      __html: trimmed.replace(/^\d+\.\s*/, "").replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    }} />
                  </div>
                );
              }
              return <p key={i} className="text-sm text-gray-700 mb-1" dangerouslySetInnerHTML={{
                __html: trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              }} />;
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={onStartQuiz}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-lg"
        >
          Start Quiz
        </button>
        <button
          onClick={onStartQuiz}
          className="w-full py-2 rounded-xl text-xs text-gray-400 hover:text-gray-600"
        >
          I already know this — skip review
        </button>
      </div>
    </div>
  );
}
