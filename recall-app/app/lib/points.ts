export interface Reward {
  id: string;
  name: string;
  cost: number;
  description: string;
}

export interface RedemptionRequest {
  id: string;
  rewardId: string;
  rewardName: string;
  cost: number;
  requestedAt: string;
  status: "pending" | "approved" | "denied";
  approvedAt?: string;
}

export interface PointsData {
  balance: number;
  totalEarned: number;
  sessionsCompleted: number;
  redemptions: RedemptionRequest[];
}

const STORAGE_KEY = "recall-points";

const REWARDS: Reward[] = [
  { id: "r1", name: "15 min Game Time", cost: 100, description: "Play your favorite game for 15 minutes" },
  { id: "r2", name: "30 min Game Time", cost: 250, description: "A solid gaming session — 30 minutes" },
  { id: "r3", name: "1 hour Game Time", cost: 500, description: "A full hour of uninterrupted gaming" },
  { id: "r4", name: "Movie Night Pick", cost: 750, description: "You pick the movie for family movie night" },
];

const SESSION_POINTS = 50;
const ACCURACY_BONUS_THRESHOLD = 0.8;
const ACCURACY_BONUS = 25;
const STREAK_BONUS_DAYS = 3;
const STREAK_BONUS = 50;

export function getRewards(): Reward[] {
  return REWARDS;
}

export function loadPoints(): PointsData {
  if (typeof window === "undefined") return { balance: 0, totalEarned: 0, sessionsCompleted: 0, redemptions: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { balance: 0, totalEarned: 0, sessionsCompleted: 0, redemptions: [] };
    return JSON.parse(raw);
  } catch {
    return { balance: 0, totalEarned: 0, sessionsCompleted: 0, redemptions: [] };
  }
}

function savePoints(data: PointsData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function earnSessionPoints(accuracy: number): { earned: number; bonus: string[] } {
  const data = loadPoints();
  let earned = SESSION_POINTS;
  const bonuses: string[] = [];

  if (accuracy >= ACCURACY_BONUS_THRESHOLD) {
    earned += ACCURACY_BONUS;
    bonuses.push(`+${ACCURACY_BONUS} accuracy bonus (${Math.round(accuracy * 100)}%)`);
  }

  data.sessionsCompleted++;

  if (data.sessionsCompleted % STREAK_BONUS_DAYS === 0) {
    earned += STREAK_BONUS;
    bonuses.push(`+${STREAK_BONUS} streak bonus (${data.sessionsCompleted} sessions!)`);
  }

  data.balance += earned;
  data.totalEarned += earned;
  savePoints(data);

  return { earned, bonus: bonuses };
}

export function requestRedemption(rewardId: string): boolean {
  const data = loadPoints();
  const reward = REWARDS.find((r) => r.id === rewardId);
  if (!reward || data.balance < reward.cost) return false;

  data.balance -= reward.cost;
  data.redemptions.push({
    id: `red_${Date.now()}`,
    rewardId: reward.id,
    rewardName: reward.name,
    cost: reward.cost,
    requestedAt: new Date().toISOString(),
    status: "pending",
  });
  savePoints(data);
  return true;
}

export function approveRedemption(redemptionId: string) {
  const data = loadPoints();
  const r = data.redemptions.find((x) => x.id === redemptionId);
  if (r) {
    r.status = "approved";
    r.approvedAt = new Date().toISOString();
  }
  savePoints(data);
}

export function denyRedemption(redemptionId: string) {
  const data = loadPoints();
  const r = data.redemptions.find((x) => x.id === redemptionId);
  if (r) {
    r.status = "denied";
    data.balance += r.cost;
  }
  savePoints(data);
}
