import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SAMPLE_CARDS } from "../../lib/sample-cards";

export async function POST(request: Request) {
  const { adminKey } = await request.json();
  if (adminKey !== "seed-recall-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const subjects = [...new Set(SAMPLE_CARDS.map((c) => c.subject))];
  const deckMap: Record<string, string> = {};

  for (const subject of subjects) {
    const { data: deck, error } = await supabase
      .from("decks")
      .insert({ name: `${subject.charAt(0).toUpperCase() + subject.slice(1)} - Core`, subject, shared: true })
      .select()
      .single();

    if (error || !deck) {
      return NextResponse.json({ error: `Failed to create deck for ${subject}: ${error?.message}` }, { status: 500 });
    }
    deckMap[subject] = deck.id;
  }

  const cardsToInsert = SAMPLE_CARDS.map((c) => ({
    deck_id: deckMap[c.subject],
    front: c.front,
    back: c.back,
    answer_type: c.answerType,
    explanation: c.explanation,
    real_world_connection: c.realWorldConnection,
    tok_connection: c.tokConnection,
    interdisciplinary: c.interdisciplinary,
    inquiry_question: c.inquiryQuestion,
    example_sentence: c.exampleSentence || null,
    image_url: c.imageUrl || null,
    audio_lang: c.audioLang,
  }));

  const { error: insertError } = await supabase.from("cards").insert(cardsToInsert);

  if (insertError) {
    return NextResponse.json({ error: `Failed to insert cards: ${insertError.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, decks: Object.keys(deckMap).length, cards: cardsToInsert.length });
}
