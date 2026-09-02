import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const { sessionCards, userId } = await request.json();

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "No API key configured" }, { status: 500 });
  }

  if (!sessionCards || sessionCards.length === 0) {
    return NextResponse.json({ weakTopics: [], strengths: [], recommendations: [], nextSessionFocus: [] });
  }

  const wrongCards = sessionCards.filter((c: any) => !c.correct);
  const rightCards = sessionCards.filter((c: any) => c.correct);

  // If everything was correct, return positive feedback
  if (wrongCards.length === 0) {
    const topics = [...new Set(sessionCards.map((c: any) => c.topic).filter(Boolean))] as string[];
    return NextResponse.json({
      weakTopics: [],
      strengths: topics,
      recommendations: ["Great session! You got everything right. Keep reviewing to strengthen long-term memory."],
      nextSessionFocus: [],
    });
  }

  const wrongList = wrongCards
    .map((c: any, i: number) => `${i + 1}. Q: "${c.front}" A: "${c.back}" (Topic: ${c.topic || c.subject})`)
    .join("\n");
  const rightList = rightCards
    .slice(0, 5)
    .map((c: any, i: number) => `${i + 1}. Q: "${c.front}" (Topic: ${c.topic || c.subject})`)
    .join("\n");

  const prompt = `You are a study coach analyzing a 9th grader's study session. Be encouraging but specific about what to work on.

Questions they got WRONG:
${wrongList}

Questions they got RIGHT (sample):
${rightList}

Total: ${rightCards.length} right, ${wrongCards.length} wrong out of ${sessionCards.length}

Analyze their performance and respond with ONLY valid JSON (no markdown):
{
  "weakTopics": ["topic1", "topic2"],
  "strengths": ["topic or skill they did well on"],
  "recommendations": ["specific, actionable advice — max 3 items"],
  "nextSessionFocus": ["topic or concept to prioritize tomorrow"],
  "summary": "1-2 sentence encouraging summary of the session"
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
      return NextResponse.json({
        weakTopics: wrongCards.map((c: any) => c.topic).filter(Boolean),
        strengths: [],
        recommendations: ["Review the cards you missed and try again."],
        nextSessionFocus: wrongCards.map((c: any) => c.topic).filter(Boolean).slice(0, 2),
      });
    }

    const data = await response.json();
    let text = data.content[0]?.text || "{}";
    text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const result = JSON.parse(text);

    // Store nextSessionFocus for the smart-session API to use
    if (userId && result.nextSessionFocus?.length > 0) {
      try {
        // Store as a simple cache row — smart-session will read this
        await supabase.from("canvas_cache").upsert(
          {
            student_id: `gap_${userId}`,
            data: { nextSessionFocus: result.nextSessionFocus, createdAt: new Date().toISOString() },
          },
          { onConflict: "student_id" }
        );
      } catch {}
    }

    return NextResponse.json({
      weakTopics: result.weakTopics || [],
      strengths: result.strengths || [],
      recommendations: result.recommendations || [],
      nextSessionFocus: result.nextSessionFocus || [],
      summary: result.summary || "",
    });
  } catch {
    return NextResponse.json({
      weakTopics: wrongCards.map((c: any) => c.topic).filter(Boolean),
      strengths: [],
      recommendations: ["Review the cards you missed and try again."],
      nextSessionFocus: [],
    });
  }
}
