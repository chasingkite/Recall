const INITIAL_EASINESS = 2.5;
const MIN_EASINESS = 1.3;

export interface SM2State {
  easiness: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
}

export function getInitialSM2State(): SM2State {
  return {
    easiness: INITIAL_EASINESS,
    interval: 0,
    repetitions: 0,
    nextReviewAt: new Date(),
  };
}

export function sm2Review(state: SM2State, quality: number): SM2State {
  const q = Math.max(0, Math.min(5, quality));

  let { easiness, interval, repetitions } = state;

  easiness = easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easiness < MIN_EASINESS) easiness = MIN_EASINESS;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions++;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easiness);
    }
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return { easiness, interval, repetitions, nextReviewAt };
}

export function qualityFromResult(correct: boolean, hintUsed: boolean, gaveUp: boolean): number {
  if (gaveUp) return 0;
  if (!correct && hintUsed) return 1;
  if (!correct) return 2;
  if (correct && hintUsed) return 3;
  return 5;
}

export function normalizeAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function checkAnswer(userAnswer: string, correctAnswer: string): { correct: boolean; close: boolean } {
  const a = normalizeAnswer(userAnswer);
  const b = normalizeAnswer(correctAnswer);
  if (a === b) return { correct: true, close: false };
  if (levenshtein(a, b) <= 1) return { correct: true, close: true };
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
