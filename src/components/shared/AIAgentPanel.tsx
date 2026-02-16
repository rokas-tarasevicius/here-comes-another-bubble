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
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
        <p className="text-sm text-gray-500">No AI agents deployed. Hire your first AI agent!</p>
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
            className="rounded-lg border border-violet-800/50 bg-gray-900 p-4 transition-colors hover:border-violet-700/60"
          >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-100">{agent.name}</h4>
                <p className="text-xs text-gray-500">{agent.provider}</p>
              </div>
              <span className="rounded-full bg-violet-900/60 px-2 py-0.5 text-xs font-medium text-violet-300">
                {AGENT_TYPE_LABELS[agent.type] ?? agent.type}
              </span>
            </div>

            {/* Stats */}
            <div className="mb-3 space-y-2">
              {/* Capability */}
              <div>
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Capability</span>
                  <span className="text-xs font-mono text-violet-300">{agent.capability}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-700">
                  <div
                    className="h-1.5 rounded-full bg-violet-500"
                    style={{ width: `${agent.capability}%` }}
                  />
                </div>
              </div>

              {/* Reliability */}
              <div>
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Reliability</span>
                  <span className="text-xs font-mono text-violet-300">{agent.reliability}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-700">
                  <div
                    className="h-1.5 rounded-full bg-violet-400"
                    style={{ width: `${agent.reliability}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Cost + Assignment */}
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="text-gray-400">
                Cost: <span className="font-mono text-gray-300">{formatCost(agent.costPerWeek)}/wk</span>
              </span>
              {featureName && (
                <span className="text-gray-500">
                  on <span className="text-gray-300">{featureName}</span>
                </span>
              )}
            </div>

            {/* Remove button */}
            <button
              onClick={() => handleRemove(agent.id)}
              className="w-full rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/30 hover:text-red-300"
            >
              Remove Agent
            </button>
          </div>
        );
      })}
    </div>
  );
}
