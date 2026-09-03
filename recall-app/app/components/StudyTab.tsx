"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "../lib/supabase/client";
import { StudyCard, MAX_SESSION_SIZE } from "../lib/sample-cards";
import { checkAnswer, actionToRating } from "../lib/spaced-repetition";
import { earnSessionPoints, clearLegacyData } from "../lib/points";
import { DAILY_GOAL_CARDS } from "../lib/supabase/db-types";
import MemoryScoreWidget from "./MemoryScoreWidget";
import CelebrationModal from "./CelebrationModal";
import StreakBadge from "./StreakBadge";
import GapAnalysisComponent from "./GapAnalysis";

interface DBCard {
  id: string;
  front: string;
  back: string;
  answer_type: string;
  explanation: string | null;
  real_world_connection: string | null;
  tok_connection: string | null;
  interdisciplinary: string | null;
  inquiry_question: string | null;
  example_sentence: string | null;
  image_url: string | null;
  audio_lang: string;
  topic: string | null;
  choices: string[] | null;
  decks: { subject: string } | null;
}

function dbCardToStudyCard(c: DBCard): StudyCard {
  return {
    id: c.id, front: c.front, back: c.back,
    answerType: (c.answer_type || "type") as StudyCard["answerType"],
    choices: c.choices || undefined,
    explanation: c.explanation || "",
    realWorldConnection: c.real_world_connection || "",
    tokConnection: c.tok_connection || "",
    interdisciplinary: c.interdisciplinary || "",
    inquiryQuestion: c.inquiry_question || "",
    imageUrl: c.image_url || undefined,
    audioLang: c.audio_lang || "en-US",
    subject: (c.decks?.subject || "english") as StudyCard["subject"],
    topic: c.topic || undefined,
    easiness: 2.5, interval: 0, repetitions: 0, nextReviewAt: new Date(),
  };
}

function assignVariety(cards: StudyCard[], all: StudyCard[]): StudyCard[] {
  return cards.map((card) => {
    // If card already has valid MC choices, keep it
    if (card.answerType === "multiple-choice" && card.choices && card.choices.length > 0) return card;
    // If card claims MC but has no choices, try to generate them or fall back to type-in
    if (card.answerType === "multiple-choice" && (!card.choices || card.choices.length === 0)) {
      let pool = all.filter((c) => c.id !== card.id && c.topic === card.topic && c.back !== card.back);
      if (pool.length < 3) pool = all.filter((c) => c.id !== card.id && c.subject === card.subject && c.back !== card.back);
      if (pool.length >= 3) {
        const choices = [...pool.sort(() => Math.random() - 0.5).slice(0, 3).map((c) => c.back), card.back].sort(() => Math.random() - 0.5);
        return { ...card, choices };
      }
      return { ...card, answerType: "type" as const };
    }
    const rand = Math.random();
    if (rand < 0.30) {
      let pool = all.filter((c) => c.id !== card.id && c.topic === card.topic && c.back !== card.back);
      if (pool.length < 3) pool = all.filter((c) => c.id !== card.id && c.subject === card.subject && c.back !== card.back);
      if (pool.length >= 3) {
        const choices = [...pool.sort(() => Math.random() - 0.5).slice(0, 3).map((c) => c.back), card.back].sort(() => Math.random() - 0.5);
        return { ...card, answerType: "multiple-choice" as const, choices };
      }
    }
    if (rand >= 0.30 && rand < 0.50) {
      const isTrue = Math.random() > 0.5;
      if (isTrue) {
        return { ...card, answerType: "true-false" as const, trueFalseStatement: `The answer to "${card.front.slice(0, 50)}" is "${card.back.slice(0, 50)}"`, trueFalseAnswer: true, back: "true" };
      }
      const wrong = all.filter((c) => c.id !== card.id && c.subject === card.subject).sort(() => Math.random() - 0.5)[0];
      if (wrong) {
        return { ...card, answerType: "true-false" as const, trueFalseStatement: `The answer to "${card.front.slice(0, 50)}" is "${wrong.back.slice(0, 50)}"`, trueFalseAnswer: false, back: "false" };
      }
    }
    if (rand >= 0.50 && rand < 0.65 && card.back.length > 2) {
      return { ...card, answerType: "fill-blank" as const, blankSentence: `Starts with "${card.back[0]}" — ${card.back.length} letters` };
    }
    if (rand >= 0.65 && rand < 0.75 && card.subject === "spanish") {
      return { ...card, answerType: "type" as const, front: `What is the Spanish word for: "${card.back}"?`, back: card.front };
    }
    // ~10% chance of explain-back card
    if (rand >= 0.90 && card.back.length > 5) {
      return { ...card, answerType: "explain" as const, front: `Explain in your own words: ${card.front}` };
    }
    return card;
  });
}

