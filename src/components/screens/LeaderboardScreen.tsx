import { useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import { getLeaderboard, clearLeaderboard, type LeaderboardEntry } from '../../engine/leaderboard.ts';
import { formatCurrency } from '../../utils/format.ts';

// ─── Grade color helper ─────────────────────────────────────────────────

function gradeColor(grade: string): string {
  switch (grade) {
    case 'S': return 'text-amber-300';
    case 'A': return 'text-emerald-400';
    case 'B': return 'text-blue-400';
    case 'C': return 'text-gray-300';
    case 'D': return 'text-orange-400';
    case 'F': return 'text-red-400';
    default: return 'text-gray-300';
  }
}

// ─── Rank badge ──────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-900/50 text-sm font-bold text-amber-400">
        1
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-700/50 text-sm font-bold text-gray-300">
        2
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-900/40 text-sm font-bold text-orange-400">
        3
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center text-sm font-mono text-gray-600">
      {rank}
    </div>
  );
}

// ─── Difficulty badge ────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, string> = {
    easy: 'bg-emerald-900/30 text-emerald-500',
    normal: 'bg-blue-900/30 text-blue-500',
    hard: 'bg-orange-900/30 text-orange-500',
    nightmare: 'bg-red-900/30 text-red-500',
  };

  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${styles[difficulty] ?? styles.normal}`}>
      {difficulty}
    </span>
  );
}

// ─── Date formatter ──────────────────────────────────────────────────────

function formatEntryDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Floating bubbles background ─────────────────────────────────────────

function BubblesBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-900/20 blur-3xl" />
      <div className="absolute top-1/3 -right-32 h-80 w-80 rounded-full bg-blue-900/15 blur-3xl" />
      <div className="absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-violet-900/15 blur-3xl" />
      <div className="absolute top-1/4 left-1/2 h-64 w-64 rounded-full bg-amber-900/10 blur-3xl" />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
    </div>
  );
}

// ─── Row highlight for top 3 ─────────────────────────────────────────────

function rowHighlight(rank: number): string {
  if (rank === 1) return 'border-amber-800/40 bg-amber-950/20';
  if (rank === 2) return 'border-gray-700/40 bg-gray-800/30';
  if (rank === 3) return 'border-orange-900/40 bg-orange-950/15';
  return 'border-gray-800/60 bg-gray-900/50';
}

// ─── Main component ──────────────────────────────────────────────────────

export function LeaderboardScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => getLeaderboard());
  const [confirmClear, setConfirmClear] = useState(false);

  function handleClear() {
    if (confirmClear) {
      clearLeaderboard();
      setEntries([]);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-gray-950 px-4 py-12">
      <BubblesBackground />

      <div className="relative z-10 w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 h-px w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-gray-100 sm:text-5xl">
            Leaderboard
          </h1>
          <p className="text-sm text-gray-500">
            Your best startup runs, ranked by score.
          </p>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        </div>

        {/* Leaderboard table */}
        {entries.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900 py-16 text-center">
            <div className="mb-3 text-gray-600">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 10.5h-.75a.75.75 0 00-.75.75v3.75m-6 3V14.25m0 0a2.25 2.25 0 012.25-2.25h.75a.75.75 0 00.75-.75V7.5a3.375 3.375 0 013.375-3.375h.375" />
              </svg>
            </div>
            <p className="text-gray-500">No runs recorded yet.</p>
            <p className="mt-1 text-xs text-gray-600">
              Complete a game to see your scores here.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            {/* Table header */}
            <div className="mb-2 hidden grid-cols-[2.5rem_1fr_4rem_3rem_5.5rem_3.5rem_5.5rem_5.5rem] items-center gap-2 border-b border-gray-800 px-3 pb-2 text-xs font-medium tracking-wide text-gray-600 uppercase sm:grid">
              <div>Rank</div>
              <div>Company</div>
              <div className="text-right">Score</div>
              <div className="text-center">Grade</div>
              <div className="text-center">Difficulty</div>
              <div className="text-right">Weeks</div>
              <div className="text-right">Valuation</div>
              <div className="text-right">Date</div>
            </div>

            {/* Entries */}
            <div className="space-y-1">
              {entries.map((entry, i) => {
                const rank = i + 1;
                return (
                  <div
                    key={`${entry.companyName}-${entry.date}-${i}`}
                    className={`rounded-lg border px-3 py-2.5 transition-colors ${rowHighlight(rank)}`}
                  >
                    {/* Desktop row */}
                    <div className="hidden grid-cols-[2.5rem_1fr_4rem_3rem_5.5rem_3.5rem_5.5rem_5.5rem] items-center gap-2 sm:grid">
                      <div>
                        <RankBadge rank={rank} />
                      </div>
                      <div className="truncate font-medium text-gray-200">
                        {entry.companyName}
                      </div>
                      <div className="text-right font-mono font-semibold text-gray-200">
                        {entry.score}
                      </div>
                      <div className={`text-center text-lg font-black ${gradeColor(entry.grade)}`}>
                        {entry.grade}
                      </div>
                      <div className="text-center">
                        <DifficultyBadge difficulty={entry.difficulty} />
                      </div>
                      <div className="text-right text-sm text-gray-400">
                        {entry.weeksPlayed}
                      </div>
                      <div className="text-right text-sm text-emerald-500">
                        {formatCurrency(entry.valuation)}
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        {formatEntryDate(entry.date)}
                      </div>
                    </div>

                    {/* Mobile row */}
                    <div className="flex items-center gap-3 sm:hidden">
                      <RankBadge rank={rank} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-gray-200">
                            {entry.companyName}
                          </span>
                          <span className={`text-sm font-black ${gradeColor(entry.grade)}`}>
                            {entry.grade}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="font-mono font-semibold text-gray-300">{entry.score} pts</span>
                          <DifficultyBadge difficulty={entry.difficulty} />
                          <span>Wk {entry.weeksPlayed}</span>
                          <span className="text-emerald-500">{formatCurrency(entry.valuation)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => setScreen('title')}
            className="rounded-lg border border-gray-800 bg-gray-900 px-8 py-3 text-base font-medium text-gray-300 transition-all hover:border-gray-700 hover:bg-gray-800 hover:text-gray-100 active:scale-[0.98]"
          >
            Back
          </button>
          {entries.length > 0 && (
            <button
              onClick={handleClear}
              className={`rounded-lg px-8 py-3 text-base font-medium transition-all active:scale-[0.98] ${
                confirmClear
                  ? 'border border-red-800 bg-red-900/40 text-red-400 hover:bg-red-900/60'
                  : 'border border-gray-800 bg-gray-900 text-gray-500 hover:border-gray-700 hover:bg-gray-800 hover:text-gray-300'
              }`}
            >
              {confirmClear ? 'Confirm Clear All?' : 'Clear All'}
            </button>
          )}
        </div>

        {/* Footer spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
