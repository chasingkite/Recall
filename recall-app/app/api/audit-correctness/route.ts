import { NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

interface CardToCheck {
  id: string;
  front: string;
  back: string;
  subject: string;
}

interface CorrectnessResult {
  cardId: string;
  front: string;
  correct: boolean;
  issue: string | null;
  suggestedBack: string | null;
}

export async function POST(request: Request) {
  const { cards } = await request.json();

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "No API key" }, { status: 500 });
  }

  const results: CorrectnessResult[] = [];
  const batchSize = 5;

  for (let i = 0; i < cards.length; i += batchSize) {
    const batch: CardToCheck[] = cards.slice(i, i + batchSize);

    const cardsText = batch.map((c, idx) => `${idx + 1}. Subject: ${c.subject} | Front: "${c.front}" | Back: "${c.back}"`).join("\n");

    const prompt = `You are a fact-checker for educational flashcards used by a 9th grade student. Check each card for factual correctness.

For each card, determine:
1. Is the answer (back) factually correct for the question (front)?
2. Is the answer appropriate for a 9th grade level?
3. Does the front logically lead to the back as an answer?

Cards to check:
${cardsText}

Respond with ONLY valid JSON — an array of objects, one per card:
[{"index": 1, "correct": true/false, "issue": "description of error or null if correct", "suggestedBack": "corrected answer or null if correct"}]

Be strict about factual accuracy. If the answer is mostly right but has a minor error (typo, imprecise wording), mark it as incorrect and suggest the fix. If correct, set issue and suggestedBack to null.`;

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
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        batch.forEach((c) => results.push({ cardId: c.id, front: c.front, correct: true, issue: null, suggestedBack: null }));
        continue;
      }

      const data = await response.json();
      let text = data.content[0]?.text || "[]";
      text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      const checks = JSON.parse(text);

      for (const check of checks) {
        const card = batch[check.index - 1];
        if (card) {
          results.push({
            cardId: card.id,
            front: card.front,
            correct: check.correct,
            issue: check.issue || null,
            suggestedBack: check.suggestedBack || null,
          });
        }
      }
    } catch {
      batch.forEach((c) => results.push({ cardId: c.id, front: c.front, correct: true, issue: null, suggestedBack: null }));
    }
  }

  const incorrect = results.filter((r) => !r.correct);
  return NextResponse.json({ total: results.length, incorrect: incorrect.length, results: incorrect });
}
