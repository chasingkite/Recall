import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CANVAS_BASE = process.env.CANVAS_BASE_URL || "https://cuhsd.instructure.com/api/v1";
const TOKEN = process.env.CANVAS_API_TOKEN || "";
const EXCLUDED_COURSE_IDS = [29747];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function canvasFetch(path: string) {
  const res = await fetch(`${CANVAS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!TOKEN) {
    return NextResponse.json({ error: "No Canvas token" }, { status: 500 });
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, canvas_student_id")
    .not("canvas_student_id", "is", null);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ synced: 0, message: "No Canvas-linked users" });
  }

  let synced = 0;

  for (const profile of profiles) {
    const studentId = profile.canvas_student_id;

    const courses = await canvasFetch(
      `/users/${studentId}/courses?include[]=total_scores&per_page=50`
    );
    if (!courses) continue;

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
          .filter((s: any) => {
            if (!s.assignment.due_at) return true;
            const dueYear = new Date(s.assignment.due_at).getFullYear();
            const currentYear = new Date().getFullYear();
            return dueYear >= currentYear - 1;
          })
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

    await supabase.from("canvas_cache").upsert(
      { student_id: studentId, data: courseAssignments, synced_at: new Date().toISOString() },
      { onConflict: "student_id" }
    );

    synced++;
  }

  return NextResponse.json({ synced, timestamp: new Date().toISOString() });
}
