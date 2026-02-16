import type { EmployeeRole, PricingModel, MarketSegment } from './game.ts';

// ─── Player decision payloads ─────────────────────────────────────────

export interface HireDecision {
  type: 'hire';
  candidateId: string;
}

export interface FireDecision {
  type: 'fire';
  employeeId: string;
}

export interface AssignTeamDecision {
  type: 'assign-team';
  assignments: {
    entityId: string;           // employee or agent id
    entityType: 'employee' | 'agent';
    featureId: string | null;   // null = unassign
  }[];
}

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

export interface PostJobDecision {
  type: 'post-job';
  role: EmployeeRole;
}

export type PlayerDecision =
  | HireDecision
  | FireDecision
  | AssignTeamDecision
  | StartFeatureDecision
  | SetPricingDecision
  | RespondToEventDecision
  | HireAIAgentDecision
  | FireAIAgentDecision
  | SeekFundingDecision
  | ChangeSegmentDecision
  | PostJobDecision;
