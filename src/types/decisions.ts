import type { PricingModel, MarketSegment } from './game.ts';

// ─── Player decision payloads ─────────────────────────────────────────

export interface StartFeatureDecision {
  type: 'start-feature';
  name: string;
  description: string;
  marketRelevance: number;
}

export interface SetPricingDecision {
  type: 'set-pricing';
  model: PricingModel;
  pricePerUnit: number;
}

export interface RespondToEventDecision {
  type: 'respond-to-event';
  decisionId: string;
  optionId: string;
}

export interface HireAIAgentDecision {
  type: 'hire-ai-agent';
  name: string;
  agentType: string;
  provider: string;
  capability: number;
  costPerWeek: number;
  reliability: number;
}

export interface FireAIAgentDecision {
  type: 'fire-ai-agent';
  agentId: string;
}

export interface SeekFundingDecision {
  type: 'seek-funding';
  targetStage: string;
}

export interface ChangeSegmentDecision {
  type: 'change-segment';
  newSegment: MarketSegment;
}

export interface HireTeamDecision {
  type: 'hire-team';
  count: number;
  salary: number;
}

export interface FireTeamDecision {
  type: 'fire-team';
  count: number;
}

export interface SetMarketingBudgetDecision {
  type: 'set-marketing-budget';
  amount: number;
}

export interface SetGrowthStrategyDecision {
  type: 'set-growth-strategy';
  strategy: string;
}

export type PlayerDecision =
  | StartFeatureDecision
  | SetPricingDecision
  | RespondToEventDecision
  | HireAIAgentDecision
  | FireAIAgentDecision
  | SeekFundingDecision
  | ChangeSegmentDecision
  | HireTeamDecision
  | FireTeamDecision
  | SetMarketingBudgetDecision
  | SetGrowthStrategyDecision;
