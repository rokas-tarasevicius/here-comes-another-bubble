import { useGameStore } from '../../store/index.ts';
import type { CompanyStage } from '../../types/game.ts';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const STAGE_LABELS: Record<CompanyStage, string> = {
  'garage': 'Garage',
  'pre-seed': 'Pre-Seed',
  'seed': 'Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  'series-c': 'Series C',
  'growth': 'Growth',
  'public': 'Public',
  'dead': 'Dead',
};

const STAGE_COLORS: Record<CompanyStage, string> = {
  'garage': 'bg-gray-700 text-gray-300',
  'pre-seed': 'bg-gray-600 text-gray-200',
  'seed': 'bg-amber-900 text-amber-200',
  'series-a': 'bg-blue-900 text-blue-200',
  'series-b': 'bg-violet-900 text-violet-200',
  'series-c': 'bg-violet-800 text-violet-100',
  'growth': 'bg-emerald-900 text-emerald-200',
  'public': 'bg-emerald-800 text-emerald-100',
  'dead': 'bg-red-900 text-red-200',
};

function formatCash(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export function Header() {
  const gameState = useGameStore((s) => s.gameState);
  const isSimulating = useGameStore((s) => s.isSimulating);
  const endWeek = useGameStore((s) => s.endWeek);

  if (!gameState) return null;

  const { meta, company, finances, pendingDecisions } = gameState;
  const pendingCount = pendingDecisions.length;
  const monthName = MONTH_NAMES[meta.month - 1] ?? 'Jan';
  const dateStr = `Week ${meta.week} \u2014 ${monthName} ${meta.day}, ${meta.year}`;
  const stageBadgeClass = STAGE_COLORS[company.stage] ?? 'bg-gray-700 text-gray-300';
  const stageLabel = STAGE_LABELS[company.stage] ?? company.stage;

  return (
    <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-3">
      {/* Left: Company name + stage badge */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-gray-100">{company.name}</h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stageBadgeClass}`}
        >
          {stageLabel}
        </span>
      </div>

      {/* Center: Date display */}
      <div className="text-sm text-gray-400 font-mono">
        {dateStr}
      </div>

      {/* Right: Cash + pending warning + Next Week button */}
      <div className="flex items-center gap-4">
        <span className="font-mono text-sm text-emerald-400">
          {formatCash(finances.cash)}
        </span>

        {pendingCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-900/50 px-2.5 py-0.5 text-xs font-medium text-amber-300">
            {pendingCount} pending
          </span>
        )}

        <button
          onClick={endWeek}
          disabled={isSimulating}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isSimulating
              ? 'cursor-not-allowed bg-gray-700 text-gray-500'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700'
          }`}
        >
          {isSimulating ? 'Simulating...' : 'Next Week \u2192'}
        </button>
      </div>
    </header>
  );
}
