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
  | 'series-d'
  | 'series-e'
  | 'series-f'
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
  | 'series-d'
  | 'series-e'
  | 'series-f'
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

// ─── Compliance & Pricing Tiers ──────────────────────────────────────

export type CertificationId =
  | 'soc2-type1'
  | 'soc2-type2'
  | 'iso-27001'
  | 'gdpr'
  | 'hipaa'
  | 'fedramp'
  | 'pci-dss'
  | 'ai-safety-audit';

export type CertificationStatus = 'locked' | 'available' | 'in-progress' | 'completed';

export interface CertificationProgress {
  id: CertificationId;
  status: CertificationStatus;
  weeksRemaining: number;
  weeksTotal: number;
  weeklySpend: number;
  totalSpent: number;
  weekStarted: number | null;
  weekCompleted: number | null;
}

export interface ComplianceState {
  certifications: CertificationProgress[];
  totalComplianceCost: number;
}

export type PricingTier = 1 | 2 | 3 | 4 | 5;

// ─── Core interfaces ──────────────────────────────────────────────────

export type ProductFocus =
  | 'new-features'    // Normal: build what sprint planning says
  | 'quality'         // Boost feature quality, slower progress
  | 'bug-fixing'      // Reduce bugs faster, less feature work
  | 'tech-debt'       // Reduce tech debt, less feature work
  | 'user-growth';    // Focus on growth/marketing features

export type AcquisitionChannel =
  | 'organic'          // Free, relies on PMF and word-of-mouth
  | 'content-seo'      // Low cost, compounds over time (+2%/wk up to +20%)
  | 'paid-ads'         // High cost, instant users, diminishing returns
  | 'community'        // Medium cost, reduces churn, stickier users
  | 'sales-outreach'   // Best for enterprise, requires team ≥ 3
  | 'viral-loops';     // No cost, requires quality > 50, exponential but risky

export interface GameMeta {
  week: number;
  year: number;
  month: number;
  day: number;
  difficulty: Difficulty;
  tone: Tone;
  growthStrategy: string;
  productFocus: ProductFocus;
  acquisitionChannel: AcquisitionChannel;
  contentSeoWeeks: number;    // weeks content-seo has been active (for compounding)
  gameOver: boolean;
  gameOverReason?: string;
  gameWon: boolean;
  gameWonReason?: string;
  infiniteMode: boolean;
  score: number;
  regulatoryHeat: number;  // 0-100, accumulates in regulated segments
  lowMoraleWeeks: number;  // consecutive weeks with morale < 40 (for salary pressure)
  fundingSoughtThisWeek?: boolean;
  recentlyFiredNames?: string[];  // track fired names to prevent fire-rehire exploit
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

export type TeamRole = 'engineer' | 'designer' | 'marketer' | 'sales' | 'ops';

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  skill: number;        // 0-100
  salary: number;        // weekly
  morale: number;        // 0-100
  weekHired: number;
  traits: string[];      // e.g., ['fast-learner', '10x-engineer', 'mentor']
  boosts: Record<string, number>; // e.g., { velocity: 10, quality: 5 }
}

export interface Candidate {
  id: string;
  name: string;
  role: TeamRole;
  skill: number;
  expectedSalary: number;
  traits: string[];
  boosts: Record<string, number>;
  availableUntilWeek: number;
}

export interface PendingOffer {
  candidateId: string;
  offeredSalary: number;
  weekOffered: number;
}

export interface TeamState {
  members: TeamMember[];
  candidates: Candidate[];
  pendingOffers: PendingOffer[];
  teamSize: number;       // derived from members.length, kept for backward compat
  avgSalary: number;      // derived from members avg, kept for backward compat
  morale: number;         // 0-100, team-wide average
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
  lastPricingChangeWeek: number;  // week when pricing was last changed (prevent frequent switches)
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
  // Segment-specific customer economics
  typicalCustomerCount: number;   // rough scale — consumer=10K+, enterprise=50-200
  revenuePerCustomer: number;     // $/week per customer at default price
  priceSensitivity: number;       // 0-1, how much customers react to price changes (consumer=high, enterprise=low)
  defaultPricing: PricingModel;   // natural pricing model for this segment
  defaultPrice: number;           // suggested starting price per unit
  customerGrowthRate: number;     // base weekly growth multiplier (consumer grows faster)
  baseChurnRate: number;          // natural churn for this segment
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
  churnRate: number;
  valuation: number;
  teamSize: number;
  avgMorale: number;
  pmfScore: number;
  bubbleIndex: number;
  eventsCount: number;
  complianceCost: number;
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
  compliance: ComplianceState;
  eventLog: EventLogEntry[];
  pendingDecisions: PendingDecision[];
  weekHistory: WeekSummary[];
}
