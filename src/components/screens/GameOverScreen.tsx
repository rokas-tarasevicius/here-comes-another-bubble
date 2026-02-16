import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import { calculateScore, type GameScore } from '../../engine/scoring.ts';
import { addLeaderboardEntry, type LeaderboardEntry } from '../../engine/leaderboard.ts';
import { formatCurrency } from '../../utils/format.ts';

// ─── Grade helpers ──────────────────────────────────────────────────────

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

function gradeBorderColor(grade: string): string {
  switch (grade) {
    case 'S': return 'border-amber-500/60';
    case 'A': return 'border-emerald-500/60';
    case 'B': return 'border-blue-500/60';
    case 'C': return 'border-gray-500/60';
    case 'D': return 'border-orange-500/60';
    case 'F': return 'border-red-500/60';
    default: return 'border-gray-500/60';
  }
}

function gradeGlow(grade: string): string {
  switch (grade) {
    case 'S': return 'shadow-amber-500/30';
    case 'A': return 'shadow-emerald-500/30';
    case 'B': return 'shadow-blue-500/30';
    case 'C': return 'shadow-gray-500/30';
    case 'D': return 'shadow-orange-500/30';
    case 'F': return 'shadow-red-500/30';
    default: return 'shadow-gray-500/30';
  }
}

function gradeLabel(grade: string): string {
  switch (grade) {
    case 'S': return 'Legendary';
    case 'A': return 'Excellent';
    case 'B': return 'Good';
    case 'C': return 'Average';
    case 'D': return 'Poor';
    case 'F': return 'Failed';
    default: return '';
  }
}

// ─── Bar colors per category ─────────────────────────────────────────────

function categoryBarColor(category: string): string {
  switch (category) {
    case 'valuation': return 'bg-emerald-500';
    case 'revenue': return 'bg-blue-500';
    case 'team': return 'bg-violet-500';
    case 'product': return 'bg-amber-500';
    case 'survival': return 'bg-gray-400';
    default: return 'bg-gray-500';
  }
}

function categoryBarTrack(category: string): string {
  switch (category) {
    case 'valuation': return 'bg-emerald-950';
    case 'revenue': return 'bg-blue-950';
    case 'team': return 'bg-violet-950';
    case 'product': return 'bg-amber-950';
    case 'survival': return 'bg-gray-900';
    default: return 'bg-gray-900';
  }
}

function categoryMax(category: string): number {
  switch (category) {
    case 'valuation': return 40;
    case 'revenue': return 20;
    case 'team': return 15;
    case 'product': return 15;
    case 'survival': return 10;
    default: return 100;
  }
}

function categoryLabel(category: string): string {
  switch (category) {
    case 'valuation': return 'Valuation';
    case 'revenue': return 'Revenue';
    case 'team': return 'Team';
    case 'product': return 'Product';
    case 'survival': return 'Survival';
    default: return category;
  }
}

// ─── Floating bubbles background ─────────────────────────────────────────

function BubblesBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-red-900/15 blur-3xl" />
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

// ─── Score breakdown bar ─────────────────────────────────────────────────

function ScoreBar({
  category,
  value,
  animate,
}: {
  category: string;
  value: number;
  animate: boolean;
}) {
  const max = categoryMax(category);
  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-right text-sm font-medium text-gray-400">
        {categoryLabel(category)}
      </div>
      <div className={`relative h-6 flex-1 overflow-hidden rounded-full ${categoryBarTrack(category)}`}>
        <div
          className={`h-full rounded-full ${categoryBarColor(category)} transition-all duration-1000 ease-out`}
          style={{ width: animate ? `${pct}%` : '0%' }}
        />
      </div>
      <div className="w-16 text-right font-mono text-sm text-gray-300">
        {value}/{max}
      </div>
    </div>
  );
}

// ─── Leaderboard mini table ──────────────────────────────────────────────

