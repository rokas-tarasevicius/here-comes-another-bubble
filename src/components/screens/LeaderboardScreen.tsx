import { useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import { getLeaderboard, clearLeaderboard, type LeaderboardEntry } from '../../engine/leaderboard.ts';
import { formatCurrency } from '../../utils/format.ts';

// ─── Grade color helper ─────────────────────────────────────────────────

function gradeColor(grade: string): string {
  switch (grade) {
    case 'S': return 'text-amber-600';
    case 'A': return 'text-[--color-retro-green]';
    case 'B': return 'text-[--color-retro-blue]';
    case 'C': return 'text-[--color-retro-text-muted]';
    case 'D': return 'text-[--color-retro-orange]';
    case 'F': return 'text-[--color-retro-red]';
    default: return 'text-[--color-retro-text-muted]';
  }
}

// ─── Rank badge ──────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: 'linear-gradient(to bottom, #ffcc00, #cc9900)', color: '#7a5c00', border: '1px solid #b8860b', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }}>
        1
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: 'linear-gradient(to bottom, #e0e0e0, #b0b0b0)', color: '#555', border: '1px solid #999', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }}>
        2
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: 'linear-gradient(to bottom, #e8a060, #cc7733)', color: '#6a3a10', border: '1px solid #aa6622', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }}>
        3
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center text-sm font-[--font-retro-mono] text-[--color-retro-text-light]">
      {rank}
    </div>
  );
}

// ─── Difficulty badge ────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, string> = {
    easy: 'retro-badge retro-badge-green',
    normal: 'retro-badge retro-badge-blue',
    hard: 'retro-badge retro-badge-orange',
    nightmare: 'retro-badge retro-badge-red',
  };

  return (
    <span className={`capitalize ${styles[difficulty] ?? styles.normal}`}>
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
    <div className="relative flex min-h-screen flex-col items-center bg-[--color-retro-bg] px-4 py-12">
      <div className="relative z-10 w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 h-px w-24" style={{ background: 'linear-gradient(to right, transparent, var(--color-retro-orange), transparent)' }} />
          <h1 className="mb-2 text-4xl font-extrabold font-[--font-retro-heading] tracking-tight text-[--color-retro-text] sm:text-5xl">
            Leaderboard
          </h1>
          <p className="text-sm text-[--color-retro-text-light]">
            Your best startup runs, ranked by score.
          </p>
          <div className="mx-auto mt-4 h-px w-24" style={{ background: 'linear-gradient(to right, transparent, var(--color-retro-orange), transparent)' }} />
        </div>

        {/* Leaderboard table */}
        {entries.length === 0 ? (
          <div className="retro-card py-16 text-center">
            <div className="mb-3 text-[--color-retro-text-light]">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 10.5h-.75a.75.75 0 00-.75.75v3.75m-6 3V14.25m0 0a2.25 2.25 0 012.25-2.25h.75a.75.75 0 00.75-.75V7.5a3.375 3.375 0 013.375-3.375h.375" />
              </svg>
            </div>
            <p className="text-[--color-retro-text-light]">No runs recorded yet.</p>
            <p className="mt-1 text-xs text-[--color-retro-text-light]">
              Complete a game to see your scores here.
            </p>
          </div>
        ) : (
          <div className="retro-card-raised retro-card-flush overflow-hidden">
            {/* Table */}
            <table className="retro-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Company</th>
                  <th className="text-right">Score</th>
                  <th className="text-center">Grade</th>
                  <th className="text-center hidden sm:table-cell">Difficulty</th>
                  <th className="text-right hidden sm:table-cell">Weeks</th>
                  <th className="text-right hidden sm:table-cell">Valuation</th>
                  <th className="text-right hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const rank = i + 1;
                  return (
                    <tr key={`${entry.companyName}-${entry.date}-${i}`}>
                      <td>
                        <RankBadge rank={rank} />
                      </td>
                      <td className="font-medium text-[--color-retro-text]">
                        {entry.companyName}
                      </td>
                      <td className="text-right font-[--font-retro-mono] font-semibold text-[--color-retro-text]">
                        {entry.score}
                      </td>
                      <td className={`text-center text-lg font-black ${gradeColor(entry.grade)}`}>
                        {entry.grade}
                      </td>
                      <td className="text-center hidden sm:table-cell">
                        <DifficultyBadge difficulty={entry.difficulty} />
                      </td>
                      <td className="text-right text-sm text-[--color-retro-text-muted] hidden sm:table-cell">
                        {entry.weeksPlayed}
                      </td>
                      <td className="text-right text-sm text-[--color-retro-green] hidden sm:table-cell">
                        {formatCurrency(entry.valuation)}
                      </td>
                      <td className="text-right text-xs text-[--color-retro-text-light] hidden sm:table-cell">
                        {formatEntryDate(entry.date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => setScreen('title')}
            className="btn-glossy btn-glossy-lg btn-silver"
          >
            Back
          </button>
          {entries.length > 0 && (
            <button
              onClick={handleClear}
              className={`btn-glossy btn-glossy-lg ${confirmClear ? 'btn-red' : 'btn-silver'}`}
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
