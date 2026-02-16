import { useGameStore } from '../../store/index.ts';
import type { CompanyStage } from '../../types/game.ts';
import { KPICard } from '../shared/KPICard.tsx';
import { WeeklySummary } from '../shared/WeeklySummary.tsx';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/format.ts';

// ─── Stage display labels ────────────────────────────────────────────

const STAGE_LABELS: Record<CompanyStage, string> = {
  'garage': 'Garage',
  'pre-seed': 'Pre-Seed',
  'seed': 'Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  'series-c': 'Series C',
  'growth': 'Growth',
  'public': 'Public',
  'dead': 'Dead',
};

const STAGE_BADGE_COLORS: Record<CompanyStage, string> = {
  'garage': 'bg-gray-700 text-gray-300',
  'pre-seed': 'bg-gray-600 text-gray-200',
  'seed': 'bg-amber-900/60 text-amber-300',
  'series-a': 'bg-blue-900/60 text-blue-300',
  'series-b': 'bg-violet-900/60 text-violet-300',
  'series-c': 'bg-violet-800/60 text-violet-200',
  'growth': 'bg-emerald-900/60 text-emerald-300',
  'public': 'bg-emerald-800/60 text-emerald-200',
  'dead': 'bg-red-900/60 text-red-300',
};

// ─── Helpers ─────────────────────────────────────────────────────────

function computeRunway(cash: number, burn: number): string {
  if (burn <= 0) return 'Infinite';
  const weeks = Math.floor(cash / burn);
  if (weeks > 520) return '10+ yrs';
  if (weeks > 52) {
    const yrs = Math.floor(weeks / 52);
    const remainingWks = weeks % 52;
    if (remainingWks === 0) return `${yrs} yrs`;
    return `${yrs} yrs ${remainingWks} wks`;
  }
  return `${weeks} wks`;
}

function getTrend(
  data: number[],
  count: number = 3,
): 'up' | 'down' | 'flat' {
  if (data.length < 2) return 'flat';
  const recent = data.slice(-count);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const delta = last - first;
  const threshold = Math.abs(first) * 0.02; // 2% threshold
  if (delta > threshold) return 'up';
  if (delta < -threshold) return 'down';
  return 'flat';
}

