import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get cards without topics
  const { data: cards } = await supabase
    .from("cards")
    .select("id, front, back, decks(subject)")
    .is("topic", null)
    .limit(50);

  if (!cards || cards.length === 0) {
    return NextResponse.json({ message: "All cards already have topics", updated: 0 });
  }

  const cardList = cards.map((c: any, i: number) =>
    `${i + 1}. [${c.decks?.subject || "unknown"}] Front: "${c.front}" Back: "${c.back}"`
  ).join("\n");

  const prompt = `Categorize each flashcard into a specific TOPIC within its subject. The topic should group cards that would make plausible wrong answers for each other in a multiple choice quiz.

Rules:
- Topics should be specific (not just the subject name)
- Cards in the same topic should have answers that could be confused with each other
- Use short lowercase topic names (2-3 words max)
- Examples: "volume_formulas", "cell_organelles", "verb_conjugation", "angle_theorems", "spanish_greetings", "literary_devices"

Cards:
${cardList}

Respond with ONLY valid JSON — an array of objects:
[{"index": 1, "topic": "topic_name"}, ...]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI call failed" }, { status: 500 });
    }

    const data = await response.json();
    let text = data.content[0]?.text || "[]";
    text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const topics = JSON.parse(text);

    let updated = 0;
    for (const t of topics) {
      const card = cards[t.index - 1];
      if (card && t.topic) {
        await supabase.from("cards").update({ topic: t.topic }).eq("id", (card as any).id);
        updated++;
      }
    }

    const remaining = await supabase.from("cards").select("id", { count: "exact" }).is("topic", null);

    return NextResponse.json({
      updated,
      remaining: remaining.count || 0,
      message: `Assigned topics to ${updated} cards. ${remaining.count || 0} remaining.`
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
