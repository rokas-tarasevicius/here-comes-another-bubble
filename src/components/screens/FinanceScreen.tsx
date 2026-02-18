import { useGameStore } from '../../store/index.ts';
import { formatCurrency } from '../../utils/format.ts';
import { CashFlowChart } from '../shared/CashFlowChart.tsx';
import { FundraisingPanel } from '../shared/FundraisingPanel.tsx';
import { InfoTip } from '../shared/InfoTip.tsx';

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

  // Raise probability (mirrors applySeekFunding formula in tick.ts)
  const raiseChance = (() => {
    const investorSentimentFactor = market.investorSentiment / 100;
    const revenueFactor = Math.min(finances.weeklyRevenue / 5000, 1);
    const teamSizeFactor = Math.min((team.teamSize + team.aiAgents.length) / 10, 1);
    const pmfFactor = product.pmfScore / 100;
    const founderBizFactor = founder.bizSkill / 100;
    const founderNetworkFactor = founder.network / 100;
    const reputationFactor = company.reputation / 100;
    const rawProb =
      investorSentimentFactor * 0.20 +
      revenueFactor * 0.15 +
      teamSizeFactor * 0.10 +
      pmfFactor * 0.15 +
      founderBizFactor * 0.15 +
      founderNetworkFactor * 0.10 +
      reputationFactor * 0.15;
    return Math.max(10, Math.min(85, rawProb * 100));
  })();

  // Pricing model display
  const pricingLabels: Record<string, string> = {
    subscription: 'Subscription',
    'usage-based': 'Usage-Based',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[--color-retro-text]" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>Finances</h1>
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
                  <span className="text-xs text-[--color-retro-text-muted]">Marketing</span>
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
          onSeekFunding={(targetStage) => seekFunding(targetStage)}
          onChangePricing={(model, price) => setPricing(model, price)}
        />
      </div>
    </div>
  );
}
