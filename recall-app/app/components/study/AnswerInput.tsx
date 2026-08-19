"use client";

import { useState, KeyboardEvent } from "react";

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export default function AnswerInput({ onSubmit, disabled }: AnswerInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit() {
    if (!value.trim()) return;
    onSubmit(value);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex gap-2 w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type your answer..."
        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm disabled:opacity-50"
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="px-5 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Check
      </button>
    </div>
  );
}
