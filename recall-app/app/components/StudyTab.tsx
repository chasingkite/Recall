"use client";

import { useState, useCallback } from "react";
import { SAMPLE_CARDS, StudyCard, MAX_SESSION_SIZE } from "../lib/sample-cards";
import { checkAnswer, sm2Review, qualityFromResult } from "../lib/spaced-repetition";
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

export default function StudyTab() {
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>("all");
  const [cards, setCards] = useState<StudyCard[]>(() => {
    const due = SAMPLE_CARDS.filter((c) => new Date(c.nextReviewAt) <= new Date());
    return due.sort(() => Math.random() - 0.5).slice(0, MAX_SESSION_SIZE);
  });
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

  const startSession = useCallback((subject: SubjectFilter) => {
    setSubjectFilter(subject);
    const due = SAMPLE_CARDS.filter((c) => {
      const isDue = new Date(c.nextReviewAt) <= new Date();
      if (subject === "all") return isDue;
      return isDue && c.subject === subject;
    }).sort(() => Math.random() - 0.5);
    setRemainingDue(Math.max(0, due.length - MAX_SESSION_SIZE));
    setCards(due.slice(0, MAX_SESSION_SIZE));
    setCurrentIndex(0);
    setState("active");
    setUserAnswer("");
    setSelectedChoice(null);
    setCorrectCount(0);
    setHintUsed(false);
    setGaveUp(false);
  }, []);

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
      const quality = qualityFromResult(correct, hintUsed, gaveUp);
      const newState = sm2Review(
        { easiness: currentCard.easiness, interval: currentCard.interval, repetitions: currentCard.repetitions, nextReviewAt: currentCard.nextReviewAt },
        quality
      );
      recordReview(currentCard.subject, correct, quality >= 3 ? 1 : 0);
      setCards((prev) =>
        prev.map((c) =>
          c.id === currentCard.id
            ? { ...c, easiness: newState.easiness, interval: newState.interval, repetitions: newState.repetitions, nextReviewAt: newState.nextReviewAt }
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

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h2>
        <p className="text-sm text-gray-500 mb-6">
          {subjectFilter === "all" ? "No cards are due for review right now." : `No ${subjectFilter} cards due right now.`}
        </p>
        <SubjectPicker current={subjectFilter} onSelect={startSession} />
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
      <SubjectPicker current={subjectFilter} onSelect={startSession} />
      <StudyTimer />
      <ProgressBar current={currentIndex} total={cards.length} correctCount={correctCount} />

      {/* Card */}
      <FlashCard
        flipped={state === "revealed"}
        front={
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SUBJECT_COLORS[currentCard.subject]}`}>
                {currentCard.subject}
              </span>
              <span className="text-xs text-gray-400 capitalize">{currentCard.answerType.replace("-", " ")}</span>
            </div>
            {currentCard.imageUrl && (
              <img src={currentCard.imageUrl} alt="" className="w-full max-w-[180px] h-auto rounded-lg" />
            )}
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center">{currentCard.front}</h2>
              <AudioButton text={currentCard.front} lang={currentCard.audioLang} />
            </div>
            {currentCard.answerType === "fill-blank" && currentCard.blankSentence && (
              <p className="text-sm text-gray-500 italic text-center">{currentCard.blankSentence}</p>
            )}
            {currentCard.answerType === "true-false" && currentCard.trueFalseStatement && (
              <p className="text-sm text-gray-600 text-center border border-gray-200 rounded-lg p-2 bg-gray-50">
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
            <p className="text-lg font-bold text-gray-900 text-center">{currentCard.back}</p>
            {currentCard.imageUrl && (
              <img src={currentCard.imageUrl} alt="" className="w-full max-w-[140px] h-auto rounded-lg" />
            )}
            {!isCorrect && (
              <div className="w-full bg-red-50 border border-red-200 rounded-lg p-2">
                <p className="text-xs font-medium text-red-800 mb-1">Why?</p>
                <p className="text-xs text-red-700">{currentCard.explanation}</p>
              </div>
            )}
            <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-xs font-medium text-blue-800 mb-1">Real-world</p>
              <p className="text-xs text-blue-700">{currentCard.realWorldConnection}</p>
            </div>
            <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-2">
              <p className="text-xs font-medium text-amber-800 mb-1">TOK / How do we know?</p>
              <p className="text-xs text-amber-700">{currentCard.tokConnection}</p>
            </div>
            <div className="w-full bg-purple-50 border border-purple-200 rounded-lg p-2">
              <p className="text-xs font-medium text-purple-800 mb-1">Across subjects</p>
              <p className="text-xs text-purple-700">{currentCard.interdisciplinary}</p>
            </div>
            <div className="w-full bg-green-50 border border-green-200 rounded-lg p-2">
              <p className="text-xs font-medium text-green-800 mb-1">Think deeper</p>
              <p className="text-xs text-green-700 italic">{currentCard.inquiryQuestion}</p>
            </div>
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

function SubjectPicker({ current, onSelect }: { current: SubjectFilter; onSelect: (s: SubjectFilter) => void }) {
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
          {s.key !== "all" && (
            <span className="ml-1 opacity-75">
              ({SAMPLE_CARDS.filter((c) => c.subject === s.key).length})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
