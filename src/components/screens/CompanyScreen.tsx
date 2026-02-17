import { useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import { formatCurrency } from '../../utils/format.ts';
import type { ProductFocus, AcquisitionChannel } from '../../types/index.ts';

// ─── Strategy option configs ────────────────────────────────────────────

const GROWTH_STRATEGIES = [
  { id: 'sustainable', label: 'Sustainable', desc: 'Lower burn, slower growth. Marketing auto-reduces.' },
  { id: 'move-fast', label: 'Move Fast', desc: 'Faster features, more tech debt, higher quality trade-off.' },
  { id: 'quality-first', label: 'Quality First', desc: 'Slower features, less tech debt, culture improves.' },
  { id: 'growth-hack', label: 'Growth Hack', desc: 'Max customer growth, higher burn, 1.5x growth.' },
];

const PRODUCT_FOCUSES: { id: ProductFocus; label: string; desc: string }[] = [
  { id: 'new-features', label: 'New Features', desc: 'Default. Focus on shipping features.' },
  { id: 'quality', label: 'Quality', desc: '1.5x quality, 0.6x progress speed.' },
  { id: 'bug-fixing', label: 'Bug Fixing', desc: 'Squash bugs faster, 0.4x feature progress.' },
  { id: 'tech-debt', label: 'Tech Debt', desc: 'Reduce tech debt, 0.4x feature progress.' },
  { id: 'user-growth', label: 'User Growth', desc: '1.4x user growth, 0.8x feature progress.' },
];

const ACQUISITION_CHANNELS: { id: AcquisitionChannel; label: string; desc: string; requires?: string }[] = [
  { id: 'organic', label: 'Organic', desc: 'Free. Relies on PMF and word-of-mouth.' },
  { id: 'content-seo', label: 'Content & SEO', desc: 'Low cost. Compounds +2%/wk growth (up to +20%).' },
  { id: 'paid-ads', label: 'Paid Ads', desc: '2x marketing spend effectiveness. No compounding.' },
  { id: 'community', label: 'Community', desc: '+10% growth, -1% churn. Stickier users.' },
  { id: 'sales-outreach', label: 'Sales Outreach', desc: 'Direct conversions from team + bizSkill.', requires: 'Team >= 3' },
  { id: 'viral-loops', label: 'Viral / PLG', desc: 'Exponential growth from users.', requires: 'Quality > 50' },
];

// ─── Component ───────────────────────────────────────────────────────────

export function CompanyScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const setGrowthStrategy = useGameStore((s) => s.setGrowthStrategy);
  const setProductFocus = useGameStore((s) => s.setProductFocus);
  const setAcquisitionChannel = useGameStore((s) => s.setAcquisitionChannel);
  const setMarketingBudget = useGameStore((s) => s.setMarketingBudget);
  const hireTeam = useGameStore((s) => s.hireTeam);
  const fireTeam = useGameStore((s) => s.fireTeam);

  const startFeature = useGameStore((s) => s.startFeature);

  const [hireCount, setHireCount] = useState(1);
  const [hireSalary, setHireSalary] = useState(3500);
  const [fireCount, setFireCount] = useState(1);
  const [marketingInput, setMarketingInput] = useState('');
  const [featureName, setFeatureName] = useState('');

  if (!gameState) return null;

  const { team, company, product, finances, meta, founder } = gameState;
  const hiringCost = hireCount * hireSalary * 2;
  const canAffordHire = finances.cash >= hiringCost;
  const canFire = team.teamSize > 0;

  // Salary scaling by stage
  const salaryMultiplier =
    company.stage === 'series-b' || company.stage === 'series-c' || company.stage === 'growth' || company.stage === 'public' ? 1.8
    : company.stage === 'series-a' ? 1.5
    : company.stage === 'seed' ? 1.2
    : 1.0;
  const suggestedSalary = Math.round(3000 * salaryMultiplier);

  // Channel availability checks
  const channelAvailable = (id: AcquisitionChannel): boolean => {
    if (id === 'sales-outreach') return team.teamSize >= 3;
    if (id === 'viral-loops') return product.overallQuality > 50;
    return true;
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-[--font-retro-heading] text-[--color-retro-text]">Company</h1>
        <p className="text-sm text-[--color-retro-text-light]">Manage your team, strategy, and user acquisition</p>
      </div>

      {/* Top Row: Team + Product stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Overview */}
        <div className="retro-card">
          <h3 className="retro-section-heading">Team Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Humans</span>
              <span className="text-lg font-[--font-retro-mono] text-[--color-retro-text]">{team.teamSize}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">AI Agents</span>
              <span className="text-lg font-[--font-retro-mono] text-[--color-retro-text]">{team.aiAgents.length}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Avg Salary</span>
              <span className="text-sm font-[--font-retro-mono] text-[--color-retro-text]">{formatCurrency(team.avgSalary)}/wk</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Morale</span>
              <span className={`text-sm font-[--font-retro-mono] ${
                team.morale >= 60 ? 'text-[--color-retro-green]' : team.morale >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
              }`}>{Math.round(team.morale)}/100</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Culture</span>
              <span className={`text-sm font-[--font-retro-mono] ${
                company.culture >= 60 ? 'text-[--color-retro-green]' : company.culture >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
              }`}>{company.culture}/100</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Weekly Payroll</span>
              <span className="text-sm font-[--font-retro-mono] text-[--color-retro-red]">{formatCurrency(team.teamSize * team.avgSalary)}/wk</span>
            </div>
          </div>
        </div>

        {/* Product Overview */}
        <div className="retro-card">
          <h3 className="retro-section-heading">Product Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Quality</span>
              <span className={`text-lg font-[--font-retro-mono] ${
                product.overallQuality >= 60 ? 'text-[--color-retro-green]' : product.overallQuality >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
              }`}>{product.overallQuality}/100</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Tech Debt</span>
              <span className={`text-lg font-[--font-retro-mono] ${
                product.techDebtTotal <= 30 ? 'text-[--color-retro-green]' : product.techDebtTotal <= 60 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
              }`}>{Math.round(product.techDebtTotal)}/100</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Bugs</span>
              <span className={`text-sm font-[--font-retro-mono] ${
                product.bugs <= 3 ? 'text-[--color-retro-green]' : product.bugs <= 8 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
              }`}>{product.bugs}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">PMF Score</span>
              <span className={`text-sm font-[--font-retro-mono] ${
                product.pmfScore >= 60 ? 'text-[--color-retro-green]' : product.pmfScore >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
              }`}>{product.pmfScore}/100</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Features</span>
              <span className="text-sm font-[--font-retro-mono] text-[--color-retro-text]">
                {product.features.filter(f => f.status === 'shipped').length} shipped / {product.features.filter(f => f.status === 'in-progress').length} in progress
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Customers</span>
              <span className="text-sm font-[--font-retro-mono] text-[--color-retro-text]">{product.customers.toLocaleString()}</span>
            </div>
          </div>

          {/* Founder skills mini display */}
          <div className="mt-3 border-t border-[--color-retro-border] pt-3">
            <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Founder Skills</span>
            <div className="mt-1 flex gap-3 text-xs font-[--font-retro-mono] text-[--color-retro-text-muted]">
              <span>Tech: {founder.techSkill}</span>
              <span>Biz: {founder.bizSkill}</span>
              <span>Network: {founder.network}</span>
              <span>Rep: {founder.reputation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Start Feature */}
      <div className="retro-card">
        <h3 className="retro-section-heading">Start a Feature</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Feature Name</label>
            <input
              type="text"
              placeholder="e.g. AI Code Completion"
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              className="retro-input mt-1 w-full"
            />
          </div>
          <button
            onClick={() => {
              if (featureName.trim()) {
                startFeature(featureName.trim(), `Player-created feature: ${featureName.trim()}`, 70);
                setFeatureName('');
              }
            }}
            disabled={!featureName.trim()}
            className="btn-glossy btn-blue shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Building
          </button>
        </div>
        {gameState.market.segmentData.customerDemand.length > 0 && (
          <div className="mt-3">
            <span className="text-xs text-[--color-retro-text-light]">Market wants:</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {gameState.market.segmentData.customerDemand.map(demand => {
                const alreadyExists = product.features.some(f => f.name.toLowerCase() === demand.toLowerCase());
                return (
                  <button
                    key={demand}
                    disabled={alreadyExists}
                    onClick={() => {
                      startFeature(demand, `Market-demanded feature: ${demand}`, 90);
                    }}
                    className={`text-xs px-2 py-1 rounded border transition-colors cursor-pointer ${
                      alreadyExists
                        ? 'border-[--color-retro-border] text-[--color-retro-text-muted] opacity-40 cursor-not-allowed line-through'
                        : 'border-[--color-retro-blue] text-[--color-retro-blue] hover:bg-blue-500/10'
                    }`}
                  >
                    {demand}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {product.features.filter(f => f.status === 'in-progress').length > 0 && (
          <div className="mt-3 border-t border-[--color-retro-border] pt-3">
            <span className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">In Progress</span>
            <div className="mt-1 space-y-1">
              {product.features.filter(f => f.status === 'in-progress').map(f => (
                <div key={f.id} className="flex items-center justify-between text-sm">
                  <span className="text-[--color-retro-text]">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="retro-progress w-24 !h-2">
                      <div className="retro-progress-bar retro-progress-bar-blue" style={{ width: `${f.progress}%` }} />
                    </div>
                    <span className="text-xs font-[--font-retro-mono] text-[--color-retro-text-muted] w-10 text-right">{Math.round(f.progress)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hire / Fire Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hire */}
        <div className="retro-card">
          <h3 className="retro-section-heading">Hire Team Members</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Count</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={hireCount}
                  onChange={(e) => setHireCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="retro-input mt-1 w-full"
                />
              </div>
              <div>
                <label className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">
                  Salary/wk <span className="normal-case text-[--color-retro-text-muted]">(suggested: ${suggestedSalary.toLocaleString()})</span>
                </label>
                <input
                  type="number"
                  min={1000}
                  max={20000}
                  step={500}
                  value={hireSalary}
                  onChange={(e) => setHireSalary(Math.max(1000, parseInt(e.target.value) || 3000))}
                  className="retro-input mt-1 w-full"
                />
              </div>
            </div>
            <div className="text-xs text-[--color-retro-text-muted]">
              Signing cost: {formatCurrency(hiringCost)} (2 weeks salary)
              {hireCount >= 2 && <span className="text-[--color-retro-orange]"> &middot; Culture penalty for fast hiring</span>}
            </div>
            <button
              onClick={() => { hireTeam(hireCount, hireSalary); }}
              disabled={!canAffordHire}
              className="btn-glossy btn-blue w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canAffordHire ? `Hire ${hireCount} for ${formatCurrency(hiringCost)}` : `Need ${formatCurrency(hiringCost)} (have ${formatCurrency(finances.cash)})`}
            </button>
          </div>
        </div>

        {/* Fire */}
        <div className="retro-card">
          <h3 className="retro-section-heading">Let Go Team Members</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Count</label>
              <input
                type="number"
                min={1}
                max={Math.max(1, team.teamSize)}
                value={Math.min(fireCount, team.teamSize || 1)}
                onChange={(e) => setFireCount(Math.max(1, Math.min(team.teamSize, parseInt(e.target.value) || 1)))}
                className="retro-input mt-1 w-full"
              />
            </div>
            <div className="text-xs text-[--color-retro-text-muted]">
              Morale hit: {fireCount >= 3 ? '-12' : fireCount >= 2 ? '-8' : '-4'}
              <span className="text-[--color-retro-orange]"> &middot; Culture -{Math.min(fireCount, team.teamSize) * 3} &middot; Reputation -{Math.min(fireCount, team.teamSize)}</span>
            </div>
            <button
              onClick={() => { fireTeam(fireCount); }}
              disabled={!canFire}
              className="btn-glossy btn-red w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canFire ? `Let go ${Math.min(fireCount, team.teamSize)} team member${Math.min(fireCount, team.teamSize) > 1 ? 's' : ''}` : 'No team to let go'}
            </button>
          </div>
        </div>
      </div>

      {/* Marketing Budget */}
      <div className="retro-card">
        <h3 className="retro-section-heading">Marketing Budget</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[--color-retro-text-light] uppercase tracking-wider">Weekly Spend</label>
              <span className="text-sm font-[--font-retro-mono] text-[--color-retro-text]">Current: {formatCurrency(finances.marketingSpend)}/wk</span>
            </div>
            <input
              type="number"
              min={0}
              max={50000}
              step={500}
              placeholder={finances.marketingSpend.toString()}
              value={marketingInput}
              onChange={(e) => setMarketingInput(e.target.value)}
              className="retro-input w-full"
            />
          </div>
          <button
            onClick={() => {
              const val = parseInt(marketingInput);
              if (!isNaN(val)) {
                setMarketingBudget(val);
                setMarketingInput('');
              }
            }}
            className="btn-glossy btn-green shrink-0"
          >
            Set Budget
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          {[0, 500, 1000, 2000, 5000].map(amt => (
            <button
              key={amt}
              onClick={() => { setMarketingBudget(amt); setMarketingInput(''); }}
              className={`text-xs px-2 py-1 rounded border-2 transition-colors cursor-pointer ${
                finances.marketingSpend === amt
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-[--color-retro-border] text-[--color-retro-text-muted] hover:border-[--color-retro-text-muted]'
              }`}
            >
              {amt === 0 ? '$0' : formatCurrency(amt)}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Growth Strategy */}
        <div className="retro-card">
          <h3 className="retro-section-heading">Growth Strategy</h3>
          <div className="space-y-2">
            {GROWTH_STRATEGIES.map(s => (
              <button
                key={s.id}
                onClick={() => setGrowthStrategy(s.id)}
                className={`w-full text-left rounded-lg px-3 py-2 border-2 transition-colors cursor-pointer ${
                  meta.growthStrategy === s.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-[--color-retro-border] hover:border-[--color-retro-text-muted] hover:bg-white/5'
                }`}
              >
                <span className={`text-sm font-semibold ${
                  meta.growthStrategy === s.id ? 'text-blue-400' : 'text-[--color-retro-text]'
                }`}>{s.label}</span>
                <p className="text-xs text-[--color-retro-text-muted] mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Product Focus */}
        <div className="retro-card">
          <h3 className="retro-section-heading">Product Focus</h3>
          <div className="space-y-2">
            {PRODUCT_FOCUSES.map(f => (
              <button
                key={f.id}
                onClick={() => setProductFocus(f.id)}
                className={`w-full text-left rounded-lg px-3 py-2 border-2 transition-colors cursor-pointer ${
                  (meta.productFocus ?? 'new-features') === f.id
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-[--color-retro-border] hover:border-[--color-retro-text-muted] hover:bg-white/5'
                }`}
              >
                <span className={`text-sm font-semibold ${
                  (meta.productFocus ?? 'new-features') === f.id ? 'text-purple-400' : 'text-[--color-retro-text]'
                }`}>{f.label}</span>
                <p className="text-xs text-[--color-retro-text-muted] mt-0.5">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Acquisition Channel */}
        <div className="retro-card">
          <h3 className="retro-section-heading">User Acquisition</h3>
          <div className="space-y-2">
            {ACQUISITION_CHANNELS.map(ch => {
              const available = channelAvailable(ch.id);
              return (
                <button
                  key={ch.id}
                  onClick={() => available && setAcquisitionChannel(ch.id)}
                  disabled={!available}
                  className={`w-full text-left rounded-lg px-3 py-2 border-2 transition-colors ${
                    (meta.acquisitionChannel ?? 'organic') === ch.id
                      ? 'border-green-500 bg-green-500/10 cursor-pointer'
                      : !available
                        ? 'border-[--color-retro-border] opacity-40 cursor-not-allowed'
                        : 'border-[--color-retro-border] hover:border-[--color-retro-text-muted] hover:bg-white/5 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${
                      (meta.acquisitionChannel ?? 'organic') === ch.id ? 'text-green-400' : 'text-[--color-retro-text]'
                    }`}>{ch.label}</span>
                    {ch.requires && !available && (
                      <span className="retro-badge retro-badge-red text-[10px]">Requires {ch.requires}</span>
                    )}
                    {ch.id === 'content-seo' && meta.acquisitionChannel === 'content-seo' && (meta.contentSeoWeeks ?? 0) > 0 && (
                      <span className="retro-badge retro-badge-green text-[10px]">
                        +{Math.min(20, (meta.contentSeoWeeks) * 2)}% bonus
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[--color-retro-text-muted] mt-0.5">{ch.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
