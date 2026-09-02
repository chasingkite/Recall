"use client";

import { useEffect, useState } from "react";

interface CelebrationModalProps {
  improvementPct: number;
  onClose: () => void;
}

export default function CelebrationModal({ improvementPct, onClose }: CelebrationModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className={`relative bg-white rounded-3xl p-8 mx-6 max-w-sm text-center shadow-2xl transform transition-transform duration-300 ${
          visible ? "scale-100" : "scale-90"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti dots */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ["#f59e0b", "#10b981", "#6366f1", "#ef4444", "#ec4899"][i % 5],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>

        <div className="text-6xl mb-4">🧠</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Memory Boost!</h2>
        <p className="text-lg font-bold text-indigo-600 mb-2">
          +{Math.round(improvementPct)}% improvement
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Your brain is getting stronger! Consistent review is building real long-term memory.
        </p>
        <p className="text-xs text-amber-600 font-medium mb-4">⭐ +30 pts earned</p>
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 active:scale-95 transition-all"
        >
          Keep going!
        </button>
      </div>
    </div>
  );
}