const SUBJECT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  spanish: { text: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
  biology: { text: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
  english: { text: "text-violet-500", bg: "bg-violet-50", border: "border-violet-200" },
  math: { text: "text-sky-500", bg: "bg-sky-50", border: "border-sky-200" },
};

type Phase = "start" | "studying" | "done";

export default function StudyTab() {
  const [phase, setPhase] = useState<Phase>("start");
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [isClose, setIsClose] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [totalCards, setTotalCards] = useState(0);
  const [studyReason, setStudyReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrichField, setEnrichField] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Daily progress state
  const [dailyCorrect, setDailyCorrect] = useState(0);
  const [dailyGoalMet, setDailyGoalMet] = useState(false);
  const [justMetGoal, setJustMetGoal] = useState(false);

  // Session points
  const [sessionPoints, setSessionPoints] = useState(0);
  const [sessionBonuses, setSessionBonuses] = useState<string[]>([]);

  // Re-queue: cards answered wrong get added to the end
  const [requeuedCards, setRequeuedCards] = useState<StudyCard[]>([]);

  // Memory / celebration
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPct, setCelebrationPct] = useState(0);
  const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);

  // Saving state
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // Study sheet (Phase 7) — collapsible during study
  const [studySheetContent, setStudySheetContent] = useState("");
  const [sheetLoading, setSheetLoading] = useState(false);
  const [showReviewNotes, setShowReviewNotes] = useState(false);

  // Explain-back (Phase 9)
  const [explainFeedback, setExplainFeedback] = useState<{
    score: number; correct: string; missing: string; misconceptions: string; feedback: string; mastered: boolean;
  } | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  // Gap analysis (Phase 10)
  const [gapAnalysis, setGapAnalysis] = useState<{
    weakTopics: string[]; strengths: string[]; recommendations: string[]; nextSessionFocus: string[]; summary?: string;
  } | null>(null);

  // Track answers for gap analysis
  const [sessionAnswers, setSessionAnswers] = useState<{ front: string; back: string; correct: boolean; topic: string; subject: string }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    clearLegacyData();
    loadSession();
  }, []);

  async function loadSession() {
    setLoading(true);
    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      // Load daily progress
      if (user) {
        const progressRes = await fetch(`/api/daily-progress?userId=${user.id}`);
        const progress = await progressRes.json();
        setDailyCorrect(progress.cards_correct || 0);
        setDailyGoalMet(progress.goal_met || false);
      }

      const res = await fetch("/api/smart-session?studentId=81991&mode=quick5&subject=all");
      const data = await res.json();
      if (data.cards && data.cards.length > 0) {
        const studyCards = (data.cards as DBCard[]).map(dbCardToStudyCard);
        const allPool = data.allCards ? (data.allCards as DBCard[]).map(dbCardToStudyCard) : studyCards;
        const varied = assignVariety(studyCards, allPool);
        setCards(varied);
        setTotalCards(data.totalDue || varied.length);
        if (data.assignments?.length > 0 && data.matchedTopics?.length > 0) {
          setStudyReason(data.assignments[0].name);
        }
      } else {
        const { data: dbCards } = await supabase.from("cards").select("*, decks(subject)").limit(50);
        if (dbCards && dbCards.length > 0) {
          const all = (dbCards as unknown as DBCard[]).map(dbCardToStudyCard);
          const session = all.sort(() => Math.random() - 0.5).slice(0, 5);
          setCards(assignVariety(session, all));
          setTotalCards(dbCards.length);
        }
      }
    } catch {
      const { data: dbCards } = await supabase.from("cards").select("*, decks(subject)").limit(50);
      if (dbCards && dbCards.length > 0) {
        const all = (dbCards as unknown as DBCard[]).map(dbCardToStudyCard);
        const session = all.sort(() => Math.random() - 0.5).slice(0, 5);
        setCards(assignVariety(session, all));
        setTotalCards(dbCards.length);
      }
    }
    setLoading(false);
  }

  function handleStart() {
    setPhase("studying");
    setCurrentIndex(0);
    setCorrectCount(0);
    setRequeuedCards([]);
    setAnswered(false);
    setJustMetGoal(false);
    setShowCelebration(false);
    setGapAnalysis(null);
    setSessionAnswers([]);
    setExplainFeedback(null);
    setShowReviewNotes(false);
    savingRef.current = false;
    setTimeout(() => inputRef.current?.focus(), 100);

    // Fetch study sheet in background (available via "Review Notes" button)
    setSheetLoading(true);
    setStudySheetContent("");
    const topics = [...new Set(cards.map((c) => c.topic).filter(Boolean))];
    const fronts = cards.map((c) => c.front);

    fetch("/api/study-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topics, cardFronts: fronts }),
    })
      .then((r) => r.json())
      .then((data) => {
        setStudySheetContent(data.sheet || "");
        setSheetLoading(false);
      })
      .catch(() => {
        setStudySheetContent("");
        setSheetLoading(false);
      });
  }

  async function recordFSRS(cardId: string, correct: boolean, hintWasUsed: boolean, gaveUp: boolean) {
    if (!userId) return;
    const rating = actionToRating(correct, hintWasUsed, gaveUp);
    try {
      await fetch("/api/card-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, cardId, rating }),
      });
    } catch {}
  }

  function handleAnswer(answer: string) {
    const card = cards[currentIndex];
    if (!card) return;
    setUserAnswer(answer);
    const result = checkAnswer(answer, card.back);
    setIsCorrect(result.correct);
    setIsClose(result.close);
    if (result.correct) {
      setCorrectCount((c) => c + 1);
    } else {
      setRequeuedCards((prev) => [...prev, card]);
    }
    setAnswered(true);
    setEnrichField(Math.floor(Math.random() * 3));
    recordFSRS(card.id, result.correct, hintUsed, false);
    recordTopicLevel(card.topic, result.correct);
    setSessionAnswers((prev) => [...prev, { front: card.front, back: card.back, correct: result.correct, topic: card.topic || "", subject: card.subject }]);
  }

  function handleMC(choice: string) {
    const card = cards[currentIndex];
    if (!card) return;
    setUserAnswer(choice);
    const correct = choice === card.back;
    setIsCorrect(correct);
    setIsClose(false);
    if (correct) {
      setCorrectCount((c) => c + 1);
    } else {
      setRequeuedCards((prev) => [...prev, card]);
    }
    setAnswered(true);
    setEnrichField(Math.floor(Math.random() * 3));
    recordFSRS(card.id, correct, false, false);
    recordTopicLevel(card.topic, correct);
    setSessionAnswers((prev) => [...prev, { front: card.front, back: card.back, correct, topic: card.topic || "", subject: card.subject }]);
  }

  function handleTF(answer: boolean) {
    const card = cards[currentIndex];
    if (!card) return;
    const correct = answer === card.trueFalseAnswer;
    setUserAnswer(answer ? "True" : "False");
    setIsCorrect(correct);
    if (correct) {
      setCorrectCount((c) => c + 1);
    } else {
      setRequeuedCards((prev) => [...prev, card]);
    }
    setAnswered(true);
    setEnrichField(Math.floor(Math.random() * 3));
    recordFSRS(card.id, correct, false, false);
    recordTopicLevel(card.topic, correct);
    setSessionAnswers((prev) => [...prev, { front: card.front, back: card.back, correct, topic: card.topic || "", subject: card.subject }]);
  }

  async function handleExplain(explanation: string) {
    const card = cards[currentIndex];
    if (!card) return;
    setUserAnswer(explanation);
    setExplainLoading(true);
    setExplainFeedback(null);

    try {
      const res = await fetch("/api/score-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: card.front,
          correctAnswer: card.back,
          studentExplanation: explanation,
          topic: card.topic || card.subject,
        }),
      });
      const data = await res.json();
      setExplainFeedback(data);
      const mastered = data.mastered;
      setIsCorrect(mastered);
      if (mastered) {
        setCorrectCount((c) => c + 1);
      } else {
        setRequeuedCards((prev) => [...prev, card]);
      }
      recordFSRS(card.id, mastered, false, false);
      recordTopicLevel(card.topic, mastered);
      setSessionAnswers((prev) => [...prev, { front: card.front, back: card.back, correct: mastered, topic: card.topic || "", subject: card.subject }]);
    } catch {
      setExplainFeedback({ score: 0, correct: "", missing: "", misconceptions: "", feedback: "Could not score your explanation. Try again.", mastered: false });
      setIsCorrect(false);
      setRequeuedCards((prev) => [...prev, card]);
    }
    setExplainLoading(false);
    setAnswered(true);
  }

  function handleSkip() {
    const card = cards[currentIndex];
    setUserAnswer("");
    setIsCorrect(false);
    setAnswered(true);
    setEnrichField(Math.floor(Math.random() * 3));
    if (card) {
      setRequeuedCards((prev) => [...prev, card]);
      recordFSRS(card.id, false, false, true);
      recordTopicLevel(card.topic, false);
      setSessionAnswers((prev) => [...prev, { front: card.front, back: card.back, correct: false, topic: card.topic || "", subject: card.subject }]);
    }
  }

  function recordTopicLevel(topic: string | undefined, correct: boolean) {
    if (!userId || !topic) return;
    fetch("/api/topic-levels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, topic, correct }),
    }).catch(() => {});
  }

  async function handleNext() {
    if (currentIndex + 1 >= cards.length) {
      // Show done screen immediately, save in background
      setSaving(true);
      setPhase("done");
      saveSessionProgress().finally(() => setSaving(false));
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswered(false);
      setUserAnswer("");
      setHintUsed(false);
      setShowHint(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function saveSessionProgress() {
    if (!userId) return;
    if (savingRef.current) return;
    savingRef.current = true;

    // Use sessionAnswers as source of truth (state setters may not have flushed)
    const totalAnswered = sessionAnswers.length;
    const totalCorrect = sessionAnswers.filter((a) => a.correct).length;
    const accuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;

    // Save to daily progress
    try {
      const res = await fetch("/api/daily-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          cardsReviewed: totalAnswered,
          cardsCorrect: totalCorrect,
        }),
      });
      const progress = await res.json();
      setDailyCorrect(progress.cards_correct || 0);
      setDailyGoalMet(progress.goal_met || false);
      if (progress.just_met_goal) setJustMetGoal(true);
    } catch {}

    // Earn session points
    try {
      const result = await earnSessionPoints(userId, accuracy);
      setSessionPoints(result.earned);
      setSessionBonuses(result.bonuses);
    } catch {}

    // Save study session to Supabase
    const topics = [...new Set(sessionAnswers.map((a) => a.topic).filter(Boolean))] as string[];
    const subjects = [...new Set(sessionAnswers.map((a) => a.subject).filter(Boolean))] as string[];
    try {
      await supabase.from("study_sessions").insert({
        user_id: userId,
        cards_reviewed: totalAnswered,
        cards_correct: totalCorrect,
        topics,
        subjects,
      });
    } catch {}

    // Check memory score for celebration
    try {
      const memRes = await fetch(`/api/card-review?userId=${userId}`);
      const memData = await memRes.json();
      if (memData.improvement_pct >= 20) {
        setCelebrationPct(memData.improvement_pct);
        setShowCelebration(true);
      }
      setMemoryRefreshKey((k) => k + 1);
    } catch {}

    // Run gap analysis (Phase 10)
    if (sessionAnswers.length > 0) {
      try {
        const gapRes = await fetch("/api/gap-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionCards: sessionAnswers, userId }),
        });
        const gapData = await gapRes.json();
        setGapAnalysis(gapData);
      } catch {}
    }
  }

  async function handleMore() {
    // If there are re-queued wrong cards, study those first
    if (requeuedCards.length > 0) {
      setCards(requeuedCards);
      setRequeuedCards([]);
      setPhase("studying");
      setCurrentIndex(0);
      setCorrectCount(0);
      setAnswered(false);
      setHintUsed(false);
      setShowHint(false);
      setJustMetGoal(false);
      setSessionAnswers([]);
      savingRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    setPhase("start");
    setCurrentIndex(0);
    setCorrectCount(0);
    setAnswered(false);
    setHintUsed(false);
    setShowHint(false);
    setJustMetGoal(false);
    await loadSession();
  }

  const card = cards[currentIndex];
  const accuracy = cards.length > 0 ? Math.round((correctCount / Math.max(1, currentIndex + (answered ? 1 : 0))) * 100) : 0;
  const cardsRemaining = DAILY_GOAL_CARDS - dailyCorrect;

  // Loading
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-[3px] border-gray-200 border-t-blue-500 rounded-full" />
          <p className="text-sm text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // START SCREEN
  if (phase === "start") {
    const progressPct = Math.min(100, Math.round((dailyCorrect / DAILY_GOAL_CARDS) * 100));

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
        {/* Status row */}
        <div className="flex items-center gap-3 mb-6">
          {userId && <StreakBadge userId={userId} />}
        </div>

        {/* Memory Score */}
        {userId && <MemoryScoreWidget key={memoryRefreshKey} userId={userId} />}

        {/* Daily Goal Card */}
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-[20px] border border-gray-200/60 shadow-sm p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-gray-500 tracking-wide">Daily Goal</span>
            <span className={`text-[13px] font-bold tabular-nums ${dailyGoalMet ? "text-amber-500" : "text-gray-800"}`}>
              {dailyCorrect} / {DAILY_GOAL_CARDS}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                dailyGoalMet ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : progressPct >= 75 ? "bg-gradient-to-r from-green-400 to-emerald-500"
                : progressPct >= 50 ? "bg-gradient-to-r from-yellow-400 to-amber-400"
                : "bg-gradient-to-r from-blue-400 to-blue-500"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[12px] text-gray-400 mt-2">
            {dailyGoalMet
              ? "Goal complete! Extra cards earn bonus points."
              : `${cardsRemaining} more correct to reach your goal`}
          </p>
        </div>

        {/* CTA */}
        <h1 className="text-[28px] font-bold text-gray-900 mb-1 tracking-tight">
          {dailyGoalMet ? "Keep going?" : "Ready to study?"}
        </h1>
        {studyReason && (
          <p className="text-[13px] text-blue-500 font-medium mb-1">{studyReason} — due soon</p>
        )}
        <p className="text-[13px] text-gray-400 mb-8">{totalCards} cards · 5 per session</p>

        <button
          onClick={handleStart}
          className="w-full max-w-sm py-[14px] rounded-[14px] bg-blue-500 text-white text-[17px] font-semibold hover:bg-blue-600 active:scale-[0.97] active:opacity-90 transition-all shadow-[0_2px_12px_rgba(59,130,246,0.3)]"
        >
          Start Session
        </button>
        {cards.length === 0 && (
          <p className="text-[13px] text-gray-400 mt-4">No cards available yet.</p>
        )}
      </div>
    );
  }

  // DONE SCREEN
  if (phase === "done") {
    const pct = cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0;
    const progressPct = Math.min(100, Math.round((dailyCorrect / DAILY_GOAL_CARDS) * 100));

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
        {/* Celebration Modal */}
        {showCelebration && (
          <CelebrationModal
            improvementPct={celebrationPct}
            onClose={() => setShowCelebration(false)}
          />
        )}

        {/* Streak */}
        {userId && (
          <div className="mb-4">
            <StreakBadge userId={userId} />
          </div>
        )}

        {/* Goal just met */}
        {justMetGoal && (
          <div className="w-full max-w-sm mb-5 p-4 rounded-[20px] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 text-center">
            <p className="text-[20px] font-bold text-amber-600">Daily Goal Complete!</p>
            <p className="text-[13px] text-amber-500 mt-1">+50 pts earned</p>
          </div>
        )}

        {/* Score card */}
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-[24px] border border-gray-200/60 shadow-sm p-6 mb-5 text-center">
          <p className="text-[48px] font-bold text-gray-900 tracking-tight">{pct}%</p>
          <p className="text-[15px] text-gray-500 font-medium">{correctCount} of {cards.length} correct</p>

          {/* Points */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {saving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-3.5 w-3.5 border-2 border-amber-400 border-t-transparent rounded-full" />
                <span className="text-[13px] text-gray-400">Saving...</span>
              </div>
            ) : (
              <>
                <p className="text-[15px] font-semibold text-amber-500">+{sessionPoints} pts</p>
                {sessionBonuses.map((b, i) => (
                  <p key={i} className="text-[12px] text-amber-400 mt-0.5">{b}</p>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Memory Score */}
        {userId && <MemoryScoreWidget key={memoryRefreshKey} userId={userId} />}

        {/* Daily progress */}
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-[16px] border border-gray-200/60 p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-gray-500">Daily Goal</span>
            <span className={`text-[13px] font-bold tabular-nums ${dailyGoalMet ? "text-amber-500" : "text-gray-800"}`}>
              {dailyCorrect} / {DAILY_GOAL_CARDS}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                dailyGoalMet ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : progressPct >= 75 ? "bg-gradient-to-r from-green-400 to-emerald-500"
                : "bg-gradient-to-r from-blue-400 to-blue-500"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {!dailyGoalMet && (
            <p className="text-[12px] text-gray-400 mt-1.5">{DAILY_GOAL_CARDS - dailyCorrect} more to go</p>
          )}
        </div>

        {/* Gap Analysis */}
        {gapAnalysis && (
          <GapAnalysisComponent
            weakTopics={gapAnalysis.weakTopics}
            strengths={gapAnalysis.strengths}
            recommendations={gapAnalysis.recommendations}
            nextSessionFocus={gapAnalysis.nextSessionFocus}
            summary={gapAnalysis.summary}
          />
        )}

        {/* Re-queue info */}
        {requeuedCards.length > 0 && (
          <p className="text-[12px] text-red-400 font-medium mb-3 mt-3">
            {requeuedCards.length} card{requeuedCards.length > 1 ? "s" : ""} to retry
          </p>
        )}

        {/* Actions */}
        <div className="w-full max-w-sm mt-4 space-y-2.5">
          <button
            onClick={handleMore}
            className="w-full py-[14px] rounded-[14px] bg-blue-500 text-white text-[17px] font-semibold hover:bg-blue-600 active:scale-[0.97] transition-all shadow-[0_2px_12px_rgba(59,130,246,0.3)]"
          >
            {requeuedCards.length > 0
              ? `Retry ${requeuedCards.length} Missed`
              : "Continue Studying"}
          </button>
          <button
            onClick={() => setPhase("start")}
            className="w-full py-[12px] rounded-[14px] bg-gray-100 text-gray-500 text-[15px] font-medium hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            Done for Now
          </button>
        </div>
      </div>
    );
  }

  // STUDYING
  if (!card) return null;

  const subjectStyle = SUBJECT_COLORS[card.subject] || { text: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" };

  return (
    <div className="min-h-[80vh] flex flex-col px-4 py-4">
      {/* Top bar: progress + review notes */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex gap-[5px]">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`h-[5px] rounded-full transition-all duration-300 ${
                i < currentIndex ? "w-7 bg-blue-500" :
                i === currentIndex ? "w-9 bg-blue-500" :
                "w-4 bg-gray-200"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setShowReviewNotes(!showReviewNotes)}
          className={`text-[11px] font-medium px-3 py-[5px] rounded-full transition-all ${
            showReviewNotes
              ? "bg-indigo-500 text-white shadow-sm"
              : "bg-gray-100 text-gray-500 active:bg-gray-200"
          }`}
        >
          {sheetLoading ? "Loading..." : showReviewNotes ? "Hide Notes" : "Notes"}
        </button>
      </div>

      {/* Collapsible Review Notes */}
      {showReviewNotes && studySheetContent && (
        <div className="mb-4 max-h-44 overflow-y-auto rounded-2xl bg-indigo-50/70 backdrop-blur-sm border border-indigo-100 p-4">
          {studySheetContent.split("\n").map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return null;
            if (trimmed.startsWith("## ") || trimmed.startsWith("**")) {
              return <p key={i} className="text-[12px] font-bold text-indigo-700 mt-2.5 mb-0.5">{trimmed.replace(/^##\s*/, "").replace(/\*\*/g, "")}</p>;
            }
            if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
              return <p key={i} className="text-[12px] text-indigo-600/80 ml-2 leading-relaxed">{trimmed.slice(2)}</p>;
            }
            return <p key={i} className="text-[12px] text-indigo-600/80 leading-relaxed">{trimmed}</p>;
          })}
        </div>
      )}
      {showReviewNotes && sheetLoading && (
        <div className="mb-4 flex items-center justify-center py-5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
          <div className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full mr-2" />
          <span className="text-[12px] text-indigo-400">Generating notes...</span>
        </div>
      )}

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {!answered ? (
          <>
            {/* Subject pill */}
            <span className={`text-[11px] font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full ${subjectStyle.bg} ${subjectStyle.text} ${subjectStyle.border} border`}>
              {card.subject}
            </span>

            {/* Image */}
            {card.imageUrl && (
              <img src={card.imageUrl} alt="" className="w-full max-w-[180px] h-auto rounded-2xl mb-5 shadow-sm" />
            )}

            {/* Question */}
            <h2 className="text-[22px] sm:text-[26px] font-bold text-gray-900 text-center mb-8 leading-snug tracking-tight max-w-sm">
              {card.front}
            </h2>

            {/* True/False statement */}
            {card.answerType === "true-false" && card.trueFalseStatement && (
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-5 mb-5 max-w-sm">
                <p className="text-[15px] text-gray-600 text-center leading-relaxed italic">
                  &ldquo;{card.trueFalseStatement}&rdquo;
                </p>
              </div>
            )}

            {/* Answer inputs */}
            <div className="w-full max-w-sm">
              {/* Multiple Choice */}
              {card.answerType === "multiple-choice" && card.choices && (
                <div className="space-y-2.5">
                  {card.choices.map((choice, idx) => (
                    <button
                      key={choice}
                      onClick={() => handleMC(choice)}
                      className="w-full py-[14px] px-4 rounded-[14px] bg-white border border-gray-200/80 text-[15px] text-left text-gray-800 font-medium shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-blue-300 hover:bg-blue-50/50 active:scale-[0.98] active:shadow-none transition-all"
                    >
                      <span className="text-gray-400 mr-2 text-[13px]">{String.fromCharCode(65 + idx)}</span>
                      {choice}
                    </button>
                  ))}
                </div>
              )}

              {/* True / False */}
              {card.answerType === "true-false" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleTF(true)}
                    className="flex-1 py-[14px] rounded-[14px] bg-emerald-50 border-2 border-emerald-200 text-emerald-600 font-bold text-[17px] hover:bg-emerald-100 active:scale-[0.97] transition-all"
                  >
                    True
                  </button>
                  <button
                    onClick={() => handleTF(false)}
                    className="flex-1 py-[14px] rounded-[14px] bg-red-50 border-2 border-red-200 text-red-500 font-bold text-[17px] hover:bg-red-100 active:scale-[0.97] transition-all"
                  >
                    False
                  </button>
                </div>
              )}

              {/* Type-in / Fill-blank */}
              {(card.answerType === "type" || card.answerType === "fill-blank") && (
                <>
                  {card.answerType === "fill-blank" && card.blankSentence && (
                    <p className="text-[12px] text-gray-400 text-center mb-2 font-medium">{card.blankSentence}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && userAnswer.trim()) handleAnswer(userAnswer); }}
                      placeholder="Type your answer..."
                      className="flex-1 px-4 py-[14px] rounded-[14px] bg-gray-50 border border-gray-200 text-[16px] focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                      autoFocus
                    />
                    <button
                      onClick={() => userAnswer.trim() && handleAnswer(userAnswer)}
                      disabled={!userAnswer.trim()}
                      className="px-5 py-[14px] rounded-[14px] bg-blue-500 text-white font-semibold text-[17px] hover:bg-blue-600 disabled:opacity-25 active:scale-[0.95] transition-all shadow-[0_2px_8px_rgba(59,130,246,0.25)]"
                    >
                      &rarr;
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setShowHint(true); setHintUsed(true); }}
                      className="flex-1 py-2.5 rounded-[12px] text-[12px] font-medium text-amber-500 bg-amber-50/60 hover:bg-amber-50 active:scale-[0.98] transition-all"
                    >
                      {showHint ? `${card.back.slice(0, Math.ceil(card.back.length / 3))}...` : "Hint"}
                    </button>
                    <button
                      onClick={handleSkip}
                      className="flex-1 py-2.5 rounded-[12px] text-[12px] font-medium text-gray-400 bg-gray-50/60 hover:bg-gray-100 active:scale-[0.98] transition-all"
                    >
                      I don&apos;t know
                    </button>
                  </div>
                </>
              )}

              {/* Explain-back */}
              {card.answerType === "explain" && (
                <>
                  <p className="text-[12px] text-indigo-400 text-center mb-3 font-medium">Explain in your own words</p>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your explanation here..."
                    rows={4}
                    className="w-full px-4 py-3.5 rounded-[14px] bg-gray-50 border border-gray-200 text-[14px] focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none resize-none transition-all"
                    autoFocus
                  />
                  <button
                    onClick={() => userAnswer.trim().length >= 10 && handleExplain(userAnswer)}
                    disabled={userAnswer.trim().length < 10 || explainLoading}
                    className="w-full mt-2.5 py-[14px] rounded-[14px] bg-indigo-500 text-white font-semibold text-[15px] hover:bg-indigo-600 disabled:opacity-25 active:scale-[0.97] transition-all shadow-[0_2px_8px_rgba(99,102,241,0.25)]"
                  >
                    {explainLoading ? "Scoring..." : "Submit"}
                  </button>
                  <button
                    onClick={handleSkip}
                    className="w-full mt-2 py-2.5 rounded-[12px] text-[12px] font-medium text-gray-400 hover:bg-gray-50 active:scale-[0.98] transition-all"
                  >
                    I don&apos;t know
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          /* ANSWERED — result card */
          <div className="w-full max-w-sm">
            {/* Result indicator */}
            <div className={`rounded-[20px] p-6 mb-4 text-center ${
              isCorrect ? "bg-emerald-50/80" : "bg-red-50/80"
            } backdrop-blur-sm border ${isCorrect ? "border-emerald-200/60" : "border-red-200/60"}`}>
              <div className={`text-3xl mb-2 ${isCorrect ? "animate-bounce" : ""}`}>
                {isCorrect ? "✓" : "✗"}
              </div>
              <p className={`text-[14px] font-semibold mb-3 ${isCorrect ? "text-emerald-600" : "text-red-500"}`}>
                {isCorrect ? (isClose ? "Close enough!" : "Correct!") : "Not quite"}
              </p>
              <p className="text-[20px] font-bold text-gray-900">{card.back}</p>
            </div>

            {/* Explain-back feedback */}
            {explainFeedback && card.answerType === "explain" && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex gap-[3px]">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className={`w-6 h-[5px] rounded-full ${s <= explainFeedback.score ? "bg-indigo-500" : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <span className="text-[12px] text-gray-400 font-medium">{explainFeedback.score}/5</span>
                </div>
                {explainFeedback.correct && (
                  <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-3.5">
                    <p className="text-[11px] font-semibold text-emerald-600 mb-1">What you got right</p>
                    <p className="text-[13px] text-emerald-700 leading-relaxed">{explainFeedback.correct}</p>
                  </div>
                )}
                {explainFeedback.missing && (
                  <div className="rounded-2xl bg-amber-50/70 border border-amber-100 p-3.5">
                    <p className="text-[11px] font-semibold text-amber-600 mb-1">What was missing</p>
                    <p className="text-[13px] text-amber-700 leading-relaxed">{explainFeedback.missing}</p>
                  </div>
                )}
                {explainFeedback.misconceptions && (
                  <div className="rounded-2xl bg-red-50/70 border border-red-100 p-3.5">
                    <p className="text-[11px] font-semibold text-red-500 mb-1">Misconceptions</p>
                    <p className="text-[13px] text-red-600 leading-relaxed">{explainFeedback.misconceptions}</p>
                  </div>
                )}
                {explainFeedback.feedback && (
                  <p className="text-[13px] text-indigo-500 text-center italic pt-1">{explainFeedback.feedback}</p>
                )}
              </div>
            )}

            {/* Explanation (non-explain cards) */}
            {card.explanation && card.answerType !== "explain" && (
              <div className={`rounded-2xl p-4 mb-3 ${isCorrect ? "bg-blue-50/60 border border-blue-100" : "bg-red-50/60 border border-red-100"}`}>
                <p className={`text-[13px] leading-relaxed ${isCorrect ? "text-blue-700" : "text-red-600"}`}>{card.explanation}</p>
              </div>
            )}

            {/* Enrichment fields */}
            {card.realWorldConnection && (
              <div className="rounded-2xl bg-gray-50/60 border border-gray-100 p-3.5 mb-2">
                <p className="text-[11px] font-semibold text-gray-400 mb-1">Real-world</p>
                <p className="text-[13px] text-gray-600 leading-relaxed">{card.realWorldConnection}</p>
              </div>
            )}
            {card.tokConnection && (
              <div className="rounded-2xl bg-amber-50/50 border border-amber-100 p-3.5 mb-2">
                <p className="text-[11px] font-semibold text-amber-500 mb-1">How do we know?</p>
                <p className="text-[13px] text-amber-700 leading-relaxed">{card.tokConnection}</p>
              </div>
            )}
            {card.interdisciplinary && (
              <div className="rounded-2xl bg-violet-50/50 border border-violet-100 p-3.5 mb-5">
                <p className="text-[11px] font-semibold text-violet-500 mb-1">Across subjects</p>
                <p className="text-[13px] text-violet-700 leading-relaxed">{card.interdisciplinary}</p>
              </div>
            )}

            {/* Next button */}
            <button
              onClick={handleNext}
              className={`w-full py-[14px] rounded-[14px] text-[17px] font-semibold active:scale-[0.97] transition-all ${
                isCorrect
                  ? "bg-emerald-500 text-white shadow-[0_2px_12px_rgba(16,185,129,0.3)] hover:bg-emerald-600"
                  : "bg-red-500 text-white shadow-[0_2px_12px_rgba(239,68,68,0.3)] hover:bg-red-600"
              }`}
            >
              {currentIndex + 1 >= cards.length ? "See Results" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
