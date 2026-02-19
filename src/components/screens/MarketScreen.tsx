import { useGameStore } from '../../store/index.ts';
import { formatCurrency, formatPercent } from '../../utils/format.ts';
import { BubbleIndexGauge } from '../shared/BubbleIndexGauge.tsx';
import { CompetitorTable } from '../shared/CompetitorTable.tsx';
import { InfoTip } from '../shared/InfoTip.tsx';

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
  const annualRevenuePerCustomer = segmentData.revenuePerCustomer * 52;
  const totalMarketCustomers = annualRevenuePerCustomer > 0
    ? segmentData.size / annualRevenuePerCustomer
    : 1;
  const playerRow = {
    name: company.name,
    funding: finances.fundingHistory.reduce((sum, r) => sum + r.amount, 0),
    valuation: company.valuation,
    teamSize: team.teamSize + team.aiAgents.length,
    productQuality: product.overallQuality,
    marketShare: totalMarketCustomers > 0
      ? product.customers / totalMarketCustomers
      : 0,
    strategy: 'Player-controlled',
  };

  // Intensity and risk color helpers
  function intensityColor(value: number): string {
    if (value >= 70) return 'text-[--color-retro-red]';
    if (value >= 40) return 'text-[--color-retro-orange]';
    return 'text-[--color-retro-green]';
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div>
        <h1 className="page-heading text-2xl font-bold text-[--color-retro-text]">Market Intelligence</h1>
        <p className="text-sm text-[--color-retro-text-light]">Week {meta.week} market analysis</p>
      </div>

      {/* Top Row: Market Overview + Bubble Index */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Market Segment Info */}
        <div className="retro-card lg:col-span-2">
          <h3 className="retro-section-heading">
            Market Segment
          </h3>

          <div className="mb-4">
            <h2 className="page-heading text-lg font-bold text-[--color-retro-text]">{segmentData.name}</h2>
            <p className="text-sm text-[--color-retro-text-muted] mt-0.5">{segmentData.description}</p>
          </div>

          {/* Hero metrics */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4">
            <div className="flex flex-col gap-1.5">
              <span className="retro-label">Market Size<InfoTip text="Total addressable market (TAM) in dollars. A larger market means more room to grow but also attracts more competitors." /></span>
              <span className="retro-value-lg text-[--color-retro-green]">
                {formatCurrency(segmentData.size)}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="retro-label">Annual Growth<InfoTip text="How fast the market is expanding per year. Higher growth markets increase TAM each week, creating opportunities — but can also inflate the bubble." /></span>
              <span className="retro-value-lg text-[--color-retro-blue]">
                {formatPercent(segmentData.growthRate * 100)}
              </span>
            </div>
          </div>

          {/* Supporting stats */}
          <div className="retro-stat-footer">
            <span className="retro-stat-tag">
              <span className="retro-stat-tag-label">Growth/wk</span>
              <span className="retro-stat-tag-value text-[--color-retro-blue]">+{formatCurrency(segmentData.size * segmentData.growthRate / 52)}</span>
            </span>
            <span className="retro-stat-tag">
              <span className="retro-stat-tag-label">Competition<InfoTip text="How fierce the competitor landscape is (0–100). High competition makes it harder to acquire customers and increases churn. Competitors can die or merge." /></span>
              <span className={`retro-stat-tag-value ${intensityColor(segmentData.competitionIntensity)}`}>{segmentData.competitionIntensity}/100</span>
            </span>
            <span className="retro-stat-tag">
              <span className="retro-stat-tag-label">Reg. Risk<InfoTip text="Regulatory risk (0–100). High values mean governments may impose restrictions, fines, or compliance costs. Can trigger surprise regulatory events." /></span>
              <span className={`retro-stat-tag-value ${intensityColor(segmentData.regulatoryRisk)}`}>{segmentData.regulatoryRisk}/100</span>
            </span>
          </div>
        </div>

        {/* Bubble Index Gauge */}
        <BubbleIndexGauge value={bubbleIndex} trend={bubbleTrend} />
      </div>

      {/* Competitor Table */}
      <div className="overflow-x-auto">
        <CompetitorTable competitors={competitors} player={playerRow} />
      </div>
    </div>
  );
}
