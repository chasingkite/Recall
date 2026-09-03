import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "No Anthropic API key" }, { status: 500 });
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, canvas_student_id")
    .not("canvas_student_id", "is", null);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ matched: 0, message: "No Canvas-linked users" });
  }

  const { data: cards } = await supabase
    .from("cards")
    .select("topic")
    .not("topic", "is", null);

  const allTopics = [...new Set((cards || []).map((c: any) => c.topic).filter(Boolean))];
  if (allTopics.length === 0) {
    return NextResponse.json({ matched: 0, message: "No card topics available" });
  }

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86400000);
  let matched = 0;

  for (const profile of profiles) {
    const { data: cache } = await supabase
      .from("canvas_cache")
      .select("data")
      .eq("student_id", profile.canvas_student_id)
      .single();

    if (!cache?.data) continue;

    const upcomingAssignments: { name: string; courseName: string }[] = [];
    for (const course of cache.data as any[]) {
      for (const a of course.assignments || []) {
        if (a.dueAt && a.status === "unsubmitted") {
          const dueDate = new Date(a.dueAt);
          if (dueDate >= now && dueDate <= weekFromNow) {
            upcomingAssignments.push({ name: a.name, courseName: course.name });
          }
        }
      }
    }

    if (upcomingAssignments.length === 0) continue;

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
        const matchedTopics = JSON.parse(text);

        const cacheKey = `topics_${profile.id}_${today}`;
        await supabase.from("canvas_cache").upsert(
          { student_id: cacheKey, data: { matchedTopics }, synced_at: new Date().toISOString() },
          { onConflict: "student_id" }
        );

        matched++;
      }
    } catch {}
  }

  return NextResponse.json({ matched, timestamp: new Date().toISOString() });
}
