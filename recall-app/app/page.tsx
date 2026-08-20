"use client";

import { useState, useEffect } from "react";
import { createClient } from "./lib/supabase/client";
import DashboardTab from "./components/DashboardTab";
import StudyTab from "./components/StudyTab";
import ProgressTab from "./components/ProgressTab";
import RewardsTab from "./components/RewardsTab";

type Tab = "dashboard" | "study" | "progress" | "rewards";

interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: string;
  canvas_student_id: string | null;
  subjects: string[];
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("study");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        if (data.canvas_student_id) setTab("dashboard");
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const hasDashboard = !!profile?.canvas_student_id;
  const tabs = hasDashboard
    ? ["dashboard", "study", "progress", "rewards"] as Tab[]
    : ["study", "progress", "rewards"] as Tab[];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">{profile?.display_name || "Recall"}</span>
        <button onClick={signOut} className="text-xs text-gray-500 hover:text-gray-700">Sign out</button>
      </header>

      <div className="flex-1 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        {tab === "dashboard" && hasDashboard && <DashboardTab />}
        {tab === "study" && <StudyTab />}
        {tab === "progress" && <ProgressTab />}
        {tab === "rewards" && <RewardsTab />}
      </div>

      <nav className="sticky bottom-0 border-t border-gray-200 bg-white">
        <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto flex">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-center text-xs sm:text-sm font-medium ${
                tab === t
                  ? t === "rewards" ? "text-amber-600 border-t-2 border-amber-500" : "text-blue-600 border-t-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
