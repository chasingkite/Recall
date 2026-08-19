"use client";

import { useState } from "react";
import DashboardTab from "./components/DashboardTab";
import StudyTab from "./components/StudyTab";
import ProgressTab from "./components/ProgressTab";
import RewardsTab from "./components/RewardsTab";

type Tab = "dashboard" | "study" | "progress" | "rewards";

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "study" && <StudyTab />}
        {tab === "progress" && <ProgressTab />}
        {tab === "rewards" && <RewardsTab />}
      </div>

      <nav className="sticky bottom-0 border-t border-gray-200 bg-white">
        <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto flex">
          <button
            onClick={() => setTab("dashboard")}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-medium ${
              tab === "dashboard" ? "text-blue-600 border-t-2 border-blue-600" : "text-gray-500"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setTab("study")}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-medium ${
              tab === "study" ? "text-blue-600 border-t-2 border-blue-600" : "text-gray-500"
            }`}
          >
            Study
          </button>
          <button
            onClick={() => setTab("progress")}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-medium ${
              tab === "progress" ? "text-blue-600 border-t-2 border-blue-600" : "text-gray-500"
            }`}
          >
            Progress
          </button>
          <button
            onClick={() => setTab("rewards")}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-medium ${
              tab === "rewards" ? "text-amber-600 border-t-2 border-amber-500" : "text-gray-500"
            }`}
          >
            Rewards
          </button>
        </div>
      </nav>
    </div>
  );
}
