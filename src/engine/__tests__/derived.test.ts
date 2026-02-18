import { describe, it, expect } from 'vitest';
import {
  calculateRunway,
  calculateWeeklyBurn,
  calculateAvgMorale,
  calculateTeamVelocity,
  calculatePMF,
  calculateValuation,
} from '../derived.ts';
import { createInitialState } from '../init.ts';
import type { GameState, AIAgent, Feature } from '../../types/index.ts';

function makeTestState(overrides?: Partial<GameState>): GameState {
  const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
  return { ...base, ...overrides };
}

function makeAIAgent(overrides?: Partial<AIAgent>): AIAgent {
  return {
    id: 'agent-1',
    name: 'Test Agent',
    type: 'coding',
    provider: 'OpenAI',
    capability: 80,
    costPerWeek: 500,
    reliability: 90,
    assignedTo: null,
    ...overrides,
  };
}

function makeFeature(overrides?: Partial<Feature>): Feature {
  return {
    id: 'feat-1',
    name: 'Test Feature',
    description: 'A test feature',
    status: 'shipped',
    progress: 100,
    quality: 75,
    marketRelevance: 80,
    ...overrides,
  };
}

describe('calculateRunway', () => {
  it('returns finite runway when there are fixed costs and no revenue', () => {
    const state = makeTestState();
    // balanced archetype has no starting employees, so burn = just fixed costs
    // Balanced founder starts with $75k cash and garage stage burn is $100 fixed.
    const runway = calculateRunway(state);
    // 75000 / 100 = 750 weeks
    expect(runway).toBe(750);
  });

  it('calculates finite runway when burning cash', () => {
    const state = makeTestState({
      team: {
        members: [
          { id: 'm1', name: 'A', role: 'engineer', skill: 50, salary: 5000, morale: 80, weekHired: 1, traits: [], boosts: {} },
          { id: 'm2', name: 'B', role: 'engineer', skill: 50, salary: 5000, morale: 80, weekHired: 1, traits: [], boosts: {} },
        ], candidates: [], pendingOffers: [], teamSize: 2,
        avgSalary: 5000,
        morale: 80,
        aiAgents: [],
      },
      finances: {
        cash: 100_000,
        weeklyRevenue: 0,
        weeklyBurn: 0,
        pricingModel: 'free',
        pricePerUnit: 0,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
    });

    const runway = calculateRunway(state);
    // burn = 2*5000 + 100 (garage base) + 2*50 = 10200
    // 100000 / 10200 ≈ 9.80
    expect(runway).toBeCloseTo(100_000 / 10_200, 1);
  });

  it('returns Infinity when revenue exceeds burn', () => {
    const state = makeTestState({
      finances: {
        cash: 50_000,
        weeklyRevenue: 10_000,
        weeklyBurn: 0,
        pricingModel: 'subscription',
        pricePerUnit: 100,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
    });

    const runway = calculateRunway(state);
    expect(runway).toBe(Infinity);
  });
});

describe('calculateWeeklyBurn', () => {
  it('includes salaries, AI costs, and fixed overhead', () => {
    const agent = makeAIAgent({ costPerWeek: 800 });
    const state = makeTestState({
      team: {
        members: [
          { id: 'm1', name: 'A', role: 'engineer', skill: 50, salary: 4000, morale: 80, weekHired: 1, traits: [], boosts: {} },
        ], candidates: [], pendingOffers: [], teamSize: 1,
        avgSalary: 4000,
        morale: 80,
        aiAgents: [agent],
      },
    });

    const burn = calculateWeeklyBurn(state);
    // 4000 (salary) + 800 (AI) + 100 (garage base) + 50 (per-person) = 4950
    expect(burn).toBe(4950);
  });

  it('returns only fixed costs when team is empty', () => {
    const state = makeTestState({
      team: {
        members: [], candidates: [], pendingOffers: [], teamSize: 0,
        avgSalary: 0,
        morale: 100,
        aiAgents: [],
      },
    });

    const burn = calculateWeeklyBurn(state);
    expect(burn).toBe(100); // just base fixed costs (garage stage = $100/wk)
  });
});

describe('calculateAvgMorale', () => {
  it('returns team morale directly', () => {
    const state = makeTestState({
      team: {
        members: [], candidates: [], pendingOffers: [], teamSize: 0,
        avgSalary: 0,
        morale: 100,
        aiAgents: [],
      },
    });

    expect(calculateAvgMorale(state)).toBe(100);
  });

  it('returns the morale value from team state', () => {
    const state = makeTestState({
      team: {
        members: [], candidates: [], pendingOffers: [], teamSize: 3,
        avgSalary: 3000,
        morale: 60,
        aiAgents: [],
      },
    });

    expect(calculateAvgMorale(state)).toBe(60);
  });
});

describe('calculateTeamVelocity', () => {
  it('combines human and AI velocity', () => {
    const agent = makeAIAgent({ capability: 90, reliability: 80 });
    const state = makeTestState({
      team: {
        members: [], candidates: [], pendingOffers: [], teamSize: 1,
        avgSalary: 3000,
        morale: 100,
        aiAgents: [agent],
      },
    });

    const velocity = calculateTeamVelocity(state);
    // Human: 1 * (100/100) * 60 = 60, AI: 90*80/100 = 72
    expect(velocity).toBe(132);
  });
});

describe('calculatePMF', () => {
  it('returns 0 when there are no shipped features', () => {
    const state = makeTestState();
    expect(calculatePMF(state)).toBe(0);
  });

  it('increases with relevant high-quality shipped features', () => {
    const feature = makeFeature({ quality: 90, marketRelevance: 90 });
    const state = makeTestState({
      product: {
        name: 'TestCo',
        features: [feature],
        overallQuality: 90,
        techDebtTotal: 5,
        pmfScore: 0,
        customers: 100,
        churnRate: 0.05,
        bugs: 0,
      },
    });

    const pmf = calculatePMF(state);
    expect(pmf).toBeGreaterThan(50);
  });
});

describe('calculateValuation', () => {
  it('returns floor valuation for zero-revenue company', () => {
    const state = makeTestState();
    const valuation = calculateValuation(state);
    expect(valuation).toBe(100_000); // floor
  });

  it('increases with revenue and bubble index', () => {
    const state = makeTestState({
      finances: {
        cash: 250_000,
        weeklyRevenue: 5000,
        weeklyBurn: 3000,
        pricingModel: 'subscription',
        pricePerUnit: 50,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 12_000,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
      product: {
        name: 'TestCo',
        features: [],
        overallQuality: 70,
        techDebtTotal: 10,
        pmfScore: 60,
        customers: 100,
        churnRate: 0.05,
        bugs: 2,
      },
      market: {
        segment: 'ai-devtools',
        segmentData: {
          id: 'ai-devtools',
          name: 'AI Developer Tools',
          description: 'Tools for AI developers',
          size: 50000,
          growthRate: 0.2,
          competitionIntensity: 75,
          regulatoryRisk: 15,
          customerDemand: ['code-generation'],
        },
        competitors: [],
        bubbleIndex: 80,
        bubbleTrend: 2,
        talentMarketHeat: 70,
        investorSentiment: 65,
      },
    });

    const valuation = calculateValuation(state);
    // Garage startup with $5K/wk revenue, 100 customers, bubble 80 - should be worth millions
    expect(valuation).toBeGreaterThan(1_000_000);
    expect(valuation).toBeLessThan(50_000_000);
  });
});
