export interface SubjectStats {
  totalReviews: number;
  correctReviews: number;
  cardsAtBox: [number, number, number, number, number]; // box 0-4 counts
}

export interface StudyStats {
  subjects: Record<string, SubjectStats>;
  totalSessions: number;
  totalCardsReviewed: number;
  totalCorrect: number;
  lastStudiedAt: string | null;
}

const STORAGE_KEY = "recall-study-stats";

function getDefaultStats(): StudyStats {
  return {
    subjects: {},
    totalSessions: 0,
    totalCardsReviewed: 0,
    totalCorrect: 0,
    lastStudiedAt: null,
  };
}

function getDefaultSubjectStats(): SubjectStats {
  return { totalReviews: 0, correctReviews: 0, cardsAtBox: [0, 0, 0, 0, 0] };
}

export function loadStats(): StudyStats {
  if (typeof window === "undefined") return getDefaultStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultStats();
    return JSON.parse(raw);
  } catch {
    return getDefaultStats();
  }
}

export function saveStats(stats: StudyStats) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function recordReview(subject: string, correct: boolean, newBox: number) {
  const stats = loadStats();
  if (!stats.subjects[subject]) {
    stats.subjects[subject] = getDefaultSubjectStats();
  }
  const s = stats.subjects[subject];
  s.totalReviews++;
  if (correct) s.correctReviews++;
  // Update box distribution
  s.cardsAtBox = [0, 0, 0, 0, 0];
  stats.totalCardsReviewed++;
  if (correct) stats.totalCorrect++;
  stats.lastStudiedAt = new Date().toISOString();
  saveStats(stats);
}

export function recordCardBox(subject: string, box: number) {
  const stats = loadStats();
  if (!stats.subjects[subject]) {
    stats.subjects[subject] = getDefaultSubjectStats();
  }
  stats.subjects[subject].cardsAtBox[box]++;
  saveStats(stats);
}

export function recordSessionComplete() {
  const stats = loadStats();
  stats.totalSessions++;
  saveStats(stats);
}

export function getMasteryPercentage(subject: string): number {
  const stats = loadStats();
  const s = stats.subjects[subject];
  if (!s || s.totalReviews === 0) return 0;
  return Math.round((s.correctReviews / s.totalReviews) * 100);
}
