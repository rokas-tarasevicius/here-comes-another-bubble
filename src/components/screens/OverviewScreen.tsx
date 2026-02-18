import { useGameStore } from '../../store/index.ts';
import type { CompanyStage } from '../../types/game.ts';
import { WeeklySummary } from '../shared/WeeklySummary.tsx';
import { InfoTip } from '../shared/InfoTip.tsx';
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

  // ── Derived values ──
  const humanCount = team.teamSize;
  const aiCount = team.aiAgents.length;
  const totalTeam = humanCount + aiCount;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* ── Middle Section: Two columns ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {/* Company Stats Card */}
          <div className="retro-card flex flex-col gap-4">
            <h3 className="retro-section-heading" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>Company Stats</h3>

            {/* Hero: Stage + Valuation */}
            <div className="grid grid-cols-2 gap-x-6">
              <div className="flex flex-col gap-1.5">
                <span className="retro-label">Stage</span>
                <span
                  className={STAGE_BADGE_CLASSES[company.stage] ?? 'retro-badge retro-badge-gray'}
                >
                  {STAGE_LABELS[company.stage] ?? company.stage}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="retro-label">Valuation<InfoTip text="Your company's estimated worth. Driven by revenue, growth rate, market hype, and funding stage. Win condition: reach a successful exit at high valuation." /></span>
                <span className="retro-value-lg text-[--color-retro-text]">
                  {formatCurrency(company.valuation)}
                </span>
              </div>
            </div>

            {/* Secondary stats */}
            <div className="retro-stat-footer">
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Equity<InfoTip text="Your ownership percentage. Diluted by fundraising. Your exit payout = valuation × equity. Try to balance growth with keeping a meaningful stake." /></span>
                <span className="retro-stat-tag-value">{formatPercent(finances.founderEquity * 100)}</span>
              </span>
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Bubble<InfoTip text="Market hype level. When high, valuations and funding are easy — but a pop crashes everything. Monitor trends in the Market tab." /></span>
                <span className={`retro-stat-tag-value ${bubbleColor(market.bubbleIndex)}`}>{market.bubbleIndex}</span>
              </span>
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Rep<InfoTip text="Company reputation. Affects hiring, fundraising, and customer trust. Grows from good decisions, shipping quality features, and press events." /></span>
                <span className="retro-stat-tag-value">{company.reputation}</span>
              </span>
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Investors<InfoTip text="How eager investors are to fund you. Influenced by your growth metrics, bubble index, and reputation. Higher sentiment = better funding terms." /></span>
                <span className="retro-stat-tag-value">{market.investorSentiment}</span>
              </span>
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Morale</span>
                <span className="retro-stat-tag-value">{Math.round(team.morale)}</span>
              </span>
            </div>
          </div>

          {/* Company Summary Card */}
          <div className="retro-card flex flex-col gap-4">
            <h3 className="retro-section-heading">Company Summary</h3>

            {/* Key stats */}
            <div className="retro-stat-footer">
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Team</span>
                <span className="retro-stat-tag-value">
                  {totalTeam} <span className="font-normal text-[--color-retro-text-muted] text-[10px]">({humanCount}+{aiCount} AI)</span>
                </span>
              </span>
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Quality</span>
                <span className={`retro-stat-tag-value ${
                  product.overallQuality >= 60 ? 'text-[--color-retro-green]' : product.overallQuality >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
                }`}>
                  {Math.round(product.overallQuality)}/100
                </span>
              </span>
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Features</span>
                <span className="retro-stat-tag-value">
                  {product.features.filter((f) => f.status === 'shipped').length}/{product.features.length}
                </span>
              </span>
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Strategy</span>
                <span className="retro-stat-tag-value">
                  {gameState.meta.growthStrategy?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'None'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Weekly Summary */}
        <WeeklySummary gameState={gameState} />
      </div>

      {/* ── Current Sprint: In-Progress Features ──────────────── */}
      {product.features.filter(f => f.status === 'in-progress').length > 0 && (
        <div className="retro-card flex flex-col gap-3">
          <h3 className="retro-section-heading">Current Sprint</h3>
          <div className="space-y-2">
            {product.features.filter(f => f.status === 'in-progress').map(f => (
              <div key={f.id} className="retro-inset p-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-[--color-retro-text] truncate block">{f.name}</span>
                  <span className="retro-label mt-0.5">Quality: {Math.round(f.quality)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="retro-progress retro-progress-xs w-32">
                    <div
                      className="retro-progress-bar retro-progress-bar-blue"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                  <span className="retro-value text-xs w-10 text-right">
                    {Math.round(f.progress)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <th>Cash</th>
                  <th>Revenue</th>
                  <th>Users</th>
                  <th>Team</th>
                  <th>PMF</th>
                </tr>
              </thead>
              <tbody>
                {weekHistory
                  .slice(-5)
                  .reverse()
                  .map((w) => (
                    <tr key={w.week}>
                      <td className="font-retro-mono text-[--color-retro-text-muted]">
                        Week {w.week}
                      </td>
                      <td className="font-retro-mono text-[--color-retro-green]">
                        {formatCurrency(w.cash)}
                      </td>
                      <td className="font-retro-mono text-[--color-retro-green]">
                        {formatCurrency(w.revenue)}
                      </td>
                      <td className="font-retro-mono text-[--color-retro-text-muted]">
                        {formatNumber(w.customers)}
                      </td>
                      <td className="font-retro-mono text-[--color-retro-blue]">
                        {w.teamSize}
                      </td>
                      <td className={`font-retro-mono ${
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
