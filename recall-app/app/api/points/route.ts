import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Reward {
  id: string;
  name: string;
  cost: number;
  description: string;
}

const REWARDS: Reward[] = [
  { id: "r1", name: "15 min Game Time", cost: 150, description: "Play your favorite game for 15 minutes" },
  { id: "r2", name: "30 min Game Time", cost: 350, description: "A solid gaming session — 30 minutes" },
  { id: "r3", name: "1 hour Game Time", cost: 600, description: "A full hour of uninterrupted gaming" },
  { id: "r4", name: "Movie Night Pick", cost: 800, description: "You pick the movie for family movie night" },
  { id: "r5", name: "Streak Freeze", cost: 75, description: "Protects your streak for 1 missed day (max 2)" },
];

const POINTS_CONFIG = {
  SESSION_COMPLETE: 10,
  DAILY_GOAL: 50,
  SESSION_ACCURACY_BONUS: 5,
  DAILY_ACCURACY_BONUS: 15,
  STREAK_MILESTONE: 25,
  MEMORY_IMPROVEMENT: 30,
  ACCURACY_THRESHOLD: 0.8,
  MAX_STREAK_FREEZES: 2,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const action = searchParams.get("action") || "balance";

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  if (action === "rewards") {
    return NextResponse.json({ rewards: REWARDS, config: POINTS_CONFIG });
  }

  if (action === "history") {
    const { data: transactions } = await supabase
      .from("points_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ transactions: transactions || [] });
  }

  if (action === "redemptions") {
    const { data: redemptions } = await supabase
      .from("redemptions")
      .select("*")
      .eq("user_id", userId)
      .order("requested_at", { ascending: false });

    return NextResponse.json({ redemptions: redemptions || [] });
  }

  // Default: balance
  const { data: ledger } = await supabase
    .from("points_ledger")
    .select("*")
    .eq("user_id", userId)
    .single();

  const { data: streak } = await supabase
    .from("streaks")
    .select("streak_freezes_owned")
    .eq("user_id", userId)
    .single();

  return NextResponse.json({
    balance: ledger?.balance || 0,
    total_earned: ledger?.total_earned || 0,
    streak_freezes: streak?.streak_freezes_owned || 0,
    config: POINTS_CONFIG,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, action } = body;

  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action required" }, { status: 400 });
  }

  if (action === "earn") {
    const { amount, reason, metadata } = body;
    if (!amount || !reason) {
      return NextResponse.json({ error: "amount and reason required" }, { status: 400 });
    }
    return await earnPoints(userId, amount, reason, metadata);
  }

  if (action === "redeem") {
    const { rewardId } = body;
    if (!rewardId) {
      return NextResponse.json({ error: "rewardId required" }, { status: 400 });
    }
    return await redeemReward(userId, rewardId);
  }

  if (action === "approve" || action === "deny") {
    const { redemptionId } = body;
    if (!redemptionId) {
      return NextResponse.json({ error: "redemptionId required" }, { status: 400 });
    }
    return await resolveRedemption(redemptionId, action);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

async function earnPoints(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
) {
  await supabase.from("points_transactions").insert({
    user_id: userId,
    amount,
    reason,
    metadata: metadata || null,
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

  return NextResponse.json({
    balance: (ledger?.balance || 0) + amount,
    earned: amount,
    reason,
  });
}

async function redeemReward(userId: string, rewardId: string) {
  const reward = REWARDS.find((r) => r.id === rewardId);
  if (!reward) {
    return NextResponse.json({ error: "Unknown reward" }, { status: 400 });
  }

  // Streak freeze: check max ownership
  if (rewardId === "r5") {
    const { data: streak } = await supabase
      .from("streaks")
      .select("streak_freezes_owned")
      .eq("user_id", userId)
      .single();

    if ((streak?.streak_freezes_owned || 0) >= POINTS_CONFIG.MAX_STREAK_FREEZES) {
      return NextResponse.json(
        { error: `You already have ${POINTS_CONFIG.MAX_STREAK_FREEZES} streak freezes (max)` },
        { status: 400 }
      );
    }
  }

  const { data: ledger } = await supabase
    .from("points_ledger")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!ledger || ledger.balance < reward.cost) {
    return NextResponse.json(
      { error: "Not enough points", balance: ledger?.balance || 0, cost: reward.cost },
      { status: 400 }
    );
  }

  // Deduct points
  await supabase
    .from("points_ledger")
    .update({
      balance: ledger.balance - reward.cost,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  // Record transaction
  await supabase.from("points_transactions").insert({
    user_id: userId,
    amount: -reward.cost,
    reason: `redeem_${rewardId}`,
    metadata: { reward_name: reward.name },
  });

  // If streak freeze, increment owned count
  if (rewardId === "r5") {
    const { data: streak } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (streak) {
      await supabase
        .from("streaks")
        .update({
          streak_freezes_owned: streak.streak_freezes_owned + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } else {
      await supabase.from("streaks").insert({
        user_id: userId,
        streak_freezes_owned: 1,
      });
    }
  }

  // Create redemption record
  await supabase.from("redemptions").insert({
    user_id: userId,
    reward_id: rewardId,
    reward_name: reward.name,
    cost: reward.cost,
    status: rewardId === "r5" ? "approved" : "pending",
    resolved_at: rewardId === "r5" ? new Date().toISOString() : null,
  });

  return NextResponse.json({
    balance: ledger.balance - reward.cost,
    redeemed: reward.name,
    status: rewardId === "r5" ? "approved" : "pending",
  });
}

async function resolveRedemption(redemptionId: string, action: "approve" | "deny") {
  const { data: redemption } = await supabase
    .from("redemptions")
    .select("*")
    .eq("id", redemptionId)
    .single();

  if (!redemption) {
    return NextResponse.json({ error: "Redemption not found" }, { status: 404 });
  }

  if (redemption.status !== "pending") {
    return NextResponse.json({ error: "Redemption already resolved" }, { status: 400 });
  }

  if (action === "deny") {
    // Refund points
    const { data: ledger } = await supabase
      .from("points_ledger")
      .select("*")
      .eq("user_id", redemption.user_id)
      .single();

    if (ledger) {
      await supabase
        .from("points_ledger")
        .update({
          balance: ledger.balance + redemption.cost,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", redemption.user_id);
    }

    await supabase.from("points_transactions").insert({
      user_id: redemption.user_id,
      amount: redemption.cost,
      reason: "refund_denied",
      metadata: { redemption_id: redemptionId, reward_name: redemption.reward_name },
    });
  }

  await supabase
    .from("redemptions")
    .update({
      status: action === "approve" ? "approved" : "denied",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", redemptionId);

  return NextResponse.json({ status: action === "approve" ? "approved" : "denied" });
}
