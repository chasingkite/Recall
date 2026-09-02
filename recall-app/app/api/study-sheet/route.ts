import { NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export async function POST(request: Request) {
  const { topics, cardFronts } = await request.json();

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "No API key configured" }, { status: 500 });
  }

  if (!topics || !cardFronts || cardFronts.length === 0) {
    return NextResponse.json({ error: "topics and cardFronts required" }, { status: 400 });
  }

  const topicList = Array.isArray(topics) ? topics.join(", ") : topics;
  const cardList = cardFronts.slice(0, 10).map((f: string, i: number) => `${i + 1}. ${f}`).join("\n");

  const prompt = `You are a study coach creating a quick review sheet for a 9th grade student about to take a quiz. The student takes Spanish 1, Biology, English 1, and Integrated Math 2.

Topics: ${topicList}

Questions they're about to answer:
${cardList}

Create a concise study sheet they can review in 2-3 minutes BEFORE answering these questions. Include:

1. **Key Facts** — The most important definitions, formulas, or rules they need to know (bullet points)
2. **Common Mistakes** — The #1 or #2 mistakes students make on these topics
3. **Quick Connections** — How these concepts connect to each other or to real life (1-2 sentences)

Keep it SHORT and scannable. Use simple language. No fluff — every line should help them answer the upcoming questions.

Format as markdown.`;

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
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content[0]?.text || "";

    return NextResponse.json({ sheet: text });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
