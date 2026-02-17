import type { GameState, EventLogEntry, PendingDecision, Feature } from '../types/index.ts';
import { ALL_EVENTS } from '../data/events/index.ts';
import { generateId } from '../utils/id.ts';

/**
 * Count how many times a given event has fired in the log.
 */
function eventOccurrenceCount(eventLog: EventLogEntry[], eventId: string): number {
  return eventLog.filter((entry) => entry.eventId === eventId).length;
}

/**
 * Check if an event is still on cooldown.
 */
function isOnCooldown(
  eventLog: EventLogEntry[],
  eventId: string,
  currentWeek: number,
  cooldownWeeks: number,
): boolean {
  if (cooldownWeeks <= 0) return false;
  const lastOccurrence = eventLog
    .filter((entry) => entry.eventId === eventId)
    .reduce((latest, entry) => Math.max(latest, entry.week), 0);
  return lastOccurrence > 0 && currentWeek - lastOccurrence < cooldownWeeks;
}

/**
 * Apply immediate state effects from an event.
 */
function applyEffects(state: GameState, effects: { path: string; operation: 'add' | 'set' | 'multiply'; value: number }[]): GameState {
  // Deep clone to safely mutate
  const next = structuredClone(state);

  for (const effect of effects) {
    const parts = effect.path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let target: any = next;
    for (let i = 0; i < parts.length - 1; i++) {
      target = target[parts[i]];
      if (target === undefined) break;
    }
    if (target === undefined) continue;

    const lastKey = parts[parts.length - 1];
    const current = target[lastKey] as number;

    switch (effect.operation) {
      case 'add':
        target[lastKey] = current + effect.value;
        break;
      case 'set':
        target[lastKey] = effect.value;
        break;
      case 'multiply':
        target[lastKey] = current * effect.value;
        break;
    }
  }

  next.finances.founderEquity = Math.max(0, Math.min(1, next.finances.founderEquity));

  return next;
}

/**
 * Weighted random selection of up to `count` items from an array.
 */
function weightedSelect<T extends { weight: number }>(
  items: T[],
  count: number,
): T[] {
  if (items.length === 0) return [];
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return [];

  const selected: T[] = [];
  const remaining = [...items];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const currentTotal = remaining.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * currentTotal;

    for (let j = 0; j < remaining.length; j++) {
      roll -= remaining[j].weight;
      if (roll <= 0) {
        selected.push(remaining[j]);
        remaining.splice(j, 1);
        break;
      }
    }
  }

  return selected;
}

/**
 * Auto-resolve expired pending decisions (default to first option).
 */
