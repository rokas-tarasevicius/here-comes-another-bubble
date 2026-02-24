import { useGameStore } from '../../store/index.ts';
import { calculateRevenueGrowthMomentum, calculateCurrentPricingTier, calculateMaxPrice, calculateMinPrice } from '../../engine/derived.ts';
import { formatCurrency } from '../../utils/format.ts';
import { CashFlowChart } from '../shared/CashFlowChart.tsx';
import { FundraisingPanel } from '../shared/FundraisingPanel.tsx';
import { InfoTip } from '../shared/InfoTip.tsx';
import { PRICING_TIERS, CERTIFICATION_DEFS, getScaledTierRequirements, checkTierCertsRequirement } from '../../data/compliance.ts';

/**
 * Finance dashboard screen showing cash position, revenue, burn rate,
 * runway, cash flow chart, P&L breakdown, and fundraising controls.
 */
export function FinanceScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const seekFunding = useGameStore((s) => s.seekFunding);
  const setPricing = useGameStore((s) => s.setPricing);

  if (!gameState) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[--color-retro-text-light]">No active game. Start a new game first.</p>
      </div>
    );
  }

  const { finances, product, team, weekHistory, company, market, founder } = gameState;

  // P&L calculations
  const totalSalaries = team.teamSize * team.avgSalary;
  const totalAICosts = team.aiAgents.reduce((sum, a) => sum + a.costPerWeek, 0);
  const isGarageStage = company.stage === 'garage' || company.stage === 'pre-seed';
  const baseCost = isGarageStage ? 100 : 500;
  const overheadEstimate = baseCost + team.teamSize * 50;
  const totalExpenses = totalSalaries + totalAICosts + overheadEstimate + finances.marketingSpend;
  const netIncome = finances.weeklyRevenue - totalExpenses;

  // Growth momentum (mirrors engine calculation)
  const growthMomentum = calculateRevenueGrowthMomentum(gameState);

  // Raise probability (mirrors applySeekFunding formula in tick.ts)
  const raiseChance = (() => {
    const momentumFactor = growthMomentum;
    const investorSentimentFactor = market.investorSentiment / 100;
    const pmfFactor = product.pmfScore / 100;
    const reputationFactor = company.reputation / 100;
    const founderBizFactor = founder.bizSkill / 100;
    const founderNetworkFactor = founder.network / 100;
    const teamSizeFactor = Math.min((team.teamSize + team.aiAgents.length) / 10, 1);
    const rawProb =
      momentumFactor * 0.25 +
      investorSentimentFactor * 0.15 +
      pmfFactor * 0.15 +
      reputationFactor * 0.15 +
      founderBizFactor * 0.10 +
      founderNetworkFactor * 0.10 +
      teamSizeFactor * 0.10;
    let prob = Math.max(5, Math.min(90, rawProb * 100));
    // Hot company bonus
    if (growthMomentum > 0.8) {
      prob = Math.max(60, prob);
    }
    return prob;
  })();

  // Pricing tier calculations
  const currentTier = calculateCurrentPricingTier(gameState);
  const maxPrice = calculateMaxPrice(gameState);
  const minPrice = calculateMinPrice(gameState);
  const engineers = team.members.filter((m) => m.role === 'engineer').length;
  const shippedFeatures = product.features.filter((f) => f.status === 'shipped').length;
  const quality = product.overallQuality;
  const completedCertIds = gameState.compliance
    ? gameState.compliance.certifications.filter((c) => c.status === 'completed').map((c) => c.id)
    : [];

  // Pricing model display
  const pricingLabels: Record<string, string> = {
    subscription: 'Subscription',
    'usage-based': 'Usage-Based',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-heading text-2xl font-bold text-[--color-retro-text]">Finances</h1>
        <p className="text-sm text-[--color-retro-text-light]">Week {gameState.meta.week} financial overview</p>
      </div>

      {/* Cash Flow Chart */}
      <CashFlowChart weekHistory={weekHistory} />

      {/* P&L + Fundraising */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* P&L Section */}
        <div className="retro-card">
          <h3 className="retro-section-heading">
            <span className="retro-label-tip">Weekly P&L<InfoTip text="Profit & Loss statement for this week. Revenue minus expenses = net income. Negative net income drains your cash reserves and shortens runway." /></span>
          </h3>

          {/* Revenue Breakdown */}
          <div className="mb-4">
            <span className="retro-label mb-2 block">Revenue<InfoTip text="Income from paying customers. Revenue = customers × unit price. Grow revenue by acquiring more customers or increasing your price (carefully — high prices reduce growth)." /></span>
            <div className="space-y-1.5">
              <div className="retro-stat-row">
                <span className="text-xs text-[--color-retro-text-muted]">
                  {pricingLabels[finances.pricingModel] ?? finances.pricingModel}{' '}
                  ({product.customers.toLocaleString()} customers)
                </span>
                <span className="retro-value text-[--color-retro-green]">
                  {formatCurrency(finances.weeklyRevenue)}
                </span>
              </div>
              {finances.pricePerUnit > 0 && (
                <div className="flex items-center gap-2">
                  <span className="retro-stat-tag">
                    <span className="retro-stat-tag-label">Unit price</span>
                    <span className="retro-stat-tag-value">{formatCurrency(finances.pricePerUnit)}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="mb-4">
            <span className="retro-label mb-2 block">Expenses<InfoTip text="All weekly costs: salaries, AI agents, overhead (scales with team size and stage), and marketing. Keep expenses below revenue to become profitable." /></span>
            <div className="space-y-1.5">
              <div className="retro-stat-row">
                <span className="text-xs text-[--color-retro-text-muted]">Salaries ({team.teamSize} members)</span>
                <span className="retro-value text-[--color-retro-red]">{formatCurrency(totalSalaries)}</span>
              </div>
              <div className="retro-stat-row">
                <span className="text-xs text-[--color-retro-text-muted]">AI Agents ({team.aiAgents.length})</span>
                <span className="retro-value text-[--color-retro-red]">{formatCurrency(totalAICosts)}</span>
              </div>
              <div className="retro-stat-row">
                <span className="text-xs text-[--color-retro-text-muted]">Overhead ({isGarageStage ? 'garage' : 'office'} + infra)<InfoTip text="Fixed costs that increase with team size. Garage stage is cheap ($100 base), office costs more ($500 base). Each team member adds $50/wk in infrastructure." /></span>
                <span className="retro-value text-[--color-retro-red]">{formatCurrency(overheadEstimate)}</span>
              </div>
              {finances.marketingSpend > 0 && (
                <div className="retro-stat-row">
                  <span className="text-xs text-[--color-retro-text-muted]">
                    Marketing
                    {finances.weeklyRevenue > 0 && (
                      <span className="text-[--color-retro-text-muted] ml-1">({Math.round((finances.marketingSpend / finances.weeklyRevenue) * 100)}% of rev)</span>
                    )}
                  </span>
                  <span className="retro-value text-[--color-retro-red]">{formatCurrency(finances.marketingSpend)}</span>
                </div>
              )}
              <div className="border-t border-black/4 pt-1.5 retro-stat-row">
                <span className="text-xs font-bold text-[--color-retro-text]">Total</span>
                <span className="retro-value text-[--color-retro-red]">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Net Income */}
          <div className="border-t border-black/4 pt-3">
            <div className="retro-stat-row">
              <span className="retro-label">
                {netIncome >= 0 ? 'Net Profit' : 'Net Loss'}
              </span>
              <span
                className={`retro-value ${
                  netIncome >= 0 ? 'text-[--color-retro-green-dark]' : 'text-[--color-retro-red]'
                }`}
              >
                {netIncome >= 0 ? '+' : ''}
                {formatCurrency(netIncome)}
              </span>
            </div>
          </div>
        </div>

        {/* Fundraising Panel */}
        <FundraisingPanel
          stage={company.stage}
          founderEquity={finances.founderEquity}
          fundingHistory={finances.fundingHistory}
          pricingModel={finances.pricingModel}
          pricePerUnit={finances.pricePerUnit}
          lastPricingChangeWeek={finances.lastPricingChangeWeek}
          currentWeek={gameState.meta.week}
          fundingSoughtThisWeek={gameState.meta.fundingSoughtThisWeek}
          investorSentiment={market.investorSentiment}
          raiseChance={raiseChance}
          growthMomentum={growthMomentum}
          onSeekFunding={(targetStage) => seekFunding(targetStage)}
          onChangePricing={(model, price) => setPricing(model, price)}
          currentTier={currentTier}
          maxPrice={maxPrice}
          minPrice={minPrice}
          engineers={engineers}
          shippedFeatures={shippedFeatures}
          quality={quality}
          completedCertIds={completedCertIds}
          difficulty={gameState.meta.difficulty}
          segment={market.segment}
        />
      </div>

      {/* Pricing Tier Roadmap */}
      <div className="retro-card">
        <h3 className="retro-section-heading">
          <span className="retro-label-tip">
            Pricing Tier Roadmap
            <InfoTip text="Higher tiers unlock higher prices. Each tier requires more engineers, shipped features, product quality, and compliance certifications. Your current tier determines the maximum price you can charge." />
          </span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {PRICING_TIERS.map((tier) => {
            const isCurrent = tier.tier === currentTier;
            const isUnlocked = tier.tier <= currentTier;
            const scaled = getScaledTierRequirements(tier, gameState.meta.difficulty);
            const meetsCerts = checkTierCertsRequirement(tier, completedCertIds, market.segment);
            const meetsEngineers = engineers >= scaled.requiredEngineers;
            const meetsFeatures = shippedFeatures >= tier.requiredShippedFeatures;
            const meetsQuality = quality >= scaled.requiredQuality;
            const defaultPrice = market.segmentData.defaultPrice;

            return (
              <div
                key={tier.tier}
                className={`retro-inset p-3 ${isCurrent ? 'ring-2 ring-[--color-retro-blue]/50' : ''} ${!isUnlocked && !isCurrent ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-bold text-[--color-retro-text]">
                    {tier.tier}. {tier.name}
                  </span>
                  {isCurrent && (
                    <span className="retro-badge retro-badge-sm retro-badge-blue">Current</span>
                  )}
                  {isUnlocked && !isCurrent && (
                    <span className="retro-badge retro-badge-sm retro-badge-green">Unlocked</span>
                  )}
                </div>
                <div className="mb-1.5">
                  <span className="retro-stat-tag">
                    <span className="retro-stat-tag-label">Range</span>
                    <span className="retro-stat-tag-value">
                      {formatCurrency(Math.round(defaultPrice * tier.priceMultiplierMin))}–{formatCurrency(Math.round(defaultPrice * tier.priceMultiplierMax))}
                    </span>
                  </span>
                </div>
                {tier.tier > 1 && (
                  <div className="flex flex-col gap-1 text-xs">
                    <span className={meetsEngineers ? 'text-[--color-retro-green]' : 'text-[--color-retro-text-muted]'}>
                      {meetsEngineers ? '\u2713' : '\u2717'} {engineers}/{scaled.requiredEngineers} engineers
                    </span>
                    <span className={meetsFeatures ? 'text-[--color-retro-green]' : 'text-[--color-retro-text-muted]'}>
                      {meetsFeatures ? '\u2713' : '\u2717'} {shippedFeatures}/{tier.requiredShippedFeatures} features
                    </span>
                    <span className={meetsQuality ? 'text-[--color-retro-green]' : 'text-[--color-retro-text-muted]'}>
                      {meetsQuality ? '\u2713' : '\u2717'} {quality}/{scaled.requiredQuality} quality
                    </span>
                    {tier.requiredCerts.length > 0 && (
                      <span className={meetsCerts ? 'text-[--color-retro-green]' : 'text-[--color-retro-text-muted]'}>
                        {meetsCerts ? '\u2713' : '\u2717'}{' '}
                        {tier.tier === 3
                          ? 'SOC2-I or ISO'
                          : tier.requiredCerts.map((c) => CERTIFICATION_DEFS[c].name).join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
