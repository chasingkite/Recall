#!/usr/bin/env node

/**
 * Recall App — Full Integration Test Suite
 * Creates a test user, runs all write tests, cleans up afterward.
 *
 * Usage: node test-phases.mjs
 * Requires: dev server running on http://localhost:3001
 */

const BASE = "http://localhost:3001";
const SUPABASE_URL = "https://yycsevunzufojchwowcf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5Y3NldnVuenVmb2pjaHdvd2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNzc2NTIsImV4cCI6MjEwMjc1MzY1Mn0.65ir2MZXBAgd6enkrFXdMIUdjWUNUYdaavJJqnxodzU";
const TEST_USER_ID = "00000000-0000-0000-0000-test00000001";
const SB_HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };

let passed = 0;
let failed = 0;
const errors = [];
let TEST_CARD_ID = null;

function assert(condition, name, detail) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    const msg = `  ❌ ${name}${detail ? ` — ${detail}` : ""}`;
    console.log(msg);
    errors.push(msg);
  }
}

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

async function sbQuery(path, method = "GET", body = null) {
  const opts = { method, headers: SB_HEADERS };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts);
}

// ==================== SETUP ====================
async function setup() {
  console.log("\n🔧 Setup: Creating test user...");

  // Delete existing test user data (cleanup from prior runs)
  await cleanup();

  // Create test profile
  const res = await sbQuery("profiles", "POST", {
    id: TEST_USER_ID, email: "test@recall.test", display_name: "Test User", role: "student", subjects: ["math", "spanish", "biology"]
  });
  if (res.status === 201 || res.status === 200) {
    console.log("  Created test profile: test@recall.test");
  } else if (res.status === 409) {
    console.log("  Test profile already exists");
  } else {
    const text = await res.text();
    console.log(`  ⚠️ Profile creation: ${res.status} ${text}`);
  }

  // Get a real card ID for card-review tests
  const { data } = await fetchJSON(`${BASE}/api/smart-session?studentId=81991&mode=quick5&subject=all`);
  if (data?.cards?.length > 0) {
    TEST_CARD_ID = data.cards[0].id;
    console.log(`  Found card: ${TEST_CARD_ID.slice(0, 12)}...`);
  }
}

// ==================== CLEANUP ====================
async function cleanup() {
  console.log("\n🧹 Cleanup: Removing test data...");
  const tables = ["daily_progress", "card_reviews", "memory_scores", "streaks", "points_ledger", "points_transactions", "redemptions", "topic_levels"];
  for (const t of tables) {
    await sbQuery(`${t}?user_id=eq.${TEST_USER_ID}`, "DELETE");
  }
  await sbQuery(`profiles?id=eq.${TEST_USER_ID}`, "DELETE");
  console.log("  Done");
}

// ==================== TESTS ====================

async function testSmartSession() {
  console.log("\n📋 Smart Session (FSRS-aware)");
  const { status, data } = await fetchJSON(`${BASE}/api/smart-session?studentId=81991&mode=quick5&subject=all`);
  assert(status === 200, "GET returns 200", `got ${status}`);
  assert(data && Array.isArray(data.cards), "Has cards array");
  if (!data?.cards) return;
  assert(data.cards.length > 0 && data.cards.length <= 5, `Returns 1-5 cards (got ${data.cards.length})`);
  assert(typeof data.dueCount === "number", "Has dueCount");
  assert(typeof data.unseenCount === "number", "Has unseenCount");
  assert(data.cards[0].id && data.cards[0].front && data.cards[0].back, "Cards have id/front/back");

  // Subject filter
  const { data: d2 } = await fetchJSON(`${BASE}/api/smart-session?studentId=81991&mode=quick5&subject=biology`);
  if (d2?.cards) {
    const allBio = d2.cards.every(c => c.decks?.subject === "biology");
    assert(allBio, "Subject filter works", `subjects: ${[...new Set(d2.cards.map(c => c.decks?.subject))]}`);
  }
}

async function testDailyProgress() {
  console.log("\n🎯 Daily Progress (mastery goal)");

  // GET initial
  const { status, data } = await fetchJSON(`${BASE}/api/daily-progress?userId=${TEST_USER_ID}`);
  assert(status === 200, "GET returns 200");
  assert(data.cards_correct === 0 && data.goal_met === false, "Starts at 0, not met");
  assert(data.goal_target === 20, "Goal target = 20");

  // POST partial progress
  const { data: d2 } = await fetchJSON(`${BASE}/api/daily-progress`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, cardsReviewed: 5, cardsCorrect: 4 }),
  });
  assert(d2.cards_reviewed === 5, "Reviewed = 5", `got ${d2.cards_reviewed}`);
  assert(d2.cards_correct === 4, "Correct = 4", `got ${d2.cards_correct}`);
  assert(d2.goal_met === false, "Goal not met (4/20)");
  assert(d2.just_met_goal === false, "just_met_goal = false");

  // POST to reach goal
  const { data: d3 } = await fetchJSON(`${BASE}/api/daily-progress`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, cardsReviewed: 20, cardsCorrect: 16 }),
  });
  assert(d3.cards_correct === 20, "Accumulated to 20", `got ${d3.cards_correct}`);
  assert(d3.goal_met === true, "Goal is met");
  assert(d3.just_met_goal === true, "just_met_goal fired");

  // POST again — no double-fire
  const { data: d4 } = await fetchJSON(`${BASE}/api/daily-progress`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, cardsReviewed: 5, cardsCorrect: 5 }),
  });
  assert(d4.goal_met === true, "Still met");
  assert(d4.just_met_goal === false, "just_met_goal doesn't re-fire");
}

