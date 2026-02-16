export interface LeaderboardEntry {
  companyName: string;
  score: number;
  grade: string;
  difficulty: string;
  weeksPlayed: number;
  valuation: number;
  date: string; // ISO string
}

const LEADERBOARD_KEY = 'hcab-leaderboard';
const MAX_ENTRIES = 20;

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const board = getLeaderboard();
  board.push(entry);
  board.sort((a, b) => b.score - a.score);
  const trimmed = board.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage unavailable
  }
  return trimmed;
}

export function clearLeaderboard(): void {
  localStorage.removeItem(LEADERBOARD_KEY);
}
