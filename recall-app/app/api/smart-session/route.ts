import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const memCache = new Map<string, { data: any; ts: number }>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const mode = searchParams.get("mode") || "full";
  const subject = searchParams.get("subject") || "all";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Look up the user's Canvas student ID and subjects from their profile
  let canvasStudentId: string | null = null;
  let userSubjects: string[] = [];
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("canvas_student_id, subjects")
      .eq("id", userId)
      .single();
    canvasStudentId = profile?.canvas_student_id || null;
    userSubjects = profile?.subjects || [];
  }

  // 1. Get upcoming assignments and grades from Canvas cache (only if user has Canvas)
  const { data: cache } = canvasStudentId
    ? await supabase.from("canvas_cache").select("data").eq("student_id", canvasStudentId).single()
    : { data: null };

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86400000);
  const upcomingAssignments: { name: string; dueAt: string; courseName: string }[] = [];
  const courseGrades: Record<string, number> = {};

  if (cache?.data) {
    for (const course of cache.data as any[]) {
      if (course.score != null) {
        const name = (course.name || "").toLowerCase();
        const mapped = name.includes("math") ? "math"
          : name.includes("english") ? "english"
          : name.includes("spanish") ? "spanish"
          : name.includes("bio") ? "biology"
          : name.includes("pe") || name.includes("physical") ? "pe"
          : null;
        if (mapped) courseGrades[mapped] = course.score;
      }
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

  // 2. Get cards — filtered by user's subjects when subject=all
  let cardQuery;
  if (subject !== "all") {
    cardQuery = supabase.from("cards").select("id, front, back, topic, answer_type, choices, decks!inner(subject)").eq("decks.subject", subject).order("created_at");
  } else if (userSubjects.length > 0) {
    cardQuery = supabase.from("cards").select("id, front, back, topic, answer_type, choices, decks!inner(subject)").in("decks.subject", userSubjects).order("created_at");
  } else {
    cardQuery = supabase.from("cards").select("id, front, back, topic, answer_type, choices, decks(subject)").order("created_at");
  }
  const { data: cards } = await cardQuery;
  if (!cards || cards.length === 0) {
    return NextResponse.json({ cards: [], assignments: [], matchedTopics: [], dueCount: 0, unseenCount: 0, totalDue: 0 });
  }

  // 2b. Load FSRS state for this user
  const { data: reviews } = userId
    ? await supabase.from("card_reviews").select("card_id, next_review_at, reps").eq("user_id", userId)
    : { data: null };

  const reviewMap = new Map<string, { next_review_at: string; reps: number }>();
  if (reviews) {
    for (const r of reviews) {
      reviewMap.set(r.card_id, { next_review_at: r.next_review_at, reps: r.reps });
    }
  }

  const nowStr = new Date().toISOString();
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

  // 3. Match assignments to card topics — cached per day
  let matchedTopics: string[] = [];

  if (upcomingAssignments.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const cacheKey = `topics_${userId}_${today}`;

    // Check in-memory cache
    const cached = memCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 24 * 60 * 60 * 1000) {
      matchedTopics = cached.data;
    } else {
      // Check Supabase cache
      let fromDb = false;
      try {
        const { data: dbCache } = await supabase
          .from("canvas_cache")
          .select("data, updated_at")
          .eq("student_id", cacheKey)
          .single();

        if (dbCache?.data?.matchedTopics) {
          const age = Date.now() - new Date(dbCache.updated_at).getTime();
          if (age < 24 * 60 * 60 * 1000) {
            matchedTopics = dbCache.data.matchedTopics;
            memCache.set(cacheKey, { data: matchedTopics, ts: Date.now() });
            fromDb = true;
          }
        }
      } catch {}

      // Generate fresh with Claude (only if not cached and API key available)
      if (!fromDb && ANTHROPIC_API_KEY) {
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
        } catch {}

        // Cache to memory + Supabase
        memCache.set(cacheKey, { data: matchedTopics, ts: Date.now() });
        try {
          await supabase.from("canvas_cache").upsert(
            { student_id: cacheKey, data: { matchedTopics }, updated_at: new Date().toISOString() },
            { onConflict: "student_id" }
          );
        } catch {}
      }
    }
  }

  // 4. Build session — guarantee subject diversity
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

  priorityDue.sort(() => Math.random() - 0.5);
  normalDue.sort(() => Math.random() - 0.5);
  priorityUnseen.sort(() => Math.random() - 0.5);
  normalUnseen.sort(() => Math.random() - 0.5);

  const sessionSize = mode === "quick5" ? 5 : 20;

  // Reserve slots for each subject — weighted by grade gap (lower grade = more cards)
  const allSubjects = [...new Set(cards.map((c: any) => c.decks?.subject).filter(Boolean))];
  const A_THRESHOLD = 93;
  const subjectWeights: Record<string, number> = {};
  let totalWeight = 0;
  for (const subj of allSubjects) {
    const grade = courseGrades[subj];
    const gap = grade != null ? Math.max(0, A_THRESHOLD - grade) : 5;
    const weight = Math.max(1, gap);
    subjectWeights[subj] = weight;
    totalWeight += weight;
  }

  const reservedTotal = Math.min(Math.floor(sessionSize * 0.6), sessionSize - 2);
  const subjectSlots: Record<string, number> = {};
  for (const subj of allSubjects) {
    subjectSlots[subj] = Math.max(1, Math.round((subjectWeights[subj] / totalWeight) * reservedTotal));
  }
  const prioritySlots = sessionSize - Object.values(subjectSlots).reduce((a, b) => a + b, 0);

  const sessionCards: any[] = [];
  const usedIds = new Set<string>();

  // Fill priority slots (Canvas-matched topics first)
  const pools = [priorityDue, normalDue, priorityUnseen, normalUnseen];
  for (const pool of pools) {
    for (const card of pool) {
      if (sessionCards.length >= prioritySlots) break;
      if (!usedIds.has((card as any).id)) {
        sessionCards.push(card);
        usedIds.add((card as any).id);
      }
    }
    if (sessionCards.length >= prioritySlots) break;
  }

  // Fill reserved slots — weighted by grade, lowest grades get more cards
  const sessionSubjects = new Set(sessionCards.map((c: any) => c.decks?.subject));
  const allAvailable = [...dueCards, ...unseenCards, ...notDueCards];

  // Sort subjects by weight descending (lowest grade first)
  const sortedSubjects = allSubjects.sort((a, b) => subjectWeights[b] - subjectWeights[a]);

  for (const subj of sortedSubjects) {
    const existingCount = sessionCards.filter((c: any) => c.decks?.subject === subj).length;
    const needed = (subjectSlots[subj] || 1) - existingCount;
    if (needed <= 0) continue;

    const subjectPool = allAvailable
      .filter((c: any) => c.decks?.subject === subj && !usedIds.has(c.id))
      .sort(() => Math.random() - 0.5);
    const toAdd = Math.min(needed, subjectPool.length);
    for (let i = 0; i < toAdd && sessionCards.length < sessionSize; i++) {
      sessionCards.push(subjectPool[i]);
      usedIds.add(subjectPool[i].id);
    }
  }

  // Fill any remaining slots
  if (sessionCards.length < sessionSize) {
    const remaining = allAvailable
      .filter((c: any) => !usedIds.has(c.id))
      .sort(() => Math.random() - 0.5);
    for (const card of remaining) {
      if (sessionCards.length >= sessionSize) break;
      sessionCards.push(card);
      usedIds.add((card as any).id);
    }
  }

  sessionCards.sort(() => Math.random() - 0.5);

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
