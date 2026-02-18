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

  const barClasses: Record<typeof color, string> = {
    emerald: 'retro-progress-bar retro-progress-bar-green',
    amber: 'retro-progress-bar retro-progress-bar-orange',
    red: 'retro-progress-bar retro-progress-bar-red',
    blue: 'retro-progress-bar',
    violet: 'retro-progress-bar retro-progress-bar-purple',
  };
  const textColors: Record<typeof color, string> = {
    emerald: 'text-[--color-retro-green]',
    amber: 'text-[--color-retro-orange]',
    red: 'text-[--color-retro-red]',
    blue: 'text-[--color-retro-blue]',
    violet: 'text-[--color-retro-purple]',
  };

  return (
    <div className="retro-card">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-[--color-retro-text]">{label}</span>
        <span className={`text-sm font-[--font-retro-mono] font-bold ${textColors[color]}`}>
          {Math.round(clamped)}/100
        </span>
      </div>
      <div className="retro-progress mb-2">
        <div
          className={barClasses[color]}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="text-xs text-[--color-retro-text-muted]">{description}</p>
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
      <div className="retro-card">
        <h3 className="retro-section-heading">
          Customer Demand
        </h3>
        {customerDemand.length === 0 ? (
          <p className="text-sm text-[--color-retro-text-muted]">No specific demands identified yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {customerDemand.map((feature) => (
              <span
                key={feature}
                className="retro-badge retro-badge-blue"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Recent Market Events */}
      <div className="retro-card">
        <h3 className="retro-section-heading">
          Recent Market Events
        </h3>
        {marketEvents.length === 0 ? (
          <p className="text-sm text-[--color-retro-text-muted]">No market events yet.</p>
        ) : (
          <div className="space-y-2">
            {marketEvents.map((event) => (
              <div key={event.id} className="border-l-[3px] border-[--color-retro-blue] pl-3 rounded-r-lg" style={{ background: 'rgba(51,102,153,0.03)' }}>
                <div className="flex items-center gap-2 py-1">
                  <span className="retro-badge retro-badge-sm retro-badge-gray">Week {event.week}</span>
                  <span className="text-sm font-semibold text-[--color-retro-text]">{event.title}</span>
                </div>
                <p className="text-xs text-[--color-retro-text-muted] pb-1.5">{event.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
