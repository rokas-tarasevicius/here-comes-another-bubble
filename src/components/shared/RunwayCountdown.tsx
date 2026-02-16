export interface RunwayCountdownProps {
  cash: number;
  weeklyBurn: number;
  weeklyRevenue?: number;
}

/**
 * Big runway display showing weeks until the company runs out of money.
 * Color-coded by urgency: emerald (safe), amber (warning), red (danger).
 * Shows "Profitable!" when revenue exceeds burn.
 */
export function RunwayCountdown({ cash, weeklyBurn, weeklyRevenue = 0 }: RunwayCountdownProps) {
  const netBurn = weeklyBurn - weeklyRevenue;
  const isProfitable = weeklyRevenue >= weeklyBurn && weeklyRevenue > 0;
  const runwayWeeks = netBurn > 0 ? Math.floor(cash / netBurn) : Infinity;

  let colorClass: string;
  let bgGlow: string;

  if (isProfitable) {
    colorClass = 'text-emerald-400';
    bgGlow = 'border-emerald-500/30';
  } else if (runwayWeeks > 26) {
    colorClass = 'text-emerald-400';
    bgGlow = 'border-emerald-500/30';
  } else if (runwayWeeks >= 12) {
    colorClass = 'text-amber-400';
    bgGlow = 'border-amber-500/30';
  } else {
    colorClass = 'text-red-400';
    bgGlow = 'border-red-500/30';
  }

  return (
    <div className={`rounded-lg border ${bgGlow} bg-gray-900 p-4 text-center`}>
      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
        Runway
      </span>

      {isProfitable ? (
        <>
          <div className={`mt-2 text-3xl font-bold font-mono ${colorClass}`}>
            Profitable!
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Revenue exceeds burn rate
          </p>
        </>
      ) : (
        <>
          <div className={`mt-2 text-3xl font-bold font-mono ${colorClass}`}>
            {runwayWeeks === Infinity ? '--' : runwayWeeks}{' '}
            <span className="text-lg font-semibold">weeks</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            until you run out of money
          </p>
        </>
      )}
    </div>
  );
}
