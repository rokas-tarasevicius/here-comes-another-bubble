import type { GameState } from '../../types/game.ts';
import { formatCurrency, formatNumber } from '../../utils/format.ts';

export interface WeeklySummaryProps {
  gameState: GameState;
}

const CATEGORY_ICONS: Record<string, string> = {
  market: '\uD83D\uDCC8',
  team: '\uD83D\uDC65',
  product: '\uD83D\uDEE0\uFE0F',
  funding: '\uD83D\uDCB0',
  competitor: '\u2694\uFE0F',
  regulation: '\uD83C\uDFDB\uFE0F',
  culture: '\uD83C\uDFAD',
  personal: '\uD83D\uDC64',
  random: '\uD83C\uDFB2',
};

const CATEGORY_BADGE: Record<string, string> = {
  market: 'retro-badge retro-badge-blue',
  team: 'retro-badge retro-badge-green',
  product: 'retro-badge retro-badge-purple',
  funding: 'retro-badge retro-badge-green',
  competitor: 'retro-badge retro-badge-red',
  regulation: 'retro-badge retro-badge-gray',
  culture: 'retro-badge retro-badge-orange',
  personal: 'retro-badge retro-badge-gray',
  random: 'retro-badge retro-badge-gray',
};

/**
 * Weekly summary component showing last week's key events and metric changes.
 */
export function WeeklySummary({ gameState }: WeeklySummaryProps) {
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

  const pendingCount = pendingDecisions.length;

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
          <span className="text-[--color-retro-text-muted]">Customers</span>
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
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[--color-retro-text-muted]">
            Events
          </span>
          {lastWeekEvents.slice(0, 5).map((event) => (
            <div key={event.id} className="flex items-start gap-2">
              <span className={CATEGORY_BADGE[event.category] ?? 'retro-badge retro-badge-gray'} style={{ flexShrink: 0, fontSize: '10px' }}>
                {CATEGORY_ICONS[event.category] ?? '\u2022'} {event.category}
              </span>
              <div className="flex flex-col">
                <span className="text-sm text-[--color-retro-text]">{event.title}</span>
                <span className="text-xs text-[--color-retro-text-light] line-clamp-2">
                  {event.description}
                </span>
              </div>
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