function autoResolveExpired(state: GameState): GameState {
  const currentWeek = state.meta.week;
  const expired = state.pendingDecisions.filter(
    (d) => d.deadline <= currentWeek,
  );

  if (expired.length === 0) return state;

  let next = { ...state };
  const remainingDecisions = state.pendingDecisions.filter(
    (d) => d.deadline > currentWeek,
  );
  const updatedLog = [...state.eventLog];

  for (const decision of expired) {
    const defaultOption = decision.options.find(
      (o) => o.id === decision.defaultOptionId,
    ) ?? decision.options[0];

    if (defaultOption) {
      next = applyEffects(next, defaultOption.effects);

      const optionId = defaultOption.id;

      // Handle hire_* side effects
      if (optionId.startsWith('hire_')) {
        const hireParts = optionId.split('_');
        const hireCount = parseInt(hireParts[1], 10) || 1;
        const hireSalary = parseInt(hireParts[2], 10) || 3500;
        const oldTotal = next.team.teamSize * next.team.avgSalary;
        const newTotal = oldTotal + hireCount * hireSalary;
        const newSize = next.team.teamSize + hireCount;
        next = {
          ...next,
          team: {
            ...next.team,
            teamSize: newSize,
            avgSalary: newSize > 0 ? Math.round(newTotal / newSize) : hireSalary,
          },
        };
      }

      // Handle team-eng_* / team-growth_* side effects
      if (optionId.startsWith('team-eng_') || optionId.startsWith('team-growth_')) {
        const parts = optionId.split('_');
        const count = parseInt(parts[1], 10) || 2;
        const salary = parseInt(parts[2], 10) || 3500;
        const oldTotal = next.team.teamSize * next.team.avgSalary;
        const newTotal = oldTotal + count * salary;
        const newSize = next.team.teamSize + count;
        next = {
          ...next,
          team: {
            ...next.team,
            teamSize: newSize,
            avgSalary: newSize > 0 ? Math.round(newTotal / newSize) : salary,
          },
        };
      }

      // Handle feature_* side effects
      if (optionId.startsWith('feature_')) {
        const parts = optionId.split('_');
        const relevance = parseInt(parts[parts.length - 1], 10);
        const featureSlug = parts.slice(1, -1).join('-');
        const featureName = featureSlug
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        const newFeature: Feature = {
          id: generateId(),
          name: featureName,
          description: `Auto-generated feature: ${featureName}`,
          status: 'in-progress' as const,
          progress: 0,
          quality: 0,
          marketRelevance: isNaN(relevance) ? 70 : relevance,
        };
        next = {
          ...next,
          product: {
            ...next.product,
            features: [...next.product.features, newFeature],
          },
        };
      }

      // Handle strategy_* side effects
      if (optionId.startsWith('strategy_')) {
        const strategy = optionId.replace('strategy_', '');
        next = {
          ...next,
          meta: {
            ...next.meta,
            growthStrategy: strategy,
          },
        };
      }

      // Handle layoff_* side effects
      if (optionId.startsWith('layoff_')) {
        const layoffParts = optionId.split('_');
        const layoffCount = parseInt(layoffParts[1], 10) || 1;
        const actualLayoffs = Math.min(next.team.teamSize, layoffCount);
        next = {
          ...next,
          team: {
            ...next.team,
            teamSize: next.team.teamSize - actualLayoffs,
          },
          company: {
            ...next.company,
            culture: Math.max(0, next.company.culture - 10),
          },
        };
      }

      // Update the event log entry with the resolution
      const logIdx = updatedLog.findIndex(
        (entry) => entry.decisionId === decision.id,
      );
      if (logIdx >= 0) {
        updatedLog[logIdx] = {
          ...updatedLog[logIdx],
          resolvedOptionId: defaultOption.id,
        };
      }
    }
  }

  return {
    ...next,
    pendingDecisions: remainingDecisions,
    eventLog: updatedLog,
  };
}

/**
 * Process events for the current week.
 * - Filter eligible events
 * - Weighted random selection of 1-3 events
 * - Create log entries and pending decisions
 * - Auto-resolve expired decisions
 *
 * Pure function: returns a new GameState.
 */
export function processEvents(state: GameState): GameState {
  // First, auto-resolve any expired decisions
  let next = autoResolveExpired(state);

  // Filter eligible events
  const eligible = ALL_EVENTS.filter((event) => {
    // Min week check
    if (next.meta.week < event.minWeek) return false;

    // Max occurrences check
    if (
      event.maxOccurrences > 0 &&
      eventOccurrenceCount(next.eventLog, event.id) >= event.maxOccurrences
    ) {
      return false;
    }

    // Cooldown check
    if (isOnCooldown(next.eventLog, event.id, next.meta.week, event.cooldownWeeks)) {
      return false;
    }

    // Condition check
    if (!event.condition(next)) return false;

    return true;
  });

  // Select 1-3 events (fewer if pool is small)
  const eventCount = Math.min(
    Math.floor(Math.random() * 3) + 1,
    eligible.length,
  );
  const selectedEvents = weightedSelect(eligible, eventCount);

  // Process each selected event
  const newLogEntries: EventLogEntry[] = [];
  const newDecisions: PendingDecision[] = [];

  for (const event of selectedEvents) {
    // Pick description based on tone
    const description =
      event.descriptions[next.meta.tone] ?? event.descriptions.default;

    // Apply immediate effects
    next = applyEffects(next, event.immediateEffects);

    const logEntry: EventLogEntry = {
      id: generateId(),
      week: next.meta.week,
      eventId: event.id,
      title: event.title,
      description,
      category: event.category,
    };

    // Create pending decision if event has options
    if (event.decisionOptions.length > 0) {
      const decision: PendingDecision = {
        id: generateId(),
        eventId: event.id,
        prompt: description,
        options: event.decisionOptions,
        deadline: next.meta.week + event.decisionDeadlineWeeks,
        defaultOptionId: event.decisionOptions[0].id,
      };
      logEntry.decisionId = decision.id;
      newDecisions.push(decision);
    }

    newLogEntries.push(logEntry);
  }

  return {
    ...next,
    eventLog: [...next.eventLog, ...newLogEntries],
    pendingDecisions: [...next.pendingDecisions, ...newDecisions],
  };
}
