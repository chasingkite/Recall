"use client";

import { useEffect, useState } from "react";
import { loadPoints, getRewards, requestRedemption, approveRedemption, denyRedemption, PointsData, Reward } from "../lib/points";

export default function RewardsTab() {
  const [points, setPoints] = useState<PointsData | null>(null);
  const [rewards] = useState<Reward[]>(getRewards());
  const [parentMode, setParentMode] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const PARENT_PIN = "1234";

  useEffect(() => {
    setPoints(loadPoints());
  }, []);

  function refresh() {
    setPoints(loadPoints());
  }

  function handleRedeem(rewardId: string) {
    const success = requestRedemption(rewardId);
    if (success) refresh();
  }

  function handleApprove(redemptionId: string) {
    approveRedemption(redemptionId);
    refresh();
  }

  function handleDeny(redemptionId: string) {
    denyRedemption(redemptionId);
    refresh();
  }

  function handleParentLogin() {
    if (pinInput === PARENT_PIN) {
      setParentMode(true);
      setPinInput("");
    }
  }

  if (!points) return null;

  const pendingRedemptions = points.redemptions.filter((r) => r.status === "pending");
  const pastRedemptions = points.redemptions.filter((r) => r.status !== "pending").slice(-5).reverse();

  return (
    <div className="w-full">
      {/* Points Balance */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-6 mb-6 text-white text-center">
        <p className="text-sm opacity-90">Your Balance</p>
        <div className="text-4xl font-bold my-1">⭐ {points.balance}</div>
        <p className="text-xs opacity-75">{points.totalEarned} total earned · {points.sessionsCompleted} sessions</p>
      </div>

      {/* Rewards Shop */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Rewards Shop</h2>
      <div className="space-y-3 mb-8">
        {rewards.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{r.name}</p>
              <p className="text-xs text-gray-500">{r.description}</p>
            </div>
            <button
              onClick={() => handleRedeem(r.id)}
              disabled={points.balance < r.cost}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                points.balance >= r.cost
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {r.cost} pts
            </button>
          </div>
        ))}
      </div>

      {/* Pending requests */}
      {pendingRedemptions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pending Approval</h2>
          {pendingRedemptions.map((r) => (
            <div key={r.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.rewardName}</p>
                  <p className="text-xs text-gray-500">
                    Requested {new Date(r.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-200 text-amber-800">Waiting</span>
              </div>
              {parentMode && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleApprove(r.id)} className="flex-1 py-2 rounded-lg bg-green-500 text-white text-xs font-medium">
                    Approve
                  </button>
                  <button onClick={() => handleDeny(r.id)} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-medium">
                    Deny
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {pastRedemptions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">History</h2>
          {pastRedemptions.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-700">{r.rewardName}</p>
                <p className="text-xs text-gray-400">{new Date(r.requestedAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Parent gate */}
      <div className="border-t border-gray-200 pt-4">
        {!parentMode ? (
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">Parent access</p>
            <div className="flex gap-2 justify-center">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleParentLogin()}
                placeholder="PIN"
                className="w-20 px-3 py-2 rounded-lg border border-gray-300 text-sm text-center"
              />
              <button onClick={handleParentLogin} className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 text-xs font-medium">
                Unlock
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-green-600 text-center">Parent mode active — you can approve/deny requests above.</p>
        )}
      </div>
    </div>
  );
}
