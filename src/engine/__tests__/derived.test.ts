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
import type { GameState, Employee, AIAgent, Feature } from '../../types/index.ts';

function makeTestState(overrides?: Partial<GameState>): GameState {
  const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
  return { ...base, ...overrides };
}

function makeEmployee(overrides?: Partial<Employee>): Employee {
  return {
    id: 'emp-1',
    name: 'Test Employee',
    role: 'engineer',
    skill: 70,
    salary: 3000,
    morale: 80,
    loyalty: 60,
    aiSentiment: 20,
    weekHired: 1,
    assignedTo: null,
    ...overrides,
  };
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
    techDebt: 10,
    marketRelevance: 80,
    assignedEmployees: [],
    assignedAgents: [],
    ...overrides,
  };
}

describe('calculateRunway', () => {
  it('returns finite runway when there are fixed costs and no revenue', () => {
    const state = makeTestState();
    // balanced archetype has no starting employees, so burn = just fixed costs
    // Balanced founder starts with $75k cash and burn is $500 fixed.
    const runway = calculateRunway(state);
    // 75000 / 500 = 150 weeks
    expect(runway).toBe(150);
  });

  it('calculates finite runway when burning cash', () => {
    const emp1 = makeEmployee({ salary: 5000 });
    const emp2 = makeEmployee({ id: 'emp-2', salary: 5000 });
    const state = makeTestState({
      team: {
        employees: [emp1, emp2],
        aiAgents: [],
        hiringPipeline: [],
        avgMorale: 80,
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
      },
    });

    const runway = calculateRunway(state);
    // burn = 5000 + 5000 + 500 + 2*50 = 10600
    // 100000 / 10600 ≈ 9.43
    expect(runway).toBeCloseTo(100_000 / 10_600, 1);
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
      },
    });

    const runway = calculateRunway(state);
    expect(runway).toBe(Infinity);
  });
});

describe('calculateWeeklyBurn', () => {
  it('includes salaries, AI costs, and fixed overhead', () => {
    const emp = makeEmployee({ salary: 4000 });
    const agent = makeAIAgent({ costPerWeek: 800 });
    const state = makeTestState({
      team: {
        employees: [emp],
        aiAgents: [agent],
        hiringPipeline: [],
        avgMorale: 80,
      },
    });

    const burn = calculateWeeklyBurn(state);
    // 4000 (salary) + 800 (AI) + 500 (base) + 50 (per-person) = 5350
    expect(burn).toBe(5350);
  });

  it('returns only fixed costs when team is empty', () => {
    const state = makeTestState({
      team: {
        employees: [],
        aiAgents: [],
        hiringPipeline: [],
        avgMorale: 100,
      },
    });

    const burn = calculateWeeklyBurn(state);
    expect(burn).toBe(500); // just base fixed costs
  });
});

describe('calculateAvgMorale', () => {
  it('returns 100 when there are no employees', () => {
    const state = makeTestState({
      team: {
        employees: [],
        aiAgents: [],
        hiringPipeline: [],
        avgMorale: 100,
      },
    });

    expect(calculateAvgMorale(state)).toBe(100);
  });

  it('averages morale across employees', () => {
    const emp1 = makeEmployee({ morale: 90 });
    const emp2 = makeEmployee({ id: 'emp-2', morale: 60 });
    const emp3 = makeEmployee({ id: 'emp-3', morale: 30 });
    const state = makeTestState({
      team: {
        employees: [emp1, emp2, emp3],
        aiAgents: [],
        hiringPipeline: [],
        avgMorale: 60,
      },
    });

    expect(calculateAvgMorale(state)).toBe(60); // (90+60+30)/3
  });
});

describe('calculateTeamVelocity', () => {
  it('combines human and AI velocity', () => {
    const emp = makeEmployee({ skill: 80, morale: 100 });
    const agent = makeAIAgent({ capability: 90, reliability: 80 });
    const state = makeTestState({
      team: {
        employees: [emp],
        aiAgents: [agent],
        hiringPipeline: [],
        avgMorale: 100,
      },
    });

    const velocity = calculateTeamVelocity(state);
    // Human: 80*100/100 = 80, AI: 90*80/100 = 72
    expect(velocity).toBe(152);
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
    // ARR = 5000*52=260000, multiple=15, bubble mult= 0.3+0.8*2.7=2.46, PMF mult=0.5+0.6*1.5=1.4
    // 260000 * 15 * 2.46 * 1.4 ≈ 13,431,600
    expect(valuation).toBeGreaterThan(10_000_000);
  });
});
