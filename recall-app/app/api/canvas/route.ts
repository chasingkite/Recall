import { NextResponse } from "next/server";

const CANVAS_BASE = process.env.CANVAS_BASE_URL || "https://cuhsd.instructure.com/api/v1";
const TOKEN = process.env.CANVAS_API_TOKEN || "";
const STUDENT_ID = process.env.CANVAS_STUDENT_ID || "81991";
const EXCLUDED_COURSE_IDS = [29747];

interface CanvasCourse {
  id: number;
  name: string;
  enrollments?: Array<{
    computed_current_score: number | null;
    computed_current_grade: string | null;
  }>;
}

interface CanvasSubmission {
  workflow_state: string;
  score: number | null;
  submitted_at: string | null;
  assignment?: {
    name: string;
    due_at: string | null;
    points_possible: number | null;
    submission_types: string[];
  };
}

async function canvasFetch(path: string) {
  const res = await fetch(`${CANVAS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET() {
  const courses: CanvasCourse[] = await canvasFetch(
    `/users/${STUDENT_ID}/courses?include[]=total_scores&per_page=50`
  );

  if (!courses) {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }

  const activeCourses = courses.filter(
    (c) => c.enrollments && c.enrollments.length > 0 && !EXCLUDED_COURSE_IDS.includes(c.id)
  );

  const courseAssignments = await Promise.all(
    activeCourses.map(async (course) => {
      const submissions: CanvasSubmission[] | null = await canvasFetch(
        `/courses/${course.id}/students/submissions?student_ids[]=${STUDENT_ID}&include[]=assignment&per_page=100`
      );

      const assignments = (submissions || [])
        .filter((s) => s.assignment?.name)
        .map((s) => ({
          name: s.assignment!.name,
          dueAt: s.assignment!.due_at,
          status: s.workflow_state,
          score: s.score,
          pointsPossible: s.assignment!.points_possible,
          submittedAt: s.submitted_at,
          submissionType: s.assignment!.submission_types.includes("on_paper") ? "on_paper" : "online",
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

  return NextResponse.json(courseAssignments);
}
