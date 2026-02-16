import { useGameStore } from '../../store/index.ts';
import { formatCurrency, formatPercent } from '../../utils/format.ts';
import { BubbleIndexGauge } from '../shared/BubbleIndexGauge.tsx';
import { CompetitorTable } from '../shared/CompetitorTable.tsx';

/**
 * Market intelligence screen showing market overview, bubble index,
 * competitor landscape, and market trend indicators.
 */
export function MarketScreen() {
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[--color-retro-text-light]">No active game. Start a new game first.</p>
      </div>
    );
  }

  const { market, company, finances, team, product, meta } = gameState;
  const { segmentData, competitors, bubbleIndex, bubbleTrend } = market;

  // Player row for competitor table
  const playerRow = {
    name: company.name,
    funding: finances.fundingHistory.reduce((sum, r) => sum + r.amount, 0),
    teamSize: team.teamSize + team.aiAgents.length,
    productQuality: product.overallQuality,
    marketShare: segmentData.size > 0
      ? product.customers / segmentData.size
      : 0,
    strategy: 'Player-controlled',
  };

  // Intensity and risk color helpers
  function intensityColor(value: number): string {
    if (value >= 70) return 'text-[--color-retro-red]';
    if (value >= 40) return 'text-[--color-retro-orange]';
    return 'text-[--color-retro-green]';
  }

  function intensityBarClass(value: number): string {
    if (value >= 70) return 'retro-progress-bar retro-progress-bar-red';
    if (value >= 40) return 'retro-progress-bar retro-progress-bar-orange';
    return 'retro-progress-bar retro-progress-bar-green';
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-[--font-retro-heading] text-[--color-retro-text]">Market Intelligence</h1>
        <p className="text-sm text-[--color-retro-text-light]">Week {meta.week} market analysis</p>
      </div>

      {/* Top Row: Market Overview + Bubble Index */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Market Segment Info */}
        <div className="retro-card lg:col-span-2">
          <h3 className="retro-section-heading">
            Market Segment
          </h3>

          <div className="mb-3">
            <h2 className="text-lg font-bold text-[--color-retro-text]">{segmentData.name}</h2>
            <p className="text-sm text-[--color-retro-text-muted]">{segmentData.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Market Size */}
            <div>
              <span className="text-xs uppercase tracking-wider text-[--color-retro-text-light]">Market Size</span>
              <p className="text-lg font-bold font-[--font-retro-mono] text-[--color-retro-green]">
                {formatCurrency(segmentData.size)}
              </p>
            </div>

            {/* Growth Rate */}
            <div>
              <span className="text-xs uppercase tracking-wider text-[--color-retro-text-light]">Growth Rate</span>
              <p className="text-lg font-bold font-[--font-retro-mono] text-[--color-retro-blue]">
                {formatPercent(segmentData.growthRate * 100)}
              </p>
            </div>

            {/* Competition Intensity */}
            <div>
              <span className="text-xs uppercase tracking-wider text-[--color-retro-text-light]">Competition</span>
              <div className="mt-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className={`text-sm font-semibold font-[--font-retro-mono] ${intensityColor(segmentData.competitionIntensity)}`}>
                    {segmentData.competitionIntensity}/100
                  </span>
                </div>
                <div className="retro-progress !h-2">
                  <div
                    className={intensityBarClass(segmentData.competitionIntensity)}
                    style={{ width: `${segmentData.competitionIntensity}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Regulatory Risk */}
            <div>
              <span className="text-xs uppercase tracking-wider text-[--color-retro-text-light]">Regulatory Risk</span>
              <div className="mt-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className={`text-sm font-semibold font-[--font-retro-mono] ${intensityColor(segmentData.regulatoryRisk)}`}>
                    {segmentData.regulatoryRisk}/100
                  </span>
                </div>
                <div className="retro-progress !h-2">
                  <div
                    className={intensityBarClass(segmentData.regulatoryRisk)}
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
    </div>
  );
}
