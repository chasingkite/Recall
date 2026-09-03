import {
  fsrsReview,
  getInitialFSRSState,
  checkAnswer,
  normalizeAnswer,
  actionToRating,
  isDue,
  getRetrievability,
  type FSRSState,
} from "./app/lib/spaced-repetition.ts";

import {
  DAILY_GOAL_CARDS,
  MASTERY_CELEBRATION_THRESHOLD,
  LEVEL_UP_THRESHOLD,
  LEVEL_UP_MIN_CARDS,
  DIFFICULTY_LEVELS,
} from "./app/lib/supabase/db-types.ts";

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// ==================== FSRS Algorithm ====================
function testFSRS() {
  console.log("\n🧠 FSRS Algorithm");

  const initial = getInitialFSRSState();
  assert(initial.stability === 0, "Initial stability = 0");
  assert(initial.difficulty === 5.0, "Initial difficulty = 5.0");
  assert(initial.reps === 0, "Initial reps = 0");

  // First review — Good (3)
  const after1 = fsrsReview(initial, 3);
  assert(after1.stability > 0, `Stability > 0 after first review (${after1.stability.toFixed(2)})`);
  assert(after1.reps === 1, "Reps = 1");
  assert(after1.difficulty >= 1 && after1.difficulty <= 10, `Difficulty in range (${after1.difficulty.toFixed(2)})`);
  assert(after1.nextReviewAt > new Date(), "Next review is in the future");

  // First review — Again (1) should give lower stability
  const afterAgain = fsrsReview(initial, 1);
  assert(afterAgain.stability < after1.stability, `Again stability < Good stability (${afterAgain.stability.toFixed(2)} < ${after1.stability.toFixed(2)})`);

  // First review — Easy (4) should give higher stability
  const afterEasy = fsrsReview(initial, 4);
  assert(afterEasy.stability > after1.stability, `Easy stability > Good stability (${afterEasy.stability.toFixed(2)} > ${after1.stability.toFixed(2)})`);

  // Second review — Good after Good (immediate review = tiny increase, that's correct FSRS behavior)
  const after2 = fsrsReview(after1, 3);
  assert(after2.reps === 2, "Reps = 2");
  assert(after2.stability >= after1.stability, "Stability does not decrease on recall");

  // Forget — stability decreases
  const afterForget = fsrsReview(after1, 1);
  assert(afterForget.stability < after1.stability, "Stability decreases on forget");
  assert(afterForget.reps === 2, "Reps still increments on forget");

  // Difficulty mean-reverts toward 5.0
  const hard = fsrsReview(initial, 2);
  assert(hard.difficulty > 5.0, `Hard increases difficulty (${hard.difficulty.toFixed(2)})`);
  const easy = fsrsReview(initial, 4);
  assert(easy.difficulty < 5.0, `Easy decreases difficulty (${easy.difficulty.toFixed(2)})`);

  // Rating clamped to 1-4
  const clamped = fsrsReview(initial, 10);
  assert(clamped.reps === 1, "Out-of-range rating clamped, still works");

  // Stability clamped
  assert(after1.stability >= 0.1, "Stability >= 0.1");
  assert(after1.stability <= 36500, "Stability <= 36500");
}

// ==================== Answer Checking ====================
function testAnswerChecking() {
  console.log("\n✏️  Answer Checking");

  // Exact match
  let r = checkAnswer("hello", "hello");
  assert(r.correct === true && r.close === false, "Exact match");

  // Case insensitive
  r = checkAnswer("Hello", "hello");
  assert(r.correct === true, "Case insensitive");

  // Levenshtein distance 1
  r = checkAnswer("helo", "hello");
  assert(r.correct === true && r.close === true, "Levenshtein ≤1 = close");

  // Too different
  r = checkAnswer("goodbye", "hello");
  assert(r.correct === false, "Different answer = wrong");

  // Strips parenthetical explanations
  r = checkAnswer("x8", "x⁸ (add exponents)");
  assert(r.correct === true, "Strips parenthetical from correct answer");

  // MC answer parsing
  r = checkAnswer("congruent", "C) congruent (alternate interior angles)");
  assert(r.correct === true, "Extracts MC answer");

  // Unicode normalization
  r = checkAnswer("buenos dias", "buenos días");
  assert(r.correct === true, "Unicode accent normalization");

  // Superscript normalization
  r = checkAnswer("x2", "x²");
  assert(r.correct === true, "Superscript normalization");

  // Fuzzy matching — filler word tolerance
  r = checkAnswer("k times original perimeter", "k times the original perimeter");
  assert(r.correct === true, "Filler word 'the' ignored");

  r = checkAnswer("removal of waste products", "the removal of waste products");
  assert(r.correct === true, "Leading 'the' ignored");

  r = checkAnswer("nucleus controls cell activities", "the nucleus controls cell activities");
  assert(r.correct === true, "Article tolerance");

  r = checkAnswer("original perimeter times k", "k times the original perimeter");
  assert(r.correct === true, "Word order tolerance (same meaningful words)");

  // Still wrong when meaning is different
  r = checkAnswer("k times original area", "k times the original perimeter");
  assert(r.correct === false, "Different meaning still wrong (area vs perimeter)");

  // Empty answer
  r = checkAnswer("", "hello");
  assert(r.correct === false, "Empty answer = wrong");
}

