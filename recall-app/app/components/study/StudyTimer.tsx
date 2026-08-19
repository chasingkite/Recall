"use client";

import { useState, useEffect, useCallback } from "react";

type TimerMode = "pomodoro" | "extended";
type TimerState = "idle" | "work" | "break";

const TIMER_CONFIGS = {
  pomodoro: { work: 25 * 60, break: 5 * 60, label: "25/5 Pomodoro" },
  extended: { work: 50 * 60, break: 10 * 60, label: "50/10 Extended" },
};

interface StudyTimerProps {
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
}

export default function StudyTimer({ onSessionStart, onSessionEnd }: StudyTimerProps) {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [state, setState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(TIMER_CONFIGS.pomodoro.work);
  const [completedSessions, setCompletedSessions] = useState(0);

  const config = TIMER_CONFIGS[mode];

  useEffect(() => {
    if (state === "idle") return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (state === "work") {
            setState("break");
            setCompletedSessions((c) => c + 1);
            onSessionEnd?.();
            return config.break;
          } else {
            setState("idle");
            return config.work;
          }
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state, config, onSessionEnd]);

  const start = useCallback(() => {
    setState("work");
    setSecondsLeft(config.work);
    onSessionStart?.();
  }, [config, onSessionStart]);

  const pause = useCallback(() => {
    setState("idle");
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setSecondsLeft(config.work);
  }, [config]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setState("idle");
    setSecondsLeft(TIMER_CONFIGS[newMode].work);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalSeconds = state === "break" ? config.break : config.work;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          <button
            onClick={() => switchMode("pomodoro")}
            className={`text-xs px-2.5 py-1 rounded-full ${mode === "pomodoro" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            25/5
          </button>
          <button
            onClick={() => switchMode("extended")}
            className={`text-xs px-2.5 py-1 rounded-full ${mode === "extended" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            50/10
          </button>
        </div>
        {completedSessions > 0 && (
          <span className="text-xs text-gray-500">{completedSessions} session{completedSessions > 1 ? "s" : ""}</span>
        )}
      </div>

      <div className="relative h-2 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${state === "break" ? "bg-green-500" : "bg-blue-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-mono font-bold text-gray-900">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${state === "break" ? "bg-green-100 text-green-700" : state === "work" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
            {state === "break" ? "Break" : state === "work" ? "Focus" : "Ready"}
          </span>
        </div>
        <div className="flex gap-2">
          {state === "idle" ? (
            <button onClick={start} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors">
              Start
            </button>
          ) : (
            <>
              <button onClick={pause} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">
                Pause
              </button>
              <button onClick={reset} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">
                Reset
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