function trendPercent(data: number[]): string {
  if (data.length < 2) return '';
  const prev = data[data.length - 2];
  const curr = data[data.length - 1];
  if (prev === 0) return curr > 0 ? '+100%' : '0%';
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function pmfColor(score: number): 'red' | 'amber' | 'emerald' {
  if (score < 30) return 'red';
  if (score < 60) return 'amber';
  return 'emerald';
}

function bubbleColor(index: number): string {
  if (index < 30) return 'text-emerald-400';
  if (index < 60) return 'text-amber-400';
  return 'text-red-400';
}

function bubbleBarColor(index: number): string {
  if (index < 30) return 'bg-emerald-500';
  if (index < 60) return 'bg-amber-500';
  return 'bg-red-500';
}

// ─── OverviewScreen ──────────────────────────────────────────────────

/**
 * The CEO dashboard — the main screen players spend most time on.
 * Provides a data-rich overview of company health, KPIs, and recent events.
 */
export function OverviewScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!gameState) return null;

  const { finances, product, team, company, market, weekHistory } = gameState;

  // ── Sparkline data from history ──
  const cashHistory = weekHistory.map((w) => w.cash);
  const revenueHistory = weekHistory.map((w) => w.revenue);
  const teamHistory = weekHistory.map((w) => w.teamSize);
  const pmfHistory = weekHistory.map((w) => w.pmfScore);

  // ── Derived values ──
  const runway = computeRunway(finances.cash, finances.weeklyBurn);
  const humanCount = team.employees.length;
  const aiCount = team.aiAgents.length;
  const totalTeam = humanCount + aiCount;
  const revenueTrend = getTrend(revenueHistory);
  const revenueTrendColor = revenueTrend === 'up' ? 'emerald' : revenueTrend === 'down' ? 'red' : 'amber';

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* ── Top Row: 4 KPI Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash */}
        <KPICard
          title="Cash"
          value={formatCurrency(finances.cash)}
          subtitle={`Burn: ${formatCurrency(finances.weeklyBurn)}/wk \u00B7 Runway: ${runway}`}
          trend={getTrend(cashHistory)}
          trendValue={trendPercent(cashHistory)}
          color="emerald"
          sparklineData={cashHistory}
        />

        {/* Revenue */}
        <KPICard
          title="Revenue"
          value={formatCurrency(finances.weeklyRevenue)}
          subtitle={`${finances.pricingModel} \u00B7 ${formatCurrency(finances.pricePerUnit)}/unit`}
          trend={revenueTrend}
          trendValue={trendPercent(revenueHistory)}
          color={revenueTrendColor}
          sparklineData={revenueHistory}
        />

        {/* Team */}
        <KPICard
          title="Team"
          value={formatNumber(totalTeam)}
          subtitle={`${humanCount} human${humanCount !== 1 ? 's' : ''} + ${aiCount} AI`}
          trend={getTrend(teamHistory)}
          trendValue={trendPercent(teamHistory)}
          color="blue"
          sparklineData={teamHistory}
        />

        {/* PMF Score */}
        <KPICard
          title="PMF Score"
          value={formatPercent(product.pmfScore)}
          subtitle={`${formatNumber(product.customers)} customers \u00B7 ${formatPercent(product.churnRate * 100)} churn`}
          trend={getTrend(pmfHistory)}
          trendValue={trendPercent(pmfHistory)}
          color={pmfColor(product.pmfScore)}
          sparklineData={pmfHistory}
        />
      </div>

      {/* ── Middle Section: Two columns ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {/* Company Stats Card */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-100">Company Stats</h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Stage */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Stage</span>
                <span
                  className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_BADGE_COLORS[company.stage] ?? 'bg-gray-700 text-gray-300'}`}
                >
                  {STAGE_LABELS[company.stage] ?? company.stage}
                </span>
              </div>

              {/* Valuation */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Valuation</span>
                <span className="text-sm font-mono text-gray-100">
                  {formatCurrency(company.valuation)}
                </span>
              </div>

              {/* Founder Equity */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Founder Equity</span>
                <span className="text-sm font-mono text-gray-100">
                  {formatPercent(finances.founderEquity * 100)}
                </span>
              </div>

              {/* Bubble Index */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Bubble Index</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-mono ${bubbleColor(market.bubbleIndex)}`}>
                    {market.bubbleIndex}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${bubbleBarColor(market.bubbleIndex)}`}
                      style={{ width: `${Math.min(market.bubbleIndex, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Extra stats row */}
            <div className="grid grid-cols-3 gap-3 border-t border-gray-800 pt-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500">Reputation</span>
                <span className="text-sm font-mono text-gray-200">{company.reputation}/100</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500">Investor Mood</span>
                <span className="text-sm font-mono text-gray-200">{market.investorSentiment}/100</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500">Team Morale</span>
                <span className="text-sm font-mono text-gray-200">{Math.round(team.avgMorale)}/100</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-100">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setScreen('team')}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700 hover:text-gray-100"
              >
                Hire
              </button>
              <button
                onClick={() => setScreen('product')}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700 hover:text-gray-100"
              >
                Start Feature
              </button>
              <button
                onClick={() => setScreen('finances')}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700 hover:text-gray-100"
              >
                Set Pricing
              </button>
              <button
                onClick={() => setScreen('funding')}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700 hover:text-gray-100"
              >
                Seek Funding
              </button>
              <button
                onClick={() => setScreen('market')}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700 hover:text-gray-100"
              >
                Market Intel
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Weekly Summary */}
        <WeeklySummary gameState={gameState} />
      </div>

      {/* ── Bottom: Recent History Table ────────────────────────── */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-100">Recent History</h3>

        {weekHistory.length === 0 ? (
          <p className="text-sm text-gray-500">
            No history yet. Complete your first week to see trends.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="pb-2 pr-4 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Week
                  </th>
                  <th className="pb-2 pr-4 text-xs font-medium uppercase tracking-wider text-gray-500 text-right">
                    Cash
                  </th>
                  <th className="pb-2 pr-4 text-xs font-medium uppercase tracking-wider text-gray-500 text-right">
                    Revenue
                  </th>
                  <th className="pb-2 pr-4 text-xs font-medium uppercase tracking-wider text-gray-500 text-right">
                    Customers
                  </th>
                  <th className="pb-2 pr-4 text-xs font-medium uppercase tracking-wider text-gray-500 text-right">
                    Team
                  </th>
                  <th className="pb-2 text-xs font-medium uppercase tracking-wider text-gray-500 text-right">
                    PMF
                  </th>
                </tr>
              </thead>
              <tbody>
                {weekHistory
                  .slice(-5)
                  .reverse()
                  .map((w) => (
                    <tr key={w.week} className="border-b border-gray-800/50 last:border-0">
                      <td className="py-2 pr-4 font-mono text-gray-300">
                        W{w.week}
                      </td>
                      <td className="py-2 pr-4 font-mono text-emerald-400 text-right">
                        {formatCurrency(w.cash)}
                      </td>
                      <td className="py-2 pr-4 font-mono text-emerald-400 text-right">
                        {formatCurrency(w.revenue)}
                      </td>
                      <td className="py-2 pr-4 font-mono text-gray-300 text-right">
                        {formatNumber(w.customers)}
                      </td>
                      <td className="py-2 pr-4 font-mono text-blue-400 text-right">
                        {w.teamSize}
                      </td>
                      <td className={`py-2 font-mono text-right ${
                        w.pmfScore < 30
                          ? 'text-red-400'
                          : w.pmfScore < 60
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      }`}>
                        {formatPercent(w.pmfScore)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
