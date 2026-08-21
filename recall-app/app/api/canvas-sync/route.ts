import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CANVAS_BASE = process.env.CANVAS_BASE_URL || "https://cuhsd.instructure.com/api/v1";
const TOKEN = process.env.CANVAS_API_TOKEN || "";
const EXCLUDED_COURSE_IDS = [29747];

async function canvasFetch(path: string) {
  const res = await fetch(`${CANVAS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function POST(request: Request) {
  const { studentId } = await request.json();

  if (!studentId || !TOKEN) {
    return NextResponse.json({ error: "Missing studentId or token" }, { status: 400 });
  }

  // Fetch fresh data from Canvas
  const courses = await canvasFetch(
    `/users/${studentId}/courses?include[]=total_scores&per_page=50`
  );

  if (!courses) {
    return NextResponse.json({ error: "Failed to fetch from Canvas" }, { status: 500 });
  }

  const activeCourses = courses.filter(
    (c: any) => c.enrollments && c.enrollments.length > 0 && !EXCLUDED_COURSE_IDS.includes(c.id)
  );

  const courseAssignments = await Promise.all(
    activeCourses.map(async (course: any) => {
      const submissions = await canvasFetch(
        `/courses/${course.id}/students/submissions?student_ids[]=${studentId}&include[]=assignment&per_page=100`
      );

      const assignments = (submissions || [])
        .filter((s: any) => s.assignment?.name)
        .map((s: any) => ({
          name: s.assignment.name,
          dueAt: s.assignment.due_at,
          status: s.workflow_state,
          score: s.score,
          pointsPossible: s.assignment.points_possible,
          submittedAt: s.submitted_at,
          submissionType: s.assignment.submission_types?.includes("on_paper") ? "on_paper" : "online",
          courseName: course.name,
          courseId: course.id,
        }));

      return {
        id: course.id,
        name: course.name,
        grade: course.enrollments?.[0]?.computed_current_grade ?? null,
        score: course.enrollments?.[0]?.computed_current_score ?? null,
        assignments,
      };
    })
  );

  // Upsert into Supabase cache
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  await supabase.from("canvas_cache").upsert(
    { student_id: studentId, data: courseAssignments, synced_at: new Date().toISOString() },
    { onConflict: "student_id" }
  );

  return NextResponse.json({ success: true, courses: courseAssignments.length, synced_at: new Date().toISOString() });
}

// GET: return cached data, sync if stale (>1 hour)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId") || process.env.CANVAS_STUDENT_ID || "81991";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check cache
  const { data: cached } = await supabase
    .from("canvas_cache")
    .select("*")
    .eq("student_id", studentId)
    .single();

  if (cached) {
    const syncedAt = new Date(cached.synced_at);
    const ageMinutes = (Date.now() - syncedAt.getTime()) / (1000 * 60);

    // If cache is less than 60 minutes old, return it
    if (ageMinutes < 60) {
      return NextResponse.json({ data: cached.data, synced_at: cached.synced_at, fromCache: true });
    }
  }

  // Cache is stale or missing — sync from Canvas
  if (!TOKEN) {
    // No token, return whatever cache we have (even if stale)
    if (cached) {
      return NextResponse.json({ data: cached.data, synced_at: cached.synced_at, fromCache: true, stale: true });
    }
    return NextResponse.json({ data: [], synced_at: null, fromCache: false });
  }

  // Fetch fresh
  const courses = await canvasFetch(
    `/users/${studentId}/courses?include[]=total_scores&per_page=50`
  );

  if (!courses) {
    // Canvas failed, return stale cache if available
    if (cached) {
      return NextResponse.json({ data: cached.data, synced_at: cached.synced_at, fromCache: true, stale: true });
    }
    return NextResponse.json({ data: [], synced_at: null, fromCache: false });
  }

  const activeCourses = courses.filter(
    (c: any) => c.enrollments && c.enrollments.length > 0 && !EXCLUDED_COURSE_IDS.includes(c.id)
  );

  const courseAssignments = await Promise.all(
    activeCourses.map(async (course: any) => {
      const submissions = await canvasFetch(
        `/courses/${course.id}/students/submissions?student_ids[]=${studentId}&include[]=assignment&per_page=100`
      );

      const assignments = (submissions || [])
        .filter((s: any) => s.assignment?.name)
        .map((s: any) => ({
          name: s.assignment.name,
          dueAt: s.assignment.due_at,
          status: s.workflow_state,
          score: s.score,
          pointsPossible: s.assignment.points_possible,
          submittedAt: s.submitted_at,
          submissionType: s.assignment.submission_types?.includes("on_paper") ? "on_paper" : "online",
          courseName: course.name,
          courseId: course.id,
        }));

      return {
        id: course.id,
        name: course.name,
        grade: course.enrollments?.[0]?.computed_current_grade ?? null,
        score: course.enrollments?.[0]?.computed_current_score ?? null,
        assignments,
      };
    })
  );

  // Update cache
  await supabase.from("canvas_cache").upsert(
    { student_id: studentId, data: courseAssignments, synced_at: new Date().toISOString() },
    { onConflict: "student_id" }
  );

  return NextResponse.json({ data: courseAssignments, synced_at: new Date().toISOString(), fromCache: false });
}
