import type {
  GameState,
  FounderArchetype,
  MarketSegment,
  Difficulty,
  Tone,
  TeamMember,
  CertificationProgress,
  CertificationId,
} from '../types/index.ts';
import { randomName } from '../data/names.ts';
import { FOUNDER_CONFIGS } from '../data/founders.ts';
import { MARKET_SEGMENTS } from '../data/markets.ts';
import { COMPETITORS_BY_SEGMENT } from '../data/competitors.ts';
import { CERTIFICATION_DEFS, getAvailableCertifications } from '../data/compliance.ts';
import { calculateWeeklyBurn } from './derived.ts';

/**
 * Create a fully-initialized GameState for a new game.
 */
export function createInitialState(
  companyName: string,
  archetype: FounderArchetype,
  segment: MarketSegment,
  difficulty: Difficulty,
  tone: Tone,
): GameState {
  const founderConfig = FOUNDER_CONFIGS[archetype];
  const segmentData = MARKET_SEGMENTS[segment];
  const competitors = COMPETITORS_BY_SEGMENT[segment].map((c) => ({ ...c }));

  const startWeek = 1;

  // Task 2: Difficulty affects starting bubble index
  const startingBubble = difficulty === 'nightmare' ? 45 : 60;

  // Bigtech archetype starts with a team
  const startingMembers: TeamMember[] = [];
  if (archetype === 'bigtech') {
    startingMembers.push(
      {
        id: 'init-1',
        name: randomName(),
        role: 'engineer',
        skill: 65,
        salary: 4500,
        morale: 87,
        weekHired: 0,
        traits: ['startup-veteran'],
        boosts: { velocity: 5 },
      },
      {
        id: 'init-2',
        name: randomName(),
        role: 'engineer',
        skill: 60,
        salary: 4200,
        morale: 87,
        weekHired: 0,
        traits: ['team-player'],
        boosts: { quality: 3 },
      },
    );
  }
  const teamSize = startingMembers.length;
  const avgSalary = teamSize > 0 ? Math.round(startingMembers.reduce((s, m) => s + m.salary, 0) / teamSize) : 3000;
  const morale = archetype === 'bigtech' ? 87 : 100;

  // Use founder-specific starting cash from FOUNDER_CONFIGS
  const startingCash = founderConfig.startingCash;

  // Initialize compliance certifications
  const availableCerts = getAvailableCertifications([]);
  const allCertIds = Object.keys(CERTIFICATION_DEFS) as CertificationId[];
  const initialCertifications: CertificationProgress[] = allCertIds.map((id) => ({
    id,
    status: availableCerts.includes(id) ? 'available' as const : 'locked' as const,
    weeksRemaining: 0,
    weeksTotal: 0,
    weeklySpend: 0,
    totalSpent: 0,
    weekStarted: null,
    weekCompleted: null,
  }));

  // Build a partial state to calculate initial burn
  const partialState: GameState = {
    meta: {
      week: startWeek,
      year: 2026,
      month: 1,
      day: 6,
      difficulty,
      tone,
      growthStrategy: 'sustainable',
      productFocus: 'new-features',
      acquisitionChannel: 'organic',
      contentSeoWeeks: 0,
      gameOver: false,
      gameWon: false,
      infiniteMode: false,
      score: 0,
      regulatoryHeat: 0,
      lowMoraleWeeks: 0,
    },
    founder: {
      name: 'You',
      ...founderConfig.baseProfile,
    },
    company: {
      name: companyName,
      stage: 'garage',
      valuation: 100_000,
      culture: 60,
      reputation: founderConfig.baseProfile.reputation,
      weekFounded: startWeek,
    },
    team: {
      members: startingMembers,
      candidates: [],
      pendingOffers: [],
      teamSize,
      avgSalary,
      morale,
      aiAgents: [],
    },
    product: {
      name: companyName,
      features: [],
      overallQuality: 0,
      techDebtTotal: 0,
      pmfScore: 0,
      customers: 0,
      churnRate: segmentData.baseChurnRate,
      bugs: 0,
    },
    finances: {
      cash: startingCash,
      weeklyRevenue: 0,
      weeklyBurn: 0,
      pricingModel: segmentData.defaultPricing,
      pricePerUnit: segmentData.defaultPrice,
      fundingHistory: [],
      founderEquity: 1.0,
      monthlyExpenses: 0,
      marketingSpend: 0,
      lastPricingChangeWeek: 0,
    },
    market: {
      segment,
      segmentData: { ...segmentData },
      competitors,
      bubbleIndex: startingBubble,
      bubbleTrend: 2,
      talentMarketHeat: 70,
      investorSentiment: 65,
    },
    compliance: {
      certifications: initialCertifications,
      totalComplianceCost: 0,
    },
    eventLog: [],
    pendingDecisions: [],
    weekHistory: [],
  };

  // Calculate initial burn so Overview doesn't show $0/wk
  const initialBurn = calculateWeeklyBurn(partialState);

  return {
    ...partialState,
    finances: {
      ...partialState.finances,
      weeklyBurn: initialBurn,
      monthlyExpenses: initialBurn * 4,
    },
  };
}
