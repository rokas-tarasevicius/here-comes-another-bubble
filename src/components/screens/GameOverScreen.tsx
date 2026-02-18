import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import { calculateScore, type GameScore } from '../../engine/scoring.ts';
import { addLeaderboardEntry } from '../../engine/leaderboard.ts';
import { formatCurrency } from '../../utils/format.ts';

// ─── Grade helpers ──────────────────────────────────────────────────────

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

function gradeBorderColor(grade: string): string {
  switch (grade) {
    case 'S': return 'border-amber-600';
    case 'A': return 'border-[--color-retro-green]';
    case 'B': return 'border-[--color-retro-blue]';
    case 'C': return 'border-[--color-retro-border-dark]';
    case 'D': return 'border-[--color-retro-orange]';
    case 'F': return 'border-[--color-retro-red]';
    default: return 'border-[--color-retro-border-dark]';
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

function categoryBarClass(category: string): string {
  switch (category) {
    case 'valuation': return 'retro-progress-bar retro-progress-bar-green';
    case 'revenue': return 'retro-progress-bar';
    case 'team': return 'retro-progress-bar retro-progress-bar-purple';
    case 'product': return 'retro-progress-bar retro-progress-bar-orange';
    case 'survival': return 'retro-progress-bar';
    default: return 'retro-progress-bar';
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
      <div className="w-20 text-right text-sm font-medium text-[--color-retro-text-muted]">
        {categoryLabel(category)}
      </div>
      <div className="retro-progress retro-progress-lg relative flex-1">
        <div
          className={categoryBarClass(category)}
          style={{ width: animate ? `${pct}%` : '0%', transition: 'width 1s ease-out' }}
        />
      </div>
      <div className="w-16 text-right font-retro-mono text-sm text-[--color-retro-text]">
        {value}/{max}
      </div>
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

// ─── Main component ──────────────────────────────────────────────────────

// Compute score and add to leaderboard once, outside of render cycle
function computeResults(gameState: import('../../types/index.ts').GameState) {
  const calculated = calculateScore(gameState);
  addLeaderboardEntry({
    companyName: gameState.company.name,
    score: calculated.total,
    grade: calculated.grade,
    difficulty: gameState.meta.difficulty,
    weeksPlayed: gameState.meta.week,
    valuation: gameState.company.valuation,
    date: new Date().toISOString(),
  });
  return { score: calculated };
}

export function GameOverScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const setScreen = useGameStore((s) => s.setScreen);
  const continueInfiniteMode = useGameStore((s) => s.continueInfiniteMode);

  // Compute score once on first render via lazy state initializer
  const [results] = useState<{ score: GameScore } | null>(() => {
    if (!gameState) return null;
    return computeResults(gameState);
  });

  const score = results?.score ?? null;

  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    if (!score) return;
    // Trigger bar animation after a short delay
    const timer = setTimeout(() => setAnimateBars(true), 100);
    return () => clearTimeout(timer);
  }, [score]);

  if (!gameState || !score) return null;

  const isWin = gameState.meta.gameWon === true;
  const reason = isWin
    ? (gameState.meta.gameWonReason ?? 'You won! Your startup journey was a success.')
    : (gameState.meta.gameOverReason ?? 'Your startup journey has ended.');
  const categories = ['valuation', 'revenue', 'team', 'product', 'survival'] as const;

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-[--color-retro-bg] px-4 py-12">
      <div className="relative z-10 w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-[--color-retro-text] sm:text-5xl">
            {isWin ? 'You Won!' : 'Game Over'}
          </h1>
          <p className={`text-lg ${isWin ? 'text-[--color-retro-green]' : 'text-[--color-retro-red]'}`}>{reason}</p>
        </div>

        {/* Company summary */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[--color-retro-text-muted]">
          <div className="retro-card retro-card-compact">
            <span className="text-[--color-retro-text-light]">Company </span>
            <span className="font-semibold text-[--color-retro-text]">{gameState.company.name}</span>
          </div>
          <div className="retro-card retro-card-compact">
            <span className="text-[--color-retro-text-light]">Weeks </span>
            <span className="font-semibold text-[--color-retro-text]">{gameState.meta.week}</span>
          </div>
          <div className="retro-card retro-card-compact">
            <span className="text-[--color-retro-text-light]">Valuation </span>
            <span className="font-semibold text-[--color-retro-green]">
              {formatCurrency(gameState.company.valuation)}
            </span>
          </div>
          <DifficultyBadge difficulty={gameState.meta.difficulty} />
        </div>

        {/* Grade circle + total score */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-full border-4 ${gradeBorderColor(score.grade)}`}
            style={{
              background: 'linear-gradient(to bottom, #ffffff, #f0f0f0)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            <div className="text-center">
              <div className={`text-5xl font-black ${gradeColor(score.grade)}`}>
                {score.grade}
              </div>
              <div className="text-xs font-medium text-[--color-retro-text-light]">
                {gradeLabel(score.grade)}
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-[--color-retro-text]">{score.total}</div>
            <div className="text-sm text-[--color-retro-text-light]">
              Total Score
              {score.difficultyMultiplier !== 1.0 && (
                <span className="ml-1 text-xs text-[--color-retro-text-light]">
                  (x{score.difficultyMultiplier} difficulty)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="retro-card-raised p-6">
          <h2 className="retro-section-heading">
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
            <div className="mt-4 border-t border-[--color-retro-border] pt-3 text-right text-sm text-[--color-retro-text-light]">
              Difficulty multiplier:{' '}
              <span className="font-retro-mono font-semibold text-[--color-retro-text]">
                x{score.difficultyMultiplier}
              </span>
            </div>
          )}
        </div>

        {/* Infinite mode prompt (only on win, not already in infinite mode) */}
        {isWin && !gameState.meta.infiniteMode && (
          <div className="retro-card-raised p-5 text-center">
            <h3 className="text-lg font-bold text-[--color-retro-text] mb-1">
              Think you can reach $10T?
            </h3>
            <p className="text-sm text-[--color-retro-text-light] mb-4">
              Continue in infinite mode — no win triggers, just pure growth until you hit a $10 trillion valuation. Or go bankrupt trying.
            </p>
            <button
              onClick={continueInfiniteMode}
              className="btn-glossy btn-glossy-lg btn-blue"
            >
              Continue — Infinite Mode
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => {
              useGameStore.setState({ gameState: null, showWeekRecap: false });
              setScreen('newgame');
            }}
            className="btn-glossy btn-glossy-lg btn-green"
          >
            New Game
          </button>
          <button
            onClick={() => {
              useGameStore.setState({ gameState: null, showWeekRecap: false });
              setScreen('title');
            }}
            className="btn-glossy btn-glossy-lg btn-silver"
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
