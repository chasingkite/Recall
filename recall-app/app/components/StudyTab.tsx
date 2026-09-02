"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "../lib/supabase/client";
import { StudyCard, MAX_SESSION_SIZE } from "../lib/sample-cards";
import { checkAnswer, fsrsReview, actionToRating } from "../lib/spaced-repetition";
import { recordReview, recordSessionComplete } from "../lib/study-stats";
import { earnSessionPoints } from "../lib/points";

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
    if (card.answerType === "multiple-choice" && card.choices && card.choices.length > 0) return card;
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
    return card;
  });
}

const SUBJECT_COLORS: Record<string, string> = {
  spanish: "text-orange-400",
  biology: "text-green-400",
  english: "text-purple-400",
  math: "text-blue-400",
};

type Phase = "start" | "studying" | "celebration" | "done";

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
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrichField, setEnrichField] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Load on mount
  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    setLoading(true);
    try {
      const res = await fetch("/api/smart-session?studentId=81991&mode=quick5&subject=all");
      const data = await res.json();
      if (data.cards && data.cards.length > 0) {
        const studyCards = (data.cards as DBCard[]).map(dbCardToStudyCard);
        // Use allCards pool for MC distractor generation (much larger than session)
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
    setAnswered(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleAnswer(answer: string) {
    const card = cards[currentIndex];
    if (!card) return;
    setUserAnswer(answer);
    const result = checkAnswer(answer, card.back);
    setIsCorrect(result.correct);
    setIsClose(result.close);
    if (result.correct) setCorrectCount((c) => c + 1);
    setAnswered(true);
    setEnrichField(Math.floor(Math.random() * 3));
    // Record in FSRS
    const rating = actionToRating(result.correct, hintUsed, false);
    recordReview(card.subject, result.correct, rating >= 3 ? 1 : 0);
  }

  function handleMC(choice: string) {
    const card = cards[currentIndex];
    if (!card) return;
    setUserAnswer(choice);
    const correct = choice === card.back;
    setIsCorrect(correct);
    setIsClose(false);
    if (correct) setCorrectCount((c) => c + 1);
    setAnswered(true);
    setEnrichField(Math.floor(Math.random() * 3));
    recordReview(card.subject, correct, correct ? 1 : 0);
  }

  function handleTF(answer: boolean) {
    const card = cards[currentIndex];
    if (!card) return;
    const correct = answer === card.trueFalseAnswer;
    setUserAnswer(answer ? "True" : "False");
    setIsCorrect(correct);
    if (correct) setCorrectCount((c) => c + 1);
    setAnswered(true);
    setEnrichField(Math.floor(Math.random() * 3));
    recordReview(card.subject, correct, correct ? 1 : 0);
  }

  function handleSkip() {
    setUserAnswer("");
    setIsCorrect(false);
    setAnswered(true);
    setEnrichField(Math.floor(Math.random() * 3));
    const card = cards[currentIndex];
    if (card) recordReview(card.subject, false, 0);
  }

  function handleNext() {
    if (currentIndex + 1 >= cards.length) {
      recordSessionComplete();
      const result = earnSessionPoints(cards.length > 0 ? correctCount / cards.length : 0);
      setStreak(result.earned);

      // Save session to Supabase for admin tracking
      const topics = [...new Set(cards.map((c) => c.topic).filter(Boolean))] as string[];
      const subjects = [...new Set(cards.map((c) => c.subject).filter(Boolean))] as string[];
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from("study_sessions").insert({
            user_id: user.id,
            cards_reviewed: cards.length,
            cards_correct: correctCount + (isCorrect ? 1 : 0),
            topics,
            subjects,
          }).then(() => {});
        }
      });

      setPhase("done");
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswered(false);
      setUserAnswer("");
      setHintUsed(false);
      setShowHint(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function handleMore() {
    setPhase("start");
    setCurrentIndex(0);
    setCorrectCount(0);
    setAnswered(false);
    setHintUsed(false);
    setShowHint(false);
    await loadSession();
  }

  const card = cards[currentIndex];
  const accuracy = cards.length > 0 ? Math.round((correctCount / Math.max(1, currentIndex + (answered ? 1 : 0))) * 100) : 0;

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
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-6">🪁</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ready to study?</h1>
        {studyReason && (
          <p className="text-sm text-blue-600 mb-1">📋 {studyReason} — due soon</p>
        )}
        <p className="text-sm text-gray-500 mb-8">{totalCards} cards waiting · 5 cards, ~2 minutes</p>
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
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{correctCount}/{cards.length} correct</h1>
        <p className="text-3xl font-bold text-blue-600 mb-2">{pct}%</p>
        <p className="text-sm text-amber-600 mb-6">⭐ +{streak} pts earned</p>
        <button
          onClick={handleMore}
          className="w-full max-w-xs py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-lg mb-3"
        >
          Do 5 more
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

  // STUDYING — full screen card experience
  if (!card) return null;

  const enrichments = [
    card.realWorldConnection ? { icon: "📱", label: "Real-world", text: card.realWorldConnection } : null,
    card.tokConnection ? { icon: "🧠", label: "How do we know?", text: card.tokConnection } : null,
    card.interdisciplinary ? { icon: "🔗", label: "Across subjects", text: card.interdisciplinary } : null,
  ].filter(Boolean);
  const currentEnrich = enrichments[enrichField % enrichments.length];

  return (
    <div className="min-h-[80vh] flex flex-col px-4 py-4">
      {/* Progress dots */}
      <div className="flex gap-1 justify-center mb-6">
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
              {isCorrect ? (isClose ? "Close enough!" : "Correct!") : "Not quite"}
            </p>

            {/* Correct answer */}
            <p className="text-xl font-bold text-gray-900 text-center mb-4">{card.back}</p>

            {/* Always show explanation */}
            {card.explanation && (
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
