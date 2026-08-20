import { NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export async function POST(request: Request) {
  const { cards } = await request.json();

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "No API key configured" }, { status: 500 });
  }

  const enrichedCards = [];

  for (const card of cards) {
    const prompt = `You are an educational content enricher for a high school flashcard app. Given this flashcard, generate 4 enrichment fields that make the card deeper and more meaningful.

Flashcard:
- Subject: ${card.subject}
- Front (question): ${card.front}
- Back (answer): ${card.back}

Generate these 4 fields as JSON:
1. "tokConnection" - A Theory of Knowledge question (1-2 sentences). Ask HOW we know this, challenge assumptions, question the nature of knowledge itself. Example: "We defined life with 7 criteria. But viruses meet some. Does our definition create the boundary, or reveal it?"
2. "interdisciplinary" - Connect this concept to 2 other subjects (1-2 sentences). Show how the same idea appears in completely different fields. Always name the other subjects explicitly.
3. "inquiryQuestion" - An open-ended question that pushes deeper thinking (1-2 sentences). No single correct answer. Should make the student pause and think critically.
4. "realWorldConnection" - A concrete, relatable real-world example (1-2 sentences). Use examples a 14-16 year old would connect with (phones, social media, sports, movies, food, school life).

Also generate:
5. "explanation" - A clear 2-3 sentence explanation of WHY the answer is correct. Include common mistakes or misconceptions.

Respond with ONLY valid JSON, no markdown:
{"tokConnection": "...", "interdisciplinary": "...", "inquiryQuestion": "...", "realWorldConnection": "...", "explanation": "..."}`;

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
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Enrich API error: ${response.status} ${errText}`);
        enrichedCards.push({ ...card, enrichError: true, enrichErrorMsg: `${response.status}: ${errText}` });
        continue;
      }

      const data = await response.json();
      let text = data.content[0]?.text || "{}";
      // Strip markdown code fences if present
      text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      const enrichment = JSON.parse(text);

      enrichedCards.push({
        ...card,
        tokConnection: enrichment.tokConnection || "",
        interdisciplinary: enrichment.interdisciplinary || "",
        inquiryQuestion: enrichment.inquiryQuestion || "",
        realWorldConnection: enrichment.realWorldConnection || "",
        explanation: enrichment.explanation || card.explanation || "",
      });
    } catch (err) {
      console.error(`Enrich fetch error:`, err);
      enrichedCards.push({ ...card, enrichError: true, enrichErrorMsg: String(err) });
    }
  }

  return NextResponse.json({ cards: enrichedCards });
}
