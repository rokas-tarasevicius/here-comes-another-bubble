import { useGameStore } from '../../store/index.ts';
import { DecisionCard } from '../shared/DecisionCard.tsx';
import { formatCurrency } from '../../utils/format.ts';
import type { PlayerDecision } from '../../types/decisions.ts';
import type { PendingDecision } from '../../types/game.ts';

// ─── Decision label helpers ──────────────────────────────────────────────

function describeDecision(decision: PlayerDecision, pendingDecisions: PendingDecision[]): string {
  switch (decision.type) {
    case 'respond-to-event': {
      const pending = pendingDecisions.find((d) => d.id === decision.decisionId);
      const optionLabel = pending?.options.find((o) => o.id === decision.optionId)?.label;
      const title = pending?.prompt ?? decision.decisionId;
      return optionLabel ? `${title}: ${optionLabel}` : title;
    }
    case 'start-feature':
      return `Start feature: ${decision.name}`;
    case 'set-pricing':
      return `Change pricing to ${decision.model} at ${formatCurrency(decision.pricePerUnit)}/unit`;
    case 'hire-ai-agent':
      return `Hire AI agent: ${decision.name} (${decision.provider})`;
    case 'fire-ai-agent':
      return `Remove AI agent`;
    case 'seek-funding':
      return `Seek funding`;
    case 'change-segment':
      return `Pivot to ${decision.newSegment.replace(/-/g, ' ')}`;
    case 'hire-team':
      return `Hire ${decision.count} team member${decision.count > 1 ? 's' : ''}`;
    case 'fire-team':
      return `Lay off ${decision.count} team member${decision.count > 1 ? 's' : ''}`;
    case 'set-marketing-budget':
      return `Set marketing budget: ${formatCurrency(decision.amount)}/wk`;
    case 'set-growth-strategy':
      return `Switch growth strategy to ${decision.strategy.replace(/-/g, ' ')}`;
    default:
      return 'Unknown action';
  }
}

function decisionTypeLabel(type: string): string {
  switch (type) {
    case 'respond-to-event': return 'Event';
    case 'start-feature': return 'Product';
    case 'set-pricing': return 'Pricing';
    case 'hire-ai-agent': return 'AI';
    case 'fire-ai-agent': return 'AI';
    case 'seek-funding': return 'Funding';
    case 'change-segment': return 'Strategy';
    case 'hire-team': return 'Team';
    case 'fire-team': return 'Team';
    case 'set-marketing-budget': return 'Marketing';
    case 'set-growth-strategy': return 'Strategy';
    default: return 'Action';
  }
}

const TYPE_BADGE_CLASSES: Record<string, string> = {
  'respond-to-event': 'retro-badge retro-badge-orange',
  'start-feature': 'retro-badge retro-badge-blue',
  'set-pricing': 'retro-badge retro-badge-green',
  'hire-ai-agent': 'retro-badge retro-badge-purple',
  'fire-ai-agent': 'retro-badge retro-badge-purple',
  'seek-funding': 'retro-badge retro-badge-orange',
  'change-segment': 'retro-badge retro-badge-blue',
  'hire-team': 'retro-badge retro-badge-blue',
  'fire-team': 'retro-badge retro-badge-red',
  'set-marketing-budget': 'retro-badge retro-badge-green',
  'set-growth-strategy': 'retro-badge retro-badge-blue',
};

// ─── Component ───────────────────────────────────────────────────────────

export function DecisionScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const decisionsThisTurn = useGameStore((s) => s.decisionsThisTurn);
  const removeDecision = useGameStore((s) => s.removeDecision);

  if (!gameState) return null;

  const { pendingDecisions, meta } = gameState;
  const currentWeek = meta.week;

  // Filter: only show decisions due this week and not already responded to
  const unrespondedDecisions = pendingDecisions.filter(
    (d) => d.deadline <= currentWeek && !decisionsThisTurn.some(
      (dt) => dt.type === 'respond-to-event' && dt.decisionId === d.id
    )
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* ── Pending Decisions ──────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[--color-retro-text]">
            Pending Decisions
            {unrespondedDecisions.length > 0 && (
              <span className="ml-2 retro-badge retro-badge-orange">
                {unrespondedDecisions.length}
              </span>
            )}
          </h2>
          <span className="text-xs text-[--color-retro-text-light]">
            Week {currentWeek}
          </span>
        </div>

        {unrespondedDecisions.length > 0 ? (
          <div className="flex flex-col gap-4">
            {unrespondedDecisions.map((decision) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                currentWeek={currentWeek}
              />
            ))}
          </div>
        ) : (
          <div className="retro-card p-10 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-14 w-14 text-[--color-retro-green]"
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
            <p className="text-lg font-bold text-[--color-retro-text]">
              All caught up!
            </p>
            <p className="mt-2 text-sm text-[--color-retro-text-muted]">
              Press <kbd className="retro-badge retro-badge-gray mx-1">N</kbd> or advance to the next week for new opportunities.
            </p>
          </div>
        )}
      </section>

      {/* ── Queued Actions ─────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[--color-retro-text]">
            Queued Actions
            {decisionsThisTurn.length > 0 && (
              <span className="ml-2 retro-badge retro-badge-blue">
                {decisionsThisTurn.length}
              </span>
            )}
          </h2>
          <span className="text-xs text-[--color-retro-text-light]">
            Actions for this week
          </span>
        </div>

        {decisionsThisTurn.length > 0 ? (
          <div className="retro-card retro-card-flush divide-y divide-[--color-retro-border]">
            {decisionsThisTurn.map((decision, index) => {
              const badgeClass =
                TYPE_BADGE_CLASSES[decision.type] ?? 'retro-badge retro-badge-gray';
              const decisionKey = decision.type === 'respond-to-event'
                ? `event-${decision.decisionId}`
                : `${decision.type}-${index}`;

              return (
                <div
                  key={decisionKey}
                  className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-[--color-retro-bg-alt]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 ${badgeClass}`}>
                      {decisionTypeLabel(decision.type)}
                    </span>
                    <span className="truncate text-sm text-[--color-retro-text]">
                      {describeDecision(decision, pendingDecisions)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeDecision(index)}
                    className="btn-glossy btn-glossy-sm btn-red shrink-0 text-xs"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="retro-card p-8 text-center">
            <p className="text-sm text-[--color-retro-text-light]">
              No actions queued for this week.
            </p>
            <p className="mt-1 text-xs text-[--color-retro-text-light]">
              Respond to pending decisions above to queue actions for this week.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
