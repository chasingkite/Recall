#!/usr/bin/env node

/**
 * Recall App — Automated Integration Tests
 * Creates a test auth user + profile, runs all API tests, cleans up.
 *
 * Usage: node test-integration.mjs
 * Requires: dev server on http://localhost:3001, .env.local with SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from "fs";

// Load env from .env.local
const envFile = readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile.split("\n").filter(l => l && !l.startsWith("#")).map(l => {
    const [k, ...v] = l.split("=");
    return [k.trim(), v.join("=").trim()];
  })
);

const BASE = "http://localhost:3001";
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const SB_HEADERS = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

let passed = 0, failed = 0;
const errors = [];
let TEST_USER_ID = null;
let TEST_CARD_ID = null;

function assert(ok, name, detail) {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; const m = `  ❌ ${name}${detail ? ` — ${detail}` : ""}`; console.log(m); errors.push(m); }
}

async function api(url, opts) {
  const r = await fetch(url, opts);
  const text = await r.text();
  try { return { status: r.status, data: JSON.parse(text) }; }
  catch { return { status: r.status, data: text }; }
}

// ==================== SETUP ====================
async function setup() {
  console.log("\n🔧 Setup");

  // Create auth user
  const authRes = await fetch(`${SB_URL}/auth/v1/admin/users`, {
    method: "POST", headers: SB_HEADERS,
    body: JSON.stringify({ email: "test-auto@recall.test", password: "TestPass123!", email_confirm: true }),
  });
  const authData = await authRes.json();

  if (authData.id) {
    TEST_USER_ID = authData.id;
    console.log(`  Created auth user: ${TEST_USER_ID.slice(0, 8)}...`);
  } else if (authData.msg?.includes("already been registered") || authData.code === "email_exists") {
    // User exists — find their ID
    const listRes = await fetch(`${SB_URL}/auth/v1/admin/users?page=1&per_page=50`, { headers: SB_HEADERS });
    const listData = await listRes.json();
    const existing = listData.users?.find(u => u.email === "test-auto@recall.test");
    if (existing) {
      TEST_USER_ID = existing.id;
      console.log(`  Found existing auth user: ${TEST_USER_ID.slice(0, 8)}...`);
    } else {
      console.log("  ❌ Could not find or create test user");
      process.exit(1);
    }
  } else {
    console.log(`  ❌ Auth user creation failed: ${JSON.stringify(authData)}`);
    process.exit(1);
  }

  // Create profile (may already exist)
  await fetch(`${SB_URL}/rest/v1/profiles`, {
    method: "POST", headers: { ...SB_HEADERS, Prefer: "return=representation" },
    body: JSON.stringify({
      id: TEST_USER_ID, email: "test-auto@recall.test", display_name: "Test Student",
      role: "student", subjects: ["spanish", "biology", "english", "math"],
    }),
  });
  console.log("  Profile ready");

  // Get a card ID
  const { data } = await api(`${BASE}/api/smart-session?studentId=81991&mode=quick5&subject=all`);
  if (data?.cards?.length > 0) {
    TEST_CARD_ID = data.cards[0].id;
    console.log(`  Card ID: ${TEST_CARD_ID.slice(0, 12)}...`);
  }
}

// ==================== CLEANUP ====================
async function cleanup() {
  console.log("\n🧹 Cleanup");
  if (!TEST_USER_ID) return;

  const tables = ["daily_progress", "card_reviews", "memory_scores", "streaks",
    "points_ledger", "points_transactions", "redemptions", "topic_levels"];
  for (const t of tables) {
    await fetch(`${SB_URL}/rest/v1/${t}?user_id=eq.${TEST_USER_ID}`, { method: "DELETE", headers: SB_HEADERS });
  }
  // Delete study_sessions for test user
  await fetch(`${SB_URL}/rest/v1/study_sessions?user_id=eq.${TEST_USER_ID}`, { method: "DELETE", headers: SB_HEADERS });
  // Delete profile
  await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${TEST_USER_ID}`, { method: "DELETE", headers: SB_HEADERS });
  // Delete auth user
  await fetch(`${SB_URL}/auth/v1/admin/users/${TEST_USER_ID}`, { method: "DELETE", headers: SB_HEADERS });
  console.log("  Test user and all data removed");
}

// ==================== TESTS ====================

async function testSmartSession() {
  console.log("\n📋 Smart Session");
  const { status, data } = await api(`${BASE}/api/smart-session?studentId=81991&mode=quick5&subject=all`);
  assert(status === 200, "Returns 200", `got ${status}`);
  assert(data?.cards?.length > 0 && data.cards.length <= 5, `1-5 cards (got ${data?.cards?.length})`);
  assert(typeof data?.dueCount === "number", "Has dueCount");
  assert(typeof data?.unseenCount === "number", "Has unseenCount");

  const { data: d2 } = await api(`${BASE}/api/smart-session?studentId=81991&mode=quick5&subject=biology`);
  if (d2?.cards?.length > 0) {
    assert(d2.cards.every(c => c.decks?.subject === "biology"), "Subject filter works");
  }
}

async function testDailyProgress() {
  console.log("\n🎯 Daily Progress");

  const { data: d1 } = await api(`${BASE}/api/daily-progress?userId=${TEST_USER_ID}`);
  assert(d1.cards_correct === 0, "Starts at 0");
  assert(d1.goal_target === 20, "Goal = 20");

  const { data: d2 } = await api(`${BASE}/api/daily-progress`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, cardsReviewed: 5, cardsCorrect: 4 }),
  });
  assert(d2.cards_correct === 4, `Correct = 4 (got ${d2.cards_correct})`);
  assert(d2.goal_met === false, "Not met at 4/20");

  const { data: d3 } = await api(`${BASE}/api/daily-progress`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, cardsReviewed: 20, cardsCorrect: 16 }),
  });
  assert(d3.cards_correct === 20, `Accumulated to 20 (got ${d3.cards_correct})`);
  assert(d3.goal_met === true, "Goal met");
  assert(d3.just_met_goal === true, "just_met_goal fired");

  const { data: d4 } = await api(`${BASE}/api/daily-progress`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, cardsReviewed: 5, cardsCorrect: 5 }),
  });
  assert(d4.just_met_goal === false, "Doesn't re-fire");
}

async function testCardReview() {
  console.log("\n🧠 Card Review (FSRS)");
  if (!TEST_CARD_ID) { console.log("  ⏭️ Skipped"); return; }

  const { status, data } = await api(`${BASE}/api/card-review`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, cardId: TEST_CARD_ID, rating: 3 }),
  });
  assert(status === 200, "POST returns 200");
  assert(data.stability > 0, `Stability > 0 (${data.stability?.toFixed(2)})`);
  assert(data.reps === 1, `Reps = 1 (got ${data.reps})`);
  assert(data.memory_score, "Has memory_score");

  const { data: d2 } = await api(`${BASE}/api/card-review`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, cardId: TEST_CARD_ID, rating: 1 }),
  });
  assert(d2.stability < data.stability, "Stability drops on Again");

  const { data: d3 } = await api(`${BASE}/api/card-review?userId=${TEST_USER_ID}`);
  assert(d3.cards_measured > 0, `Memory score tracks cards (${d3.cards_measured})`);
}

async function testStreaks() {
  console.log("\n🔥 Streaks");
  const { data } = await api(`${BASE}/api/streaks?userId=${TEST_USER_ID}`);
  assert(data.current_streak >= 1, `Streak ≥ 1 (got ${data.current_streak})`);
}

async function testPoints() {
  console.log("\n⭐ Points");

  const { data } = await api(`${BASE}/api/points?userId=${TEST_USER_ID}&action=balance`);
  assert(data.balance >= 50, `Balance ≥ 50 after goal (got ${data.balance})`);

  const { data: d2 } = await api(`${BASE}/api/points?action=rewards&userId=_`);
  assert(d2.rewards?.length === 5, "5 rewards");

  const { data: d3 } = await api(`${BASE}/api/points`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, action: "earn", amount: 100, reason: "test" }),
  });
  assert(d3.earned === 100, "Earned 100");

  const { data: d4 } = await api(`${BASE}/api/points`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, action: "redeem", rewardId: "r5" }),
  });
  assert(d4.status === "approved", "Streak freeze auto-approved");

  const { status: s5 } = await api(`${BASE}/api/points`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, action: "redeem", rewardId: "r4" }),
  });
  assert(s5 === 400, "Insufficient funds → 400");
}

async function testTopicLevels() {
  console.log("\n🪜 Topic Levels");

  const { data: d1 } = await api(`${BASE}/api/topic-levels`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, topic: "test-topic", correct: true }),
  });
  assert(d1.current_level === 1, "Starts at L1");
  assert(d1.cards_at_level === 1, "1 card tracked");

  const { data: d2 } = await api(`${BASE}/api/topic-levels`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, topic: "test-topic", correct: false }),
  });
  assert(d2.cards_at_level === 2, "2 cards tracked");
  assert(d2.accuracy === 50, "50% accuracy");
}

async function testStudySheet() {
  console.log("\n📝 Study Sheet");
  const { status, data } = await api(`${BASE}/api/study-sheet`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topics: ["cells"], cardFronts: ["What is the nucleus?", "What is mitochondria?"] }),
  });
  assert(status === 200, "Returns 200");
  assert(data.sheet?.length > 50, `Has content (${data.sheet?.length} chars)`);
}

async function testScoreExplanation() {
  console.log("\n🎓 Explain-Back");
  const { data } = await api(`${BASE}/api/score-explanation`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concept: "What is the nucleus?",
      correctAnswer: "Controls cell activities and contains DNA",
      studentExplanation: "The nucleus is the brain of the cell. It has DNA that tells the cell what to do.",
      topic: "biology",
    }),
  });
  assert(data.score >= 3, `Good explanation ≥ 3 (got ${data.score})`);
  assert(data.mastered === true, "Mastered");

  const { data: d2 } = await api(`${BASE}/api/score-explanation`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concept: "What is photosynthesis?",
      correctAnswer: "Plants convert CO2 and water into glucose using light",
      studentExplanation: "makes plants green",
      topic: "biology",
    }),
  });
  assert(d2.score <= 3, `Bad explanation ≤ 3 (got ${d2.score})`);
}

async function testGapAnalysis() {
  console.log("\n📊 Gap Analysis");
  const { data } = await api(`${BASE}/api/gap-analysis`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionCards: [
        { front: "mitochondria?", back: "powerhouse", correct: true, topic: "cells", subject: "biology" },
        { front: "hola", back: "hello", correct: false, topic: "greetings", subject: "spanish" },
      ],
    }),
  });
  assert(data.weakTopics?.length > 0, "Found weak topics");
  assert(data.summary?.length > 0, "Has summary");
}

async function testValidation() {
  console.log("\n🛡️  Validation");
  assert((await api(`${BASE}/api/daily-progress`)).status === 400, "daily-progress no userId → 400");
  assert((await api(`${BASE}/api/card-review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "x" }) })).status === 400, "card-review no cardId → 400");
  assert((await api(`${BASE}/api/points`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "x" }) })).status === 400, "points no action → 400");
  assert((await api(`${BASE}/api/score-explanation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })).status === 400, "score-explanation empty → 400");
  assert((await api(`${BASE}/api/study-sheet`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })).status === 400, "study-sheet empty → 400");
}

// ==================== MAIN ====================
async function main() {
  console.log("🧪 Recall — Full Integration Tests");
  console.log("==========================================");

  try { const r = await fetch(BASE); if (r.status !== 200) throw new Error(); }
  catch { console.log(`❌ Server not running on ${BASE}`); process.exit(1); }

  try {
    await setup();
    await testSmartSession();
    await testDailyProgress();
    await testCardReview();
    await testStreaks();
    await testPoints();
    await testTopicLevels();
    await testStudySheet();
    await testScoreExplanation();
    await testGapAnalysis();
    await testValidation();
  } finally {
    await cleanup();
  }

  console.log("\n==========================================");
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed}`);
  if (errors.length > 0) { console.log("\nFailed:"); errors.forEach(e => console.log(e)); }
  else console.log("\n🎉 All tests passed!");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error("Crashed:", e); process.exit(1); });
