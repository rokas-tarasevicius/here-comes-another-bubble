import { useGameStore } from '../../store/index.ts';
import type { AIAgentType } from '../../types/game.ts';

const AGENT_TYPE_LABELS: Record<AIAgentType, string> = {
  coding: 'Coding',
  design: 'Design',
  marketing: 'Marketing',
  analytics: 'Analytics',
  support: 'Support',
  general: 'General',
};

function formatCost(amount: number): string {
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export function AIAgentPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const addDecision = useGameStore((s) => s.addDecision);

  if (!gameState) return null;

  const { aiAgents } = gameState.team;

  if (aiAgents.length === 0) {
    return (
      <div className="retro-card text-center" style={{ padding: '32px 16px' }}>
        <p className="text-sm text-[--color-retro-text-muted]">No AI agents deployed. Hire your first AI agent!</p>
      </div>
    );
  }

  function handleRemove(agentId: string) {
    addDecision({ type: 'fire-ai-agent', agentId });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {aiAgents.map((agent) => {
        const featureName = agent.assignedTo
          ? gameState.product.features.find((f) => f.id === agent.assignedTo)?.name ?? 'Unknown'
          : null;

        return (
          <div
            key={agent.id}
            className="retro-card"
            style={{ borderColor: '#9988aa', borderLeftWidth: '3px', borderLeftColor: '#663399' }}
          >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-[--color-retro-text]">{agent.name}</h4>
                <p className="text-xs text-[--color-retro-text-light]">{agent.provider}</p>
              </div>
              <span className="retro-badge retro-badge-purple">
                {AGENT_TYPE_LABELS[agent.type] ?? agent.type}
              </span>
            </div>

            {/* Stats */}
            <div className="mb-3 space-y-2">
              {/* Capability */}
              <div>
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-xs text-[--color-retro-text-muted]">Capability</span>
                  <span className="text-xs font-retro-mono text-[--color-retro-purple]">{agent.capability}</span>
                </div>
                <div className="retro-progress" style={{ height: '10px' }}>
                  <div
                    className="retro-progress-bar retro-progress-bar-purple"
                    style={{ width: `${agent.capability}%` }}
                  />
                </div>
              </div>

              {/* Reliability */}
              <div>
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-xs text-[--color-retro-text-muted]">Reliability</span>
                  <span className="text-xs font-retro-mono text-[--color-retro-purple]">{agent.reliability}</span>
                </div>
                <div className="retro-progress" style={{ height: '10px' }}>
                  <div
                    className="retro-progress-bar retro-progress-bar-purple"
                    style={{ width: `${agent.reliability}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Cost + Assignment */}
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="text-[--color-retro-text-muted]">
                Cost: <span className="font-retro-mono text-[--color-retro-text]">{formatCost(agent.costPerWeek)}/wk</span>
              </span>
              {featureName && (
                <span className="text-[--color-retro-text-light]">
                  on <span className="text-[--color-retro-text]">{featureName}</span>
                </span>
              )}
            </div>

            {/* Remove button */}
            <button
              onClick={() => handleRemove(agent.id)}
              className="btn-glossy btn-red w-full"
              style={{ fontSize: '11px', padding: '6px 12px' }}
            >
              Remove Agent
            </button>
          </div>
        );
      })}
    </div>
  );
}
