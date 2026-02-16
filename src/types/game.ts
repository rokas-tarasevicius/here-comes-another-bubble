// ─── Enums as union types (erasableSyntaxOnly) ────────────────────────

export type Tone = 'realistic' | 'satirical' | 'mixed';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'nightmare';

export type FounderArchetype =
  | 'technical'   // Strong tech, weak biz
  | 'visionary'   // Strong biz, weak tech
  | 'balanced'    // Middle ground
  | 'bigtech'     // Ex-FAANG, starts with employees
  | 'academic';   // Research-oriented

export type CompanyStage =
  | 'garage'
  | 'pre-seed'
  | 'seed'
  | 'series-a'
  | 'series-b'
  | 'series-c'
  | 'growth'
  | 'public'
  | 'dead';

export type AIAgentType =
  | 'coding'
  | 'design'
  | 'marketing'
  | 'analytics'
  | 'support'
  | 'general';

export type FeatureStatus =
  | 'planned'
  | 'in-progress'
  | 'shipped'
  | 'deprecated';

export type PricingModel =
  | 'free'
  | 'freemium'
  | 'subscription'
  | 'usage-based'
  | 'enterprise'
  | 'one-time';

export type FundingStage =
  | 'bootstrapped'
  | 'pre-seed'
  | 'seed'
  | 'series-a'
  | 'series-b'
  | 'series-c'
  | 'ipo';

export type MarketSegment =
  | 'ai-devtools'
  | 'ai-healthcare'
  | 'ai-fintech'
  | 'ai-education'
  | 'ai-enterprise'
  | 'ai-consumer'
  | 'ai-creative';

export type EventCategory =
  | 'market'
  | 'team'
  | 'product'
  | 'funding'
  | 'competitor'
  | 'regulation'
  | 'culture'
  | 'personal'
  | 'random';

// ─── Core interfaces ──────────────────────────────────────────────────

export interface GameMeta {
  week: number;
  year: number;
  month: number;
  day: number;
  difficulty: Difficulty;
  tone: Tone;
  growthStrategy: string;
  gameOver: boolean;
  gameOverReason?: string;
  gameWon: boolean;
  gameWonReason?: string;
  score: number;
  regulatoryHeat: number;  // 0-100, accumulates in regulated segments
}

export interface FounderProfile {
  name: string;
  archetype: FounderArchetype;
  techSkill: number;   // 0-100
  bizSkill: number;    // 0-100
  network: number;     // 0-100
  reputation: number;  // 0-100
  learning: number;    // 0-100 — how fast skills grow
}

export interface CompanyState {
  name: string;
  stage: CompanyStage;
  valuation: number;
  culture: number;       // 0-100
  reputation: number;    // 0-100
  weekFounded: number;
}

export interface AIAgent {
  id: string;
  name: string;
  type: AIAgentType;
  provider: string;
  capability: number;    // 0-100
  costPerWeek: number;
  reliability: number;   // 0-100
  assignedTo: string | null;  // feature id or null
}

export interface TeamState {
  teamSize: number;
  avgSalary: number;
  morale: number;        // 0-100
  aiAgents: AIAgent[];
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  status: FeatureStatus;
  progress: number;        // 0-100
  quality: number;         // 0-100
  marketRelevance: number; // 0-100
}

export interface ProductState {
  name: string;
  features: Feature[];
  overallQuality: number;    // 0-100
  techDebtTotal: number;     // 0-100
  pmfScore: number;          // 0-100
  customers: number;
  churnRate: number;         // 0-1
  bugs: number;
}

export interface FundingRound {
  stage: FundingStage;
  amount: number;
  valuation: number;
  dilution: number;     // 0-1
  investorName: string;
  weekClosed: number;
}

export interface FinancialState {
  cash: number;
  weeklyRevenue: number;
  weeklyBurn: number;
  pricingModel: PricingModel;
  pricePerUnit: number;
  fundingHistory: FundingRound[];
  founderEquity: number;    // 0-1
  monthlyExpenses: number;
  marketingSpend: number;   // weekly marketing budget, increased by growth-hack strategy
}

export interface MarketSegmentData {
  id: MarketSegment;
  name: string;
  description: string;
  size: number;
  growthRate: number;          // fractional, e.g. 0.15 = 15%
  competitionIntensity: number; // 0-100
  regulatoryRisk: number;      // 0-100
  customerDemand: string[];    // feature names customers want
}

export interface Competitor {
  id: string;
  name: string;
  segment: MarketSegment;
  funding: number;
  teamSize: number;
  productQuality: number;    // 0-100
  marketShare: number;       // 0-1
  strategy: string;
  alive: boolean;
}

export interface MarketState {
  segment: MarketSegment;
  segmentData: MarketSegmentData;
  competitors: Competitor[];
  bubbleIndex: number;        // 0-100, higher = more bubbly
  bubbleTrend: number;        // positive = inflating
  talentMarketHeat: number;   // 0-100
  investorSentiment: number;  // 0-100
}

// ─── Event log & decisions ────────────────────────────────────────────

export interface StateEffect {
  path: string;    // dot-notation path, e.g. "finances.cash"
  operation: 'add' | 'set' | 'multiply';
  value: number;
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  effects: StateEffect[];
  tone?: Tone;  // optional tone tag
}

export interface PendingDecision {
  id: string;
  eventId: string;
  prompt: string;
  options: DecisionOption[];
  deadline: number;    // week number by which to decide
  defaultOptionId: string;
}

export interface EventLogEntry {
  id: string;
  week: number;
  eventId: string;
  title: string;
  description: string;
  category: EventCategory;
  decisionId?: string;
  resolvedOptionId?: string;
}

export interface WeekSummary {
  week: number;
  cash: number;
  revenue: number;
  burn: number;
  customers: number;
  valuation: number;
  teamSize: number;
  avgMorale: number;
  pmfScore: number;
  bubbleIndex: number;
  eventsCount: number;
}

// ─── Top-level game state ─────────────────────────────────────────────

export interface GameState {
  meta: GameMeta;
  founder: FounderProfile;
  company: CompanyState;
  team: TeamState;
  product: ProductState;
  finances: FinancialState;
  market: MarketState;
  eventLog: EventLogEntry[];
  pendingDecisions: PendingDecision[];
  weekHistory: WeekSummary[];
}
