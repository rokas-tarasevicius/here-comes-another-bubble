import { useGameStore } from '../../store/index.ts';
import { formatCurrency } from '../../utils/format.ts';
import { KPICard } from '../shared/KPICard.tsx';
import { CashFlowChart } from '../shared/CashFlowChart.tsx';
import { RunwayCountdown } from '../shared/RunwayCountdown.tsx';
import { FundraisingPanel } from '../shared/FundraisingPanel.tsx';

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

  const { finances, product, team, weekHistory, company } = gameState;

  // Revenue trend from recent history
  const recentRevenue = weekHistory.slice(-8).map((w) => w.revenue);
  const revenueTrend: 'up' | 'down' | 'flat' =
    recentRevenue.length >= 2
      ? recentRevenue[recentRevenue.length - 1] > recentRevenue[recentRevenue.length - 2]
        ? 'up'
        : recentRevenue[recentRevenue.length - 1] < recentRevenue[recentRevenue.length - 2]
          ? 'down'
          : 'flat'
      : 'flat';

  // Cash trend
  const recentCash = weekHistory.slice(-8).map((w) => w.cash);

  // Burn trend
  const recentBurn = weekHistory.slice(-8).map((w) => w.burn);

  // P&L calculations
  const totalSalaries = team.teamSize * team.avgSalary;
  const totalAICosts = team.aiAgents.reduce((sum, a) => sum + a.costPerWeek, 0);
  const isGarageStage = company.stage === 'garage' || company.stage === 'pre-seed';
  const baseCost = isGarageStage ? 100 : 500;
  const overheadEstimate = baseCost + team.teamSize * 50;
  const totalExpenses = totalSalaries + totalAICosts + overheadEstimate + finances.marketingSpend;
  const netIncome = finances.weeklyRevenue - totalExpenses;

  // Pricing model display
  const pricingLabels: Record<string, string> = {
    subscription: 'Subscription',
    'usage-based': 'Usage-Based',
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-[--font-retro-heading] text-[--color-retro-text]">Finances</h1>
        <p className="text-sm text-[--color-retro-text-light]">Week {gameState.meta.week} financial overview</p>
      </div>

      {/* Top Row: Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Cash"
          value={formatCurrency(finances.cash)}
          color="emerald"
          sparklineData={recentCash}
        />
        <KPICard
          title="Weekly Revenue"
          value={formatCurrency(finances.weeklyRevenue)}
          trend={revenueTrend}
          color="blue"
          sparklineData={recentRevenue}
          subtitle={`${pricingLabels[finances.pricingModel] ?? finances.pricingModel} model`}
        />
        <KPICard
          title="Weekly Burn"
          value={formatCurrency(finances.weeklyBurn)}
          color="red"
          sparklineData={recentBurn}
          subtitle={`${formatCurrency(finances.monthlyExpenses)}/mo expenses`}
        />
        <RunwayCountdown
          cash={finances.cash}
          weeklyBurn={finances.weeklyBurn}
          weeklyRevenue={finances.weeklyRevenue}
        />
      </div>

      {/* Cash Flow Chart */}
      <CashFlowChart weekHistory={weekHistory} />

      {/* P&L + Fundraising */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* P&L Section */}
        <div className="retro-card">
          <h3 className="retro-section-heading">
            Weekly P&L
          </h3>

          {/* Revenue Breakdown */}
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold uppercase text-[--color-retro-green]">Revenue</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[--color-retro-text-muted]">
                  {pricingLabels[finances.pricingModel] ?? finances.pricingModel}{' '}
                  ({product.customers.toLocaleString()} customers)
                </span>
                <span className="font-[--font-retro-mono] text-[--color-retro-green]">
                  {formatCurrency(finances.weeklyRevenue)}
                </span>
              </div>
              {finances.pricePerUnit > 0 && (
                <p className="text-xs text-[--color-retro-text-light]">
                  {formatCurrency(finances.pricePerUnit)}/unit
                </p>
              )}
            </div>
            <div className="mt-2 border-t border-[--color-retro-border] pt-1 flex items-center justify-between text-sm font-semibold">
              <span className="text-[--color-retro-text]">Total Revenue</span>
              <span className="font-[--font-retro-mono] text-[--color-retro-green]">
                {formatCurrency(finances.weeklyRevenue)}
              </span>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold uppercase text-[--color-retro-red]">Expenses</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[--color-retro-text-muted]">
                  Salaries ({team.teamSize} team members)
                </span>
                <span className="font-[--font-retro-mono] text-[--color-retro-red]">
                  {formatCurrency(totalSalaries)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[--color-retro-text-muted]">
                  AI Agents ({team.aiAgents.length} agents)
                </span>
                <span className="font-[--font-retro-mono] text-[--color-retro-red]">
                  {formatCurrency(totalAICosts)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[--color-retro-text-muted]">
                  Overhead ({isGarageStage ? 'garage' : 'office'} + infra)
                </span>
                <span className="font-[--font-retro-mono] text-[--color-retro-red]">
                  {formatCurrency(overheadEstimate)}
                </span>
              </div>
              {finances.marketingSpend > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[--color-retro-text-muted]">Marketing</span>
                  <span className="font-[--font-retro-mono] text-[--color-retro-red]">
                    {formatCurrency(finances.marketingSpend)}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-2 border-t border-[--color-retro-border] pt-1 flex items-center justify-between text-sm font-semibold">
              <span className="text-[--color-retro-text]">Total Expenses</span>
              <span className="font-[--font-retro-mono] text-[--color-retro-red]">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>

          {/* Net Income */}
          <div className="retro-inset">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[--color-retro-text]">Net Income</span>
              <span
                className={`text-lg font-bold font-[--font-retro-mono] ${
                  netIncome >= 0 ? 'text-[--color-retro-green]' : 'text-[--color-retro-red]'
                }`}
              >
                {netIncome >= 0 ? '+' : ''}
                {formatCurrency(netIncome)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[--color-retro-text-light]">
              {netIncome >= 0 ? 'You are operating profitably this week' : 'You are burning cash this week'}
            </p>
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
          onSeekFunding={(targetStage) => seekFunding(targetStage)}
          onChangePricing={(model, price) => setPricing(model, price)}
        />
      </div>
    </div>
  );
}
