import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { LEVEL_UP_THRESHOLD, LEVEL_UP_MIN_CARDS } from "../../lib/supabase/db-types";

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

  const { data: levels } = await supabase
    .from("topic_levels")
    .select("*")
    .eq("user_id", userId)
    .order("topic");

  return NextResponse.json({ levels: levels || [] });
}

export async function POST(request: Request) {
  const { userId, topic, correct } = await request.json();

  if (!userId || !topic) {
    return NextResponse.json({ error: "userId and topic required" }, { status: 400 });
  }

  // Get or create topic level
  const { data: existing } = await supabase
    .from("topic_levels")
    .select("*")
    .eq("user_id", userId)
    .eq("topic", topic)
    .single();

  const currentLevel = existing?.current_level || 1;
  const cardsAtLevel = (existing?.cards_at_level || 0) + 1;
  const cardsCorrectAtLevel = (existing?.cards_correct_at_level || 0) + (correct ? 1 : 0);

  // Check for level up
  let newLevel = currentLevel;
  let leveledUp = false;
  const accuracy = cardsAtLevel > 0 ? cardsCorrectAtLevel / cardsAtLevel : 0;

  if (
    accuracy >= LEVEL_UP_THRESHOLD &&
    cardsAtLevel >= LEVEL_UP_MIN_CARDS &&
    currentLevel < 5
  ) {
    newLevel = currentLevel + 1;
    leveledUp = true;
  }

  const { error } = await supabase
    .from("topic_levels")
    .upsert(
      {
        user_id: userId,
        topic,
        current_level: newLevel,
        cards_at_level: leveledUp ? 0 : cardsAtLevel,
        cards_correct_at_level: leveledUp ? 0 : cardsCorrectAtLevel,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,topic" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    topic,
    current_level: newLevel,
    leveled_up: leveledUp,
    cards_at_level: leveledUp ? 0 : cardsAtLevel,
    cards_correct_at_level: leveledUp ? 0 : cardsCorrectAtLevel,
    accuracy: Math.round(accuracy * 100),
    progress_to_next: leveledUp
      ? 0
      : Math.round(
          Math.min(1, Math.min(cardsAtLevel / LEVEL_UP_MIN_CARDS, accuracy / LEVEL_UP_THRESHOLD)) * 100
        ),
  });
}
