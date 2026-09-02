-- ============================================================
-- Recall App: Daily Engagement System — Database Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. daily_progress: tracks cards mastered per user per day
CREATE TABLE IF NOT EXISTS daily_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  cards_reviewed integer NOT NULL DEFAULT 0,
  cards_correct integer NOT NULL DEFAULT 0,
  goal_met boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 2. card_reviews: per-user per-card FSRS state
CREATE TABLE IF NOT EXISTS card_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  stability float NOT NULL DEFAULT 0,
  difficulty float NOT NULL DEFAULT 5.0,
  last_review_at timestamptz NOT NULL DEFAULT now(),
  next_review_at timestamptz NOT NULL DEFAULT now(),
  reps integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_id)
);

-- 3. memory_scores: daily retention snapshot
CREATE TABLE IF NOT EXISTS memory_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  avg_retrievability float NOT NULL DEFAULT 0,
  cards_measured integer NOT NULL DEFAULT 0,
  improvement_pct float NOT NULL DEFAULT 0,
  celebration_triggered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 4. streaks: denormalized streak tracking
CREATE TABLE IF NOT EXISTS streaks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_goal_met_date date,
  streak_freezes_owned integer NOT NULL DEFAULT 0,
  freeze_used_date date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 5. points_ledger: server-side point balance (replaces localStorage)
CREATE TABLE IF NOT EXISTS points_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 6. points_transactions: audit trail for all point changes
CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. redemptions: reward requests with approval flow
CREATE TABLE IF NOT EXISTS redemptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id text NOT NULL,
  reward_name text NOT NULL,
  cost integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- 8. push_subscriptions: Web Push subscription storage
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- 9. topic_levels: per-user per-topic difficulty progression
CREATE TABLE IF NOT EXISTS topic_levels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic text NOT NULL,
  current_level integer NOT NULL DEFAULT 1 CHECK (current_level BETWEEN 1 AND 5),
  cards_at_level integer NOT NULL DEFAULT 0,
  cards_correct_at_level integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic)
);

-- 10. Alter study_sessions: add retrievability tracking
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS avg_retrievability float;

-- 11. Alter cards: add difficulty tier for learning ladder
ALTER TABLE cards ADD COLUMN IF NOT EXISTS difficulty_tier integer NOT NULL DEFAULT 1 CHECK (difficulty_tier BETWEEN 1 AND 5);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON daily_progress(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_card_reviews_user ON card_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_card_reviews_next_review ON card_reviews(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_memory_scores_user_date ON memory_scores(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions(user_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_topic_levels_user ON topic_levels(user_id);

-- ============================================================
-- Row Level Security (RLS)
-- Users can only read/write their own data, admins can read all
-- ============================================================

ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_levels ENABLE ROW LEVEL SECURITY;

-- Students: read/write own data
CREATE POLICY "Users manage own daily_progress" ON daily_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own card_reviews" ON card_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own memory_scores" ON memory_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own streaks" ON streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own points_ledger" ON points_ledger FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own points_transactions" ON points_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own redemptions" ON redemptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own push_subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own topic_levels" ON topic_levels FOR ALL USING (auth.uid() = user_id);

-- Admin: read all data (for dashboard)
CREATE POLICY "Admin reads all daily_progress" ON daily_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin reads all card_reviews" ON card_reviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin reads all memory_scores" ON memory_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin reads all streaks" ON streaks FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin reads all points_ledger" ON points_ledger FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin reads all points_transactions" ON points_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin reads all redemptions" ON redemptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manages all redemptions" ON redemptions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin reads all topic_levels" ON topic_levels FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
