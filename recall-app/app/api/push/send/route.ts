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

export async function POST(request: Request) {
  const { userId, title, body, url = "/" } = await request.json();

  if (!title || !body) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }

  let query = supabase.from("push_subscriptions").select("*");
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data: subscriptions } = await query;

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, message: "No subscriptions found" });
  }

  const payload = JSON.stringify({ title, body, url, tag: `recall-${Date.now()}` });

  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (err: any) {
      failed++;
      if (err.statusCode === 410 || err.statusCode === 404) {
        staleEndpoints.push(sub.endpoint);
      }
    }
  }

  if (staleEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", staleEndpoints);
  }

  return NextResponse.json({ sent, failed, cleaned: staleEndpoints.length });
}
