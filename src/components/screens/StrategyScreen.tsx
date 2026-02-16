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
  emerald: 'text-emerald-400 bg-emerald-900/30',
  red: 'text-red-400 bg-red-900/30',
  amber: 'text-amber-400 bg-amber-900/30',
  blue: 'text-blue-400 bg-blue-900/30',
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
  const barColors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
  };
  const textColors: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    violet: 'text-violet-400',
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">{label}</span>
        <span className={`text-sm font-mono font-medium ${textColors[accent]}`}>
          {value}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-700">
        <div
          className={`h-2 rounded-full transition-all ${barColors[accent]}`}
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
    <div className="rounded-lg border border-violet-900/40 bg-gray-900 p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-100">
            {provider.name}
          </h4>
          <span className="text-xs font-mono text-violet-400">
            {formatCost(provider.baseCostPerWeek)}/wk
          </span>
        </div>
        <div className="flex gap-2 text-right">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">
              Capability
            </span>
            <span className="text-xs font-mono text-blue-400">
              {provider.baseCapability}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">
              Reliability
            </span>
            <span className="text-xs font-mono text-emerald-400">
              {provider.baseReliability}
            </span>
          </div>
        </div>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-gray-500">
        {provider.description}
      </p>

      {/* Agent types / specialties */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {provider.agentTypes.map((type) => (
          <span
            key={type}
            className="rounded bg-violet-900/20 px-2 py-0.5 text-[10px] font-medium text-violet-300"
          >
            {AGENT_TYPE_LABELS[type]}
          </span>
        ))}
      </div>

      {/* Hire button / expanded hiring */}
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full rounded-md border border-violet-700/50 bg-violet-900/20 px-3 py-2 text-xs font-medium text-violet-300 transition-colors hover:border-violet-600 hover:bg-violet-900/40 hover:text-violet-200"
        >
          Hire AI Agent
        </button>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">
            Select agent type
          </span>
          {provider.agentTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                onHire(provider, type);
                setExpanded(false);
              }}
              className="flex items-center justify-between rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 transition-colors hover:border-violet-600 hover:bg-violet-900/20 hover:text-violet-200"
            >
              <span>{AGENT_TYPE_LABELS[type]} Agent</span>
              <span className="font-mono text-gray-500">
                {formatCost(provider.baseCostPerWeek)}/wk
              </span>
            </button>
          ))}
          <button
            onClick={() => setExpanded(false)}
            className="mt-1 text-xs text-gray-500 transition-colors hover:text-gray-300"
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

  const [activeStrategy, setActiveStrategy] = useState<string>('sustainable');

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
        <h2 className="mb-4 text-lg font-bold text-gray-100">
          Company Culture
        </h2>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
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
          <p className="mt-4 text-xs text-gray-600">
            Culture meters shift based on your decisions, hiring, and events. They influence team morale, productivity, and available options.
          </p>
        </div>
      </section>

      {/* ── Growth Strategy ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-100">
          Growth Strategy
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GROWTH_STRATEGIES.map((strategy) => {
            const isActive = activeStrategy === strategy.id;
            return (
              <button
                key={strategy.id}
                onClick={() => setActiveStrategy(strategy.id)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  isActive
                    ? 'border-emerald-600 bg-emerald-900/10 ring-1 ring-emerald-600/30'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-800/80'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <h3
                    className={`text-sm font-semibold ${
                      isActive ? 'text-emerald-300' : 'text-gray-100'
                    }`}
                  >
                    {strategy.name}
                  </h3>
                  {isActive && (
                    <span className="rounded bg-emerald-900/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="mb-2 text-xs font-medium italic text-gray-500">
                  {strategy.tagline}
                </p>
                <p className="mb-3 text-xs leading-relaxed text-gray-400">
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
        <h2 className="mb-4 text-lg font-bold text-violet-300">
          AI Strategy
        </h2>

        {/* Overview cards */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* AI Agent utilization */}
          <div className="rounded-lg border border-violet-900/40 bg-gray-900 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              AI Agents
            </span>
            <p className="mt-1 text-2xl font-bold font-mono text-violet-400">
              {aiCount}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {aiCount === 0
                ? 'No agents deployed'
                : `${team.aiAgents.filter((a) => a.assignedTo).length} assigned to features`}
            </p>
          </div>

          {/* Human count */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Human Team
            </span>
            <p className="mt-1 text-2xl font-bold font-mono text-blue-400">
              {humanCount}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Avg morale: {Math.round(team.avgMorale)}
            </p>
          </div>

          {/* Ratio */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Human / AI Ratio
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-gray-100">
                {humanCount}
              </span>
              <span className="text-lg text-gray-600">/</span>
              <span className="text-2xl font-bold font-mono text-violet-400">
                {aiCount}
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-700 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                style={{ width: `${aiRatio}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-gray-600">
              <span>Human</span>
              <span>{aiRatio}% AI</span>
            </div>
          </div>
        </div>

        {/* Active agents list */}
        {team.aiAgents.length > 0 && (
          <div className="mb-4 rounded-lg border border-violet-900/40 bg-gray-900 p-4">
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Active Agents
            </h4>
            <div className="flex flex-col gap-2">
              {team.aiAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between rounded-md bg-gray-800/60 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-violet-900/30 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">
                      {AGENT_TYPE_LABELS[agent.type]}
                    </span>
                    <span className="text-sm text-gray-200">{agent.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-mono text-gray-500">
                      Cap: {agent.capability}
                    </span>
                    <span className="font-mono text-gray-500">
                      Rel: {agent.reliability}
                    </span>
                    <span className="font-mono text-violet-400">
                      {formatCost(agent.costPerWeek)}/wk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Provider cards */}
        <h3 className="mb-3 text-sm font-semibold text-gray-300">
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
        <h2 className="mb-4 text-lg font-bold text-gray-100">
          Market Position
        </h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Current segment info */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">
              Current Segment
            </h3>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-400">
                {market.segmentData.name}
              </span>
              <span className="text-xs text-gray-500">
                {market.segment}
              </span>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-gray-400">
              {market.segmentData.description}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                  Market Size
                </span>
                <p className="text-sm font-mono text-gray-200">
                  {market.segmentData.size.toLocaleString('en-US')}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                  Growth Rate
                </span>
                <p className="text-sm font-mono text-emerald-400">
                  {(market.segmentData.growthRate * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                  Competition
                </span>
                <p className="text-sm font-mono text-amber-400">
                  {market.segmentData.competitionIntensity}/100
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                  Regulatory Risk
                </span>
                <p className="text-sm font-mono text-red-400">
                  {market.segmentData.regulatoryRisk}/100
                </p>
              </div>
            </div>
          </div>

          {/* Customer demands */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">
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
                      className="flex items-center gap-2.5 rounded-md bg-gray-800/60 px-3 py-2"
                    >
                      {isMet ? (
                        <svg
                          className="h-4 w-4 shrink-0 text-emerald-400"
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
                          className="h-4 w-4 shrink-0 text-gray-600"
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
                          isMet ? 'text-emerald-300' : 'text-gray-400'
                        }`}
                      >
                        {demand}
                      </span>
                      {isMet && (
                        <span className="ml-auto text-[10px] uppercase tracking-wider text-emerald-600">
                          Shipped
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No specific demands in this segment yet.
              </p>
            )}
          </div>
        </div>

        {/* Competitors */}
        {market.competitors.length > 0 && (
          <div className="mt-4 rounded-lg border border-gray-800 bg-gray-900 p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">
              Competitors
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Quality
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Market Share
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Team
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Strategy
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {market.competitors.map((comp) => {
                    const qualityDiff = comp.productQuality - product.overallQuality;
                    return (
                      <tr
                        key={comp.id}
                        className={`transition-colors hover:bg-gray-800/50 ${
                          !comp.alive ? 'opacity-40' : ''
                        }`}
                      >
                        <td className="px-3 py-2 font-medium text-gray-200">
                          {comp.name}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-300">
                              {comp.productQuality}
                            </span>
                            <span
                              className={`text-[10px] font-mono ${
                                qualityDiff > 0
                                  ? 'text-red-400'
                                  : qualityDiff < 0
                                    ? 'text-emerald-400'
                                    : 'text-gray-500'
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
                        <td className="px-3 py-2 font-mono text-gray-300">
                          {(comp.marketShare * 100).toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 font-mono text-gray-400">
                          {comp.teamSize}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400">
                          {comp.strategy}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                              comp.alive
                                ? 'bg-emerald-900/30 text-emerald-400'
                                : 'bg-red-900/30 text-red-400'
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
            <div className="mt-3 flex items-center gap-3 border-t border-gray-800 pt-3">
              <span className="text-xs text-gray-500">Your product quality:</span>
              <span className="font-mono text-sm text-blue-400">
                {product.overallQuality}/100
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
