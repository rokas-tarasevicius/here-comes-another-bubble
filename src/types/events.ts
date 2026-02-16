import type {
  EventCategory,
  Tone,
  DecisionOption,
  StateEffect,
  GameState,
} from './game.ts';

/**
 * A game event definition.
 * Events are templates stored in data files; at runtime the engine
 * evaluates conditions and selects from the pool.
 */
export interface GameEvent {
  id: string;
  title: string;
  category: EventCategory;

  /** Minimum week before this event can fire */
  minWeek: number;

  /** Maximum number of times this event can fire in a game (0 = unlimited) */
  maxOccurrences: number;

  /** Cooldown in weeks before this event can fire again */
  cooldownWeeks: number;

  /** Base selection weight (higher = more likely) */
  weight: number;

  /**
   * Returns true if the event is eligible to fire given the current state.
   * Pure function — must not mutate state.
   */
  condition: (state: GameState) => boolean;

  /** Tone-specific description variants */
  descriptions: Partial<Record<Tone, string>> & { default: string };

  /** Immediate effects applied when the event fires (before any decision) */
  immediateEffects: StateEffect[];

  /**
   * If non-empty, a PendingDecision is created and the player must choose.
   * If empty, the event is informational only.
   */
  decisionOptions: DecisionOption[];

  /** Deadline offset in weeks for the decision (from the event week) */
  decisionDeadlineWeeks: number;
}
