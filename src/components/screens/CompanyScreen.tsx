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
    <div className="space-y-6 max-w-5xl mx-auto min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[--color-retro-text]" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>Company</h1>
        <p className="text-sm text-[--color-retro-text-light]">Manage your team, strategy, and user acquisition</p>
      </div>

      {/* Top Row: Team + Product stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Overview */}
        <div className="retro-card">
          <h3 className="retro-section-heading">Team Overview</h3>

          {/* Hero metrics */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4">
            <div className="flex flex-col gap-1.5">
              <span className="retro-label">Humans</span>
              <span className="retro-value-lg text-[--color-retro-text]">{team.teamSize}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="retro-label">AI Agents</span>
              <span className="retro-value-lg text-[--color-retro-text]">{team.aiAgents.length}</span>
            </div>
          </div>

          {/* Supporting metrics */}
          <div className="retro-stat-footer">
            <span className="retro-stat-tag">
              <span className="retro-stat-tag-label">Morale</span>
              <span className={`retro-stat-tag-value ${
                team.morale >= 60 ? 'text-[--color-retro-green]' : team.morale >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
              }`}>{Math.round(team.morale)}/100</span>
            </span>
            <span className="retro-stat-tag">
              <span className="retro-stat-tag-label">Culture</span>
              <span className={`retro-stat-tag-value ${
                company.culture >= 60 ? 'text-[--color-retro-green]' : company.culture >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
              }`}>{company.culture}/100</span>
            </span>
            <span className="retro-stat-tag">
              <span className="retro-stat-tag-label">Avg Salary</span>
              <span className="retro-stat-tag-value">{formatCurrency(team.avgSalary)}/wk</span>
            </span>
            <span className="retro-stat-tag">
              <span className="retro-stat-tag-label">Payroll</span>
              <span className="retro-stat-tag-value text-[--color-retro-red]">{formatCurrency(team.teamSize * team.avgSalary)}/wk</span>
            </span>
          </div>
        </div>

        {/* Product Overview */}
        <div className="retro-card">
          <h3 className="retro-section-heading">Product Overview</h3>

          {/* Hero metrics */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4">
            <div className="flex flex-col gap-1.5">
              <span className="retro-label">Quality</span>
              <span className={`retro-value-lg ${
                product.overallQuality >= 60 ? 'text-[--color-retro-green]' : product.overallQuality >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
              }`}>{product.overallQuality}<span className="text-sm font-normal text-[--color-retro-text-muted]">/100</span></span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="retro-label">Tech Debt</span>
              <span className={`retro-value-lg ${
                product.techDebtTotal <= 30 ? 'text-[--color-retro-green]' : product.techDebtTotal <= 60 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
              }`}>{Math.round(product.techDebtTotal)}<span className="text-sm font-normal text-[--color-retro-text-muted]">/100</span></span>
            </div>
          </div>

          {/* Supporting metrics */}
          <div className="retro-stat-footer mb-3">
            <span className="retro-stat-tag">
              <span className="retro-stat-tag-label">Bugs</span>
              <span className={`retro-stat-tag-value ${
                product.bugs <= 3 ? 'text-[--color-retro-green]' : product.bugs <= 8 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
              }`}>{product.bugs}</span>
            </span>
            <span className="retro-stat-tag">
              <span className="retro-stat-tag-label">PMF</span>
              <span className={`retro-stat-tag-value ${
                product.pmfScore >= 60 ? 'text-[--color-retro-green]' : product.pmfScore >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
              }`}>{product.pmfScore}/100</span>
            </span>
            <span className="retro-stat-tag">
              <span className="retro-stat-tag-label">Features</span>
              <span className="retro-stat-tag-value">
                {product.features.filter(f => f.status === 'shipped').length} shipped / {product.features.filter(f => f.status === 'in-progress').length} wip
              </span>
            </span>
            <span className="retro-stat-tag">
              <span className="retro-stat-tag-label">Customers</span>
              <span className="retro-stat-tag-value">{product.customers.toLocaleString()}</span>
            </span>
          </div>

          {/* Founder skills */}
          <div className="retro-stat-footer">
            <span className="retro-label shrink-0">Founder</span>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Tech</span>
                <span className="retro-stat-tag-value">{founder.techSkill}</span>
              </span>
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Biz</span>
                <span className="retro-stat-tag-value">{founder.bizSkill}</span>
              </span>
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Net</span>
                <span className="retro-stat-tag-value">{founder.network}</span>
              </span>
              <span className="retro-stat-tag">
                <span className="retro-stat-tag-label">Rep</span>
                <span className="retro-stat-tag-value">{founder.reputation}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Start Feature */}
      <div className="retro-card">
        <h3 className="retro-section-heading">Start a Feature</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="retro-label">Feature Name</label>
            <input
              type="text"
              placeholder="e.g. AI Code Completion"
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              className="retro-input mt-1.5 w-full"
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
            <span className="retro-label">Market wants</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {gameState.market.segmentData.customerDemand.map(demand => {
                const alreadyExists = product.features.some(f => f.name.toLowerCase() === demand.toLowerCase());
                return (
                  <button
                    key={demand}
                    disabled={alreadyExists}
                    onClick={() => {
                      startFeature(demand, `Market-demanded feature: ${demand}`, 90);
                    }}
                    className={`btn-glossy btn-glossy-sm rounded-full transition-all ${
                      alreadyExists
                        ? 'btn-silver opacity-40 cursor-not-allowed line-through'
                        : 'btn-silver hover:shadow-md'
                    }`}
                    style={{ fontSize: '11px', padding: '4px 12px' }}
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
            <span className="retro-label">In Progress</span>
            <div className="mt-2 space-y-1.5">
              {product.features.filter(f => f.status === 'in-progress').map(f => (
                <div key={f.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[--color-retro-text]">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="retro-progress retro-progress-sm w-24">
                      <div className="retro-progress-bar retro-progress-bar-blue" style={{ width: `${f.progress}%` }} />
                    </div>
                    <span className="retro-value text-xs w-10 text-right">{Math.round(f.progress)}%</span>
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
          <div className="space-y-2 max-h-80 overflow-y-auto retro-scrollbar">
            {team.members.map(member => (
              <div key={member.id} className="retro-inset p-3">
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Identity */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-bold text-[--color-retro-text]">{member.name}</span>
                      <span className="retro-badge retro-badge-sm retro-badge-blue">{member.role}</span>
                      {member.traits.map(t => (
                        <span key={t} className="retro-badge retro-badge-sm retro-badge-purple">{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="retro-stat-tag">
                        <span className="retro-stat-tag-label">Skill</span>
                        <span className="retro-stat-tag-value">{member.skill}</span>
                      </span>
                      <span className="retro-stat-tag">
                        <span className="retro-stat-tag-label">Salary</span>
                        <span className="retro-stat-tag-value">{formatCurrency(member.salary)}/wk</span>
                      </span>
                      <span className="retro-stat-tag">
                        <span className="retro-stat-tag-label">Morale</span>
                        <span className={`retro-stat-tag-value ${
                          member.morale >= 60 ? 'text-[--color-retro-green]' : member.morale >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
                        }`}>{member.morale}</span>
                      </span>
                    </div>
                  </div>
                  {/* Right: Action */}
                  <button
                    onClick={() => {
                      if (confirmFire === member.id) {
                        fireMember(member.id);
                        setConfirmFire(null);
                      } else {
                        setConfirmFire(member.id);
                      }
                    }}
                    className="btn-glossy btn-glossy-sm btn-red shrink-0"
                  >
                    {confirmFire === member.id ? 'Confirm?' : 'Fire'}
                  </button>
                </div>
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
                <div key={candidate.id} className="retro-candidate-card">
                  {/* Top: Identity (left) + Stats (right) */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[--color-retro-text]">{candidate.name}</span>
                        <span className="retro-badge retro-badge-sm retro-badge-blue">{candidate.role}</span>
                        {candidate.traits.map(t => (
                          <span key={t} className="retro-badge retro-badge-sm retro-badge-purple">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                      <span className="retro-stat-tag">
                        <span className="retro-stat-tag-label">Skill</span>
                        <span className="retro-stat-tag-value">{candidate.skill}</span>
                      </span>
                      <span className="retro-stat-tag">
                        <span className="retro-stat-tag-label">Expects</span>
                        <span className="retro-stat-tag-value">{formatCurrency(candidate.expectedSalary)}/wk</span>
                      </span>
                      <span className="retro-stat-tag">
                        <span className="retro-stat-tag-label">Leaves</span>
                        <span className="retro-stat-tag-value">W{candidate.availableUntilWeek}</span>
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Offer controls */}
                  {hasPendingOffer ? (
                    <div className="mt-2.5 border-t border-black/4 pt-2.5">
                      <span className="retro-badge retro-badge-sm retro-badge-orange">Offer pending — resolves next week</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 mt-2.5 border-t border-black/4 pt-2.5">
                      <span className="retro-label shrink-0">Offer</span>
                      <span className="inline-flex items-center shrink-0">
                        <span className="font-retro-mono text-sm font-medium text-[--color-retro-text]">$</span>
                        <input
                          type="number"
                          min={1000}
                          step={500}
                          value={offerInput}
                          onChange={(e) => setOfferSalaries(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                          className="font-retro-mono text-sm font-medium text-[--color-retro-text] bg-transparent border-none outline-none w-16 p-0 appearance-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </span>
                      <span className="flex-1" />
                      <span
                        className="retro-stat-tag shrink-0"
                      >
                        <span className="retro-stat-tag-label">Chance</span>
                        <span className={`retro-stat-tag-value ${
                          acceptProb >= 60 ? 'text-[--color-retro-green]' : acceptProb >= 30 ? 'text-[--color-retro-orange]' : 'text-[--color-retro-red]'
                        }`}>{acceptProb}%</span>
                      </span>
                      <button
                        onClick={() => makeOffer(candidate.id, offerAmount)}
                        className="btn-glossy btn-green btn-glossy-sm shrink-0"
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
      {(() => {
        const spend = finances.marketingSpend;
        const pctStep = Math.round(spend * 0.05);
        const magnitude = Math.pow(10, Math.max(0, Math.floor(Math.log10(pctStep || 1))));
        const step = Math.max(100, Math.round(pctStep / magnitude) * magnitude);
        return (
          <div className="retro-card">
            <h3 className="retro-section-heading">Marketing Budget</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMarketingBudget(Math.max(0, spend - step))}
                disabled={spend <= 0}
                className="btn-glossy btn-silver w-8 h-8 p-0! text-lg disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                −
              </button>
              <span className="inline-flex items-center justify-center min-w-[60px]">
                <span className="font-retro-mono text-lg font-medium text-[--color-retro-text]">$</span>
                <input
                  type="number"
                  min={0}
                  value={spend}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0) setMarketingBudget(val);
                  }}
                  style={{ width: `${Math.max(1, String(spend).length)}ch` }}
                  className="font-retro-mono text-lg font-medium text-[--color-retro-text] bg-transparent border-none outline-none p-0 text-left appearance-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </span>
              <button
                onClick={() => setMarketingBudget(spend + step)}
                className="btn-glossy btn-silver w-8 h-8 p-0! text-lg shrink-0"
              >
                +
              </button>
              <span className="text-xs text-[--color-retro-text-light]">per week <span className="text-[--color-retro-text-muted]">(±{formatCurrency(step)})</span></span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[0, 500, 1000, 2500, 5000, 10000, 25000, 50000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setMarketingBudget(amt)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    spend === amt
                      ? 'bg-retro-green-pale text-retro-green-dark font-semibold border-retro-green/20'
                      : 'bg-[--color-retro-bg-alt] text-[--color-retro-text-muted] border-transparent hover:border-[--color-retro-border] hover:text-[--color-retro-text]'
                  }`}
                    style={spend === amt ? { boxShadow: 'inset 0 1px 2px rgba(43,122,43,0.1)' } : {}}
                >
                  {amt === 0 ? '$0' : formatCurrency(amt)}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Strategy Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Growth Strategy */}
        <div className="retro-card">
          <h3 className="retro-section-heading">Growth Strategy</h3>
          <div className="space-y-2">
            {GROWTH_STRATEGIES.map(s => {
              const isActive = meta.growthStrategy === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setGrowthStrategy(s.id)}
                  className={`retro-strategy-option ${isActive ? 'retro-strategy-option--active' : ''}`}
                  style={isActive ? {
                    background: 'linear-gradient(to bottom, #edf3fa, #e4edf7)',
                    borderColor: 'rgba(51,102,153,0.20)',
                    boxShadow: 'inset 0 1px 3px rgba(51,102,153,0.12), 0 0 0 1px rgba(51,102,153,0.06)',
                  } : undefined}
                >
                  <span className={`text-sm font-semibold ${
                    isActive ? 'text-retro-blue' : 'text-[--color-retro-text]'
                  }`}>{s.label}</span>
                  <p className="text-xs text-[--color-retro-text-muted] mt-0.5">{s.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Focus */}
        <div className="retro-card">
          <h3 className="retro-section-heading">Product Focus</h3>
          <div className="space-y-2">
            {PRODUCT_FOCUSES.map(f => {
              const isActive = (meta.productFocus ?? 'new-features') === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setProductFocus(f.id)}
                  className={`retro-strategy-option ${isActive ? 'retro-strategy-option--active' : ''}`}
                  style={isActive ? {
                    background: 'linear-gradient(to bottom, #f2ebf8, #ebe3f2)',
                    borderColor: 'rgba(102,51,153,0.20)',
                    boxShadow: 'inset 0 1px 3px rgba(102,51,153,0.12), 0 0 0 1px rgba(102,51,153,0.06)',
                  } : undefined}
                >
                  <span className={`text-sm font-semibold ${
                    isActive ? 'text-retro-purple' : 'text-[--color-retro-text]'
                  }`}>{f.label}</span>
                  <p className="text-xs text-[--color-retro-text-muted] mt-0.5">{f.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Acquisition Channel */}
        <div className="retro-card">
          <h3 className="retro-section-heading">User Acquisition</h3>
          <div className="space-y-2">
            {ACQUISITION_CHANNELS.map(ch => {
              const available = channelAvailable(ch.id);
              const isActive = (meta.acquisitionChannel ?? 'organic') === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => available && setAcquisitionChannel(ch.id)}
                  disabled={!available}
                  className={`retro-strategy-option ${isActive ? 'retro-strategy-option--active' : ''} ${!available ? 'opacity-40' : ''}`}
                  style={isActive ? {
                    background: 'linear-gradient(to bottom, #eaf6ea, #e2f0e2)',
                    borderColor: 'rgba(43,122,43,0.20)',
                    boxShadow: 'inset 0 1px 3px rgba(43,122,43,0.12), 0 0 0 1px rgba(43,122,43,0.06)',
                  } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${
                      (meta.acquisitionChannel ?? 'organic') === ch.id ? 'text-retro-green-dark' : 'text-[--color-retro-text]'
                    }`}>{ch.label}</span>
                    {ch.requires && !available && (
                      <span className="retro-badge retro-badge-sm retro-badge-red">Requires {ch.requires}</span>
                    )}
                    {ch.id === 'content-seo' && (meta.contentSeoWeeks ?? 0) > 0 && (
                      <span className={`retro-badge retro-badge-sm ${isActive ? 'retro-badge-green' : 'retro-badge-gray opacity-60'}`}>
                        +{Math.min(20, (meta.contentSeoWeeks ?? 0) * 2)}% bonus
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
