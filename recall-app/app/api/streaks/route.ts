import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  return NextResponse.json({
    current_streak: streak?.current_streak || 0,
    longest_streak: streak?.longest_streak || 0,
    last_goal_met_date: streak?.last_goal_met_date || null,
    streak_freezes_owned: streak?.streak_freezes_owned || 0,
    freeze_used_date: streak?.freeze_used_date || null,
  });
}
