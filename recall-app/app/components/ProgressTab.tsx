"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import LearningLadder from "./LearningLadder";
import StreakBadge from "./StreakBadge";

const SUBJECT_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  spanish: { bg: "bg-orange-50", text: "text-orange-600", ring: "stroke-orange-400" },
  biology: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "stroke-emerald-400" },
  english: { bg: "bg-violet-50", text: "text-violet-600", ring: "stroke-violet-400" },
  math: { bg: "bg-sky-50", text: "text-sky-600", ring: "stroke-sky-400" },
};

function AccuracyRing({ percent }: { percent: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <div className="relative w-[120px] h-[120px]">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke="url(#accuracyGrad)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="accuracyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[32px] font-bold text-gray-900 tabular-nums leading-none">{percent}</span>
        <span className="text-[13px] text-gray-400 font-medium">%</span>
      </div>
    </div>
  );
}

function SubjectPill({ subject, mastery, reviewed, correct }: { subject: string; mastery: number; reviewed: number; correct: number }) {
  const style = SUBJECT_STYLES[subject] || { bg: "bg-gray-50", text: "text-gray-600", ring: "stroke-gray-400" };
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (mastery / 100) * circ;

  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-[16px] ${style.bg} border border-white/60`}>
      <div className="relative w-[56px] h-[56px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" opacity="0.4" />
          <circle
            cx="26" cy="26" r={r} fill="none"
            className={style.ring} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-[15px] font-bold tabular-nums ${style.text}`}>{mastery}%</span>
        </div>
      </div>
      <span className={`text-[11px] font-semibold uppercase tracking-wider ${style.text}`}>{subject}</span>
      {reviewed > 0 && <span className="text-[10px] text-gray-400 tabular-nums">{correct}/{reviewed}</span>}
      {reviewed === 0 && <span className="text-[10px] text-gray-300 italic">new</span>}
    </div>
  );
}

export default function ProgressTab() {
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalReviewed, setTotalReviewed] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [thisWeekCards, setThisWeekCards] = useState(0);
  const [subjectData, setSubjectData] = useState<Record<string, { reviewed: number; correct: number }>>({});
  const [lastStudied, setLastStudied] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const all = sessions || [];
    const reviewed = all.reduce((s, r: any) => s + (r.cards_reviewed || 0), 0);
    const correct = all.reduce((s, r: any) => s + (r.cards_correct || 0), 0);

    const breakdown: Record<string, { reviewed: number; correct: number }> = {};
    for (const session of all) {
      const subjects = (session as any).subjects || [];
      const perSubj = subjects.length > 0 ? (session as any).cards_reviewed / subjects.length : 0;
      const perSubjCorrect = subjects.length > 0 ? (session as any).cards_correct / subjects.length : 0;
      for (const s of subjects) {
        if (!breakdown[s]) breakdown[s] = { reviewed: 0, correct: 0 };
        breakdown[s].reviewed += perSubj;
        breakdown[s].correct += perSubjCorrect;
      }
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const week = all
      .filter((s: any) => new Date(s.created_at) >= weekAgo)
      .reduce((sum, s: any) => sum + (s.cards_reviewed || 0), 0);

    setTotalSessions(all.length);
    setTotalReviewed(reviewed);
    setTotalCorrect(correct);
    setThisWeekCards(week);
    setSubjectData(breakdown);
    setLastStudied(all.length > 0 ? all[0].created_at : null);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-7 w-7 border-[3px] border-gray-200 border-t-blue-500 rounded-full" />
      </div>
    );
  }

  const accuracy = totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : 0;
  const subjects = ["spanish", "biology", "english", "math"];

  return (
    <div className="w-full">
      <h1 className="text-[24px] font-bold text-gray-900 tracking-tight mb-6">Progress</h1>

      {/* Accuracy Ring Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-gray-200/60 shadow-sm p-6 mb-5">
        <div className="flex flex-col items-center mb-5">
          <AccuracyRing percent={accuracy} />
          <p className="text-[14px] text-gray-400 font-medium mt-2">Overall Accuracy</p>
        </div>

        {/* Quick stats row */}
        <div className="flex items-center justify-around pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {userId && <StreakBadge userId={userId} />}
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold text-gray-900 tabular-nums">{totalReviewed}</p>
            <p className="text-[11px] text-gray-400 font-medium">cards</p>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold text-gray-900 tabular-nums">{thisWeekCards}</p>
            <p className="text-[11px] text-gray-400 font-medium">this week</p>
          </div>
        </div>
      </div>

      {/* Subject Pills */}
      <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Subjects</h2>
      <div className="grid grid-cols-2 gap-2.5 mb-8">
        {subjects.map((subject) => {
          const data = subjectData[subject];
          const reviewed = Math.round(data?.reviewed ?? 0);
          const correct = Math.round(data?.correct ?? 0);
          const mastery = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0;
          return <SubjectPill key={subject} subject={subject} mastery={mastery} reviewed={reviewed} correct={correct} />;
        })}
      </div>

      {/* Last studied */}
      {lastStudied && (
        <p className="text-[12px] text-gray-300 text-center mb-6">
          Last studied {new Date(lastStudied).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </p>
      )}

      {/* Learning Ladder */}
      {userId && <LearningLadder userId={userId} />}
    </div>
  );
}
