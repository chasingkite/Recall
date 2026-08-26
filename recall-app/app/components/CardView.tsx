"use client";

import { useState } from "react";
import AudioButton from "./study/AudioButton";

interface CardViewProps {
  front: string;
  back: string;
  subject: string;
  imageUrl?: string | null;
  audioLang?: string | null;
  answerType: string;
  choices?: string[] | null;
  explanation?: string | null;
  realWorldConnection?: string | null;
  tokConnection?: string | null;
  interdisciplinary?: string | null;
  inquiryQuestion?: string | null;
  flipped: boolean;
  onFlip?: () => void;
  // For active input (study mode)
  showInput?: boolean;
  onSubmitAnswer?: (answer: string) => void;
  onMultipleChoice?: (choice: string) => void;
  onTrueFalse?: (answer: boolean) => void;
  onGiveUp?: () => void;
  onHintUsed?: () => void;
  // Result state (after answering)
  isCorrect?: boolean;
  isClose?: boolean;
}

const SUBJECT_COLORS: Record<string, string> = {
  spanish: "bg-orange-100 text-orange-700",
  biology: "bg-green-100 text-green-700",
  english: "bg-purple-100 text-purple-700",
  math: "bg-blue-100 text-blue-700",
};

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

export default function CardView({
  front, back, subject, imageUrl, audioLang, answerType, choices,
  explanation, realWorldConnection, tokConnection, interdisciplinary, inquiryQuestion,
  flipped, onFlip, showInput, onSubmitAnswer, onMultipleChoice, onTrueFalse, onGiveUp, onHintUsed,
  isCorrect, isClose,
}: CardViewProps) {

  if (!flipped) {
    return (
      <div className="w-full">
        {/* Card Front */}
        <div
          onClick={onFlip}
          className="w-full rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col items-center justify-center min-h-[200px] cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SUBJECT_COLORS[subject] || "bg-gray-100 text-gray-700"}`}>
              {subject}
            </span>
            <span className="text-xs text-gray-400 capitalize">{answerType.replace("-", " ")}</span>
          </div>
          {imageUrl && <img src={imageUrl} alt="" className="w-full max-w-[180px] h-auto rounded-lg mb-3" />}
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">{front}</h2>
            {subject === "spanish" && audioLang && <AudioButton text={front} lang={audioLang} />}
          </div>
        </div>

        {/* Answer Input Area */}
        {showInput && (
          <div className="w-full mt-4">
            {answerType === "multiple-choice" && choices && choices.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {choices.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => onMultipleChoice?.(choice)}
                    className="w-full py-3 px-4 rounded-lg border border-gray-300 bg-white text-sm text-left text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}
            {answerType === "true-false" && (
              <div className="flex gap-3">
                <button onClick={() => onTrueFalse?.(true)} className="flex-1 py-3 rounded-lg border-2 border-green-200 bg-green-50 text-green-700 font-medium hover:bg-green-100">True</button>
                <button onClick={() => onTrueFalse?.(false)} className="flex-1 py-3 rounded-lg border-2 border-red-200 bg-red-50 text-red-700 font-medium hover:bg-red-100">False</button>
              </div>
            )}
            {(answerType === "type" || answerType === "fill-blank") && (
              <TypeInput
                onSubmit={(v) => onSubmitAnswer?.(v)}
                onGiveUp={onGiveUp}
                onHintUsed={onHintUsed}
                hint={back.slice(0, Math.ceil(back.length / 3)) + "..."}
                placeholder={answerType === "fill-blank" ? "Fill in the blank..." : "Type your answer..."}
              />
            )}
          </div>
        )}

        {/* Static preview (auditor mode — no input, just show format) */}
        {!showInput && answerType === "multiple-choice" && choices && choices.length > 0 && (
          <div className="grid grid-cols-1 gap-2 mt-4">
            {choices.map((choice) => (
              <div
                key={choice}
                className={`w-full py-3 px-4 rounded-lg border text-sm ${choice === back ? "border-green-300 bg-green-50 text-green-800 font-medium" : "border-gray-200 bg-white text-gray-700"}`}
              >
                {choice} {choice === back && <span className="text-xs text-green-600 ml-1">✓</span>}
              </div>
            ))}
          </div>
        )}
        {!showInput && answerType === "true-false" && (
          <div className="flex gap-3 mt-4">
            <div className="flex-1 py-3 rounded-lg border-2 border-green-200 bg-green-50 text-green-700 font-medium text-center text-sm">True</div>
            <div className="flex-1 py-3 rounded-lg border-2 border-red-200 bg-red-50 text-red-700 font-medium text-center text-sm">False</div>
          </div>
        )}
        {!showInput && (answerType === "type" || answerType === "fill-blank") && (
          <div className="mt-4 flex gap-2">
            <div className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-400">
              {answerType === "fill-blank" ? "Fill in the blank..." : "Type your answer..."}
            </div>
            <div className="px-5 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium opacity-50">Check</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col items-center gap-3">
      {isCorrect !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {isCorrect ? (isClose ? "Close enough!" : "Correct!") : "Incorrect"}
        </span>
      )}
      <p className="text-xl font-bold text-gray-900 text-center">{back}</p>
      {imageUrl && <img src={imageUrl} alt="" className="w-full max-w-[140px] h-auto rounded-lg" />}
      {(!isCorrect && isCorrect !== undefined) && explanation && (
        <div className="w-full bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-xs font-medium text-red-800 mb-1">Why?</p>
          <p className="text-xs text-red-700">{explanation}</p>
        </div>
      )}
      {realWorldConnection && (
        <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2">
          <p className="text-xs font-medium text-blue-800 mb-1">Real-world</p>
          <p className="text-xs text-blue-700">{realWorldConnection}</p>
        </div>
      )}
      {tokConnection && (
        <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-2">
          <p className="text-xs font-medium text-amber-800 mb-1">TOK / How do we know?</p>
          <p className="text-xs text-amber-700">{tokConnection}</p>
        </div>
      )}
      {interdisciplinary && (
        <div className="w-full bg-purple-50 border border-purple-200 rounded-lg p-2">
          <p className="text-xs font-medium text-purple-800 mb-1">Across subjects</p>
          <p className="text-xs text-purple-700">{interdisciplinary}</p>
        </div>
      )}
      {inquiryQuestion && (
        <div className="w-full bg-green-50 border border-green-200 rounded-lg p-2">
          <p className="text-xs font-medium text-green-800 mb-1">Think deeper</p>
          <p className="text-xs text-green-700 italic">{inquiryQuestion}</p>
        </div>
      )}
    </div>
  );
}
