"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "../lib/supabase/client";
import { SAMPLE_CARDS, StudyCard, MAX_SESSION_SIZE } from "../lib/sample-cards";
import { checkAnswer, fsrsReview, actionToRating } from "../lib/spaced-repetition";
import { recordReview, recordSessionComplete } from "../lib/study-stats";
import FlashCard from "./study/FlashCard";
import AudioButton from "./study/AudioButton";
import ProgressBar from "./study/ProgressBar";
import SessionComplete from "./study/SessionComplete";
import StudyTimer from "./study/StudyTimer";

const SUBJECT_COLORS: Record<string, string> = {
  spanish: "bg-orange-100 text-orange-700",
  biology: "bg-green-100 text-green-700",
  english: "bg-purple-100 text-purple-700",
  math: "bg-blue-100 text-blue-700",
};

type SessionState = "active" | "revealed" | "complete";
type SubjectFilter = "all" | "spanish" | "biology" | "english" | "math";

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
  decks: { subject: string } | null;
}

function dbCardToStudyCard(c: DBCard): StudyCard {
  return {
    id: c.id,
    front: c.front,
    back: c.back,
    answerType: (c.answer_type || "type") as StudyCard["answerType"],
    explanation: c.explanation || "",
    realWorldConnection: c.real_world_connection || "",
    tokConnection: c.tok_connection || "",
    interdisciplinary: c.interdisciplinary || "",
    inquiryQuestion: c.inquiry_question || "",
    exampleSentence: c.example_sentence || undefined,
    imageUrl: c.image_url || undefined,
    audioLang: c.audio_lang || "en-US",
    subject: (c.decks?.subject || "english") as StudyCard["subject"],
    easiness: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewAt: new Date(),
  };
}

function assignAnswerVariety(cards: StudyCard[], allCards: StudyCard[]): StudyCard[] {
  return cards.map((card, i) => {
    // Cards that already have a non-default answer type WITH choices keep them
    if (card.answerType === "multiple-choice" && card.choices && card.choices.length > 0) return card;
    if (card.answerType === "true-false" && card.trueFalseStatement) return card;
    if (card.answerType === "fill-blank" && card.blankSentence) return card;

    // For cards marked as MC but missing choices, or all "type" cards — assign variety
    const roll = i % 5;

    if (roll === 0) {
      // Reverse card: only for Spanish (show English, ask for Spanish word)
      if (card.subject === "spanish") {
        return {
          ...card,
          answerType: "type" as const,
          front: `What is the Spanish word for: "${card.back}"?`,
          back: card.front,
        };
      }
      // Non-Spanish: just use standard type-in
      return card;
    }

    if (roll === 1) {
      // Multiple choice: use other cards as distractors (ALL subjects)
      const distractors = allCards
        .filter((c) => c.id !== card.id && c.subject === card.subject)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((c) => c.back);
      if (distractors.length >= 3) {
        const choices = [...distractors, card.back].sort(() => Math.random() - 0.5);
        return { ...card, answerType: "multiple-choice" as const, choices };
      }
      return card;
    }

    if (roll === 2 && card.back.length > 2) {
      // Fill in the blank: show first letter + blanks
      return {
        ...card,
        answerType: "fill-blank" as const,
        blankSentence: `The answer starts with "${card.back[0]}" and has ${card.back.length} letters.`,
      };
    }

    if (roll === 3) {
      // True/false: works for all subjects with different phrasing
      const isTrue = Math.random() > 0.5;
      if (isTrue) {
        const statement = card.subject === "spanish"
          ? `"${card.front}" means "${card.back}"`
          : `The answer to "${card.front.slice(0, 60)}" is "${card.back.slice(0, 60)}"`;
        return {
          ...card,
          answerType: "true-false" as const,
          trueFalseStatement: statement,
          trueFalseAnswer: true,
          back: "true",
        };
      } else {
        const wrongAnswer = allCards
          .filter((c) => c.id !== card.id && c.subject === card.subject)
          .sort(() => Math.random() - 0.5)[0];
        if (wrongAnswer) {
          const statement = card.subject === "spanish"
            ? `"${card.front}" means "${wrongAnswer.back}"`
            : `The answer to "${card.front.slice(0, 60)}" is "${wrongAnswer.back.slice(0, 60)}"`;
          return {
            ...card,
            answerType: "true-false" as const,
            trueFalseStatement: statement,
            trueFalseAnswer: false,
            back: "false",
          };
        }
      }
      return card;
    }

    // roll === 4: standard type-in (hardest, pure active recall)
    return card;
  });
}

