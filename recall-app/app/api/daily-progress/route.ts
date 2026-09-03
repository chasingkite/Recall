import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DAILY_GOAL_CARDS } from "../../lib/supabase/db-types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  return NextResponse.json({
    cards_reviewed: data?.cards_reviewed || 0,
    cards_correct: data?.cards_correct || 0,
    goal_met: data?.goal_met || false,
    goal_target: DAILY_GOAL_CARDS,
  });
}

export async function POST(request: Request) {
  const { userId, cardsReviewed, cardsCorrect } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Fetch current progress
  const { data: existing } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const newReviewed = (existing?.cards_reviewed || 0) + (cardsReviewed || 0);
  const newCorrect = (existing?.cards_correct || 0) + (cardsCorrect || 0);
  const wasGoalMet = existing?.goal_met || false;
  const isGoalMet = newCorrect >= DAILY_GOAL_CARDS;

  const { data, error } = await supabase
    .from("daily_progress")
    .upsert(
      {
        user_id: userId,
        date: today,
        cards_reviewed: newReviewed,
        cards_correct: newCorrect,
        goal_met: isGoalMet,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If goal was just met for the first time today, trigger streak + points
  const justMetGoal = isGoalMet && !wasGoalMet;

  if (justMetGoal) {
    // Update streak
    await updateStreak(userId, today);
    // Award daily goal points
    await awardPoints(userId, 50, "daily_goal", { date: today });
  }

  return NextResponse.json({
    cards_reviewed: newReviewed,
    cards_correct: newCorrect,
    goal_met: isGoalMet,
    goal_target: DAILY_GOAL_CARDS,
    just_met_goal: justMetGoal,
  });
}

async function updateStreak(userId: string, today: string) {
  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const dayBeforeYesterday = new Date();
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
  const dayBeforeYesterdayStr = dayBeforeYesterday.toISOString().split("T")[0];

  if (!streak) {
    // First time — create streak record
    await supabase.from("streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_goal_met_date: today,
    });
    return;
  }

  if (streak.last_goal_met_date === today) {
    return; // Already counted today
  }

  let newStreak = 1;

  if (streak.last_goal_met_date === yesterdayStr) {
    // Consecutive day — increment
    newStreak = streak.current_streak + 1;
  } else if (
    streak.last_goal_met_date === dayBeforeYesterdayStr &&
    streak.streak_freezes_owned > 0
  ) {
    // Missed yesterday but have a freeze — use it
    newStreak = streak.current_streak + 1;
    await supabase
      .from("streaks")
      .update({
        streak_freezes_owned: streak.streak_freezes_owned - 1,
        freeze_used_date: yesterdayStr,
      })
      .eq("user_id", userId);
  }

  const newLongest = Math.max(streak.longest_streak, newStreak);

  // Award streak milestone points (every 7 days)
  if (newStreak > 0 && newStreak % 7 === 0) {
    await awardPoints(userId, 25, "streak_milestone", {
      streak: newStreak,
    });
  }

  await supabase
    .from("streaks")
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_goal_met_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

async function awardPoints(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
) {
  // Insert transaction
  await supabase.from("points_transactions").insert({
    user_id: userId,
    amount,
    reason,
    metadata: metadata || null,
  });

  // Upsert ledger
  const { data: ledger } = await supabase
    .from("points_ledger")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (ledger) {
    await supabase
      .from("points_ledger")
      .update({
        balance: ledger.balance + amount,
        total_earned: ledger.total_earned + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } else {
    await supabase.from("points_ledger").insert({
      user_id: userId,
      balance: amount,
      total_earned: amount,
    });
  }
}
