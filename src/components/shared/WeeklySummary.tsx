import type { GameState } from '../../types/game.ts';
import { useGameStore } from '../../store/index.ts';
import { formatCurrency, formatNumber } from '../../utils/format.ts';

export interface WeeklySummaryProps {
  gameState: GameState;
}

const CATEGORY_BADGE: Record<string, string> = {
  market: 'retro-badge retro-badge-sm retro-badge-blue',
  team: 'retro-badge retro-badge-sm retro-badge-green',
  product: 'retro-badge retro-badge-sm retro-badge-purple',
  funding: 'retro-badge retro-badge-sm retro-badge-green',
  competitor: 'retro-badge retro-badge-sm retro-badge-red',
  regulation: 'retro-badge retro-badge-sm retro-badge-gray',
  culture: 'retro-badge retro-badge-sm retro-badge-orange',
  personal: 'retro-badge retro-badge-sm retro-badge-gray',
  random: 'retro-badge retro-badge-sm retro-badge-gray',
};

/**
 * Weekly summary component showing last week's key events and metric changes.
 */
export function WeeklySummary({ gameState }: WeeklySummaryProps) {
  const decisionsThisTurn = useGameStore((s) => s.decisionsThisTurn);
  const setScreen = useGameStore((s) => s.setScreen);
  const { meta, eventLog, pendingDecisions, weekHistory, finances, product } = gameState;
  const currentWeek = meta.week;

  // Week 1: no history yet
  if (currentWeek <= 1 && weekHistory.length === 0) {
    return (
      <div className="retro-card">
        <h3 className="retro-section-heading">Weekly Summary</h3>
        <p className="text-sm text-[--color-retro-text-muted]">
          Welcome! Advance to your first week to get started.
        </p>
      </div>
    );
  }

  // Events from last week
  const lastWeek = currentWeek - 1;
  const lastWeekEvents = eventLog.filter((e) => e.week === lastWeek);

  // Metric deltas (compare last two history entries)
  const latest = weekHistory[weekHistory.length - 1];
  const previous = weekHistory.length >= 2 ? weekHistory[weekHistory.length - 2] : null;

  const cashDelta = previous ? latest.cash - previous.cash : null;
  const revenueDelta = previous ? latest.revenue - previous.revenue : null;
  const customerDelta = previous ? latest.customers - previous.customers : null;

  const pendingCount = pendingDecisions.filter(
    (d) => d.deadline <= currentWeek && !decisionsThisTurn.some(
      (dt) => dt.type === 'respond-to-event' && dt.decisionId === d.id
    )
  ).length;

  const formatDelta = (val: number | null, formatter: (n: number) => string, fallback: string) => {
    if (val === null) return fallback;
    return `${val >= 0 ? '+' : ''}${formatter(val)}`;
  };

  const deltaColor = (val: number | null) =>
    val !== null && val >= 0 ? 'text-[--color-retro-green]' : 'text-[--color-retro-red]';

  return (
    <div className="retro-card flex flex-col gap-4">
      <h3 className="retro-section-heading">
        Week {lastWeek} Recap
      </h3>

      {/* Performance — stat tags */}
      <div className="retro-stat-footer">
        <span className="retro-stat-tag">
          <span className="retro-stat-tag-label">Cash</span>
          <span className={`retro-stat-tag-value ${deltaColor(cashDelta)}`}>
            {formatDelta(cashDelta, formatCurrency, formatCurrency(finances.cash))}
          </span>
        </span>
        <span className="retro-stat-tag">
          <span className="retro-stat-tag-label">Revenue</span>
          <span className={`retro-stat-tag-value ${deltaColor(revenueDelta)}`}>
            {formatDelta(revenueDelta, formatCurrency, formatCurrency(finances.weeklyRevenue))}
          </span>
        </span>
        <span className="retro-stat-tag">
          <span className="retro-stat-tag-label">Users</span>
          <span className={`retro-stat-tag-value ${deltaColor(customerDelta)}`}>
            {formatDelta(customerDelta, formatNumber, formatNumber(product.customers))}
          </span>
        </span>
      </div>

      {/* Recent Events */}
      {lastWeekEvents.length > 0 && (
        <div>
          <span className="retro-label mb-2 block">
            Events ({lastWeekEvents.length})
          </span>
          <div className="space-y-2">
            {lastWeekEvents.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="rounded-lg px-3 py-2.5 border border-black/6"
                style={{
                  background: 'linear-gradient(to bottom, #ffffff, #fcfbf9)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={CATEGORY_BADGE[event.category] ?? 'retro-badge retro-badge-sm retro-badge-gray'}>
                    {event.category}
                  </span>
                  <span className="text-sm font-semibold text-[--color-retro-text]">{event.title}</span>
                </div>
                <p className="text-xs text-[--color-retro-text-muted] line-clamp-2 leading-relaxed">
                  {event.description}
                </p>
              </div>
            ))}
            {lastWeekEvents.length > 5 && (
              <span className="retro-label block text-center">
                +{lastWeekEvents.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Pending decisions */}
      {pendingCount > 0 && (
        <button
          onClick={() => setScreen('decisions')}
          className="btn-glossy btn-orange w-full"
        >
          {pendingCount} pending decision{pendingCount > 1 ? 's' : ''} — Resolve →
        </button>
      )}
    </div>
  );
}
