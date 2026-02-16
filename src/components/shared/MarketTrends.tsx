import type { EventLogEntry } from '../../types/game.ts';

export interface MarketTrendsProps {
  investorSentiment: number;   // 0-100
  talentMarketHeat: number;    // 0-100
  customerDemand: string[];
  eventLog: EventLogEntry[];
  currentWeek: number;
}

function MeterBar({ label, value, description, color }: {
  label: string;
  value: number;
  description: string;
  color: 'emerald' | 'amber' | 'red' | 'blue' | 'violet';
}) {
  const clamped = Math.max(0, Math.min(100, value));

  const barColors: Record<typeof color, string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    violet: 'bg-violet-500',
  };
  const textColors: Record<typeof color, string> = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    violet: 'text-violet-400',
  };

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className={`text-sm font-mono font-semibold ${textColors[color]}`}>
          {Math.round(clamped)}/100
        </span>
      </div>
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full ${barColors[color]} transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

/**
 * Market trends panel showing investor sentiment, talent market heat,
 * customer demand features, and recent market events.
 */
export function MarketTrends({
  investorSentiment,
  talentMarketHeat,
  customerDemand,
  eventLog,
  currentWeek,
}: MarketTrendsProps) {
  // Filter market events, show last 5
  const marketEvents = eventLog
    .filter((e) => e.category === 'market')
    .sort((a, b) => b.week - a.week)
    .slice(0, 5);

  const sentimentDesc =
    investorSentiment >= 70
      ? 'VCs are writing checks eagerly'
      : investorSentiment >= 40
        ? 'Moderate funding activity'
        : 'Investors are cautious and conservative';

  const talentDesc =
    talentMarketHeat >= 70
      ? 'Very hard to hire -- fierce competition for talent'
      : talentMarketHeat >= 40
        ? 'Moderate hiring difficulty'
        : 'Plenty of talent available';

  return (
    <div className="space-y-4">
      {/* Sentiment & Talent Meters */}
      <MeterBar
        label="Investor Sentiment"
        value={investorSentiment}
        description={sentimentDesc}
        color={investorSentiment >= 70 ? 'emerald' : investorSentiment >= 40 ? 'amber' : 'red'}
      />

      <MeterBar
        label="Talent Market Heat"
        value={talentMarketHeat}
        description={talentDesc}
        color={talentMarketHeat >= 70 ? 'red' : talentMarketHeat >= 40 ? 'amber' : 'emerald'}
      />

      {/* Customer Demand */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-400">
          Customer Demand
        </h3>
        {customerDemand.length === 0 ? (
          <p className="text-sm text-gray-500">No specific demands identified yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {customerDemand.map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Recent Market Events */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-400">
          Recent Market Events
        </h3>
        {marketEvents.length === 0 ? (
          <p className="text-sm text-gray-500">No market events yet.</p>
        ) : (
          <div className="space-y-2">
            {marketEvents.map((event) => (
              <div key={event.id} className="border-l-2 border-blue-500/40 pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Week {event.week}</span>
                  <span className="text-sm font-medium text-gray-300">{event.title}</span>
                </div>
                <p className="text-xs text-gray-500">{event.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
