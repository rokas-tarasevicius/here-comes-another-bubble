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
    <div className={`retro-card border-l-4 ${borderColor} text-center`}>
      <span className="text-xs font-bold uppercase tracking-wider text-[--color-retro-text-muted]">
        Runway
      </span>

      {isProfitable ? (
        <>
          <div className={`mt-2 text-3xl font-bold font-[--font-retro-mono] ${colorClass}`}>
            Profitable!
          </div>
          <p className="mt-1 text-xs text-[--color-retro-text-light]">
            Revenue exceeds burn rate
          </p>
        </>
      ) : (
        <>
          <div className={`mt-2 text-3xl font-bold font-[--font-retro-mono] ${colorClass}`}>
            {runwayWeeks === Infinity ? '--' : runwayWeeks}{' '}
            <span className="text-lg font-semibold">weeks</span>
          </div>
          <p className="mt-1 text-xs text-[--color-retro-text-light]">
            until you run out of money
          </p>
        </>
      )}
    </div>
  );
}
