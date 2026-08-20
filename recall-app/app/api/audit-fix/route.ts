import { NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export async function POST(request: Request) {
  const { card, issue } = await request.json();

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "No API key" }, { status: 500 });
  }

  const prompt = `You are a flashcard quality expert. A card has been flagged with this issue: "${issue}"

Current card:
- Subject: ${card.subject}
- Front: ${card.front}
- Back: ${card.back}

Rules for good flashcards:
- One concept per card (atomic principle — if there are multiple facts, keep ONLY the most important one)
- Front should be a retrieval prompt, not a bare term
- Back should be concise (under 100 chars ideally, max 150)
- Remove ALL HTML artifacts: &nbsp; &amp; <br> <b> etc — use plain text only
- Remove formatting characters that don't render: ^_ or special unicode spaces
- For math: test fact retrieval, not multi-step problems
- For languages: use contextual prompts, not bare translations
- If the card has too much info, pick the SINGLE most testable fact and discard the rest

Fix the card. Respond with ONLY valid JSON:
{"front": "improved front text", "back": "improved back text (concise, under 100 chars)", "explanation": "what you changed and why"}`;

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
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "API call failed" }, { status: 500 });
    }

    const data = await response.json();
    let text = data.content[0]?.text || "{}";
    text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const fix = JSON.parse(text);

    return NextResponse.json({ fix });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
