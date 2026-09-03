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

const SUBJECT_COLORS: Record<string, string> = {
  spanish: "text-orange-400",
  biology: "text-green-400",
  english: "text-purple-400",
  math: "text-blue-400",
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
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // START SCREEN
  if (phase === "start") {
    const progressPct = Math.min(100, Math.round((dailyCorrect / DAILY_GOAL_CARDS) * 100));
    const progressColor = dailyGoalMet ? "bg-amber-400" : progressPct >= 75 ? "bg-green-500" : progressPct >= 50 ? "bg-yellow-500" : "bg-blue-500";

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        {/* Streak Badge */}
        {userId && (
          <div className="mb-4">
            <StreakBadge userId={userId} />
          </div>
        )}

        {/* Memory Score */}
        {userId && <MemoryScoreWidget key={memoryRefreshKey} userId={userId} />}

        {/* Daily Goal Progress */}
        <div className="w-full max-w-xs mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500">Daily Goal</span>
            <span className={`text-xs font-bold ${dailyGoalMet ? "text-amber-600" : "text-gray-700"}`}>
              {dailyCorrect} / {DAILY_GOAL_CARDS} mastered
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {dailyGoalMet ? (
            <p className="text-xs text-amber-600 mt-1.5 font-medium">Goal complete! Keep going for bonus points.</p>
          ) : (
            <p className="text-xs text-gray-400 mt-1.5">{cardsRemaining} more correct answers to hit your goal</p>
          )}
        </div>

        <div className="text-5xl mb-6">{dailyGoalMet ? "🏆" : "🪁"}</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {dailyGoalMet ? "Goal reached! Study more?" : "Ready to study?"}
        </h1>
        {studyReason && (
          <p className="text-sm text-blue-600 mb-1">📋 {studyReason} — due soon</p>
        )}
        <p className="text-sm text-gray-500 mb-8">{totalCards} cards available · 5 cards per session</p>
        <button
          onClick={handleStart}
          className="w-full max-w-xs py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-lg"
        >
          Start
        </button>
        {cards.length === 0 && (
          <p className="text-sm text-gray-400 mt-4">No cards available. Import some from the Admin tab.</p>
        )}
      </div>
    );
  }

  // DONE SCREEN
  if (phase === "done") {
    const pct = cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0;
    const progressPct = Math.min(100, Math.round((dailyCorrect / DAILY_GOAL_CARDS) * 100));
    const progressColor = dailyGoalMet ? "bg-amber-400" : progressPct >= 75 ? "bg-green-500" : progressPct >= 50 ? "bg-yellow-500" : "bg-blue-500";

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        {/* Celebration Modal */}
        {showCelebration && (
          <CelebrationModal
            improvementPct={celebrationPct}
            onClose={() => setShowCelebration(false)}
          />
        )}

        {/* Streak Badge */}
        {userId && (
          <div className="mb-3">
            <StreakBadge userId={userId} />
          </div>
        )}

        {/* Goal just met celebration */}
        {justMetGoal && (
          <div className="w-full max-w-xs mb-4 p-3 rounded-2xl bg-amber-50 border-2 border-amber-300">
            <p className="text-lg font-bold text-amber-700">🎯 Daily Goal Complete!</p>
            <p className="text-xs text-amber-600 mt-1">+50 pts earned for hitting your goal</p>
          </div>
        )}

        <div className="text-6xl mb-4">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{correctCount}/{cards.length} correct</h1>
        <p className="text-3xl font-bold text-blue-600 mb-2">{pct}%</p>

        {/* Points earned */}
        {saving ? (
          <div className="flex items-center gap-2 mb-2">
            <div className="animate-spin h-3.5 w-3.5 border-2 border-amber-500 border-t-transparent rounded-full" />
            <span className="text-xs text-amber-500">Saving progress...</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-amber-600 mb-2">⭐ +{sessionPoints} pts earned</p>
            {sessionBonuses.map((b, i) => (
              <p key={i} className="text-xs text-amber-500">{b}</p>
            ))}
          </>
        )}

        {/* Memory Score */}
        {userId && <MemoryScoreWidget key={memoryRefreshKey} userId={userId} />}

        {/* Daily progress bar */}
        <div className="w-full max-w-xs mt-4 mb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Daily Goal</span>
            <span className={`text-xs font-bold ${dailyGoalMet ? "text-amber-600" : "text-gray-700"}`}>
              {dailyCorrect} / {DAILY_GOAL_CARDS}
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {!dailyGoalMet && (
            <p className="text-xs text-gray-400 mt-1">{DAILY_GOAL_CARDS - dailyCorrect} more to go!</p>
          )}
        </div>

        {/* Gap Analysis (Phase 10) */}
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
          <p className="text-xs text-red-500 mb-3">
            {requeuedCards.length} card{requeuedCards.length > 1 ? "s" : ""} to retry (wrong answers)
          </p>
        )}

        <button
          onClick={handleMore}
          className="w-full max-w-xs py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-lg mb-3"
        >
          {requeuedCards.length > 0
            ? `Retry ${requeuedCards.length} missed card${requeuedCards.length > 1 ? "s" : ""}`
            : "Do 5 more"}
        </button>
        <button
          onClick={() => setPhase("start")}
          className="w-full max-w-xs py-3 rounded-2xl bg-gray-100 text-gray-700 text-sm font-medium"
        >
          Done for now
        </button>
      </div>
    );
  }

  // STUDYING
  if (!card) return null;

  const enrichments = [
    card.realWorldConnection ? { icon: "📱", label: "Real-world", text: card.realWorldConnection } : null,
    card.tokConnection ? { icon: "🧠", label: "How do we know?", text: card.tokConnection } : null,
    card.interdisciplinary ? { icon: "🔗", label: "Across subjects", text: card.interdisciplinary } : null,
  ].filter(Boolean);
  const currentEnrich = enrichments[enrichField % enrichments.length];

  return (
    <div className="min-h-[80vh] flex flex-col px-4 py-4">
      {/* Progress dots + Review Notes toggle */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex gap-1">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i < currentIndex ? "w-6 bg-blue-500" :
                i === currentIndex ? "w-8 bg-blue-600" :
                "w-4 bg-gray-300"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setShowReviewNotes(!showReviewNotes)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            showReviewNotes
              ? "bg-indigo-100 border-indigo-300 text-indigo-700"
              : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
          }`}
        >
          {sheetLoading ? "📝 Loading..." : showReviewNotes ? "📝 Hide Notes" : "📝 Review Notes"}
        </button>
      </div>

      {/* Collapsible Review Notes Panel */}
      {showReviewNotes && studySheetContent && (
        <div className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-indigo-200 bg-indigo-50 p-3">
          {studySheetContent.split("\n").map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return null;
            if (trimmed.startsWith("## ") || trimmed.startsWith("**")) {
              return <p key={i} className="text-xs font-bold text-indigo-700 mt-2 mb-0.5">{trimmed.replace(/^##\s*/, "").replace(/\*\*/g, "")}</p>;
            }
            if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
              return <p key={i} className="text-xs text-indigo-600 ml-2">• {trimmed.slice(2)}</p>;
            }
            return <p key={i} className="text-xs text-indigo-600">{trimmed}</p>;
          })}
        </div>
      )}
      {showReviewNotes && sheetLoading && (
        <div className="mb-4 flex items-center justify-center py-4 rounded-xl border border-indigo-200 bg-indigo-50">
          <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full mr-2" />
          <span className="text-xs text-indigo-500">Generating review notes...</span>
        </div>
      )}

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {!answered ? (
          <>
            {/* Subject tag */}
            <span className={`text-xs font-medium uppercase tracking-wide mb-3 ${SUBJECT_COLORS[card.subject] || "text-gray-400"}`}>
              {card.subject}
            </span>

            {/* Image */}
            {card.imageUrl && <img src={card.imageUrl} alt="" className="w-full max-w-[200px] h-auto rounded-lg mb-4" />}

            {/* Question */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-6 leading-snug">
              {card.front}
            </h2>

            {/* True/False statement */}
            {card.answerType === "true-false" && card.trueFalseStatement && (
              <p className="text-base text-gray-600 text-center bg-gray-50 rounded-xl p-4 mb-4 max-w-sm">
                &ldquo;{card.trueFalseStatement}&rdquo;
              </p>
            )}

            {/* Answer input */}
            <div className="w-full max-w-sm">
              {card.answerType === "multiple-choice" && card.choices && (
                <div className="space-y-2">
                  {card.choices.map((choice) => (
                    <button
                      key={choice}
                      onClick={() => handleMC(choice)}
                      className="w-full py-3.5 px-4 rounded-xl border border-gray-200 bg-white text-sm text-left text-gray-900 hover:bg-blue-50 hover:border-blue-300 active:scale-[0.98] transition-all"
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}

              {card.answerType === "true-false" && (
                <div className="flex gap-3">
                  <button onClick={() => handleTF(true)} className="flex-1 py-4 rounded-xl bg-green-50 border-2 border-green-200 text-green-700 font-bold text-lg hover:bg-green-100 active:scale-95 transition-all">True</button>
                  <button onClick={() => handleTF(false)} className="flex-1 py-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 font-bold text-lg hover:bg-red-100 active:scale-95 transition-all">False</button>
                </div>
              )}

              {(card.answerType === "type" || card.answerType === "fill-blank") && (
                <>
                  {card.answerType === "fill-blank" && card.blankSentence && (
                    <p className="text-xs text-gray-400 text-center mb-2">{card.blankSentence}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && userAnswer.trim()) handleAnswer(userAnswer); }}
                      placeholder="Type your answer..."
                      className="flex-1 px-4 py-3.5 rounded-xl border border-gray-200 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => userAnswer.trim() && handleAnswer(userAnswer)}
                      disabled={!userAnswer.trim()}
                      className="px-5 py-3.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-30 active:scale-95 transition-all"
                    >
                      →
                    </button>
                  </div>
                  {/* Hint + Skip */}
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => { setShowHint(true); setHintUsed(true); }}
                      className="flex-1 py-2 rounded-xl text-xs text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      {showHint ? `💡 ${card.back.slice(0, Math.ceil(card.back.length / 3))}...` : "💡 Hint"}
                    </button>
                    <button
                      onClick={handleSkip}
                      className="flex-1 py-2 rounded-xl text-xs text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      🤷 I don&apos;t know
                    </button>
                  </div>
                </>
              )}

              {/* Explain-back (Phase 9) */}
              {card.answerType === "explain" && (
                <>
                  <p className="text-xs text-indigo-500 text-center mb-2">Explain in your own words — AI will score your answer</p>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your explanation here..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                    autoFocus
                  />
                  <button
                    onClick={() => userAnswer.trim().length >= 10 && handleExplain(userAnswer)}
                    disabled={userAnswer.trim().length < 10 || explainLoading}
                    className="w-full mt-2 py-3.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-30 active:scale-95 transition-all"
                  >
                    {explainLoading ? "Scoring..." : "Submit Explanation"}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-1">Minimum 10 characters</p>
                  <button
                    onClick={handleSkip}
                    className="w-full mt-2 py-2 rounded-xl text-xs text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    🤷 I don&apos;t know
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          /* ANSWERED — show result */
          <>
            {/* Result badge */}
            <div className={`text-4xl mb-3 ${isCorrect ? "animate-bounce" : ""}`}>
              {isCorrect ? "✅" : "❌"}
            </div>

            <p className={`text-sm font-medium mb-2 ${isCorrect ? "text-green-600" : "text-red-600"}`}>
              {isCorrect ? (isClose ? "Close enough!" : "Correct!") : "Not quite — this card will come back"}
            </p>

            {/* Correct answer */}
            <p className="text-xl font-bold text-gray-900 text-center mb-4">{card.back}</p>

            {/* Explain-back feedback (Phase 9) */}
            {explainFeedback && card.answerType === "explain" && (
              <div className="w-full max-w-sm space-y-2 mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-500">Score:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className={`w-5 h-2 rounded-full ${s <= explainFeedback.score ? "bg-indigo-500" : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{explainFeedback.score}/5</span>
                </div>
                {explainFeedback.correct && (
                  <div className="rounded-xl bg-green-50 p-3">
                    <p className="text-xs text-green-600 font-medium mb-0.5">What you got right</p>
                    <p className="text-xs text-green-700">{explainFeedback.correct}</p>
                  </div>
                )}
                {explainFeedback.missing && (
                  <div className="rounded-xl bg-amber-50 p-3">
                    <p className="text-xs text-amber-600 font-medium mb-0.5">What was missing</p>
                    <p className="text-xs text-amber-700">{explainFeedback.missing}</p>
                  </div>
                )}
                {explainFeedback.misconceptions && (
                  <div className="rounded-xl bg-red-50 p-3">
                    <p className="text-xs text-red-600 font-medium mb-0.5">Misconceptions</p>
                    <p className="text-xs text-red-700">{explainFeedback.misconceptions}</p>
                  </div>
                )}
                {explainFeedback.feedback && (
                  <p className="text-sm text-indigo-600 text-center italic">{explainFeedback.feedback}</p>
                )}
              </div>
            )}

            {/* Always show explanation (non-explain cards) */}
            {card.explanation && card.answerType !== "explain" && (
              <div className={`w-full max-w-sm rounded-xl p-3 mb-3 ${isCorrect ? "bg-blue-50" : "bg-red-50"}`}>
                <p className={`text-xs ${isCorrect ? "text-blue-700" : "text-red-700"}`}>{card.explanation}</p>
              </div>
            )}

            {/* Show ALL enrichment fields */}
            {card.realWorldConnection && (
              <div className="w-full max-w-sm bg-gray-50 rounded-xl p-3 mb-2">
                <p className="text-xs text-gray-500 mb-1">📱 Real-world</p>
                <p className="text-sm text-gray-700">{card.realWorldConnection}</p>
              </div>
            )}
            {card.tokConnection && (
              <div className="w-full max-w-sm bg-amber-50 rounded-xl p-3 mb-2">
                <p className="text-xs text-amber-600 mb-1">🧠 How do we know?</p>
                <p className="text-sm text-amber-700">{card.tokConnection}</p>
              </div>
            )}
            {card.interdisciplinary && (
              <div className="w-full max-w-sm bg-purple-50 rounded-xl p-3 mb-6">
                <p className="text-xs text-purple-600 mb-1">🔗 Across subjects</p>
                <p className="text-sm text-purple-700">{card.interdisciplinary}</p>
              </div>
            )}

            {/* Next button */}
            <button
              onClick={handleNext}
              className={`w-full max-w-xs py-4 rounded-2xl text-lg font-bold active:scale-95 transition-all shadow-lg ${
                isCorrect ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              {currentIndex + 1 >= cards.length ? "See results" : "Next →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
