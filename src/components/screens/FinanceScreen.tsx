import { useGameStore } from '../../store/index.ts';
import { formatCurrency, formatPercent } from '../../utils/format.ts';
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
  const addDecision = useGameStore((s) => s.addDecision);

  if (!gameState) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">No active game. Start a new game first.</p>
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
  const totalSalaries = team.employees.reduce((sum, e) => sum + e.salary, 0);
  const totalAICosts = team.aiAgents.reduce((sum, a) => sum + a.costPerWeek, 0);
  const overhead = Math.round(finances.monthlyExpenses / 4 - totalSalaries - totalAICosts);
  const overheadEstimate = Math.max(0, overhead);
  const totalExpenses = totalSalaries + totalAICosts + overheadEstimate;
  const netIncome = finances.weeklyRevenue - totalExpenses;

  // Pricing model display
  const pricingLabels: Record<string, string> = {
    free: 'Free',
    freemium: 'Freemium',
    subscription: 'Subscription',
    'usage-based': 'Usage-Based',
    enterprise: 'Enterprise',
    'one-time': 'One-Time',
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Finances</h1>
        <p className="text-sm text-gray-500">Week {gameState.meta.week} financial overview</p>
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
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-400">
            Weekly P&L
          </h3>

          {/* Revenue Breakdown */}
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold uppercase text-emerald-400">Revenue</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {pricingLabels[finances.pricingModel] ?? finances.pricingModel}{' '}
                  ({product.customers.toLocaleString()} customers)
                </span>
                <span className="font-mono text-emerald-400">
                  {formatCurrency(finances.weeklyRevenue)}
                </span>
              </div>
              {finances.pricePerUnit > 0 && (
                <p className="text-xs text-gray-600">
                  {formatCurrency(finances.pricePerUnit)}/unit
                </p>
              )}
            </div>
            <div className="mt-2 border-t border-gray-800 pt-1 flex items-center justify-between text-sm font-semibold">
              <span className="text-gray-300">Total Revenue</span>
              <span className="font-mono text-emerald-400">
                {formatCurrency(finances.weeklyRevenue)}
              </span>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold uppercase text-red-400">Expenses</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  Salaries ({team.employees.length} employees)
                </span>
                <span className="font-mono text-red-400">
                  {formatCurrency(totalSalaries)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  AI Agents ({team.aiAgents.length} agents)
                </span>
                <span className="font-mono text-red-400">
                  {formatCurrency(totalAICosts)}
                </span>
              </div>
              {overheadEstimate > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Overhead</span>
                  <span className="font-mono text-red-400">
                    {formatCurrency(overheadEstimate)}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-2 border-t border-gray-800 pt-1 flex items-center justify-between text-sm font-semibold">
              <span className="text-gray-300">Total Expenses</span>
              <span className="font-mono text-red-400">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>

          {/* Net Income */}
          <div className="border-t-2 border-gray-700 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-200">Net Income</span>
              <span
                className={`text-lg font-bold font-mono ${
                  netIncome >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {netIncome >= 0 ? '+' : ''}
                {formatCurrency(netIncome)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
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
          onSeekFunding={(decision) => addDecision(decision)}
          onChangePricing={(decision) => addDecision(decision)}
        />
      </div>
    </div>
  );
}