async function testCardReview() {
  console.log("\n🧠 Card Review (FSRS persistence)");
  if (!TEST_CARD_ID) { console.log("  ⏭️ Skipped — no card ID"); return; }

  // First review (Good = 3)
  const { status, data } = await fetchJSON(`${BASE}/api/card-review`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, cardId: TEST_CARD_ID, rating: 3 }),
  });
  assert(status === 200, "POST returns 200");
  assert(data.stability > 0, `Stability > 0 (got ${data.stability})`);
  assert(data.reps === 1, `Reps = 1 (got ${data.reps})`);
  assert(data.interval >= 1, `Interval ≥ 1 (got ${data.interval})`);
  assert(data.memory_score, "Has memory_score");
  assert(typeof data.memory_score.avg_retrievability === "number", "Has avg_retrievability");

  // Second review (Again = 1)
  const { data: d2 } = await fetchJSON(`${BASE}/api/card-review`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, cardId: TEST_CARD_ID, rating: 1 }),
  });
  assert(d2.reps === 2, `Reps = 2 (got ${d2.reps})`);
  assert(d2.stability < data.stability, "Stability decreased after Again");

  // GET memory score
  const { data: d3 } = await fetchJSON(`${BASE}/api/card-review?userId=${TEST_USER_ID}`);
  assert(d3.cards_measured > 0, `cards_measured > 0 (got ${d3.cards_measured})`);
}

async function testStreaks() {
  console.log("\n🔥 Streaks");
  const { data } = await fetchJSON(`${BASE}/api/streaks?userId=${TEST_USER_ID}`);
  assert(data.current_streak >= 1, `Streak ≥ 1 after goal met (got ${data.current_streak})`);
  assert(data.longest_streak >= 1, `Longest ≥ 1 (got ${data.longest_streak})`);
}

async function testPoints() {
  console.log("\n⭐ Points");

  const { data } = await fetchJSON(`${BASE}/api/points?userId=${TEST_USER_ID}&action=balance`);
  assert(data.balance >= 50, `Balance ≥ 50 after daily goal (got ${data.balance})`);

  // Rewards catalog
  const { data: d2 } = await fetchJSON(`${BASE}/api/points?action=rewards&userId=_`);
  assert(d2.rewards.length === 5, "5 rewards in catalog");
  const costs = Object.fromEntries(d2.rewards.map(r => [r.id, r.cost]));
  assert(costs.r1 === 150 && costs.r5 === 75, "Correct costs (150/75)");

  // Earn points
  const { data: d3 } = await fetchJSON(`${BASE}/api/points`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, action: "earn", amount: 10, reason: "test_session" }),
  });
  assert(d3.earned === 10, "Earned 10 pts");

  // Redeem streak freeze
  const { data: d4 } = await fetchJSON(`${BASE}/api/points`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, action: "redeem", rewardId: "r5" }),
  });
  assert(d4.status === "approved", "Streak freeze auto-approved");

  // Insufficient funds
  const { status: s5 } = await fetchJSON(`${BASE}/api/points`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, action: "redeem", rewardId: "r4" }),
  });
  assert(s5 === 400, "Insufficient funds → 400");
}

async function testStudySheet() {
  console.log("\n📝 Study Sheet (AI)");
  const { status, data } = await fetchJSON(`${BASE}/api/study-sheet`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topics: ["biology", "cells"], cardFronts: ["What is the nucleus?", "What are chloroplasts?"] }),
  });
  assert(status === 200, "POST returns 200");
  assert(data.sheet?.length > 50, `Has content (${data.sheet?.length} chars)`);
}

async function testTopicLevels() {
  console.log("\n🪜 Topic Levels (Learning Ladder)");

  const { data: d1 } = await fetchJSON(`${BASE}/api/topic-levels`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, topic: "test-cells", correct: true }),
  });
  assert(d1.current_level === 1, "Starts at L1");
  assert(d1.cards_at_level === 1, "1 card at level");
  assert(d1.leveled_up === false, "Not leveled up yet");

  const { data: d2 } = await fetchJSON(`${BASE}/api/topic-levels`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: TEST_USER_ID, topic: "test-cells", correct: false }),
  });
  assert(d2.cards_at_level === 2, "2 cards at level");
  assert(d2.accuracy === 50, "50% accuracy");
}

