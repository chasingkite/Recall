import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId") || "81991";
  const mode = searchParams.get("mode") || "full"; // "quick5" or "full"
  const subject = searchParams.get("subject") || "all";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Get upcoming assignments from Canvas cache
  const { data: cache } = await supabase
    .from("canvas_cache")
    .select("data")
    .eq("student_id", studentId)
    .single();

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86400000);
  const upcomingAssignments: { name: string; dueAt: string; courseName: string }[] = [];

  if (cache?.data) {
    for (const course of cache.data as any[]) {
      for (const a of course.assignments || []) {
        if (a.dueAt && a.status === "unsubmitted") {
          const dueDate = new Date(a.dueAt);
          if (dueDate >= now && dueDate <= weekFromNow) {
            upcomingAssignments.push({ name: a.name, dueAt: a.dueAt, courseName: course.name });
          }
        }
      }
    }
  }

  // 2. Get all cards with topics
  let cardQuery = supabase.from("cards").select("id, front, back, topic, answer_type, choices, decks(subject)").order("created_at");
  if (subject !== "all") {
    cardQuery = supabase.from("cards").select("id, front, back, topic, answer_type, choices, decks!inner(subject)").eq("decks.subject", subject).order("created_at");
  }
  const { data: cards } = await cardQuery;
  if (!cards || cards.length === 0) {
    return NextResponse.json({ cards: [], assignments: [], matchedTopics: [] });
  }

  // 2b. Load FSRS state for this student to prioritize due cards
  const { data: reviews } = await supabase
    .from("card_reviews")
    .select("card_id, next_review_at, reps")
    .eq("user_id", studentId);

  const reviewMap = new Map<string, { next_review_at: string; reps: number }>();
  if (reviews) {
    for (const r of reviews) {
      reviewMap.set(r.card_id, { next_review_at: r.next_review_at, reps: r.reps });
    }
  }

  const nowStr = new Date().toISOString();

  // Separate cards into: due (FSRS says review now), unseen (never reviewed), and not-yet-due
  const dueCards: any[] = [];
  const unseenCards: any[] = [];
  const notDueCards: any[] = [];

  for (const card of cards) {
    const review = reviewMap.get((card as any).id);
    if (!review) {
      unseenCards.push(card);
    } else if (review.next_review_at <= nowStr) {
      dueCards.push(card);
    } else {
      notDueCards.push(card);
    }
  }

  // 3. Match assignments to card topics using AI
  let matchedTopics: string[] = [];

  if (upcomingAssignments.length > 0 && ANTHROPIC_API_KEY) {
    const allTopics = [...new Set(cards.map((c: any) => c.topic).filter(Boolean))];
    const assignmentList = upcomingAssignments.map((a, i) => `${i + 1}. "${a.name}" (${a.courseName})`).join("\n");
    const topicList = allTopics.join(", ");

    const prompt = `Match these upcoming school assignments to the most relevant flashcard topics.

Assignments due this week:
${assignmentList}

Available flashcard topics: ${topicList}

For each assignment, list which topics are relevant. Respond with ONLY a JSON array of matching topic strings (no duplicates):
["topic1", "topic2", ...]

Only include topics that directly relate to the assignments. If no topics match, return [].`;

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

      if (response.ok) {
        const data = await response.json();
        let text = data.content[0]?.text || "[]";
        text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        matchedTopics = JSON.parse(text);
      }
    } catch {
      // Fall back to no matching
    }
  }

  // 4. Build session: prioritize (1) due cards in matched topics, (2) other due cards, (3) unseen cards
  const priorityDue: any[] = [];
  const normalDue: any[] = [];
  const priorityUnseen: any[] = [];
  const normalUnseen: any[] = [];

  for (const card of dueCards) {
    if (matchedTopics.includes((card as any).topic)) {
      priorityDue.push(card);
    } else {
      normalDue.push(card);
    }
  }

  for (const card of unseenCards) {
    if (matchedTopics.includes((card as any).topic)) {
      priorityUnseen.push(card);
    } else {
      normalUnseen.push(card);
    }
  }

  // Shuffle each pool
  priorityDue.sort(() => Math.random() - 0.5);
  normalDue.sort(() => Math.random() - 0.5);
  priorityUnseen.sort(() => Math.random() - 0.5);
  normalUnseen.sort(() => Math.random() - 0.5);

  const sessionSize = mode === "quick5" ? 5 : 20;

  // Fill session: priority due → normal due → priority unseen → normal unseen
  const sessionCards: any[] = [];
  const pools = [priorityDue, normalDue, priorityUnseen, normalUnseen];
  for (const pool of pools) {
    for (const card of pool) {
      if (sessionCards.length >= sessionSize) break;
      sessionCards.push(card);
    }
    if (sessionCards.length >= sessionSize) break;
  }

  // If still not enough, add from not-due cards
  if (sessionCards.length < sessionSize) {
    notDueCards.sort(() => Math.random() - 0.5);
    for (const card of notDueCards) {
      if (sessionCards.length >= sessionSize) break;
      sessionCards.push(card);
    }
  }

  // Shuffle final session
  sessionCards.sort(() => Math.random() - 0.5);

  // Also return ALL cards for MC distractor generation
  const allCardsForDistractors = cards.slice(0, 100);

  return NextResponse.json({
    cards: sessionCards,
    allCards: allCardsForDistractors,
    assignments: upcomingAssignments.map((a) => ({ name: a.name, dueAt: a.dueAt })),
    matchedTopics,
    dueCount: dueCards.length,
    unseenCount: unseenCards.length,
    totalDue: cards.length,
  });
}
