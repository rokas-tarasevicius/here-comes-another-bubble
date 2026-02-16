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
import { calculateWeeklyBurn } from './derived.ts';
import { generateId } from '../utils/id.ts';

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
      morale: 90,
      loyalty: 75,
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
      morale: 85,
      loyalty: 70,
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

  // BUG 2 fix: Use founder-specific starting cash from FOUNDER_CONFIGS
  const startingCash = founderConfig.startingCash;

  // Build a partial state to calculate initial burn (BUG 1 fix)
  const partialState: GameState = {
    meta: {
      week: startWeek,
      year: 2026,
      month: 1,
      day: 6,
      difficulty,
      tone,
      growthStrategy: 'sustainable',
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
      cash: startingCash,
      weeklyRevenue: 0,
      weeklyBurn: 0,
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
      bubbleIndex: 60,
      bubbleTrend: 2,
      talentMarketHeat: 70,
      investorSentiment: 65,
    },
    eventLog: [],
    pendingDecisions: [],
    weekHistory: [],
  };

  // BUG 1 fix: Calculate initial burn so Overview doesn't show $0/wk
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
