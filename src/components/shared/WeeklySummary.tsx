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

/**
 * Weekly summary component showing last week's key events and metric changes.
 */
export function WeeklySummary({ gameState }: WeeklySummaryProps) {
  const { meta, eventLog, pendingDecisions, weekHistory, finances, product } = gameState;
  const currentWeek = meta.week;

  // Week 1: no history yet
  if (currentWeek <= 1 && weekHistory.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h3 className="text-sm font-semibold text-gray-100 mb-3">Weekly Summary</h3>
        <p className="text-sm text-gray-400">
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
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-100">
        Week {lastWeek} Recap
      </h3>

      {/* Metric Changes */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Cash</span>
          <span className={`font-mono ${cashDelta !== null && cashDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {cashDelta !== null
              ? `${cashDelta >= 0 ? '+' : ''}${formatCurrency(cashDelta)}`
              : formatCurrency(finances.cash)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Revenue</span>
          <span className={`font-mono ${revenueDelta !== null && revenueDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {revenueDelta !== null
              ? `${revenueDelta >= 0 ? '+' : ''}${formatCurrency(revenueDelta)}`
              : formatCurrency(finances.weeklyRevenue)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Customers</span>
          <span className={`font-mono ${customerDelta !== null && customerDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {customerDelta !== null
              ? `${customerDelta >= 0 ? '+' : ''}${formatNumber(customerDelta)}`
              : formatNumber(product.customers)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800" />

      {/* Recent Events */}
      {lastWeekEvents.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Events
          </span>
          {lastWeekEvents.slice(0, 5).map((event) => (
            <div key={event.id} className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0" aria-hidden="true">
                {CATEGORY_ICONS[event.category] ?? '\u2022'}
              </span>
              <div className="flex flex-col">
                <span className="text-sm text-gray-200">{event.title}</span>
                <span className="text-xs text-gray-500 line-clamp-2">
                  {event.description}
                </span>
              </div>
            </div>
          ))}
          {lastWeekEvents.length > 5 && (
            <span className="text-xs text-gray-500">
              +{lastWeekEvents.length - 5} more events
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No events last week.</p>
      )}

      {/* Pending decisions */}
      {pendingCount > 0 && (
        <>
          <div className="border-t border-gray-800" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-400 font-medium">
              {pendingCount} pending decision{pendingCount > 1 ? 's' : ''}
            </span>
            <span className="text-xs text-gray-500">
              Resolve before advancing
            </span>
          </div>
        </>
      )}
    </div>
  );
}
