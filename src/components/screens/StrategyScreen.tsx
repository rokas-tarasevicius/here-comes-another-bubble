import { useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import { AI_PROVIDERS } from '../../data/aiProviders.ts';
import type { AIProviderConfig } from '../../data/aiProviders.ts';
import type { AIAgentType } from '../../types/game.ts';

// ─── Growth strategy definitions ─────────────────────────────────────────

interface GrowthStrategy {
  id: string;
  name: string;
  tagline: string;
  description: string;
  traits: { label: string; color: 'emerald' | 'red' | 'amber' | 'blue' }[];
}

const GROWTH_STRATEGIES: GrowthStrategy[] = [
  {
    id: 'move-fast',
    name: 'Move Fast',
    tagline: 'Ship it, fix it later',
    description:
      'Prioritize development speed above all else. You will ship features faster but accumulate tech debt and quality issues.',
    traits: [
      { label: 'Dev Speed +', color: 'emerald' },
      { label: 'Tech Debt +', color: 'red' },
      { label: 'Quality -', color: 'amber' },
    ],
  },
  {
    id: 'quality-first',
    name: 'Quality First',
    tagline: 'Measure twice, cut once',
    description:
      'Take time to build things right. Slower output but lower tech debt and higher product quality that pays off long-term.',
    traits: [
      { label: 'Dev Speed -', color: 'amber' },
      { label: 'Tech Debt -', color: 'emerald' },
      { label: 'Quality +', color: 'emerald' },
    ],
  },
  {
    id: 'growth-hack',
    name: 'Growth Hack',
    tagline: 'Acquire users at all costs',
    description:
      'Aggressive marketing spend and growth tactics. Burns cash fast but brings in customers quickly. Hope your unit economics work out.',
    traits: [
      { label: 'Marketing +', color: 'emerald' },
      { label: 'Burn Rate +', color: 'red' },
      { label: 'Acquisition +', color: 'emerald' },
    ],
  },
  {
    id: 'sustainable',
    name: 'Sustainable',
    tagline: 'Default alive',
    description:
      'Conservative spending and organic growth. Longer runway and lower risk, but you may get outpaced by faster-moving competitors.',
    traits: [
      { label: 'Spending -', color: 'emerald' },
      { label: 'Growth -', color: 'amber' },
      { label: 'Runway +', color: 'emerald' },
    ],
  },
];

const TRAIT_COLORS = {
  emerald: 'text-[--color-retro-green] bg-[--color-retro-green-pale]',
  red: 'text-[--color-retro-red] bg-[--color-retro-red-pale]',
  amber: 'text-[--color-retro-orange] bg-[--color-retro-orange-pale]',
  blue: 'text-[--color-retro-blue] bg-[--color-retro-blue-pale]',
} as const;

// ─── Agent type badge labels ─────────────────────────────────────────────

const AGENT_TYPE_LABELS: Record<AIAgentType, string> = {
  coding: 'Coding',
  design: 'Design',
  marketing: 'Marketing',
  analytics: 'Analytics',
  support: 'Support',
  general: 'General',
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function formatCost(amount: number): string {
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}

// ─── Culture Slider ──────────────────────────────────────────────────────

interface CultureSliderProps {
  label: string;
  value: number;
  accent?: 'emerald' | 'blue' | 'amber' | 'violet';
}

function CultureSlider({ label, value, accent = 'emerald' }: CultureSliderProps) {
  const barClasses: Record<string, string> = {
    emerald: 'retro-progress-bar retro-progress-bar-green',
    blue: 'retro-progress-bar',
    amber: 'retro-progress-bar retro-progress-bar-orange',
    violet: 'retro-progress-bar retro-progress-bar-purple',
  };
  const textColors: Record<string, string> = {
    emerald: 'text-[--color-retro-green]',
    blue: 'text-[--color-retro-blue]',
    amber: 'text-[--color-retro-orange]',
    violet: 'text-[--color-retro-purple]',
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[--color-retro-text]">{label}</span>
        <span className={`text-sm font-[--font-retro-mono] font-medium ${textColors[accent]}`}>
          {value}
        </span>
      </div>
      <div className="retro-progress !h-2">
        <div
          className={barClasses[accent]}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

// ─── AI Provider Card ────────────────────────────────────────────────────

interface AIProviderCardProps {
  provider: AIProviderConfig;
  onHire: (provider: AIProviderConfig, agentType: AIAgentType) => void;
}

function AIProviderCard({ provider, onHire }: AIProviderCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="retro-card" style={{ borderColor: 'var(--color-retro-purple)', borderWidth: '1px' }}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-[--color-retro-text]">
            {provider.name}
          </h4>
          <span className="text-xs font-[--font-retro-mono] text-[--color-retro-purple]">
            {formatCost(provider.baseCostPerWeek)}/wk
          </span>
        </div>
        <div className="flex gap-2 text-right">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-[--color-retro-text-light]">
              Capability
            </span>
            <span className="text-xs font-[--font-retro-mono] text-[--color-retro-blue]">
              {provider.baseCapability}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-[--color-retro-text-light]">
              Reliability
            </span>
            <span className="text-xs font-[--font-retro-mono] text-[--color-retro-green]">
              {provider.baseReliability}
            </span>
          </div>
        </div>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-[--color-retro-text-light]">
        {provider.description}
      </p>

      {/* Agent types / specialties */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {provider.agentTypes.map((type) => (
          <span
            key={type}
            className="retro-badge retro-badge-purple"
          >
            {AGENT_TYPE_LABELS[type]}
          </span>
        ))}
      </div>

      {/* Hire button / expanded hiring */}
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="btn-glossy btn-purple w-full"
        >
          Hire AI Agent
        </button>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-[--color-retro-text-light]">
            Select agent type
          </span>
          {provider.agentTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                onHire(provider, type);
                setExpanded(false);
              }}
              className="btn-glossy btn-silver flex items-center justify-between w-full text-xs"
            >
              <span>{AGENT_TYPE_LABELS[type]} Agent</span>
              <span className="font-[--font-retro-mono] text-[--color-retro-text-light]">
                {formatCost(provider.baseCostPerWeek)}/wk
              </span>
            </button>
          ))}
          <button
            onClick={() => setExpanded(false)}
            className="mt-1 text-xs text-[--color-retro-text-light] transition-colors hover:text-[--color-retro-text]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Strategy Screen ────────────────────────────────────────────────

export function StrategyScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const addDecision = useGameStore((s) => s.addDecision);
  const setGrowthStrategy = useGameStore((s) => s.setGrowthStrategy);

  const activeStrategy = gameState?.meta.growthStrategy ?? 'sustainable';

  if (!gameState) return null;

  const { company, team, product, market } = gameState;
  const culture = company.culture;

  const humanCount = team.employees.length;
  const aiCount = team.aiAgents.length;
  const totalWorkers = humanCount + aiCount;
  const aiRatio = totalWorkers > 0 ? Math.round((aiCount / totalWorkers) * 100) : 0;

  function handleHireAgent(provider: AIProviderConfig, agentType: AIAgentType) {
    addDecision({
      type: 'hire-ai-agent',
      name: `${provider.name} ${AGENT_TYPE_LABELS[agentType]} Agent`,
      agentType,
      provider: provider.id,
      capability: provider.baseCapability,
      costPerWeek: provider.baseCostPerWeek,
      reliability: provider.baseReliability,
    });
  }

  // Determine which customer demands are met
  const shippedFeatureNames = product.features
    .filter((f) => f.status === 'shipped')
    .map((f) => f.name.toLowerCase());
  const customerDemands = market.segmentData.customerDemand;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* ── Company Culture ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold font-[--font-retro-heading] text-[--color-retro-text]">
          Company Culture
        </h2>
        <div className="retro-card">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <CultureSlider
              label="Work-Life Balance"
              value={culture.workLifeBalance}
              accent="emerald"
            />
            <CultureSlider
              label="Innovation"
              value={culture.innovation}
              accent="blue"
            />
            <CultureSlider
              label="Collaboration"
              value={culture.collaboration}
              accent="amber"
            />
            <CultureSlider
              label="AI-First"
              value={culture.aiFirst}
              accent="violet"
            />
          </div>
          <p className="mt-4 text-xs text-[--color-retro-text-light]">
            Culture meters shift based on your decisions, hiring, and events. They influence team morale, productivity, and available options.
          </p>
        </div>
      </section>

      {/* ── Growth Strategy ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold font-[--font-retro-heading] text-[--color-retro-text]">
          Growth Strategy
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GROWTH_STRATEGIES.map((strategy) => {
            const isActive = activeStrategy === strategy.id;
            return (
              <button
                key={strategy.id}
                onClick={() => setGrowthStrategy(strategy.id)}
                className={`retro-card-raised text-left transition-all ${
                  isActive
                    ? 'border-[--color-retro-blue]! ring-2 ring-[--color-retro-blue-pale]'
                    : 'hover:border-[--color-retro-border-dark]'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <h3
                    className={`text-sm font-semibold ${
                      isActive ? 'text-[--color-retro-blue]' : 'text-[--color-retro-text]'
                    }`}
                  >
                    {strategy.name}
                  </h3>
                  {isActive && (
                    <span className="retro-badge retro-badge-blue">
                      Active
                    </span>
                  )}
                </div>
                <p className="mb-2 text-xs font-medium italic text-[--color-retro-text-light]">
                  {strategy.tagline}
                </p>
                <p className="mb-3 text-xs leading-relaxed text-[--color-retro-text-muted]">
                  {strategy.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.traits.map((trait) => (
                    <span
                      key={trait.label}
                      className={`rounded px-2 py-0.5 text-[10px] font-medium ${TRAIT_COLORS[trait.color]}`}
                    >
                      {trait.label}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── AI Strategy ─────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold font-[--font-retro-heading] text-[--color-retro-purple]">
          AI Strategy
        </h2>

        {/* Overview cards */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* AI Agent utilization */}
          <div className="retro-card" style={{ borderColor: 'var(--color-retro-purple)' }}>
            <span className="text-xs font-medium uppercase tracking-wider text-[--color-retro-text-light]">
              AI Agents
            </span>
            <p className="mt-1 text-2xl font-bold font-[--font-retro-mono] text-[--color-retro-purple]">
              {aiCount}
            </p>
            <p className="mt-0.5 text-xs text-[--color-retro-text-light]">
              {aiCount === 0
                ? 'No agents deployed'
                : `${team.aiAgents.filter((a) => a.assignedTo).length} assigned to features`}
            </p>
          </div>

          {/* Human count */}
          <div className="retro-card">
            <span className="text-xs font-medium uppercase tracking-wider text-[--color-retro-text-light]">
              Human Team
            </span>
            <p className="mt-1 text-2xl font-bold font-[--font-retro-mono] text-[--color-retro-blue]">
              {humanCount}
            </p>
            <p className="mt-0.5 text-xs text-[--color-retro-text-light]">
              Avg morale: {Math.round(team.avgMorale)}
            </p>
          </div>

          {/* Ratio */}
          <div className="retro-card">
            <span className="text-xs font-medium uppercase tracking-wider text-[--color-retro-text-light]">
              Human / AI Ratio
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-[--font-retro-mono] text-[--color-retro-text]">
                {humanCount}
              </span>
              <span className="text-lg text-[--color-retro-text-light]">/</span>
              <span className="text-2xl font-bold font-[--font-retro-mono] text-[--color-retro-purple]">
                {aiCount}
              </span>
            </div>
            <div className="retro-progress mt-2 !h-2">
              <div
                className="retro-progress-bar retro-progress-bar-purple"
                style={{ width: `${aiRatio}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-[--color-retro-text-light]">
              <span>Human</span>
              <span>{aiRatio}% AI</span>
            </div>
          </div>
        </div>

        {/* Active agents list */}
        {team.aiAgents.length > 0 && (
          <div className="retro-card mb-4" style={{ borderColor: 'var(--color-retro-purple)' }}>
            <h4 className="retro-section-heading" style={{ color: 'var(--color-retro-purple)', borderColor: 'var(--color-retro-purple)' }}>
              Active Agents
            </h4>
            <div className="flex flex-col gap-2">
              {team.aiAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="retro-inset flex items-center justify-between px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="retro-badge retro-badge-purple">
                      {AGENT_TYPE_LABELS[agent.type]}
                    </span>
                    <span className="text-sm text-[--color-retro-text]">{agent.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-[--font-retro-mono] text-[--color-retro-text-light]">
                      Cap: {agent.capability}
                    </span>
                    <span className="font-[--font-retro-mono] text-[--color-retro-text-light]">
                      Rel: {agent.reliability}
                    </span>
                    <span className="font-[--font-retro-mono] text-[--color-retro-purple]">
                      {formatCost(agent.costPerWeek)}/wk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Provider cards */}
        <h3 className="retro-section-heading" style={{ color: 'var(--color-retro-purple)', borderColor: 'var(--color-retro-purple)' }}>
          AI Providers
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AI_PROVIDERS.map((provider) => (
            <AIProviderCard
              key={provider.id}
              provider={provider}
              onHire={handleHireAgent}
            />
          ))}
        </div>
      </section>

      {/* ── Market Position ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold font-[--font-retro-heading] text-[--color-retro-text]">
          Market Position
        </h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Current segment info */}
          <div className="retro-card">
            <h3 className="retro-section-heading">
              Current Segment
            </h3>
            <div className="mb-2 flex items-center gap-2">
              <span className="retro-badge retro-badge-blue">
                {market.segmentData.name}
              </span>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-[--color-retro-text-muted]">
              {market.segmentData.description}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[--color-retro-text-light]">
                  Market Size
                </span>
                <p className="text-sm font-[--font-retro-mono] text-[--color-retro-text]">
                  {market.segmentData.size.toLocaleString('en-US')}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[--color-retro-text-light]">
                  Growth Rate
                </span>
                <p className="text-sm font-[--font-retro-mono] text-[--color-retro-green]">
                  {(market.segmentData.growthRate * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[--color-retro-text-light]">
                  Competition
                </span>
                <p className="text-sm font-[--font-retro-mono] text-[--color-retro-orange]">
                  {market.segmentData.competitionIntensity}/100
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[--color-retro-text-light]">
                  Regulatory Risk
                </span>
                <p className="text-sm font-[--font-retro-mono] text-[--color-retro-red]">
                  {market.segmentData.regulatoryRisk}/100
                </p>
              </div>
            </div>
          </div>

          {/* Customer demands */}
          <div className="retro-card">
            <h3 className="retro-section-heading">
              Customer Demands
            </h3>
            {customerDemands.length > 0 ? (
              <div className="flex flex-col gap-2">
                {customerDemands.map((demand) => {
                  const isMet = shippedFeatureNames.some(
                    (name) =>
                      name.includes(demand.toLowerCase()) ||
                      demand.toLowerCase().includes(name),
                  );
                  return (
                    <div
                      key={demand}
                      className="retro-inset flex items-center gap-2.5 px-3 py-2"
                    >
                      {isMet ? (
                        <svg
                          className="h-4 w-4 shrink-0 text-[--color-retro-green]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4 shrink-0 text-[--color-retro-text-light]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                      )}
                      <span
                        className={`text-sm ${
                          isMet ? 'text-[--color-retro-green]' : 'text-[--color-retro-text-muted]'
                        }`}
                      >
                        {demand}
                      </span>
                      {isMet && (
                        <span className="ml-auto text-[10px] uppercase tracking-wider text-[--color-retro-green]">
                          Shipped
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[--color-retro-text-light]">
                No specific demands in this segment yet.
              </p>
            )}
          </div>
        </div>

        {/* Competitors */}
        {market.competitors.length > 0 && (
          <div className="retro-card mt-4">
            <h3 className="retro-section-heading">
              Competitors
            </h3>
            <div className="overflow-x-auto">
              <table className="retro-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Quality</th>
                    <th>Market Share</th>
                    <th>Team</th>
                    <th>Strategy</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {market.competitors.map((comp) => {
                    const qualityDiff = Math.round(comp.productQuality - product.overallQuality);
                    return (
                      <tr
                        key={comp.id}
                        className={!comp.alive ? 'opacity-40' : ''}
                      >
                        <td className="font-medium text-[--color-retro-text]">
                          {comp.name}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-[--font-retro-mono] text-[--color-retro-text]">
                              {Math.round(comp.productQuality)}
                            </span>
                            <span
                              className={`text-[10px] font-[--font-retro-mono] ${
                                qualityDiff > 0
                                  ? 'text-[--color-retro-red]'
                                  : qualityDiff < 0
                                    ? 'text-[--color-retro-green]'
                                    : 'text-[--color-retro-text-light]'
                              }`}
                            >
                              {qualityDiff > 0
                                ? `+${qualityDiff} vs you`
                                : qualityDiff < 0
                                  ? `${qualityDiff} vs you`
                                  : 'same'}
                            </span>
                          </div>
                        </td>
                        <td className="font-[--font-retro-mono] text-[--color-retro-text]">
                          {(comp.marketShare * 100).toFixed(1)}%
                        </td>
                        <td className="font-[--font-retro-mono] text-[--color-retro-text-muted]">
                          {comp.teamSize}
                        </td>
                        <td className="text-xs text-[--color-retro-text-muted]">
                          {comp.strategy}
                        </td>
                        <td>
                          <span
                            className={`retro-badge ${
                              comp.alive
                                ? 'retro-badge-green'
                                : 'retro-badge-red'
                            }`}
                          >
                            {comp.alive ? 'Active' : 'Dead'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Your position reference */}
            <div className="mt-3 flex items-center gap-3 border-t border-[--color-retro-border] pt-3">
              <span className="text-xs text-[--color-retro-text-light]">Your product quality:</span>
              <span className="font-[--font-retro-mono] text-sm text-[--color-retro-blue]">
                {product.overallQuality}/100
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
