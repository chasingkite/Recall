import { NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export async function POST(request: Request) {
  const { cards } = await request.json();

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "No API key configured" }, { status: 500 });
  }

  const enrichedCards = [];

  for (const card of cards) {
    const prompt = `You are an educational content enricher for a 9th grade high school student's flashcard app. The student takes: Spanish 1, Biology, English 1, and Integrated Math 2. She's 14, lives in California, uses social media (TikTok, Instagram), plays sports, watches movies/shows, and cares about animals and the environment.

Flashcard:
- Subject: ${card.subject}
- Front (question): ${card.front}
- Back (answer): ${card.back}

Generate these 5 fields as JSON. Keep language simple, conversational, and relatable to a freshman:

1. "tokConnection" - A "how do we actually know this?" question (1-2 sentences). Don't be overly philosophical. Make it something a curious 14-year-old would wonder. Example: "Scientists can't see atoms directly — so how did they figure out what's inside a cell? What counts as proof when you can't see something?"

2. "interdisciplinary" - Connect to her OTHER classes specifically: Spanish 1, Biology, English 1, or Math 2 (1-2 sentences). Show how this concept appears in a totally different subject she's actually taking. Example for a biology card: "In Math 2, you graph functions that grow exponentially — population growth in ecology follows the same curve."

3. "inquiryQuestion" - A question that would spark debate with friends (1-2 sentences). No single right answer. Something she'd actually want to discuss. Avoid sounding like a textbook.

4. "realWorldConnection" - A specific example from her world: TikTok trends, Instagram, Netflix shows, school lunch, sports practice, California weather, her phone, gaming, or shopping (1-2 sentences). Not generic — make it FEEL like her life.

5. "explanation" - Why the answer is correct in plain language (2-3 sentences). Mention the #1 mistake students make on this topic. Talk like a helpful older sibling, not a textbook.

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
