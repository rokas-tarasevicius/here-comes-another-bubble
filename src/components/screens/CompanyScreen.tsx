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
  const makeOffer = useGameStore((s) => s.makeOffer);
  const fireMember = useGameStore((s) => s.fireMember);

  const startFeature = useGameStore((s) => s.startFeature);

  const [marketingInput, setMarketingInput] = useState('');
  const [featureName, setFeatureName] = useState('');
  const [offerSalaries, setOfferSalaries] = useState<Record<string, string>>({});
  const [confirmFire, setConfirmFire] = useState<string | null>(null);

  if (!gameState) return null;

  const { team, company, product, finances, meta, founder } = gameState;

  // Channel availability checks
  const channelAvailable = (id: AcquisitionChannel): boolean => {
    if (id === 'sales-outreach') return team.teamSize >= 3;
    if (id === 'viral-loops') return product.overallQuality > 50;
    return true;
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto min-w-0">
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

      {/* Team Roster */}
      <div className="retro-card">
        <h3 className="retro-section-heading">Team Roster ({team.members?.length ?? team.teamSize} members)</h3>
        {(!team.members || team.members.length === 0) ? (
          <p className="text-sm text-[--color-retro-text-muted]">No team members yet. Hire from the candidate pool below or use quick hire.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {team.members.map(member => (
              <div key={member.id} className="flex items-center justify-between gap-3 p-2 rounded border border-[--color-retro-border] bg-white/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[--color-retro-text]">{member.name}</span>
                    <span className="retro-badge retro-badge-blue text-[10px]">{member.role}</span>
                    {member.traits.map(t => (
                      <span key={t} className="retro-badge retro-badge-purple text-[10px]">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-3 text-xs text-[--color-retro-text-muted] mt-0.5">
                    <span>Skill: {member.skill}</span>
                    <span>{formatCurrency(member.salary)}/wk</span>
                    <span>Morale: {member.morale}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirmFire === member.id) {
                      fireMember(member.id);
                      setConfirmFire(null);
                    } else {
                      setConfirmFire(member.id);
                    }
                  }}
                  className={`text-xs px-2 py-1 rounded border transition-colors cursor-pointer shrink-0 ${
                    confirmFire === member.id
                      ? 'border-red-500 bg-red-500/10 text-red-500'
                      : 'border-[--color-retro-border] text-[--color-retro-text-muted] hover:border-red-400 hover:text-red-400'
                  }`}
                >
                  {confirmFire === member.id ? 'Confirm?' : 'Fire'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Pool */}
      <div className="retro-card">
        <h3 className="retro-section-heading">Candidate Pool ({team.candidates?.length ?? 0} available)</h3>
        {(!team.candidates || team.candidates.length === 0) ? (
          <p className="text-sm text-[--color-retro-text-muted]">No candidates available. New candidates appear every 4 weeks.</p>
        ) : (
          <div className="space-y-3">
            {team.candidates.map(candidate => {
              const hasPendingOffer = team.pendingOffers?.some(o => o.candidateId === candidate.id);
              const offerInput = offerSalaries[candidate.id] ?? String(candidate.expectedSalary);
              const offerAmount = parseInt(offerInput) || candidate.expectedSalary;
              const salaryRatio = offerAmount / candidate.expectedSalary;
              let acceptProb = Math.round(Math.max(5, Math.min(95, 60 * salaryRatio)));
              if (salaryRatio >= 1.2) acceptProb = Math.min(95, acceptProb);
              if (salaryRatio < 0.8) acceptProb = Math.max(10, Math.round(acceptProb * 0.5));

              return (
                <div key={candidate.id} className="p-3 rounded border border-[--color-retro-border] bg-white/50">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[--color-retro-text]">{candidate.name}</span>
                        <span className="retro-badge retro-badge-blue text-[10px]">{candidate.role}</span>
                        <span className="text-xs text-[--color-retro-text-muted]">Skill: {candidate.skill}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {candidate.traits.map(t => (
                          <span key={t} className="retro-badge retro-badge-purple text-[10px]">{t}</span>
                        ))}
                        <span className="text-xs text-[--color-retro-text-muted]">
                          Expects: {formatCurrency(candidate.expectedSalary)}/wk
                        </span>
                        <span className="text-xs text-[--color-retro-text-light]">
                          (leaves W{candidate.availableUntilWeek})
                        </span>
                      </div>
                    </div>
                  </div>

                  {hasPendingOffer ? (
                    <div className="text-xs text-[--color-retro-orange] font-medium">Offer pending — resolves next week</div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-[--color-retro-text-light] uppercase">Salary Offer ($/wk)</label>
                        <input
                          type="number"
                          min={1000}
                          step={500}
                          value={offerInput}
                          onChange={(e) => setOfferSalaries(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                          className="retro-input w-full mt-0.5"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0 w-20">
                        <div className="text-[10px] text-[--color-retro-text-light] uppercase">Accept %</div>
                        <div className="retro-progress w-full !h-3">
                          <div
                            className={`retro-progress-bar ${
                              acceptProb >= 60 ? 'retro-progress-bar-green' : acceptProb >= 30 ? 'retro-progress-bar-orange' : 'retro-progress-bar-red'
                            }`}
                            style={{ width: `${acceptProb}%` }}
                          />
                        </div>
                        <span className="text-xs font-[--font-retro-mono] text-[--color-retro-text-muted]">{acceptProb}%</span>
                      </div>
                      <button
                        onClick={() => makeOffer(candidate.id, offerAmount)}
                        className="btn-glossy btn-green shrink-0 text-sm"
                      >
                        Make Offer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
