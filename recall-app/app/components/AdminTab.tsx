"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import ImportDeck from "./ImportDeck";

interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: string;
  canvas_student_id: string | null;
  subjects: string[];
}

const AVAILABLE_SUBJECTS = ["spanish", "biology", "english", "math", "science", "history", "reading"];

export default function AdminTab() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editSubjects, setEditSubjects] = useState<string[]>([]);
  const [editCanvasId, setEditCanvasId] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    if (data) setUsers(data);
    setLoading(false);
  }

  function startEdit(user: Profile) {
    setEditingUser(user.id);
    setEditSubjects(user.subjects || []);
    setEditCanvasId(user.canvas_student_id || "");
  }

  async function saveUser(userId: string) {
    await supabase.from("profiles").update({
      subjects: editSubjects,
      canvas_student_id: editCanvasId || null,
    }).eq("id", userId);
    setEditingUser(null);
    loadUsers();
  }

  async function setRole(userId: string, role: string) {
    await supabase.from("profiles").update({ role }).eq("id", userId);
    loadUsers();
  }

  function toggleSubject(subject: string) {
    setEditSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  }

  function addCustomSubject() {
    if (newSubject.trim() && !editSubjects.includes(newSubject.trim().toLowerCase())) {
      setEditSubjects((prev) => [...prev, newSubject.trim().toLowerCase()]);
      setNewSubject("");
    }
  }

  const [showImport, setShowImport] = useState(false);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  }

  if (showImport) {
    return (
      <div className="w-full">
        <button onClick={() => setShowImport(false)} className="text-xs text-blue-600 mb-4 hover:text-blue-800">&larr; Back to Admin</button>
        <ImportDeck />
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Admin Panel</h1>

      {/* Import Deck Button */}
      <button
        onClick={() => setShowImport(true)}
        className="w-full mb-6 py-3 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
      >
        + Import Deck (CSV / Anki)
      </button>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Manage Users</h2>
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{user.display_name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                user.role === "admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
              }`}>
                {user.role}
              </span>
            </div>

            {/* Subjects display */}
            <div className="flex flex-wrap gap-1 mb-2">
              {(user.subjects || []).map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{s}</span>
              ))}
              {(!user.subjects || user.subjects.length === 0) && (
                <span className="text-xs text-gray-400 italic">No subjects assigned</span>
              )}
            </div>

            {user.canvas_student_id && (
              <p className="text-xs text-gray-400 mb-2">Canvas ID: {user.canvas_student_id}</p>
            )}

            {editingUser === user.id ? (
              <div className="mt-3 border-t border-gray-100 pt-3">
                {/* Subject toggles */}
                <p className="text-xs font-medium text-gray-700 mb-2">Subjects:</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {AVAILABLE_SUBJECTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSubject(s)}
                      className={`text-xs px-2.5 py-1 rounded-full border capitalize ${
                        editSubjects.includes(s) ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {/* Custom subject */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomSubject()}
                    placeholder="Add custom subject..."
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-300"
                  />
                  <button onClick={addCustomSubject} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">Add</button>
                </div>
                {/* Canvas ID */}
                <p className="text-xs font-medium text-gray-700 mb-1">Canvas Student ID:</p>
                <input
                  type="text"
                  value={editCanvasId}
                  onChange={(e) => setEditCanvasId(e.target.value)}
                  placeholder="Leave empty if no Canvas access"
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-300 mb-3"
                />
                {/* Role */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setRole(user.id, "student")}
                    className={`text-xs px-3 py-1 rounded-full border ${user.role === "student" ? "bg-blue-500 text-white" : "bg-white text-gray-600"}`}
                  >
                    Student
                  </button>
                  <button
                    onClick={() => setRole(user.id, "admin")}
                    className={`text-xs px-3 py-1 rounded-full border ${user.role === "admin" ? "bg-red-500 text-white" : "bg-white text-gray-600"}`}
                  >
                    Admin
                  </button>
                </div>
                {/* Save/Cancel */}
                <div className="flex gap-2">
                  <button onClick={() => saveUser(user.id)} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium">Save</button>
                  <button onClick={() => setEditingUser(null)} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => startEdit(user)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Edit
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