// ==================== Normalize Answer ====================
function testNormalizeAnswer() {
  console.log("\n🔤 Normalize Answer");

  assert(normalizeAnswer("  Hello  ") === "hello", "Trims and lowercases");
  assert(normalizeAnswer("×") === "*", "× → *");
  assert(normalizeAnswer("÷") === "/", "÷ → /");
  assert(normalizeAnswer("−") === "-", "− → -");
  assert(normalizeAnswer("x²") === "x2", "² → 2");
  assert(normalizeAnswer("x^3") === "x3", "Removes ^");
  assert(normalizeAnswer("  multiple   spaces  ") === "multiple spaces", "Collapses spaces");
}

// ==================== Action to Rating ====================
function testActionToRating() {
  console.log("\n🎯 Action to Rating");

  assert(actionToRating(true, false, false) === 3, "Correct, no hint = Good (3)");
  assert(actionToRating(true, true, false) === 2, "Correct with hint = Hard (2)");
  assert(actionToRating(false, false, false) === 1, "Incorrect = Again (1)");
  assert(actionToRating(false, false, true) === 1, "Gave up = Again (1)");
  assert(actionToRating(false, true, true) === 1, "Gave up with hint = Again (1)");
}

// ==================== isDue / Retrievability ====================
function testDueAndRetrievability() {
  console.log("\n📅 isDue & Retrievability");

  const state = getInitialFSRSState();
  assert(isDue(state) === true, "New card is due (nextReviewAt = now)");

  const future: FSRSState = {
    ...state,
    nextReviewAt: new Date(Date.now() + 86400000),
    reps: 1,
    stability: 2.3,
  };
  assert(isDue(future) === false, "Card with future nextReviewAt is not due");

  const past: FSRSState = {
    ...state,
    nextReviewAt: new Date(Date.now() - 86400000),
    reps: 1,
    stability: 2.3,
  };
  assert(isDue(past) === true, "Card with past nextReviewAt is due");

  // Retrievability
  assert(getRetrievability(state) === 0, "New card (0 reps) has 0 retrievability");

  const reviewed: FSRSState = {
    ...state,
    reps: 1,
    stability: 10,
    lastReviewAt: new Date(),
  };
  const r = getRetrievability(reviewed);
  assert(r > 0.9, `Just-reviewed card has high retrievability (${r.toFixed(3)})`);

  const old: FSRSState = {
    ...state,
    reps: 1,
    stability: 1,
    lastReviewAt: new Date(Date.now() - 30 * 86400000),
  };
  const rOld = getRetrievability(old);
  assert(rOld < 0.5, `30-day-old card with stability=1 has low retrievability (${rOld.toFixed(3)})`);
}

// ==================== Constants ====================
function testConstants() {
  console.log("\n🔢 Constants");

  assert(DAILY_GOAL_CARDS === 20, "Daily goal = 20 cards");
  assert(MASTERY_CELEBRATION_THRESHOLD === 0.20, "Celebration threshold = 20%");
  assert(LEVEL_UP_THRESHOLD === 0.80, "Level up threshold = 80%");
  assert(LEVEL_UP_MIN_CARDS === 10, "Level up min cards = 10");
  assert(DIFFICULTY_LEVELS.length === 5, "5 difficulty levels");
  assert(DIFFICULTY_LEVELS[0].name === "Beginner", "Level 1 = Beginner");
  assert(DIFFICULTY_LEVELS[4].name === "Expert", "Level 5 = Expert");
}

