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

const STAGE_BADGE_CLASSES: Record<CompanyStage, string> = {
  'garage': 'retro-badge retro-badge-gray',
  'pre-seed': 'retro-badge retro-badge-gray',
  'seed': 'retro-badge retro-badge-orange',
  'series-a': 'retro-badge retro-badge-blue',
  'series-b': 'retro-badge retro-badge-purple',
  'series-c': 'retro-badge retro-badge-purple',
  'growth': 'retro-badge retro-badge-green',
  'public': 'retro-badge retro-badge-green',
  'dead': 'retro-badge retro-badge-red',
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
  if (index < 30) return 'text-[--color-retro-green]';
  if (index < 60) return 'text-[--color-retro-orange]';
  return 'text-[--color-retro-red]';
}

function bubbleProgressBarClass(index: number): string {
  if (index < 30) return 'retro-progress-bar retro-progress-bar-green';
  if (index < 60) return 'retro-progress-bar retro-progress-bar-orange';
  return 'retro-progress-bar retro-progress-bar-red';
}

// ─── OverviewScreen ──────────────────────────────────────────────────

/**
 * The CEO dashboard — the main screen players spend most time on.
 * Provides a data-rich overview of company health, KPIs, and recent events.
 */
export function OverviewScreen() {
  const gameState = useGameStore((s) => s.gameState);

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
          <div className="retro-card flex flex-col gap-4">
            <h3 className="retro-section-heading">Company Stats</h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Stage */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Stage</span>
                <span
                  className={STAGE_BADGE_CLASSES[company.stage] ?? 'retro-badge retro-badge-gray'}
                >
                  {STAGE_LABELS[company.stage] ?? company.stage}
                </span>
              </div>

              {/* Valuation */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Valuation</span>
                <span className="text-sm font-[--font-retro-mono] text-[--color-retro-text]">
                  {formatCurrency(company.valuation)}
                </span>
              </div>

              {/* Founder Equity */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Founder Equity</span>
                <span className="text-sm font-[--font-retro-mono] text-[--color-retro-text]">
                  {formatPercent(finances.founderEquity * 100)}
                </span>
              </div>

              {/* Bubble Index */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Bubble Index</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-[--font-retro-mono] ${bubbleColor(market.bubbleIndex)}`}>
                    {market.bubbleIndex}
                  </span>
                  <div className="retro-progress flex-1 !h-2">
                    <div
                      className={bubbleProgressBarClass(market.bubbleIndex)}
                      style={{ width: `${Math.min(market.bubbleIndex, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Extra stats row */}
            <div className="grid grid-cols-3 gap-3 border-t border-[--color-retro-border] pt-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[--color-retro-text-light]">Reputation</span>
                <span className="text-sm font-[--font-retro-mono] text-[--color-retro-text-muted]">{company.reputation}/100</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[--color-retro-text-light]">Investor Mood</span>
                <span className="text-sm font-[--font-retro-mono] text-[--color-retro-text-muted]">{market.investorSentiment}/100</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[--color-retro-text-light]">Team Morale</span>
                <span className="text-sm font-[--font-retro-mono] text-[--color-retro-text-muted]">{Math.round(team.avgMorale)}/100</span>
              </div>
            </div>
          </div>

          {/* Company Summary Card */}
          <div className="retro-card flex flex-col gap-4">
            <h3 className="retro-section-heading">Company Summary</h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Team Size */}
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Team Size</span>
                <span className="text-sm font-[--font-retro-mono] text-[--color-retro-text]">
                  {totalTeam} ({humanCount} human{humanCount !== 1 ? 's' : ''} + {aiCount} AI)
                </span>
              </div>

              {/* Morale */}
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Team Morale</span>
                <span className={`text-sm font-[--font-retro-mono] ${
                  team.avgMorale >= 60 ? 'text-[--color-retro-green]' : team.avgMorale >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
                }`}>
                  {Math.round(team.avgMorale)}/100
                </span>
              </div>

              {/* Product Quality */}
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Product Quality</span>
                <span className={`text-sm font-[--font-retro-mono] ${
                  product.overallQuality >= 60 ? 'text-[--color-retro-green]' : product.overallQuality >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
                }`}>
                  {Math.round(product.overallQuality)}/100
                </span>
              </div>

              {/* Features Shipped */}
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Features Shipped</span>
                <span className="text-sm font-[--font-retro-mono] text-[--color-retro-text]">
                  {product.features.filter((f) => f.status === 'shipped').length} / {product.features.length}
                </span>
              </div>
            </div>

            {/* Growth Strategy */}
            <div className="border-t border-[--color-retro-border] pt-3">
              <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Growth Strategy</span>
              <span className="retro-badge retro-badge-blue mt-1 inline-block">
                {gameState.meta.growthStrategy?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Weekly Summary */}
        <WeeklySummary gameState={gameState} />
      </div>

      {/* ── Bottom: Recent History Table ────────────────────────── */}
      <div className="retro-card flex flex-col gap-3">
        <h3 className="retro-section-heading">Recent History</h3>

        {weekHistory.length === 0 ? (
          <p className="text-sm text-[--color-retro-text-light]">
            No history yet. Complete your first week to see trends.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="retro-table">
              <thead>
                <tr>
                  <th>Week</th>
                  <th className="text-right">Cash</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Customers</th>
                  <th className="text-right">Team</th>
                  <th className="text-right">PMF</th>
                </tr>
              </thead>
              <tbody>
                {weekHistory
                  .slice(-5)
                  .reverse()
                  .map((w) => (
                    <tr key={w.week}>
                      <td className="font-[--font-retro-mono] text-[--color-retro-text-muted]">
                        W{w.week}
                      </td>
                      <td className="font-[--font-retro-mono] text-[--color-retro-green] text-right">
                        {formatCurrency(w.cash)}
                      </td>
                      <td className="font-[--font-retro-mono] text-[--color-retro-green] text-right">
                        {formatCurrency(w.revenue)}
                      </td>
                      <td className="font-[--font-retro-mono] text-[--color-retro-text-muted] text-right">
                        {formatNumber(w.customers)}
                      </td>
                      <td className="font-[--font-retro-mono] text-[--color-retro-blue] text-right">
                        {w.teamSize}
                      </td>
                      <td className={`font-[--font-retro-mono] text-right ${
                        w.pmfScore < 30
                          ? 'text-[--color-retro-red]'
                          : w.pmfScore < 60
                            ? 'text-[--color-retro-orange]'
                            : 'text-[--color-retro-green]'
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
