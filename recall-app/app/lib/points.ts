export interface Reward {
  id: string;
  name: string;
  cost: number;
  description: string;
}

export interface PointsData {
  balance: number;
  total_earned: number;
  streak_freezes: number;
}

export interface PointsConfig {
  SESSION_COMPLETE: number;
  DAILY_GOAL: number;
  SESSION_ACCURACY_BONUS: number;
  DAILY_ACCURACY_BONUS: number;
  STREAK_MILESTONE: number;
  MEMORY_IMPROVEMENT: number;
  ACCURACY_THRESHOLD: number;
  MAX_STREAK_FREEZES: number;
}

export async function getBalance(userId: string): Promise<PointsData> {
  const res = await fetch(`/api/points?userId=${userId}&action=balance`);
  const data = await res.json();
  return {
    balance: data.balance || 0,
    total_earned: data.total_earned || 0,
    streak_freezes: data.streak_freezes || 0,
  };
}

export async function getRewards(): Promise<{ rewards: Reward[]; config: PointsConfig }> {
  const res = await fetch(`/api/points?action=rewards&userId=_`);
  return res.json();
}

export async function earnPoints(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<{ balance: number; earned: number }> {
  const res = await fetch("/api/points", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, action: "earn", amount, reason, metadata }),
  });
  return res.json();
}

export async function redeemReward(
  userId: string,
  rewardId: string
): Promise<{ balance: number; redeemed?: string; error?: string }> {
  const res = await fetch("/api/points", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, action: "redeem", rewardId }),
  });
  return res.json();
}

export async function resolveRedemption(
  userId: string,
  redemptionId: string,
  action: "approve" | "deny"
): Promise<{ status: string }> {
  const res = await fetch("/api/points", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, action, redemptionId }),
  });
  return res.json();
}

export async function getRedemptions(
  userId: string
): Promise<{ id: string; reward_name: string; cost: number; status: string; requested_at: string }[]> {
  const res = await fetch(`/api/points?userId=${userId}&action=redemptions`);
  const data = await res.json();
  return data.redemptions || [];
}

export async function earnSessionPoints(
  userId: string,
  accuracy: number
): Promise<{ earned: number; bonuses: string[] }> {
  let total = 0;
  const bonuses: string[] = [];

  // Base session points
  const base = 10;
  total += base;
  await earnPoints(userId, base, "session_complete");

  // Accuracy bonus
  if (accuracy >= 0.8) {
    total += 5;
    bonuses.push(`+5 accuracy bonus (${Math.round(accuracy * 100)}%)`);
    await earnPoints(userId, 5, "session_accuracy", { accuracy });
  }

  return { earned: total, bonuses };
}

// Clear legacy localStorage data
export function clearLegacyData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("recall-points");
  localStorage.removeItem("recall-study-stats");
}