// ==================== Daily Progress Accumulation ====================
function testDailyProgressAccumulation() {
  console.log("\n📊 Daily Progress Accumulation");

  // Simulate the accumulation logic from daily-progress API
  function accumulate(existing: { cards_reviewed: number; cards_correct: number; goal_met: boolean } | null, newReviewed: number, newCorrect: number) {
    const totalReviewed = (existing?.cards_reviewed || 0) + newReviewed;
    const totalCorrect = (existing?.cards_correct || 0) + newCorrect;
    const wasGoalMet = existing?.goal_met || false;
    const isGoalMet = totalCorrect >= 20;
    return { cards_reviewed: totalReviewed, cards_correct: totalCorrect, goal_met: isGoalMet, just_met_goal: isGoalMet && !wasGoalMet };
  }

  // Session 1: 10 correct out of 20
  const after1 = accumulate(null, 20, 10);
  assert(after1.cards_reviewed === 20, "Session 1: reviewed = 20");
  assert(after1.cards_correct === 10, "Session 1: correct = 10");
  assert(after1.goal_met === false, "Session 1: goal not met (10/20)");

  // Session 2: 1 correct out of 5
  const after2 = accumulate(after1, 5, 1);
  assert(after2.cards_reviewed === 25, "Session 2: reviewed = 25 (20+5)");
  assert(after2.cards_correct === 11, "Session 2: correct = 11 (10+1)");
  assert(after2.goal_met === false, "Session 2: goal not met (11/20)");

  // Session 3: 9 correct out of 10 — hits goal
  const after3 = accumulate(after2, 10, 9);
  assert(after3.cards_reviewed === 35, "Session 3: reviewed = 35");
  assert(after3.cards_correct === 20, "Session 3: correct = 20");
  assert(after3.goal_met === true, "Session 3: goal met!");
  assert(after3.just_met_goal === true, "Session 3: just_met_goal fires");

  // Session 4: goal already met — shouldn't re-fire
  const after4 = accumulate({ ...after3, goal_met: true }, 5, 5);
  assert(after4.cards_correct === 25, "Session 4: correct = 25");
  assert(after4.goal_met === true, "Session 4: still met");
  assert(after4.just_met_goal === false, "Session 4: just_met_goal does NOT re-fire");

  // Edge case: 0 correct
  const zeroSession = accumulate(after1, 5, 0);
  assert(zeroSession.cards_correct === 10, "Zero-correct session: stays at 10");

  // Edge case: null existing (first session)
  const first = accumulate(null, 5, 3);
  assert(first.cards_reviewed === 5, "First session from null: reviewed = 5");
  assert(first.cards_correct === 3, "First session from null: correct = 3");
}

// ==================== Session Save Guard ====================
function testSessionSaveGuard() {
  console.log("\n🛡️  Session Save Guard (prevent duplicate saves)");

  // Simulate the savingRef guard
  let savingRef = false;

  function saveSessionProgress(): boolean {
    if (savingRef) return false;
    savingRef = true;
    return true;
  }

  function resetForNewSession() {
    savingRef = false;
  }

  // First save should succeed
  assert(saveSessionProgress() === true, "First save succeeds");

  // Second save in same session should be blocked
  assert(saveSessionProgress() === false, "Duplicate save blocked");
  assert(saveSessionProgress() === false, "Third save also blocked");

  // After reset (new session), save should work again
  resetForNewSession();
  assert(saveSessionProgress() === true, "Save works after reset");
  assert(saveSessionProgress() === false, "Duplicate blocked again in new session");
}

// ==================== Session Answer Tracking ====================
function testSessionAnswerTracking() {
  console.log("\n📝 Session Answer Tracking");

  // Simulate sessionAnswers accumulation
  const sessionAnswers: { front: string; back: string; correct: boolean; topic: string; subject: string }[] = [];

  // Answer 5 cards: 3 correct, 2 wrong
  sessionAnswers.push({ front: "q1", back: "a1", correct: true, topic: "t1", subject: "spanish" });
  sessionAnswers.push({ front: "q2", back: "a2", correct: false, topic: "t1", subject: "spanish" });
  sessionAnswers.push({ front: "q3", back: "a3", correct: true, topic: "t2", subject: "biology" });
  sessionAnswers.push({ front: "q4", back: "a4", correct: true, topic: "t2", subject: "biology" });
  sessionAnswers.push({ front: "q5", back: "a5", correct: false, topic: "t1", subject: "spanish" });

  const totalAnswered = sessionAnswers.length;
  const totalCorrect = sessionAnswers.filter(a => a.correct).length;
  const accuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;

  assert(totalAnswered === 5, "5 answers tracked");
  assert(totalCorrect === 3, "3 correct counted");
  assert(accuracy === 0.6, "60% accuracy computed");

  // These values should be used for daily progress POST
  assert(totalAnswered === 5, "cardsReviewed sent to API = 5");
  assert(totalCorrect === 3, "cardsCorrect sent to API = 3");

  // Empty session
  const empty: typeof sessionAnswers = [];
  assert(empty.filter(a => a.correct).length === 0, "Empty session = 0 correct");
  assert(empty.length === 0, "Empty session = 0 reviewed");

  // All correct session
  const perfect = [
    { front: "q1", back: "a1", correct: true, topic: "t", subject: "s" },
    { front: "q2", back: "a2", correct: true, topic: "t", subject: "s" },
  ];
  assert(perfect.filter(a => a.correct).length === 2, "Perfect session = 2/2 correct");
}

// ==================== MAIN ====================
console.log("🧪 Recall — Pure Logic Unit Tests");
console.log("==========================================");

testFSRS();
testAnswerChecking();
testNormalizeAnswer();
testActionToRating();
testDueAndRetrievability();
testConstants();
testDailyProgressAccumulation();
testSessionSaveGuard();
testSessionAnswerTracking();

console.log("\n==========================================");
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failed > 0) process.exit(1);
else console.log("\n🎉 All tests passed!");
