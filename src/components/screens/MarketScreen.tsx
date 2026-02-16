import { useGameStore } from '../../store/index.ts';
import { formatCurrency, formatPercent } from '../../utils/format.ts';
import { BubbleIndexGauge } from '../shared/BubbleIndexGauge.tsx';
import { CompetitorTable } from '../shared/CompetitorTable.tsx';
import { MarketTrends } from '../shared/MarketTrends.tsx';

/**
 * Market intelligence screen showing market overview, bubble index,
 * competitor landscape, and market trend indicators.
 */
export function MarketScreen() {
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">No active game. Start a new game first.</p>
      </div>
    );
  }

  const { market, company, finances, team, product, eventLog, meta } = gameState;
  const { segmentData, competitors, bubbleIndex, bubbleTrend, talentMarketHeat, investorSentiment } = market;

  // Player row for competitor table
  const playerRow = {
    name: company.name,
    funding: finances.fundingHistory.reduce((sum, r) => sum + r.amount, 0),
    teamSize: team.employees.length + team.aiAgents.length,
    productQuality: product.overallQuality,
    marketShare: competitors.length > 0
      ? 1 - competitors.reduce((sum, c) => sum + c.marketShare, 0)
      : 1,
    strategy: 'Player-controlled',
  };

  // Intensity and risk color helpers
  function intensityColor(value: number): string {
    if (value >= 70) return 'text-red-400';
    if (value >= 40) return 'text-amber-400';
    return 'text-emerald-400';
  }

  function intensityBarColor(value: number): string {
    if (value >= 70) return 'bg-red-500';
    if (value >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Market Intelligence</h1>
        <p className="text-sm text-gray-500">Week {meta.week} market analysis</p>
      </div>

      {/* Top Row: Market Overview + Bubble Index */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Market Segment Info */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-400">
            Market Segment
          </h3>

          <div className="mb-3">
            <h2 className="text-lg font-bold text-gray-100">{segmentData.name}</h2>
            <p className="text-sm text-gray-400">{segmentData.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Market Size */}
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-500">Market Size</span>
              <p className="text-lg font-bold font-mono text-emerald-400">
                {formatCurrency(segmentData.size)}
              </p>
            </div>

            {/* Growth Rate */}
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-500">Growth Rate</span>
              <p className="text-lg font-bold font-mono text-blue-400">
                {formatPercent(segmentData.growthRate * 100)}
              </p>
            </div>

            {/* Competition Intensity */}
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-500">Competition</span>
              <div className="mt-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className={`text-sm font-semibold font-mono ${intensityColor(segmentData.competitionIntensity)}`}>
                    {segmentData.competitionIntensity}/100
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className={`h-full rounded-full ${intensityBarColor(segmentData.competitionIntensity)} transition-all duration-300`}
                    style={{ width: `${segmentData.competitionIntensity}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Regulatory Risk */}
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-500">Regulatory Risk</span>
              <div className="mt-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className={`text-sm font-semibold font-mono ${intensityColor(segmentData.regulatoryRisk)}`}>
                    {segmentData.regulatoryRisk}/100
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className={`h-full rounded-full ${intensityBarColor(segmentData.regulatoryRisk)} transition-all duration-300`}
                    style={{ width: `${segmentData.regulatoryRisk}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bubble Index Gauge */}
        <BubbleIndexGauge value={bubbleIndex} trend={bubbleTrend} />
      </div>

      {/* Competitor Table */}
      <CompetitorTable competitors={competitors} player={playerRow} />

      {/* Market Trends */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-100">Market Trends</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MarketTrends
            investorSentiment={investorSentiment}
            talentMarketHeat={talentMarketHeat}
            customerDemand={segmentData.customerDemand}
            eventLog={eventLog}
            currentWeek={meta.week}
          />
        </div>
      </div>
    </div>
  );
}
