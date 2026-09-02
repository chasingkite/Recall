import { NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export async function POST(request: Request) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "No API key" }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("image") as File;
  const subject = formData.get("subject") as string || "english";

  if (!file) {
    return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
  }

  // Convert file to base64
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  // Determine media type
  let mediaType = "image/jpeg";
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) mediaType = "image/png";
  else if (name.endsWith(".gif")) mediaType = "image/gif";
  else if (name.endsWith(".webp")) mediaType = "image/webp";
  else if (name.endsWith(".heic") || name.endsWith(".heif")) mediaType = "image/jpeg"; // Claude handles HEIC as jpeg
  else if (name.endsWith(".pdf")) mediaType = "application/pdf";

  const prompt = `You are creating flashcards for a 9th grade student from this study material image. Extract ALL testable facts, vocabulary, definitions, and key concepts visible in the image.

Subject: ${subject}

Create 5-15 atomic flashcards. For each card:
- Front: a retrieval prompt question (not just a bare term)
- Back: concise answer (under 80 characters)
- If the image shows multiple choice questions, include the exact choices separated by |

Respond with ONLY valid JSON array:
[{"front": "question", "back": "answer", "choices": "choice1|choice2|choice3|choice4"}]

If a card doesn't need MC choices, set choices to null. Focus on facts a student would be tested on.`;

  try {
    const content: any[] = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: base64,
        },
      },
      {
        type: "text",
        text: prompt,
      },
    ];

    // For PDFs, use document type instead of image
    if (name.endsWith(".pdf")) {
      content[0] = {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64,
        },
      };
    }

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
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `API error: ${response.status} ${errText.slice(0, 200)}` }, { status: 500 });
    }

    const data = await response.json();
    let text = data.content[0]?.text || "[]";
    text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const cards = JSON.parse(text);

    return NextResponse.json({ cards, count: cards.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
