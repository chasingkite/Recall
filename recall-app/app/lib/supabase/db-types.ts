export interface DailyProgress {
  id: string;
  user_id: string;
  date: string;
  cards_reviewed: number;
  cards_correct: number;
  goal_met: boolean;
  created_at: string;
  updated_at: string;
}

export interface CardReview {
  id: string;
  user_id: string;
  card_id: string;
  stability: number;
  difficulty: number;
  last_review_at: string;
  next_review_at: string;
  reps: number;
  created_at: string;
  updated_at: string;
}

export interface MemoryScore {
  id: string;
  user_id: string;
  date: string;
  avg_retrievability: number;
  cards_measured: number;
  improvement_pct: number;
  celebration_triggered: boolean;
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_goal_met_date: string | null;
  streak_freezes_owned: number;
  freeze_used_date: string | null;
  updated_at: string;
}

export interface PointsLedger {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  created_at: string;
  updated_at: string;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Redemption {
  id: string;
  user_id: string;
  reward_id: string;
  reward_name: string;
  cost: number;
  status: "pending" | "approved" | "denied";
  requested_at: string;
  resolved_at: string | null;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface TopicLevel {
  id: string;
  user_id: string;
  topic: string;
  current_level: number;
  cards_at_level: number;
  cards_correct_at_level: number;
  created_at: string;
  updated_at: string;
}

export const DAILY_GOAL_CARDS = 20;
export const MASTERY_CELEBRATION_THRESHOLD = 0.20;

export const DIFFICULTY_LEVELS = [
  { level: 1, name: "Beginner", description: "Basic recall — definitions, simple facts" },
  { level: 2, name: "Familiar", description: "Application — when do you use X?" },
  { level: 3, name: "Competent", description: "Connections — interdisciplinary, compare/contrast" },
  { level: 4, name: "Proficient", description: "Analysis — why does X work? Edge cases" },
  { level: 5, name: "Expert", description: "Synthesis — teach it, create examples, predict outcomes" },
] as const;

export const LEVEL_UP_THRESHOLD = 0.80;
export const LEVEL_UP_MIN_CARDS = 10;
