import type {
  GameState,
  FounderArchetype,
  MarketSegment,
  Difficulty,
  Tone,
  Employee,
} from '../types/index.ts';
import { FOUNDER_CONFIGS } from '../data/founders.ts';
import { MARKET_SEGMENTS } from '../data/markets.ts';
import { COMPETITORS_BY_SEGMENT } from '../data/competitors.ts';
import { generateId } from '../utils/id.ts';

/**
 * Starting cash by difficulty.
 */
const STARTING_CASH: Record<Difficulty, number> = {
  easy: 500_000,
  normal: 250_000,
  hard: 150_000,
  nightmare: 75_000,
};

/**
 * Create the starting employees for the bigtech archetype.
 */
function createBigtechStartingEmployees(week: number): Employee[] {
  return [
    {
      id: generateId(),
      name: 'Alex Chen',
      role: 'senior-engineer',
      skill: 78,
      salary: 4_500,
      morale: 75,
      loyalty: 60,
      aiSentiment: 30,
      weekHired: week,
      assignedTo: null,
    },
    {
      id: generateId(),
      name: 'Jordan Lee',
      role: 'senior-engineer',
      skill: 72,
      salary: 4_200,
      morale: 80,
      loyalty: 55,
      aiSentiment: 10,
      weekHired: week,
      assignedTo: null,
    },
  ];
}

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
  const startingEmployees =
    archetype === 'bigtech' ? createBigtechStartingEmployees(startWeek) : [];

  const avgMorale =
    startingEmployees.length > 0
      ? Math.round(
          startingEmployees.reduce((s, e) => s + e.morale, 0) /
            startingEmployees.length,
        )
      : 100;

  return {
    meta: {
      week: startWeek,
      year: 2026,
      month: 1,
      day: 6,  // First Monday of 2026
      difficulty,
      tone,
      gameOver: false,
      score: 0,
    },

    founder: {
      name: 'You',
      ...founderConfig.baseProfile,
    },

    company: {
      name: companyName,
      stage: 'garage',
      valuation: 100_000,
      culture: {
        workLifeBalance: 60,
        innovation: 70,
        collaboration: 65,
        aiFirst: 50,
      },
      reputation: founderConfig.baseProfile.reputation,
      weekFounded: startWeek,
    },

    team: {
      employees: startingEmployees,
      aiAgents: [],
      hiringPipeline: [],
      avgMorale,
    },

    product: {
      name: companyName,
      features: [],
      overallQuality: 0,
      techDebtTotal: 0,
      pmfScore: 0,
      customers: 0,
      churnRate: 0.05,
      bugs: 0,
    },

    finances: {
      cash: STARTING_CASH[difficulty],
      weeklyRevenue: 0,
      weeklyBurn: 0,  // Will be computed on first tick
      pricingModel: 'free',
      pricePerUnit: 0,
      fundingHistory: [],
      founderEquity: 1.0,
      monthlyExpenses: 0,
    },

    market: {
      segment,
      segmentData: { ...segmentData },
      competitors,
      bubbleIndex: 60,     // Mid-bubble
      bubbleTrend: 2,      // Inflating
      talentMarketHeat: 70,
      investorSentiment: 65,
    },

    eventLog: [],
    pendingDecisions: [],
    weekHistory: [],
  };
}
