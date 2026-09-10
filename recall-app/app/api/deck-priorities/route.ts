import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const { data, error } = await admin()
    .from("deck_priorities")
    .select("deck_id")
    .eq("user_id", userId)
    .eq("starred", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ starredDeckIds: (data || []).map((r) => r.deck_id) });
}

export async function POST(request: Request) {
  const { userId, deckId, starred } = await request.json();
  if (!userId || !deckId) return NextResponse.json({ error: "userId and deckId required" }, { status: 400 });
  const sb = admin();
  if (starred) {
    const { error } = await sb
      .from("deck_priorities")
      .upsert({ user_id: userId, deck_id: deckId, starred: true }, { onConflict: "user_id,deck_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await sb.from("deck_priorities").delete().eq("user_id", userId).eq("deck_id", deckId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
