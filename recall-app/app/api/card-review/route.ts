import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MASTERY_CELEBRATION_THRESHOLD } from "../../lib/supabase/db-types";

const DECAY = -0.5;
const FACTOR = 19 / 81;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getRetrievability(stability: number, lastReviewAt: string): number {
  if (stability <= 0) return 0;
  const elapsed = (Date.now() - new Date(lastReviewAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.pow(1 + FACTOR * elapsed / stability, DECAY);
}

function initialStability(rating: number): number {
  const w = [0.4, 0.9, 2.3, 6.0];
  return w[Math.max(0, Math.min(3, rating - 1))];
}

function initialDifficulty(rating: number): number {
  return Math.max(1, Math.min(10, 5.0 - (rating - 3) * 1.5));
}

function nextDifficulty(d: number, rating: number): number {
  const delta = -(rating - 3) * 0.5;
  const newD = d + delta;
  return Math.max(1, Math.min(10, newD * 0.9 + 5.0 * 0.1));
}

function recallStability(d: number, s: number, r: number, rating: number): number {
  const hardPenalty = rating === 2 ? 0.8 : 1.0;
  const easyBonus = rating === 4 ? 1.3 : 1.0;
  return s * (1 + Math.exp(5.5 - d / 2) * Math.pow(s, -0.2) * (Math.exp((1 - r) * 0.8) - 1) * hardPenalty * easyBonus);
}

function forgetStability(d: number, s: number, r: number): number {
  return Math.max(0.1, 0.2 * Math.pow(d, -0.3) * Math.pow(s + 1, 0.2) * (Math.exp((1 - r) * 1.2) - 1));
}

function nextInterval(stability: number): number {
  const REQUEST_RETENTION = 0.9;
  const interval = stability * Math.log(REQUEST_RETENTION) / Math.log(1 / (1 + FACTOR));
  return Math.max(1, Math.round(interval));
}

export async function POST(request: Request) {
  const { userId, cardId, rating } = await request.json();

  if (!userId || !cardId || !rating) {
    return NextResponse.json({ error: "userId, cardId, and rating required" }, { status: 400 });
  }

  const r = Math.max(1, Math.min(4, rating));

  // Load existing FSRS state
  const { data: existing } = await supabase
    .from("card_reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("card_id", cardId)
    .single();

  let stability: number;
  let difficulty: number;
  let reps: number;

  if (!existing || existing.reps === 0) {
    stability = initialStability(r);
    difficulty = initialDifficulty(r);
    reps = 1;
  } else {
    const elapsed = (Date.now() - new Date(existing.last_review_at).getTime()) / (1000 * 60 * 60 * 24);
    const retrievability = Math.pow(1 + FACTOR * elapsed / existing.stability, DECAY);

    difficulty = nextDifficulty(existing.difficulty, r);

    if (r === 1) {
      stability = forgetStability(existing.difficulty, existing.stability, retrievability);
    } else {
      stability = recallStability(existing.difficulty, existing.stability, retrievability, r);
    }

    reps = existing.reps + 1;
  }

  stability = Math.max(0.1, Math.min(36500, stability));
  difficulty = Math.max(1, Math.min(10, difficulty));

  const interval = nextInterval(stability);
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  // Upsert card_reviews
  const { error } = await supabase
    .from("card_reviews")
    .upsert(
      {
        user_id: userId,
        card_id: cardId,
        stability,
        difficulty,
        last_review_at: new Date().toISOString(),
        next_review_at: nextReviewAt.toISOString(),
        reps,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,card_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Recompute today's memory score
  const memoryResult = await updateMemoryScore(userId);

  return NextResponse.json({
    stability,
    difficulty,
    reps,
    next_review_at: nextReviewAt.toISOString(),
    interval,
    memory_score: memoryResult,
  });
}

async function updateMemoryScore(userId: string) {
  // Get all card_reviews for this user
  const { data: reviews } = await supabase
    .from("card_reviews")
    .select("stability, last_review_at, reps")
    .eq("user_id", userId)
    .gt("reps", 0);

  if (!reviews || reviews.length === 0) {
    return { avg_retrievability: 0, improvement_pct: 0, celebration: false };
  }

  // Compute average retrievability
  let totalR = 0;
  for (const rev of reviews) {
    totalR += getRetrievability(rev.stability, rev.last_review_at);
  }
  const avgR = totalR / reviews.length;

  // Get yesterday's score for comparison
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const { data: yesterdayScore } = await supabase
    .from("memory_scores")
    .select("avg_retrievability")
    .eq("user_id", userId)
    .eq("date", yesterdayStr)
    .single();

  const yesterdayR = yesterdayScore?.avg_retrievability || 0;
  const improvementPct = yesterdayR > 0
    ? ((avgR - yesterdayR) / yesterdayR) * 100
    : 0;

  const shouldCelebrate = improvementPct >= MASTERY_CELEBRATION_THRESHOLD * 100;

  const today = new Date().toISOString().split("T")[0];

  // Check if celebration was already triggered today
  const { data: existingScore } = await supabase
    .from("memory_scores")
    .select("celebration_triggered")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const alreadyCelebrated = existingScore?.celebration_triggered || false;
  const triggerCelebration = shouldCelebrate && !alreadyCelebrated;

  await supabase
    .from("memory_scores")
    .upsert(
      {
        user_id: userId,
        date: today,
        avg_retrievability: Math.round(avgR * 1000) / 1000,
        cards_measured: reviews.length,
        improvement_pct: Math.round(improvementPct * 10) / 10,
        celebration_triggered: alreadyCelebrated || shouldCelebrate,
      },
      { onConflict: "user_id,date" }
    );

  // Award points for memory improvement
  if (triggerCelebration) {
    // Insert points transaction
    await supabase.from("points_transactions").insert({
      user_id: userId,
      amount: 30,
      reason: "memory_improvement",
      metadata: { improvement_pct: improvementPct, date: today },
    });

    const { data: ledger } = await supabase
      .from("points_ledger")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (ledger) {
      await supabase
        .from("points_ledger")
        .update({
          balance: ledger.balance + 30,
          total_earned: ledger.total_earned + 30,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }
  }

  return {
    avg_retrievability: Math.round(avgR * 100),
    cards_measured: reviews.length,
    improvement_pct: Math.round(improvementPct * 10) / 10,
    celebration: triggerCelebration,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const { data: reviews } = await supabase
    .from("card_reviews")
    .select("stability, last_review_at, reps")
    .eq("user_id", userId)
    .gt("reps", 0);

  if (!reviews || reviews.length === 0) {
    return NextResponse.json({
      avg_retrievability: 0,
      cards_measured: 0,
      improvement_pct: 0,
    });
  }

  let totalR = 0;
  for (const rev of reviews) {
    totalR += getRetrievability(rev.stability, rev.last_review_at);
  }
  const avgR = totalR / reviews.length;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const { data: yesterdayScore } = await supabase
    .from("memory_scores")
    .select("avg_retrievability")
    .eq("user_id", userId)
    .eq("date", yesterdayStr)
    .single();

  const yesterdayR = yesterdayScore?.avg_retrievability || 0;
  const improvementPct = yesterdayR > 0
    ? ((avgR - yesterdayR) / yesterdayR) * 100
    : 0;

  return NextResponse.json({
    avg_retrievability: Math.round(avgR * 100),
    cards_measured: reviews.length,
    improvement_pct: Math.round(improvementPct * 10) / 10,
    yesterday_score: Math.round(yesterdayR * 100),
  });
}
