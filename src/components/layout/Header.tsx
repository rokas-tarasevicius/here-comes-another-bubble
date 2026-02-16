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
  'garage': 'retro-badge retro-badge-gray',
  'pre-seed': 'retro-badge retro-badge-gray',
  'seed': 'retro-badge retro-badge-orange',
  'series-a': 'retro-badge retro-badge-blue',
  'series-b': 'retro-badge retro-badge-purple',
  'series-c': 'retro-badge retro-badge-purple',
  'growth': 'retro-badge retro-badge-green',
  'public': 'retro-badge retro-badge-green',
  'dead': 'retro-badge retro-badge-red',
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
    <header className="retro-header flex items-center justify-between px-6 py-3">
      {/* Left: Company name + stage badge */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-[--font-retro-heading] font-bold text-[--color-retro-text]">{company.name}</h1>
        <span
          className={`text-xs ${stageBadgeClass}`}
        >
          {stageLabel}
        </span>
      </div>

      {/* Center: Date display */}
      <div className="retro-badge retro-badge-blue font-[--font-retro-mono] text-xs">
        {dateStr}
      </div>

      {/* Right: Cash + pending warning + Next Week button */}
      <div className="flex items-center gap-4">
        <span className="font-[--font-retro-mono] text-sm font-bold text-[--color-retro-green-dark]">
          {formatCash(finances.cash)}
        </span>

        {pendingCount > 0 && (
          <span className="retro-badge retro-badge-orange flex items-center gap-1 text-xs">
            {pendingCount} pending
          </span>
        )}

        <button
          onClick={endWeek}
          disabled={isSimulating}
          className={`btn-glossy text-sm ${
            isSimulating
              ? 'btn-silver cursor-not-allowed opacity-60'
              : 'btn-green'
          }`}
        >
          {isSimulating ? 'Simulating...' : 'Next Week \u2192'}
        </button>
      </div>
    </header>
  );
}
