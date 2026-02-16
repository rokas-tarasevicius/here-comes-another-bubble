import type { GameEvent } from '../../types/index.ts';
import { ROUTINE_EVENTS } from './routine.ts';
import { MARKET_EVENTS } from './market.ts';
import { CRISIS_EVENTS } from './crisis.ts';
import { OPPORTUNITY_EVENTS } from './opportunity.ts';
import { AI_SPECIFIC_EVENTS } from './ai-specific.ts';

export const ALL_EVENTS: GameEvent[] = [
  ...ROUTINE_EVENTS,
  ...MARKET_EVENTS,
  ...CRISIS_EVENTS,
  ...OPPORTUNITY_EVENTS,
  ...AI_SPECIFIC_EVENTS,
];
