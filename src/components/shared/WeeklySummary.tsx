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

  return (
    <div className="retro-card flex flex-col gap-3">
      <h3 className="retro-section-heading">
        Week {lastWeek} Recap
      </h3>

      {/* Metric Changes */}
      <div className="retro-inset flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[--color-retro-text-muted]">Cash</span>
          <span className={`font-[--font-retro-mono] font-semibold ${cashDelta !== null && cashDelta >= 0 ? 'text-[--color-retro-green]' : 'text-[--color-retro-red]'}`}>
            {cashDelta !== null
              ? `${cashDelta >= 0 ? '+' : ''}${formatCurrency(cashDelta)}`
              : formatCurrency(finances.cash)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[--color-retro-text-muted]">Revenue</span>
          <span className={`font-[--font-retro-mono] font-semibold ${revenueDelta !== null && revenueDelta >= 0 ? 'text-[--color-retro-green]' : 'text-[--color-retro-red]'}`}>
            {revenueDelta !== null
              ? `${revenueDelta >= 0 ? '+' : ''}${formatCurrency(revenueDelta)}`
              : formatCurrency(finances.weeklyRevenue)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[--color-retro-text-muted]">Users</span>
          <span className={`font-[--font-retro-mono] font-semibold ${customerDelta !== null && customerDelta >= 0 ? 'text-[--color-retro-green]' : 'text-[--color-retro-red]'}`}>
            {customerDelta !== null
              ? `${customerDelta >= 0 ? '+' : ''}${formatNumber(customerDelta)}`
              : formatNumber(product.customers)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="retro-hr" />

      {/* Recent Events */}
      {lastWeekEvents.length > 0 ? (
        <div className="flex flex-col gap-0">
          <span className="text-xs font-bold uppercase tracking-wider text-[--color-retro-text-muted] mb-2">
            Events
          </span>
          {lastWeekEvents.slice(0, 5).map((event, idx) => (
            <div key={event.id} className={`flex flex-col gap-0.5 py-2 ${idx > 0 ? 'border-t border-[--color-retro-border]' : ''}`}>
              <div className="flex items-center gap-2">
                <span className={CATEGORY_BADGE[event.category] ?? 'retro-badge retro-badge-sm retro-badge-gray'}>
                  {event.category}
                </span>
                <span className="text-sm font-medium text-[--color-retro-text]">{event.title}</span>
              </div>
              <span className="text-xs text-[--color-retro-text-light] line-clamp-2">
                {event.description}
              </span>
            </div>
          ))}
          {lastWeekEvents.length > 5 && (
            <span className="text-xs text-[--color-retro-text-light]">
              +{lastWeekEvents.length - 5} more events
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-[--color-retro-text-muted]">No events last week.</p>
      )}

      {/* Pending decisions */}
      {pendingCount > 0 && (
        <>
          <div className="retro-hr" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[--color-retro-orange] font-bold">
              {pendingCount} pending decision{pendingCount > 1 ? 's' : ''}
            </span>
            <span className="text-xs text-[--color-retro-text-light]">
              Resolve before advancing
            </span>
          </div>
        </>
      )}
    </div>
  );
}
