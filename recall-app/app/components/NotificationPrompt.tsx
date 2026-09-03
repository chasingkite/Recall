"use client";

import { useState, useEffect } from "react";
import { isPushSupported, getPermissionState, subscribeToPush, isInstalledPWA } from "../lib/push-notifications";

export default function NotificationPrompt({ userId }: { userId: string }) {
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [needsPWA, setNeedsPWA] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;

    const permission = getPermissionState();
    if (permission === "granted" || permission === "denied") return;

    const dismissed = localStorage.getItem("push_prompt_dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !isInstalledPWA()) {
      setNeedsPWA(true);
    }

    setShow(true);
  }, []);

  if (!show) return null;

  async function handleEnable() {
    setSubscribing(true);
    const success = await subscribeToPush(userId);
    setSubscribing(false);
    if (success) setShow(false);
  }

  function handleDismiss() {
    localStorage.setItem("push_prompt_dismissed", String(Date.now()));
    setShow(false);
  }

  return (
    <div className="mx-4 mb-3 rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔔</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Get daily study reminders</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {needsPWA
              ? "Add Recall to your home screen first, then enable notifications."
              : "Never miss your streak — we'll remind you when it's time to study."}
          </p>
          <div className="flex gap-2 mt-3">
            {needsPWA ? (
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium"
              >
                Got it
              </button>
            ) : (
              <>
                <button
                  onClick={handleEnable}
                  disabled={subscribing}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {subscribing ? "Enabling..." : "Enable"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium"
                >
                  Not now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
