import { useEffect } from 'react';
import { useGameStore } from '../../store/index.ts';
import { formatCurrency, formatNumber } from '../../utils/format.ts';

// ─── Delta row helper ───────────────────────────────────────────────────

interface DeltaRow {
  label: string;
  current: number;
  previous: number;
  format: 'currency' | 'number' | 'percent';
}

function formatValue(value: number, format: DeltaRow['format']): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'number':
      return formatNumber(value);
    case 'percent':
      return `${Math.round(value)}%`;
  }
}

function formatDelta(delta: number, format: DeltaRow['format']): string {
  const sign = delta >= 0 ? '+' : '';
  switch (format) {
    case 'currency':
      return `${sign}${formatCurrency(delta)}`;
    case 'number':
      return `${sign}${formatNumber(delta)}`;
    case 'percent':
      return `${sign}${Math.round(delta)}%`;
  }
}

// ─── Component ──────────────────────────────────────────────────────────

export function WeekRecap() {
  const gameState = useGameStore((s) => s.gameState);
  const showWeekRecap = useGameStore((s) => s.showWeekRecap);
  const dismissWeekRecap = useGameStore((s) => s.dismissWeekRecap);

  const weekHistory = gameState?.weekHistory;
  const shouldDismiss = showWeekRecap && (!gameState || !weekHistory || weekHistory.length === 0);

  useEffect(() => {
    if (shouldDismiss) dismissWeekRecap();
  }, [shouldDismiss, dismissWeekRecap]);

  if (!showWeekRecap || !gameState) return null;

  const { eventLog, meta } = gameState;

  if (!weekHistory || weekHistory.length === 0) return null;

  const latest = weekHistory[weekHistory.length - 1];
  const previous = weekHistory.length >= 2 ? weekHistory[weekHistory.length - 2] : null;

  const deltas: DeltaRow[] = [
    {
      label: 'Users',
      current: latest.customers,
      previous: previous?.customers ?? 0,
      format: 'number',
    },
    {
      label: 'Revenue',
      current: latest.revenue,
      previous: previous?.revenue ?? 0,
      format: 'currency',
    },
    {
      label: 'Cash',
      current: latest.cash,
      previous: previous?.cash ?? latest.cash,
      format: 'currency',
    },
    {
      label: 'Team',
      current: latest.teamSize,
      previous: previous?.teamSize ?? 0,
      format: 'number',
    },
    {
      label: 'Morale',
      current: latest.avgMorale,
      previous: previous?.avgMorale ?? latest.avgMorale,
      format: 'percent',
    },
  ];

  // Key events from this week
  const thisWeekEvents = eventLog
    .filter((e) => e.week === meta.week - 1 || e.week === meta.week)
    .slice(-4);

  return (
    <div
      className="retro-modal-overlay"
      onClick={dismissWeekRecap}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="retro-modal w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2 className="text-xl font-bold text-[--color-retro-text] mb-4 text-center">
          Week {meta.week - 1} Recap
        </h2>

        {/* Delta rows */}
        <div className="retro-inset flex flex-col gap-2 mb-4">
          {deltas.map((row) => {
            const delta = row.current - row.previous;
            const hasChange = previous !== null;

            return (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-[--color-retro-text-muted]">{row.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-retro-mono text-[--color-retro-text]">
                    {formatValue(row.current, row.format)}
                  </span>
                  {hasChange && delta !== 0 && (
                    <span
                      className={`font-retro-mono text-xs font-semibold ${
                        delta > 0 ? 'text-[--color-retro-green]' : 'text-[--color-retro-red]'
                      }`}
                    >
                      {formatDelta(delta, row.format)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Key events */}
        {thisWeekEvents.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-retro-text-muted] mb-2">
              Key Events
            </h3>
            <div className="flex flex-col gap-1.5">
              {thisWeekEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-2">
                  <span className="text-xs text-[--color-retro-text-light] shrink-0 mt-0.5">
                    &bull;
                  </span>
                  <span className="text-xs text-[--color-retro-text-muted] line-clamp-1">
                    {event.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={dismissWeekRecap}
          className="btn-glossy btn-blue w-full"
          autoFocus
        >
          Continue
        </button>

        <p className="text-center text-xs text-[--color-retro-text-light] mt-2">
          Press <kbd className="retro-badge retro-badge-sm retro-badge-gray mx-0.5">Enter</kbd> or <kbd className="retro-badge retro-badge-sm retro-badge-gray mx-0.5">Esc</kbd> to dismiss
        </p>
      </div>
    </div>
  );
}
