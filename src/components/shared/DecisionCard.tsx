import { useGameStore } from '../../store/index.ts';
import type { PendingDecision, StateEffect, DecisionOption } from '../../types/game.ts';
import type { RespondToEventDecision } from '../../types/decisions.ts';

// ─── Props ───────────────────────────────────────────────────────────────

export interface DecisionCardProps {
  decision: PendingDecision;
  currentWeek: number;
}

// ─── Effect formatting ───────────────────────────────────────────────────

const EFFECT_LABELS: Record<string, string> = {
  'cash': 'Cash',
  'weeklyRevenue': 'Revenue',
  'weeklyBurn': 'Burn Rate',
  'monthlyExpenses': 'Expenses',
  'founderEquity': 'Equity',
  'avgMorale': 'Team Morale',
  'morale': 'Morale',
  'techSkill': 'Tech Skill',
  'bizSkill': 'Business Skill',
  'network': 'Network',
  'reputation': 'Reputation',
  'learning': 'Learning Speed',
  'overallQuality': 'Product Quality',
  'techDebtTotal': 'Tech Debt',
  'pmfScore': 'Product-Market Fit',
  'customers': 'Customers',
  'churnRate': 'Churn Rate',
  'bugs': 'Bugs',
  'bubbleIndex': 'Bubble Index',
  'investorSentiment': 'Investor Sentiment',
  'talentMarketHeat': 'Talent Market',
  'culture': 'Culture',
  'valuation': 'Valuation',
  'pricePerUnit': 'Price/Unit',
};

function getEffectLabel(path: string): string {
  const key = path.split('.').pop() || path;
  return EFFECT_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

function formatEffectValue(effect: StateEffect): string {
  const label = getEffectLabel(effect.path);
  const pathKey = effect.path.split('.').pop() || effect.path;

  if (effect.operation === 'add') {
    // Currency-like paths get dollar formatting
    const isCurrency =
      pathKey === 'cash' ||
      pathKey === 'weeklyRevenue' ||
      pathKey === 'weeklyBurn' ||
      pathKey === 'monthlyExpenses';
    if (isCurrency) {
      if (effect.value < 0) {
        return `${label}: -$${Math.abs(effect.value).toLocaleString('en-US')}`;
      }
      return `${label}: +$${effect.value.toLocaleString('en-US')}`;
    }
    const sign = effect.value >= 0 ? '+' : '';
    return `${label}: ${sign}${effect.value}`;
  }
  if (effect.operation === 'multiply') {
    return `${label}: \u00D7${effect.value}`;
  }
  return `${label}: \u2192 ${effect.value}`;
}

/** Combine effects with the same path and operation by summing their values. */
function combineEffects(effects: StateEffect[]): StateEffect[] {
  const map = new Map<string, StateEffect>();
  for (const eff of effects) {
    const key = `${eff.path}|${eff.operation}`;
    const existing = map.get(key);
    if (existing && eff.operation === 'add') {
      map.set(key, { ...existing, value: existing.value + eff.value });
    } else {
      // For multiply / set, last-write wins; or first entry
      map.set(key, { ...eff });
    }
  }
  return Array.from(map.values());
}

function effectBadgeClass(effect: StateEffect): string {
  if (effect.operation === 'add') {
    return effect.value >= 0 ? 'retro-badge retro-badge-green' : 'retro-badge retro-badge-red';
  }
  if (effect.operation === 'multiply') {
    return effect.value >= 1 ? 'retro-badge retro-badge-green' : 'retro-badge retro-badge-red';
  }
  return 'retro-badge retro-badge-blue';
}

// ─── Deadline urgency helpers ────────────────────────────────────────────

function deadlineUrgency(deadline: number, currentWeek: number): 'critical' | 'warning' | 'normal' {
  const weeksLeft = deadline - currentWeek;
  if (weeksLeft <= 1) return 'critical';
  if (weeksLeft <= 3) return 'warning';
  return 'normal';
}

const URGENCY_BADGE: Record<string, string> = {
  critical: 'retro-badge retro-badge-red',
  warning: 'retro-badge retro-badge-orange',
  normal: 'retro-badge retro-badge-gray',
};

// ─── Tone badge ──────────────────────────────────────────────────────────

const TONE_BADGE: Record<string, string> = {
  realistic: 'retro-badge retro-badge-blue',
  satirical: 'retro-badge retro-badge-orange',
  mixed: 'retro-badge retro-badge-purple',
};

// ─── Component ───────────────────────────────────────────────────────────

export function DecisionCard({ decision, currentWeek }: DecisionCardProps) {
  const addDecision = useGameStore((s) => s.addDecision);
  const decisionsThisTurn = useGameStore((s) => s.decisionsThisTurn);
  const removeDecision = useGameStore((s) => s.removeDecision);

  // Find if an option for this decision is already selected
  const selectedEntry = decisionsThisTurn.findIndex(
    (d) =>
      d.type === 'respond-to-event' &&
      (d as RespondToEventDecision).decisionId === decision.id,
  );
  const selectedDecision =
    selectedEntry >= 0
      ? (decisionsThisTurn[selectedEntry] as RespondToEventDecision)
      : null;
  const selectedOptionId = selectedDecision?.optionId ?? null;

  const urgency = deadlineUrgency(decision.deadline, currentWeek);
  const weeksLeft = decision.deadline - currentWeek;

  function handleSelect(option: DecisionOption) {
    // If this option is already selected, do nothing
    if (selectedOptionId === option.id) return;

    // If a different option was selected, remove it first
    if (selectedEntry >= 0) {
      removeDecision(selectedEntry);
    }

    addDecision({
      type: 'respond-to-event',
      decisionId: decision.id,
      optionId: option.id,
    });
  }

  return (
    <div className="retro-card-raised" style={{ padding: '20px' }}>
      {/* Header row: deadline badge */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed font-bold text-[--color-retro-text]">
          {decision.prompt}
        </p>
        <span className={`shrink-0 ${URGENCY_BADGE[urgency]}`}>
          {weeksLeft <= 0
            ? 'Due now!'
            : weeksLeft === 1
              ? 'Due next week'
              : `Week ${decision.deadline}`}
        </span>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {decision.options.map((option) => {
          const isSelected = selectedOptionId === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              className={`retro-card group relative text-left transition-all ${
                isSelected
                  ? 'border-[--color-retro-blue] ring-2 ring-[--color-retro-blue-light] bg-[--color-retro-blue-pale]'
                  : 'hover:border-[--color-retro-border-dark] hover:bg-[--color-retro-bg-alt]'
              }`}
            >
              {/* Selected check mark */}
              {isSelected && (
                <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: '#336699' }}>
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}

              {/* Label + tone badge */}
              <div className="mb-1 flex items-center gap-2 pr-6">
                <span className="text-sm font-bold text-[--color-retro-text]">
                  {option.label}
                </span>
                {option.tone && (
                  <span className={TONE_BADGE[option.tone] ?? 'retro-badge retro-badge-gray'}>
                    {option.tone}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mb-2 text-xs leading-relaxed text-[--color-retro-text-muted]">
                {option.description}
              </p>

              {/* Effect previews */}
              {option.effects.length > 0 && (
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {combineEffects(option.effects).map((eff, i) => (
                    <span
                      key={i}
                      className={`${effectBadgeClass(eff)} font-[--font-retro-mono]`}
                      style={{ fontSize: '10px' }}
                    >
                      {formatEffectValue(eff)}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
