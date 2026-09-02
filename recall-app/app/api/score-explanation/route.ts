import { NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export async function POST(request: Request) {
  const { concept, correctAnswer, studentExplanation, topic } = await request.json();

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "No API key configured" }, { status: 500 });
  }

  if (!concept || !correctAnswer || !studentExplanation) {
    return NextResponse.json({ error: "concept, correctAnswer, and studentExplanation required" }, { status: 400 });
  }

  const prompt = `You are a friendly study coach evaluating a 9th grader's explanation of a concept. Be encouraging but honest about gaps.

Topic: ${topic || "General"}
Concept/Question: ${concept}
Correct Answer: ${correctAnswer}

Student's explanation:
"${studentExplanation}"

Evaluate their explanation and respond with ONLY valid JSON (no markdown):
{
  "score": <1-5 where 1=major gaps, 3=adequate, 5=could teach it>,
  "correct": "<what they got right — be specific and encouraging>",
  "missing": "<key points they left out — be specific>",
  "misconceptions": "<anything incorrect they said, or empty string if none>",
  "feedback": "<1-2 sentence encouraging summary — talk like a supportive older sibling>"
}`;

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
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    let text = data.content[0]?.text || "{}";
    text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const result = JSON.parse(text);

    return NextResponse.json({
      score: result.score || 1,
      correct: result.correct || "",
      missing: result.missing || "",
      misconceptions: result.misconceptions || "",
      feedback: result.feedback || "",
      mastered: (result.score || 0) >= 3,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
