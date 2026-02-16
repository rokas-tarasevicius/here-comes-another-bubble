import { useGameStore } from '../../store/index.ts';
import { DecisionCard } from '../shared/DecisionCard.tsx';
import type { PlayerDecision } from '../../types/decisions.ts';

// ─── Decision label helpers ──────────────────────────────────────────────

function describeDecision(decision: PlayerDecision): string {
  switch (decision.type) {
    case 'respond-to-event':
      return `Event response: decision ${decision.decisionId} \u2192 option ${decision.optionId}`;
    case 'hire':
      return `Hire candidate ${decision.candidateId}`;
    case 'fire':
      return `Fire employee ${decision.employeeId}`;
    case 'assign-team':
      return `Reassign ${decision.assignments.length} team member${decision.assignments.length !== 1 ? 's' : ''}`;
    case 'start-feature':
      return `Start feature: ${decision.name}`;
    case 'set-pricing':
      return `Set pricing: ${decision.model} at $${decision.pricePerUnit}`;
    case 'hire-ai-agent':
      return `Hire AI agent: ${decision.name} (${decision.provider})`;
    case 'fire-ai-agent':
      return `Remove AI agent ${decision.agentId}`;
    case 'seek-funding':
      return `Seek funding: ${decision.targetStage}`;
    case 'change-segment':
      return `Pivot to ${decision.newSegment}`;
    case 'post-job':
      return `Post job listing: ${decision.role}`;
    default:
      return 'Unknown action';
  }
}

function decisionTypeLabel(type: string): string {
  switch (type) {
    case 'respond-to-event': return 'Event';
    case 'hire': return 'Hiring';
    case 'fire': return 'Firing';
    case 'assign-team': return 'Team';
    case 'start-feature': return 'Product';
    case 'set-pricing': return 'Pricing';
    case 'hire-ai-agent': return 'AI';
    case 'fire-ai-agent': return 'AI';
    case 'seek-funding': return 'Funding';
    case 'change-segment': return 'Strategy';
    case 'post-job': return 'Hiring';
    default: return 'Action';
  }
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  'respond-to-event': 'text-amber-400 bg-amber-900/30',
  hire: 'text-emerald-400 bg-emerald-900/30',
  fire: 'text-red-400 bg-red-900/30',
  'assign-team': 'text-blue-400 bg-blue-900/30',
  'start-feature': 'text-blue-400 bg-blue-900/30',
  'set-pricing': 'text-emerald-400 bg-emerald-900/30',
  'hire-ai-agent': 'text-violet-400 bg-violet-900/30',
  'fire-ai-agent': 'text-violet-400 bg-violet-900/30',
  'seek-funding': 'text-amber-400 bg-amber-900/30',
  'change-segment': 'text-blue-400 bg-blue-900/30',
  'post-job': 'text-emerald-400 bg-emerald-900/30',
};

// ─── Component ───────────────────────────────────────────────────────────

export function DecisionScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const decisionsThisTurn = useGameStore((s) => s.decisionsThisTurn);
  const removeDecision = useGameStore((s) => s.removeDecision);

  if (!gameState) return null;

  const { pendingDecisions, meta } = gameState;
  const currentWeek = meta.week;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* ── Pending Decisions ──────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-100">
            Pending Decisions
            {pendingDecisions.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-900/40 px-2.5 py-0.5 text-sm font-semibold text-amber-400">
                {pendingDecisions.length}
              </span>
            )}
          </h2>
          <span className="text-xs text-gray-500">
            Week {currentWeek}
          </span>
        </div>

        {pendingDecisions.length > 0 ? (
          <div className="flex flex-col gap-4">
            {pendingDecisions.map((decision) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                currentWeek={currentWeek}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
            <div className="mb-3">
              <svg
                className="mx-auto h-10 w-10 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-300">
              No decisions pending.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              You're all caught up! Advance to the next week for new events.
            </p>
          </div>
        )}
      </section>

      {/* ── Queued Actions ─────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-100">
            Queued Actions
            {decisionsThisTurn.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-900/40 px-2.5 py-0.5 text-sm font-semibold text-blue-400">
                {decisionsThisTurn.length}
              </span>
            )}
          </h2>
          <span className="text-xs text-gray-500">
            Actions for this week
          </span>
        </div>

        {decisionsThisTurn.length > 0 ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900 divide-y divide-gray-800">
            {decisionsThisTurn.map((decision, index) => {
              const badgeColor =
                TYPE_BADGE_COLORS[decision.type] ?? 'text-gray-400 bg-gray-800';

              return (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-gray-800/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeColor}`}
                    >
                      {decisionTypeLabel(decision.type)}
                    </span>
                    <span className="truncate text-sm text-gray-300">
                      {describeDecision(decision)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeDecision(index)}
                    className="shrink-0 rounded px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/30 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
            <p className="text-sm text-gray-500">
              No actions queued for this week.
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Make decisions above or use other screens to queue actions.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
