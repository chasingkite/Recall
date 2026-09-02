"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import {
  getBalance,
  getRewards,
  redeemReward,
  resolveRedemption,
  getRedemptions,
  Reward,
  PointsData,
} from "../lib/points";

interface RedemptionRecord {
  id: string;
  reward_name: string;
  cost: number;
  status: string;
  requested_at: string;
}

export default function RewardsTab() {
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [streakFreezes, setStreakFreezes] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentMode, setParentMode] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const PARENT_PIN = "1234";

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const [balanceData, rewardsData, redemptionsData] = await Promise.all([
      getBalance(user.id),
      getRewards(),
      getRedemptions(user.id),
    ]);

    setBalance(balanceData.balance);
    setTotalEarned(balanceData.total_earned);
    setStreakFreezes(balanceData.streak_freezes);
    setRewards(rewardsData.rewards);
    setRedemptions(redemptionsData);
    setLoading(false);
  }

  async function handleRedeem(rewardId: string) {
    if (!userId || redeeming) return;
    setRedeeming(rewardId);
    const result = await redeemReward(userId, rewardId);
    if (result.error) {
      alert(result.error);
    }
    await loadData();
    setRedeeming(null);
  }

  async function handleResolve(redemptionId: string, action: "approve" | "deny") {
    if (!userId) return;
    await resolveRedemption(userId, redemptionId, action);
    await loadData();
  }

  function handleParentLogin() {
    if (pinInput === PARENT_PIN) {
      setParentMode(true);
      setPinInput("");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-6 w-6 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const pendingRedemptions = redemptions.filter((r) => r.status === "pending");
  const pastRedemptions = redemptions.filter((r) => r.status !== "pending").slice(0, 10);

  return (
    <div className="w-full">
      {/* Points Balance */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-6 mb-6 text-white text-center">
        <p className="text-sm opacity-90">Your Balance</p>
        <div className="text-4xl font-bold my-1">⭐ {balance}</div>
        <p className="text-xs opacity-75">{totalEarned} total earned</p>
        {streakFreezes > 0 && (
          <p className="text-xs opacity-75 mt-1">🛡️ {streakFreezes} streak freeze{streakFreezes > 1 ? "s" : ""}</p>
        )}
      </div>

      {/* How to Earn */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-3">
        <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">How to Earn Points</h3>
        <div className="space-y-1 text-xs text-blue-600">
          <div className="flex justify-between"><span>Complete a session (5 cards)</span><span className="font-medium">+10 pts</span></div>
          <div className="flex justify-between"><span>Daily goal (20 cards mastered)</span><span className="font-medium">+50 pts</span></div>
          <div className="flex justify-between"><span>Session accuracy ≥ 80%</span><span className="font-medium">+5 pts</span></div>
          <div className="flex justify-between"><span>Daily accuracy ≥ 80%</span><span className="font-medium">+15 pts</span></div>
          <div className="flex justify-between"><span>7-day streak milestone</span><span className="font-medium">+25 pts</span></div>
          <div className="flex justify-between"><span>Memory +20% improvement</span><span className="font-medium">+30 pts</span></div>
        </div>
      </div>

      {/* Rewards Shop */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Rewards Shop</h2>
      <div className="space-y-3 mb-8">
        {rewards.map((r) => {
          const isFreeze = r.id === "r5";
          const freezeMaxed = isFreeze && streakFreezes >= 2;

          return (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-500">{r.description}</p>
                {freezeMaxed && <p className="text-xs text-amber-600 mt-0.5">Max owned (2/2)</p>}
              </div>
              <button
                onClick={() => handleRedeem(r.id)}
                disabled={balance < r.cost || freezeMaxed || redeeming === r.id}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  balance >= r.cost && !freezeMaxed
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {redeeming === r.id ? "..." : `${r.cost} pts`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Pending requests */}
      {pendingRedemptions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pending Approval</h2>
          {pendingRedemptions.map((r) => (
            <div key={r.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.reward_name}</p>
                  <p className="text-xs text-gray-500">
                    Requested {new Date(r.requested_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-200 text-amber-800">Waiting</span>
              </div>
              {parentMode && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleResolve(r.id, "approve")} className="flex-1 py-2 rounded-lg bg-green-500 text-white text-xs font-medium">
                    Approve
                  </button>
                  <button onClick={() => handleResolve(r.id, "deny")} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-medium">
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
                <p className="text-sm text-gray-700">{r.reward_name}</p>
                <p className="text-xs text-gray-400">{new Date(r.requested_at).toLocaleDateString()}</p>
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
