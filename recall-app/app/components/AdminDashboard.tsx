"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: string;
  canvas_student_id: string | null;
  subjects: string[];
}

interface StudentSummary {
  profile: Profile;
  studyStats: { totalReviews: number; correctReviews: number; subjects: Record<string, { totalReviews: number; correctReviews: number }> } | null;
  pointsBalance: number;
  totalSessions: number;
}

export default function AdminDashboard() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [activeStudent, setActiveStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student");

      if (profiles) {
        const summaries: StudentSummary[] = profiles.map((p) => ({
          profile: p,
          studyStats: null,
          pointsBalance: 0,
          totalSessions: 0,
        }));
        setStudents(summaries);
        if (summaries.length > 0) setActiveStudent(summaries[0].profile.id);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No students registered yet.</p>
      </div>
    );
  }

  const active = students.find((s) => s.profile.id === activeStudent);

  return (
    <div className="w-full">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Student Overview</h1>

      {/* Student tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {students.map((s) => (
          <button
            key={s.profile.id}
            onClick={() => setActiveStudent(s.profile.id)}
            className={`shrink-0 text-sm px-4 py-2 rounded-full border font-medium transition-colors ${
              activeStudent === s.profile.id
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {s.profile.display_name}
          </button>
        ))}
      </div>

      {active && <StudentDetail student={active} />}
    </div>
  );
}

function StudentDetail({ student }: { student: StudentSummary }) {
  const { profile } = student;
  const hasCanvas = !!profile.canvas_student_id;

  return (
    <div>
      {/* Student header */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{profile.display_name}</p>
            <p className="text-xs text-gray-500">{profile.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasCanvas && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Canvas linked</span>}
            {!hasCanvas && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">No Canvas</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {(profile.subjects || []).map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize">{s}</span>
          ))}
        </div>
      </div>

      {/* Study Progress */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Study Progress</h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{student.totalSessions}</div>
          <div className="text-xs text-gray-500">Sessions</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{student.studyStats ? Math.round((student.studyStats.correctReviews / Math.max(1, student.studyStats.totalReviews)) * 100) : 0}%</div>
          <div className="text-xs text-gray-500">Accuracy</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{student.pointsBalance}</div>
          <div className="text-xs text-gray-500">Points</div>
        </div>
      </div>

      {/* Per-subject mastery */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Mastery by Subject</h2>
      <div className="space-y-2 mb-6">
        {(profile.subjects || []).map((subject) => {
          const subjectStats = student.studyStats?.subjects[subject];
          const mastery = subjectStats ? Math.round((subjectStats.correctReviews / Math.max(1, subjectStats.totalReviews)) * 100) : 0;
          return (
            <div key={subject} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700 capitalize">{subject}</span>
                <span className="text-xs text-gray-500">{mastery}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${mastery}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Canvas assignments summary (if linked) */}
      {hasCanvas && <CanvasSummary studentId={profile.canvas_student_id!} />}

      {!hasCanvas && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">No Canvas account linked.</p>
          <p className="text-xs text-gray-400 mt-1">Assign a Canvas Student ID in the Admin tab to enable the assignments dashboard.</p>
        </div>
      )}
    </div>
  );
}

function CanvasSummary({ studentId }: { studentId: string }) {
  const [courses, setCourses] = useState<{ name: string; grade: string | null; score: number | null; assignments: { status: string; dueAt?: string }[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/canvas")
      .then((r) => r.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return <div className="flex justify-center py-4"><div className="animate-spin h-5 w-5 border-3 border-blue-500 border-t-transparent rounded-full" /></div>;
  }

  const totalAssignments = courses.reduce((sum, c) => sum + c.assignments.length, 0);
  const completedAssignments = courses.reduce((sum, c) => sum + c.assignments.filter((a) => a.status === "graded" || a.status === "submitted").length, 0);
  const overdueAssignments = courses.reduce((sum, c) => sum + c.assignments.filter((a) => a.status === "unsubmitted" && a.dueAt && new Date(a.dueAt) < new Date()).length, 0);

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Canvas Summary</h2>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-green-700">{completedAssignments}/{totalAssignments}</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-red-700">{overdueAssignments}</div>
          <div className="text-xs text-gray-500">Overdue</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-blue-700">{courses.length}</div>
          <div className="text-xs text-gray-500">Classes</div>
        </div>
      </div>

      <div className="space-y-2">
        {courses.map((c) => (
          <div key={c.name} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
            <span className="text-xs text-gray-700">{c.name.split("-")[0].replace(/^\d+\s*/, "").trim()}</span>
            <span className="text-sm font-bold text-gray-900">{c.grade || "--"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
