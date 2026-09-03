import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: profiles } = await supabase.from("profiles").select("id, display_name");
  if (!profiles) return NextResponse.json({ sent: 0 });

  let totalSent = 0;

  for (const profile of profiles) {
    const { data: progress } = await supabase
      .from("daily_progress")
      .select("goal_met")
      .eq("user_id", profile.id)
      .eq("date", today)
      .single();

    if (progress?.goal_met) continue;

    const { data: streak } = await supabase
      .from("streaks")
      .select("current_streak")
      .eq("user_id", profile.id)
      .single();

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", profile.id);

    if (!subs || subs.length === 0) continue;

    const cardsReviewed = progress ? (progress as any).cards_reviewed || 0 : 0;
    let title = "Time to study!";
    let body = "Your daily cards are waiting. A quick session keeps your memory sharp.";

    if (streak && streak.current_streak > 0) {
      title = `Your ${streak.current_streak}-day streak is at risk!`;
      body = `Don't break your streak! ${20 - cardsReviewed} cards left for today's goal.`;
    }

    const payload = JSON.stringify({ title, body, url: "/", tag: "daily-reminder" });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        totalSent++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }
  }

  return NextResponse.json({ sent: totalSent, checked: profiles.length });
}