export default function StudyTab() {
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>("all");
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [state, setState] = useState<SessionState>("active");
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [isClose, setIsClose] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [remainingDue, setRemainingDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cardCounts, setCardCounts] = useState<Record<string, number>>({});
  const supabase = createClient();

  const loadCards = useCallback(async (subject: SubjectFilter) => {
    setLoading(true);

    // Fetch card counts per subject
    const { data: allCardsForCounts } = await supabase
      .from("cards")
      .select("decks(subject)");
    if (allCardsForCounts) {
      const counts: Record<string, number> = { all: allCardsForCounts.length };
      for (const c of allCardsForCounts) {
        const s = (c as unknown as { decks: { subject: string } | null }).decks?.subject;
        if (s) counts[s] = (counts[s] || 0) + 1;
      }
      setCardCounts(counts);
    }

    let query = supabase
      .from("cards")
      .select("*, decks(subject)")
      .order("created_at");

    if (subject !== "all") {
      query = supabase
        .from("cards")
        .select("*, decks!inner(subject)")
        .eq("decks.subject", subject)
        .order("created_at");
    }

    const { data } = await query;

    let studyCards: StudyCard[];
    if (data && data.length > 0) {
      studyCards = (data as DBCard[]).map(dbCardToStudyCard);
    } else {
      // Fallback to hardcoded cards if Supabase is empty
      studyCards = SAMPLE_CARDS.filter((c) => {
        if (subject === "all") return true;
        return c.subject === subject;
      });
    }

    const shuffled = studyCards.sort(() => Math.random() - 0.5);
    const sessionCards = shuffled.slice(0, MAX_SESSION_SIZE);
    const varied = assignAnswerVariety(sessionCards, studyCards);
    setRemainingDue(Math.max(0, shuffled.length - MAX_SESSION_SIZE));
    setCards(varied);
    setCurrentIndex(0);
    setState("active");
    setUserAnswer("");
    setSelectedChoice(null);
    setCorrectCount(0);
    setHintUsed(false);
    setGaveUp(false);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadCards("all");
  }, [loadCards]);

  const startSession = useCallback((subject: SubjectFilter) => {
    setSubjectFilter(subject);
    loadCards(subject);
  }, [loadCards]);

  const currentCard = cards[currentIndex];

  const handleSubmitAnswer = useCallback(
    (answer: string) => {
      if (!currentCard) return;
      setUserAnswer(answer);
      const result = checkAnswer(answer, currentCard.back);
      setIsCorrect(result.correct);
      setIsClose(result.close);
      setState("revealed");
    },
    [currentCard]
  );

  const handleMultipleChoice = useCallback(
    (choice: string) => {
      if (!currentCard) return;
      setSelectedChoice(choice);
      setUserAnswer(choice);
      const correct = choice === currentCard.back;
      setIsCorrect(correct);
      setIsClose(false);
      setState("revealed");
    },
    [currentCard]
  );

  const handleTrueFalse = useCallback(
    (answer: boolean) => {
      if (!currentCard) return;
      const correct = answer === currentCard.trueFalseAnswer;
      setUserAnswer(answer ? "True" : "False");
      setIsCorrect(correct);
      setIsClose(false);
      setState("revealed");
    },
    [currentCard]
  );

  const handleFillBlank = useCallback(
    (answer: string) => {
      if (!currentCard) return;
      setUserAnswer(answer);
      const result = checkAnswer(answer, currentCard.back);
      setIsCorrect(result.correct);
      setIsClose(result.close);
      setState("revealed");
    },
    [currentCard]
  );

  const handleGiveUp = useCallback(() => {
    if (!currentCard) return;
    setUserAnswer("");
    setIsCorrect(false);
    setIsClose(false);
    setGaveUp(true);
    setState("revealed");
  }, [currentCard]);

  const handleRate = useCallback(
    (correct: boolean) => {
      if (!currentCard) return;
      const rating = actionToRating(correct, hintUsed, gaveUp);
      const newState = fsrsReview(
        { stability: currentCard.easiness, difficulty: 5.0, lastReviewAt: new Date(), nextReviewAt: currentCard.nextReviewAt, reps: currentCard.repetitions },
        rating
      );
      recordReview(currentCard.subject, correct, rating >= 3 ? 1 : 0);
      setCards((prev) =>
        prev.map((c) =>
          c.id === currentCard.id
            ? { ...c, easiness: newState.stability, interval: Math.round(newState.stability), repetitions: newState.reps, nextReviewAt: newState.nextReviewAt }
            : c
        )
      );
      if (correct) setCorrectCount((c) => c + 1);

      if (currentIndex + 1 >= cards.length) {
        recordSessionComplete();
        setState("complete");
      } else {
        setCurrentIndex((i) => i + 1);
        setState("active");
        setUserAnswer("");
        setSelectedChoice(null);
        setHintUsed(false);
        setGaveUp(false);
      }
    },
    [currentCard, currentIndex, cards.length, hintUsed, gaveUp]
  );

  const handleRestart = useCallback(() => {
    startSession(subjectFilter);
  }, [startSession, subjectFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h2>
        <p className="text-sm text-gray-500 mb-6">
          {subjectFilter === "all" ? "No cards are due for review right now." : `No ${subjectFilter} cards due right now.`}
        </p>
        <SubjectPicker current={subjectFilter} onSelect={startSession} cardCounts={cardCounts} />
      </div>
    );
  }

  if (state === "complete") {
    return (
      <div>
        <SessionComplete total={cards.length} correctCount={correctCount} onRestart={handleRestart} />
        {remainingDue > 0 && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500 mb-2">{remainingDue} more cards still due</p>
            <button
              onClick={handleRestart}
              className="px-4 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              Continue studying →
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <SubjectPicker current={subjectFilter} onSelect={startSession} cardCounts={cardCounts} />
      <StudyTimer />
      <ProgressBar current={currentIndex} total={cards.length} correctCount={correctCount} />

      {/* Card */}
      <FlashCard
        flipped={state === "revealed"}
        front={
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SUBJECT_COLORS[currentCard.subject] || "bg-gray-100 text-gray-700"}`}>
                {currentCard.subject}
              </span>
              <span className="text-xs text-gray-400 capitalize">{currentCard.answerType.replace("-", " ")}</span>
            </div>
            {currentCard.imageUrl && (
              <img src={currentCard.imageUrl} alt="" className="w-full max-w-[180px] h-auto rounded-lg" />
            )}
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">{currentCard.front}</h2>
              {currentCard.subject === "spanish" && <AudioButton text={currentCard.front} lang={currentCard.audioLang} />}
            </div>
            {currentCard.answerType === "fill-blank" && currentCard.blankSentence && (
              <p className="text-base text-gray-500 italic text-center">{currentCard.blankSentence}</p>
            )}
            {currentCard.answerType === "true-false" && currentCard.trueFalseStatement && (
              <p className="text-base text-gray-600 text-center border border-gray-200 rounded-lg p-3 bg-gray-50">
                &ldquo;{currentCard.trueFalseStatement}&rdquo;
              </p>
            )}
          </div>
        }
        back={
          <div className="flex flex-col items-center gap-2 w-full">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {isCorrect ? (isClose ? "Close enough!" : "Correct!") : "Incorrect"}
            </span>
            <p className="text-xl font-bold text-gray-900 text-center">{currentCard.back}</p>
            {currentCard.imageUrl && (
              <img src={currentCard.imageUrl} alt="" className="w-full max-w-[140px] h-auto rounded-lg" />
            )}
            {!isCorrect && currentCard.explanation && (
              <div className="w-full bg-red-50 border border-red-200 rounded-lg p-2">
                <p className="text-xs font-medium text-red-800 mb-1">Why?</p>
                <p className="text-xs text-red-700">{currentCard.explanation}</p>
              </div>
            )}
            {currentCard.realWorldConnection && (
              <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-xs font-medium text-blue-800 mb-1">Real-world</p>
                <p className="text-xs text-blue-700">{currentCard.realWorldConnection}</p>
              </div>
            )}
            {currentCard.tokConnection && (
              <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-2">
                <p className="text-xs font-medium text-amber-800 mb-1">TOK / How do we know?</p>
                <p className="text-xs text-amber-700">{currentCard.tokConnection}</p>
              </div>
            )}
            {currentCard.interdisciplinary && (
              <div className="w-full bg-purple-50 border border-purple-200 rounded-lg p-2">
                <p className="text-xs font-medium text-purple-800 mb-1">Across subjects</p>
                <p className="text-xs text-purple-700">{currentCard.interdisciplinary}</p>
              </div>
            )}
            {currentCard.inquiryQuestion && (
              <div className="w-full bg-green-50 border border-green-200 rounded-lg p-2">
                <p className="text-xs font-medium text-green-800 mb-1">Think deeper</p>
                <p className="text-xs text-green-700 italic">{currentCard.inquiryQuestion}</p>
              </div>
            )}
          </div>
        }
      />

      {/* Answer Input Area */}
      <div className="w-full mt-6">
        {state === "active" && currentCard.answerType === "type" && (
          <TypeInput
            onSubmit={handleSubmitAnswer}
            onGiveUp={handleGiveUp}
            onHintUsed={() => setHintUsed(true)}
            hint={currentCard.back.slice(0, Math.ceil(currentCard.back.length / 3)) + "..."}
          />
        )}
        {state === "active" && currentCard.answerType === "fill-blank" && (
          <TypeInput
            onSubmit={handleFillBlank}
            onGiveUp={handleGiveUp}
            onHintUsed={() => setHintUsed(true)}
            hint={currentCard.back[0] + "_".repeat(currentCard.back.length - 1)}
            placeholder="Fill in the blank..."
          />
        )}
        {state === "active" && currentCard.answerType === "multiple-choice" && currentCard.choices && (
          <div className="grid grid-cols-1 gap-2">
            {currentCard.choices.map((choice) => (
              <button
                key={choice}
                onClick={() => handleMultipleChoice(choice)}
                className="w-full py-3 px-4 rounded-lg border border-gray-300 bg-white text-sm text-left text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                {choice}
              </button>
            ))}
          </div>
        )}
        {state === "active" && currentCard.answerType === "true-false" && (
          <div className="flex gap-3">
            <button
              onClick={() => handleTrueFalse(true)}
              className="flex-1 py-3 rounded-lg border-2 border-green-200 bg-green-50 text-green-700 font-medium hover:bg-green-100 transition-colors"
            >
              True
            </button>
            <button
              onClick={() => handleTrueFalse(false)}
              className="flex-1 py-3 rounded-lg border-2 border-red-200 bg-red-50 text-red-700 font-medium hover:bg-red-100 transition-colors"
            >
              False
            </button>
          </div>
        )}

        {/* Revealed: auto-graded, just show Next */}
        {state === "revealed" && (
          <div className="w-full mt-2">
            <button
              onClick={() => handleRate(isCorrect)}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                isCorrect
                  ? "border-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                  : "border-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              {isCorrect ? "Correct! Next →" : "Missed — Next →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TypeInput({ onSubmit, onGiveUp, onHintUsed, hint, placeholder }: { onSubmit: (v: string) => void; onGiveUp?: () => void; onHintUsed?: () => void; hint?: string; placeholder?: string }) {
  const [value, setValue] = useState("");
  const [showHint, setShowHint] = useState(false);
  return (
    <div className="w-full">
      <div className="flex gap-2 w-full">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) { onSubmit(value); setValue(""); } }}
          placeholder={placeholder || "Type your answer..."}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
          autoFocus
        />
        <button
          onClick={() => { if (value.trim()) { onSubmit(value); setValue(""); } }}
          disabled={!value.trim()}
          className="px-5 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Check
        </button>
      </div>
      <div className="flex gap-2 mt-2">
        {hint && (
          <button
            onClick={() => { setShowHint(true); onHintUsed?.(); }}
            className="flex-1 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
          >
            {showHint ? `Hint: ${hint}` : "Show Hint 💡"}
          </button>
        )}
        {onGiveUp && (
          <button
            onClick={onGiveUp}
            className="flex-1 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-colors"
          >
            I don&apos;t know 🤷
          </button>
        )}
      </div>
    </div>
  );
}

const SUBJECT_OPTIONS: { key: SubjectFilter; label: string; color: string }[] = [
  { key: "all", label: "All Subjects", color: "bg-gray-900 text-white border-gray-900" },
  { key: "spanish", label: "Spanish", color: "bg-orange-500 text-white border-orange-500" },
  { key: "biology", label: "Biology", color: "bg-green-500 text-white border-green-500" },
  { key: "english", label: "English", color: "bg-purple-500 text-white border-purple-500" },
  { key: "math", label: "Math", color: "bg-blue-500 text-white border-blue-500" },
];

function SubjectPicker({ current, onSelect, cardCounts }: { current: SubjectFilter; onSelect: (s: SubjectFilter) => void; cardCounts?: Record<string, number> }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-3 mb-3 w-full scrollbar-hide">
      {SUBJECT_OPTIONS.map((s) => (
        <button
          key={s.key}
          onClick={() => onSelect(s.key)}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            current === s.key ? s.color : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          {s.label}
          {cardCounts && cardCounts[s.key] !== undefined && (
            <span className="ml-1 opacity-75">({cardCounts[s.key]})</span>
          )}
        </button>
      ))}
    </div>
  );
}