async function testScoreExplanation() {
  console.log("\n🎓 Explain-Back (Feynman)");

  // Good explanation
  const { data } = await fetchJSON(`${BASE}/api/score-explanation`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concept: "What is the nucleus?",
      correctAnswer: "The nucleus controls cell activities and contains DNA",
      studentExplanation: "The nucleus is the brain of the cell. It holds DNA which tells the cell what proteins to make and how to function.",
      topic: "biology",
    }),
  });
  assert(data.score >= 1 && data.score <= 5, `Score 1-5 (got ${data.score})`);
  assert(data.score >= 3, `Good answer scores ≥3 (got ${data.score})`);
  assert(data.mastered === true, "Good answer = mastered");

  // Bad explanation
  const { data: d2 } = await fetchJSON(`${BASE}/api/score-explanation`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concept: "What is photosynthesis?",
      correctAnswer: "Plants convert CO2 and water into glucose and oxygen using light energy",
      studentExplanation: "it makes plants green",
      topic: "biology",
    }),
  });
  assert(d2.score <= 3, `Bad answer scores ≤3 (got ${d2.score})`);
}

async function testGapAnalysis() {
  console.log("\n📊 Gap Analysis");

  const { data } = await fetchJSON(`${BASE}/api/gap-analysis`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionCards: [
        { front: "mitochondria?", back: "powerhouse", correct: true, topic: "cells", subject: "biology" },
        { front: "hola", back: "hello", correct: false, topic: "greetings", subject: "spanish" },
        { front: "x²+5x+6", back: "(x+2)(x+3)", correct: false, topic: "polynomials", subject: "math" },
      ],
    }),
  });
  assert(data.weakTopics?.length > 0, `Found weak topics (got ${data.weakTopics?.length})`);
  assert(data.summary?.length > 0, "Has summary");

  // All correct
  const { data: d2 } = await fetchJSON(`${BASE}/api/gap-analysis`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionCards: [{ front: "x", back: "y", correct: true, topic: "t", subject: "s" }] }),
  });
  assert(d2.weakTopics?.length === 0, "No weak topics when all correct");
}

async function testValidation() {
  console.log("\n🛡️  Validation");
  const tests = [
    [`${BASE}/api/daily-progress`, "GET", null, 400, "daily-progress without userId"],
    [`${BASE}/api/streaks`, "GET", null, 400, "streaks without userId"],
    [`${BASE}/api/card-review`, "POST", { userId: "x" }, 400, "card-review without cardId"],
    [`${BASE}/api/points`, "POST", { userId: "x" }, 400, "points without action"],
    [`${BASE}/api/score-explanation`, "POST", {}, 400, "score-explanation empty"],
    [`${BASE}/api/study-sheet`, "POST", {}, 400, "study-sheet empty"],
    [`${BASE}/api/topic-levels`, "POST", {}, 400, "topic-levels empty"],
    [`${BASE}/api/points`, "POST", { userId: "x", action: "redeem", rewardId: "fake" }, 400, "redeem unknown reward"],
  ];
  for (const [url, method, body, expected, name] of tests) {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    const { status } = await fetchJSON(url, method === "GET" ? undefined : opts);
    assert(status === expected, `${name} → ${expected}`, `got ${status}`);
  }
}

async function testConstants() {
  console.log("\n🔢 Points Config");
  const { data } = await fetchJSON(`${BASE}/api/points?action=rewards&userId=_`);
  const c = data.config;
  assert(c.SESSION_COMPLETE === 10, "Session = 10 (was 50)");
  assert(c.DAILY_GOAL === 50, "Daily goal = 50 (new)");
  assert(c.SESSION_ACCURACY_BONUS === 5, "Accuracy bonus = 5 (was 25)");
  assert(c.STREAK_MILESTONE === 25, "Streak milestone = 25");
  assert(c.MEMORY_IMPROVEMENT === 30, "Memory improvement = 30 (new)");
  assert(c.MAX_STREAK_FREEZES === 2, "Max freezes = 2");
}

// ==================== MAIN ====================
async function main() {
  console.log("🧪 Recall App — Full Integration Tests");
  console.log("==========================================");

  try { await fetch(BASE); } catch {
    console.log(`\n❌ Cannot connect to ${BASE}. Is the dev server running?`);
    process.exit(1);
  }

  try {
    await setup();
    await testSmartSession();
    await testDailyProgress();
    await testCardReview();
    await testStreaks();
    await testPoints();
    await testStudySheet();
    await testTopicLevels();
    await testScoreExplanation();
    await testGapAnalysis();
    await testValidation();
    await testConstants();
  } finally {
    await cleanup();
  }

  console.log("\n==========================================");
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed}`);
  if (errors.length > 0) {
    console.log("\nFailed:");
    errors.forEach(e => console.log(e));
  } else {
    console.log("\n🎉 All tests passed!");
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error("Crashed:", err); process.exit(1); });