function LeaderboardMini({
  entries,
  currentScore,
}: {
  entries: LeaderboardEntry[];
  currentScore: number;
}) {
  const top10 = entries.slice(0, 10);

  if (top10.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-gray-400 uppercase">
        Leaderboard
      </h3>
      <div className="space-y-1">
        <div className="grid grid-cols-[2rem_1fr_3.5rem_2.5rem] gap-2 border-b border-gray-800 pb-1 text-xs font-medium text-gray-600">
          <div>#</div>
          <div>Company</div>
          <div className="text-right">Score</div>
          <div className="text-right">Grade</div>
        </div>
        {top10.map((entry, i) => {
          const isHighlight = entry.score === currentScore && i === top10.findIndex(e => e.score === currentScore);
          const rankColor =
            i === 0 ? 'text-amber-400' :
            i === 1 ? 'text-gray-300' :
            i === 2 ? 'text-orange-400' :
            'text-gray-600';

          return (
            <div
              key={`${entry.companyName}-${entry.date}-${i}`}
              className={`grid grid-cols-[2rem_1fr_3.5rem_2.5rem] gap-2 rounded px-1 py-1 text-sm ${
                isHighlight ? 'bg-gray-800/80 text-gray-100' : 'text-gray-400'
              }`}
            >
              <div className={`font-mono font-bold ${rankColor}`}>
                {i + 1}
              </div>
              <div className="truncate">
                {entry.companyName}
                {isHighlight && (
                  <span className="ml-1 text-xs text-emerald-500">NEW</span>
                )}
              </div>
              <div className="text-right font-mono">{entry.score}</div>
              <div className={`text-right font-bold ${gradeColor(entry.grade)}`}>
                {entry.grade}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Difficulty badge ────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, string> = {
    easy: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50',
    normal: 'bg-blue-900/40 text-blue-400 border-blue-800/50',
    hard: 'bg-orange-900/40 text-orange-400 border-orange-800/50',
    nightmare: 'bg-red-900/40 text-red-400 border-red-800/50',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles[difficulty] ?? styles.normal}`}>
      {difficulty}
    </span>
  );
}

// ─── Main component ──────────────────────────────────────────────────────

// Compute score and add to leaderboard once, outside of render cycle
function computeResults(gameState: import('../../types/index.ts').GameState) {
  const calculated = calculateScore(gameState);
  const board = addLeaderboardEntry({
    companyName: gameState.company.name,
    score: calculated.total,
    grade: calculated.grade,
    difficulty: gameState.meta.difficulty,
    weeksPlayed: gameState.meta.week,
    valuation: gameState.company.valuation,
    date: new Date().toISOString(),
  });
  return { score: calculated, leaderboard: board };
}

export function GameOverScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const setScreen = useGameStore((s) => s.setScreen);

  // Compute score once on first render via lazy state initializer
  const [results] = useState<{ score: GameScore; leaderboard: LeaderboardEntry[] } | null>(() => {
    if (!gameState) return null;
    return computeResults(gameState);
  });

  const score = results?.score ?? null;
  const leaderboard = results?.leaderboard ?? [];

  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    if (!score) return;
    // Trigger bar animation after a short delay
    const timer = setTimeout(() => setAnimateBars(true), 100);
    return () => clearTimeout(timer);
  }, [score]);

  if (!gameState || !score) return null;

  const reason = gameState.meta.gameOverReason ?? 'Your startup journey has ended.';
  const categories = ['valuation', 'revenue', 'team', 'product', 'survival'] as const;

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-gray-950 px-4 py-12">
      <BubblesBackground />

      <div className="relative z-10 w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-gray-100 sm:text-5xl">
            Game Over
          </h1>
          <p className="text-lg text-red-400/80">{reason}</p>
        </div>

        {/* Company summary */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
          <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-2">
            <span className="text-gray-500">Company </span>
            <span className="font-semibold text-gray-200">{gameState.company.name}</span>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-2">
            <span className="text-gray-500">Weeks </span>
            <span className="font-semibold text-gray-200">{gameState.meta.week}</span>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-2">
            <span className="text-gray-500">Valuation </span>
            <span className="font-semibold text-emerald-400">
              {formatCurrency(gameState.company.valuation)}
            </span>
          </div>
          <DifficultyBadge difficulty={gameState.meta.difficulty} />
        </div>

        {/* Grade circle + total score */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-full border-4 shadow-lg ${gradeBorderColor(score.grade)} ${gradeGlow(score.grade)}`}
          >
            <div className="text-center">
              <div className={`text-5xl font-black ${gradeColor(score.grade)}`}>
                {score.grade}
              </div>
              <div className="text-xs font-medium text-gray-500">
                {gradeLabel(score.grade)}
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-gray-100">{score.total}</div>
            <div className="text-sm text-gray-500">
              Total Score
              {score.difficultyMultiplier !== 1.0 && (
                <span className="ml-1 text-xs text-gray-600">
                  (x{score.difficultyMultiplier} difficulty)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-400 uppercase">
            Score Breakdown
          </h2>
          <div className="space-y-3">
            {categories.map((cat) => (
              <ScoreBar
                key={cat}
                category={cat}
                value={score.breakdown[cat]}
                animate={animateBars}
              />
            ))}
          </div>
          {score.difficultyMultiplier !== 1.0 && (
            <div className="mt-4 border-t border-gray-800 pt-3 text-right text-sm text-gray-500">
              Difficulty multiplier:{' '}
              <span className="font-mono font-semibold text-gray-300">
                x{score.difficultyMultiplier}
              </span>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <LeaderboardMini entries={leaderboard} currentScore={score.total} />

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => setScreen('newgame')}
            className="group relative overflow-hidden rounded-lg bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-500 hover:shadow-emerald-900/50 active:scale-[0.98]"
          >
            <span className="relative z-10">New Game</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </button>
          <button
            onClick={() => setScreen('title')}
            className="rounded-lg border border-gray-800 bg-gray-900 px-8 py-3 text-base font-medium text-gray-300 transition-all hover:border-gray-700 hover:bg-gray-800 hover:text-gray-100 active:scale-[0.98]"
          >
            Main Menu
          </button>
        </div>

        {/* Footer spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
