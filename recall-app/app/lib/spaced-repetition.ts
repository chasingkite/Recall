const DECAY = -0.5;
const FACTOR = 19 / 81;
const REQUEST_RETENTION = 0.9;

export interface FSRSState {
  stability: number;
  difficulty: number;
  lastReviewAt: Date;
  nextReviewAt: Date;
  reps: number;
}

export function getInitialFSRSState(): FSRSState {
  return {
    stability: 0,
    difficulty: 5.0,
    lastReviewAt: new Date(),
    nextReviewAt: new Date(),
    reps: 0,
  };
}

export function fsrsReview(state: FSRSState, rating: number): FSRSState {
  // Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
  const r = Math.max(1, Math.min(4, rating));

  let { stability, difficulty, reps } = state;

  if (reps === 0) {
    // First review: assign initial stability based on rating
    stability = initialStability(r);
    difficulty = initialDifficulty(r);
  } else {
    // Calculate retrievability at time of review
    const elapsed = daysSince(state.lastReviewAt);
    const retrievability = Math.pow(1 + FACTOR * elapsed / stability, DECAY);

    // Update difficulty
    difficulty = nextDifficulty(difficulty, r);

    // Update stability
    if (r === 1) {
      // Forgot: stability decreases
      stability = forgetStability(difficulty, stability, retrievability);
    } else {
      // Recalled: stability increases
      stability = recallStability(difficulty, stability, retrievability, r);
    }
  }

  // Clamp values
  stability = Math.max(0.1, Math.min(36500, stability));
  difficulty = Math.max(1, Math.min(10, difficulty));

  // Calculate next review interval
  const interval = nextInterval(stability);
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return {
    stability,
    difficulty,
    lastReviewAt: new Date(),
    nextReviewAt,
    reps: reps + 1,
  };
}

function initialStability(rating: number): number {
  const w = [0.4, 0.9, 2.3, 6.0];
  return w[rating - 1];
}

function initialDifficulty(rating: number): number {
  return Math.max(1, Math.min(10, 5.0 - (rating - 3) * 1.5));
}

function nextDifficulty(d: number, rating: number): number {
  const delta = -(rating - 3) * 0.5;
  const newD = d + delta;
  // Mean reversion toward 5.0
  return Math.max(1, Math.min(10, newD * 0.9 + 5.0 * 0.1));
}

function recallStability(d: number, s: number, r: number, rating: number): number {
  const hardPenalty = rating === 2 ? 0.8 : 1.0;
  const easyBonus = rating === 4 ? 1.3 : 1.0;
  return s * (1 + Math.exp(5.5 - d / 2) * Math.pow(s, -0.2) * (Math.exp((1 - r) * 0.8) - 1) * hardPenalty * easyBonus);
}

function forgetStability(d: number, s: number, r: number): number {
  return Math.max(0.1, 0.2 * Math.pow(d, -0.3) * Math.pow(s + 1, 0.2) * (Math.exp((1 - r) * 1.2) - 1));
}

function nextInterval(stability: number): number {
  const interval = stability * Math.log(REQUEST_RETENTION) / Math.log(1 / (1 + FACTOR));
  return Math.max(1, Math.round(interval));
}

function daysSince(date: Date): number {
  return Math.max(0, (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

// Convert user actions to FSRS ratings
export function actionToRating(correct: boolean, hintUsed: boolean, gaveUp: boolean): number {
  if (gaveUp) return 1; // Again
  if (!correct) return 1; // Again
  if (hintUsed) return 2; // Hard
  return 3; // Good
}

// Check if a card is due for review
export function isDue(state: FSRSState): boolean {
  return new Date() >= new Date(state.nextReviewAt);
}

// Calculate current retrievability (0-1)
export function getRetrievability(state: FSRSState): number {
  if (state.reps === 0) return 0;
  const elapsed = daysSince(state.lastReviewAt);
  return Math.pow(1 + FACTOR * elapsed / state.stability, DECAY);
}

// Legacy exports for compatibility
export function normalizeAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // Normalize superscript digits to regular digits
    .replace(/⁰/g, "0").replace(/¹/g, "1").replace(/²/g, "2").replace(/³/g, "3")
    .replace(/⁴/g, "4").replace(/⁵/g, "5").replace(/⁶/g, "6").replace(/⁷/g, "7")
    .replace(/⁸/g, "8").replace(/⁹/g, "9")
    // Normalize common math symbols
    .replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")
    // Remove ^ for exponents (so x^3 and x3 match x³)
    .replace(/\^/g, "")
    // Remove extra spaces
    .replace(/\s+/g, " ");
}

export function checkAnswer(userAnswer: string, correctAnswer: string): { correct: boolean; close: boolean } {
  const a = normalizeAnswer(userAnswer);
  // Extract core answer: strip parenthetical explanations and anything after common separators
  let cleaned = correctAnswer;
  // Remove parenthetical explanations: "x⁸ (add exponents)" → "x⁸"
  cleaned = cleaned.replace(/\s*\(.*\)\s*$/, "").trim();
  // Remove explanations after common separators: "x⁸ — add exponents" or "x⁸ - add exponents"
  cleaned = cleaned.replace(/\s*[—–]\s*.*$/, "").trim();
  // For MC answers like "C) congruent (alternate interior angles)" extract just the answer
  const mcMatch = cleaned.match(/^[A-D]\)\s*(.+)/);
  if (mcMatch) cleaned = mcMatch[1].trim();

  const b = normalizeAnswer(cleaned);
  const bFull = normalizeAnswer(correctAnswer);

  // Check against cleaned version first
  if (a === b) return { correct: true, close: false };
  if (levenshtein(a, b) <= 1) return { correct: true, close: true };
  // Also check against full version in case student typed everything
  if (a === bFull) return { correct: true, close: false };
  if (levenshtein(a, bFull) <= 1) return { correct: true, close: true };
  // Check if answer is contained in the correct answer (e.g., "x⁸" within "x⁸ (add exponents: 5+3=8)")
  if (b.length > 2 && a.length >= b.length * 0.8 && bFull.includes(a)) return { correct: true, close: true };
  return { correct: false, close: false };
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
