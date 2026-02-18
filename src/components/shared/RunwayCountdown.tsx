export interface RunwayCountdownProps {
  cash: number;
  weeklyBurn: number;
  weeklyRevenue?: number;
}

/**
 * Big runway display showing weeks until the company runs out of money.
 * Color-coded by urgency: green (safe), orange (warning), red (danger).
 * Shows "Profitable!" when revenue exceeds burn.
 */
export function RunwayCountdown({ cash, weeklyBurn, weeklyRevenue = 0 }: RunwayCountdownProps) {
  const netBurn = weeklyBurn - weeklyRevenue;
  const isProfitable = weeklyRevenue >= weeklyBurn && weeklyRevenue > 0;
  const runwayWeeks = netBurn > 0 ? Math.floor(cash / netBurn) : Infinity;

  let colorClass: string;
  let borderColor: string;

  if (isProfitable) {
    colorClass = 'text-[--color-retro-green]';
    borderColor = 'border-[--color-retro-green]';
  } else if (runwayWeeks > 26) {
    colorClass = 'text-[--color-retro-green]';
    borderColor = 'border-[--color-retro-green]';
  } else if (runwayWeeks >= 12) {
    colorClass = 'text-[--color-retro-orange]';
    borderColor = 'border-[--color-retro-orange]';
  } else {
    colorClass = 'text-[--color-retro-red]';
    borderColor = 'border-[--color-retro-red]';
  }

  return (
    <div className={`retro-card border-l-[5px] ${borderColor} flex flex-col gap-2`}>
      <span className="retro-label">
        Runway
      </span>

      {isProfitable ? (
        <>
          <span className={`retro-value-lg font-retro-mono ${colorClass}`}
            style={{ textShadow: '0 1px 1px rgba(0,0,0,0.06)' }}
          >
            Profitable!
          </span>
          <span className="text-xs text-[--color-retro-text-light]">
            Revenue exceeds burn rate
          </span>
        </>
      ) : (
        <>
          <div className="flex items-end gap-1">
            <span className={`retro-value-lg font-retro-mono ${colorClass}`}
              style={{ textShadow: '0 1px 1px rgba(0,0,0,0.06)' }}
            >
              {runwayWeeks === Infinity ? '\u221E' : runwayWeeks}
            </span>
            <span className="text-sm font-medium text-[--color-retro-text-muted] mb-0.5">weeks</span>
          </div>
          <span className="text-xs text-[--color-retro-text-light]">
            until you run out of money
          </span>
        </>
      )}
    </div>
  );
}
