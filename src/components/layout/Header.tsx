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
  const setScreen = useGameStore((s) => s.setScreen);

  if (!gameState) return null;

  const decisionsThisTurn = useGameStore((s) => s.decisionsThisTurn);
  const { meta, company, finances, pendingDecisions } = gameState;

  // Only count decisions due this week that haven't been responded to yet
  const unresolvedDecisions = pendingDecisions.filter(
    (d) => d.deadline <= meta.week && !decisionsThisTurn.some(
      (dt) => dt.type === 'respond-to-event' && dt.decisionId === d.id
    )
  );
  const pendingCount = unresolvedDecisions.length;
  const hasUrgentUnresolved = pendingCount > 0;
  const monthName = MONTH_NAMES[meta.month - 1] ?? 'Jan';
  const dateStr = `Week ${meta.week} \u2014 ${monthName} ${meta.day}, ${meta.year}`;
  const stageBadgeClass = STAGE_COLORS[company.stage] ?? 'bg-gray-700 text-gray-300';
  const stageLabel = STAGE_LABELS[company.stage] ?? company.stage;

  return (
    <header className="retro-header flex flex-wrap items-center justify-between gap-2 px-3 md:px-6 py-2 md:py-3">
      {/* Left: Company name + stage badge */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <h1 className="text-sm md:text-lg font-[--font-retro-heading] font-bold text-[--color-retro-text] truncate">{company.name}</h1>
        <span
          className={`text-xs shrink-0 ${stageBadgeClass}`}
        >
          {stageLabel}
        </span>
      </div>

      {/* Center: Date display */}
      <div className="retro-badge retro-badge-blue font-[--font-retro-mono] text-xs shrink-0">
        {dateStr}
      </div>

      {/* Right: Cash + pending warning + Next Week button */}
      <div className="flex items-center gap-2 md:gap-4">
        <span className="font-[--font-retro-mono] text-xs md:text-sm font-bold text-[--color-retro-green-dark]">
          {formatCash(finances.cash)}
        </span>

        {pendingCount > 0 && (
          <span className="retro-badge retro-badge-orange flex items-center gap-1 text-xs">
            {pendingCount} pending
          </span>
        )}

        {hasUrgentUnresolved && (
          <span className="retro-badge retro-badge-red text-xs animate-pulse">
            Decisions Due!
          </span>
        )}

        <button
          onClick={hasUrgentUnresolved ? () => setScreen('decisions') : endWeek}
          disabled={isSimulating}
          className={`btn-glossy text-xs md:text-sm ${
            isSimulating
              ? 'btn-silver cursor-not-allowed opacity-60'
              : hasUrgentUnresolved
                ? 'btn-red'
                : 'btn-green'
          }`}
        >
          {isSimulating ? 'Simulating...' : hasUrgentUnresolved ? 'Resolve Decisions First' : 'Next Week \u2192'}
        </button>
      </div>
    </header>
  );
}
