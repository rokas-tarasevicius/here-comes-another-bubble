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
        pricingModel: 'subscription',
        pricePerUnit: 25,
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

  it('returns 0 when customerDemand is empty', () => {
    const state = makeTestState({
      product: {
        name: 'TestCo',
        features: [makeFeature({ quality: 100, marketRelevance: 100 })],
        overallQuality: 100,
        techDebtTotal: 0,
        pmfScore: 0,
        customers: 0,
        churnRate: 0,
        bugs: 0,
      },
      market: {
        segment: 'ai-devtools',
        segmentData: {
          id: 'ai-devtools',
          name: 'AI Developer Tools',
          description: 'Test',
          size: 50000,
          growthRate: 0.2,
          competitionIntensity: 75,
          regulatoryRisk: 15,
          customerDemand: [],
          typicalCustomerCount: 5000,
          revenuePerCustomer: 20,
          priceSensitivity: 0.5,
          defaultPricing: 'subscription' as const,
          defaultPrice: 25,
          customerGrowthRate: 1.08,
          baseChurnRate: 0.04,
        },
        competitors: [],
        bubbleIndex: 60,
        bubbleTrend: 2,
        talentMarketHeat: 70,
        investorSentiment: 65,
      },
    });

    expect(calculatePMF(state)).toBe(0);
  });

  it('ignores non-shipped features (planned, in-progress, deprecated)', () => {
    const state = makeTestState({
      product: {
        name: 'TestCo',
        features: [
          makeFeature({ id: 'f1', status: 'planned', quality: 100, marketRelevance: 100 }),
          makeFeature({ id: 'f2', status: 'in-progress', quality: 100, marketRelevance: 100 }),
          makeFeature({ id: 'f3', status: 'deprecated', quality: 100, marketRelevance: 100 }),
        ],
        overallQuality: 100,
        techDebtTotal: 0,
        pmfScore: 0,
        customers: 0,
        churnRate: 0,
        bugs: 0,
      },
    });

    expect(calculatePMF(state)).toBe(0);
  });

  it('calculates exact PMF for a single perfect feature with full coverage', () => {
    // 1 shipped feature, 1 demand item → coverage = 1.0
    // quality=100, marketRelevance=100 → relevanceQuality = (100*100)/100 = 100
    // PMF = round(100 * 0.7 + 1.0 * 100 * 0.3) = round(70 + 30) = 100
    const state = makeTestState({
      product: {
        name: 'TestCo',
        features: [makeFeature({ quality: 100, marketRelevance: 100 })],
        overallQuality: 100,
        techDebtTotal: 0,
        pmfScore: 0,
        customers: 0,
        churnRate: 0,
        bugs: 0,
      },
      market: {
        segment: 'ai-devtools',
        segmentData: {
          id: 'ai-devtools',
          name: 'AI Developer Tools',
          description: 'Test',
          size: 50000,
          growthRate: 0.2,
          competitionIntensity: 75,
          regulatoryRisk: 15,
          customerDemand: ['code-generation'],
          typicalCustomerCount: 5000,
          revenuePerCustomer: 20,
          priceSensitivity: 0.5,
          defaultPricing: 'subscription' as const,
          defaultPrice: 25,
          customerGrowthRate: 1.08,
          baseChurnRate: 0.04,
        },
        competitors: [],
        bubbleIndex: 60,
        bubbleTrend: 2,
        talentMarketHeat: 70,
        investorSentiment: 65,
      },
    });

    expect(calculatePMF(state)).toBe(100);
  });

  it('calculates PMF with partial coverage (fewer features than demand)', () => {
    // 2 shipped features, 10 demand items → coverage = 2/10 = 0.2
    // Both features: quality=80, marketRelevance=60 → each = (60*80)/100 = 48
    // avgRelevanceQuality = 48
    // PMF = round(48 * 0.7 + 0.2 * 100 * 0.3) = round(33.6 + 6) = 40
    const state = makeTestState({
      product: {
        name: 'TestCo',
        features: [
          makeFeature({ id: 'f1', quality: 80, marketRelevance: 60 }),
          makeFeature({ id: 'f2', quality: 80, marketRelevance: 60 }),
        ],
        overallQuality: 80,
        techDebtTotal: 0,
        pmfScore: 0,
        customers: 0,
        churnRate: 0,
        bugs: 0,
      },
    });
    // default ai-devtools has 10 demand items
    expect(calculatePMF(state)).toBe(40);
  });

  it('caps coverage at 1.0 when features exceed demand items', () => {
    // 3 shipped features, 2 demand items → coverage = min(3/2, 1) = 1.0
    // quality=50, marketRelevance=50 each → relevanceQuality = (50*50)/100 = 25
    // avgRelevanceQuality = 25
    // PMF = round(25 * 0.7 + 1.0 * 100 * 0.3) = round(17.5 + 30) = 48
    const state = makeTestState({
      product: {
        name: 'TestCo',
        features: [
          makeFeature({ id: 'f1', quality: 50, marketRelevance: 50 }),
          makeFeature({ id: 'f2', quality: 50, marketRelevance: 50 }),
          makeFeature({ id: 'f3', quality: 50, marketRelevance: 50 }),
        ],
        overallQuality: 50,
        techDebtTotal: 0,
        pmfScore: 0,
        customers: 0,
        churnRate: 0,
        bugs: 0,
      },
      market: {
        segment: 'ai-devtools',
        segmentData: {
          id: 'ai-devtools',
          name: 'AI Developer Tools',
          description: 'Test',
          size: 50000,
          growthRate: 0.2,
          competitionIntensity: 75,
          regulatoryRisk: 15,
          customerDemand: ['feat-a', 'feat-b'],
          typicalCustomerCount: 5000,
          revenuePerCustomer: 20,
          priceSensitivity: 0.5,
          defaultPricing: 'subscription' as const,
          defaultPrice: 25,
          customerGrowthRate: 1.08,
          baseChurnRate: 0.04,
        },
        competitors: [],
        bubbleIndex: 60,
        bubbleTrend: 2,
        talentMarketHeat: 70,
        investorSentiment: 65,
      },
    });

    expect(calculatePMF(state)).toBe(48);
  });

  it('returns low PMF for low-quality low-relevance features', () => {
    // quality=10, marketRelevance=10 → relevanceQuality = (10*10)/100 = 1
    // 1 feature, 10 demand → coverage = 0.1
    // PMF = round(1 * 0.7 + 0.1 * 100 * 0.3) = round(0.7 + 3) = 4
    const state = makeTestState({
      product: {
        name: 'TestCo',
        features: [makeFeature({ quality: 10, marketRelevance: 10 })],
        overallQuality: 10,
        techDebtTotal: 0,
        pmfScore: 0,
        customers: 0,
        churnRate: 0,
        bugs: 0,
      },
    });

    expect(calculatePMF(state)).toBe(4);
  });

  it('handles mix of shipped and non-shipped features correctly', () => {
    // Only shipped features count. 1 shipped (q=100, mr=100), 2 non-shipped.
    // 1 shipped / 10 demand → coverage = 0.1
    // avgRelevanceQuality = 100
    // PMF = round(100 * 0.7 + 0.1 * 100 * 0.3) = round(70 + 3) = 73
    const state = makeTestState({
      product: {
        name: 'TestCo',
        features: [
          makeFeature({ id: 'f1', status: 'shipped', quality: 100, marketRelevance: 100 }),
          makeFeature({ id: 'f2', status: 'in-progress', quality: 100, marketRelevance: 100 }),
          makeFeature({ id: 'f3', status: 'planned', quality: 100, marketRelevance: 100 }),
        ],
        overallQuality: 100,
        techDebtTotal: 0,
        pmfScore: 0,
        customers: 0,
        churnRate: 0,
        bugs: 0,
      },
    });

    expect(calculatePMF(state)).toBe(73);
  });

  it('handles features with zero quality', () => {
    // quality=0, marketRelevance=80 → relevanceQuality = (80*0)/100 = 0
    // 1 shipped / 10 demand → coverage = 0.1
    // PMF = round(0 * 0.7 + 0.1 * 100 * 0.3) = round(0 + 3) = 3
    const state = makeTestState({
      product: {
        name: 'TestCo',
        features: [makeFeature({ quality: 0, marketRelevance: 80 })],
        overallQuality: 0,
        techDebtTotal: 0,
        pmfScore: 0,
        customers: 0,
        churnRate: 0,
        bugs: 0,
      },
    });

    expect(calculatePMF(state)).toBe(3);
  });

  it('handles features with zero marketRelevance', () => {
    // quality=80, marketRelevance=0 → relevanceQuality = (0*80)/100 = 0
    // 1 shipped / 10 demand → coverage = 0.1
    // PMF = round(0 * 0.7 + 0.1 * 100 * 0.3) = round(0 + 3) = 3
    const state = makeTestState({
      product: {
        name: 'TestCo',
        features: [makeFeature({ quality: 80, marketRelevance: 0 })],
        overallQuality: 80,
        techDebtTotal: 0,
        pmfScore: 0,
        customers: 0,
        churnRate: 0,
        bugs: 0,
      },
    });

    expect(calculatePMF(state)).toBe(3);
  });
});

describe('calculateValuation', () => {
  it('returns at least floor valuation for zero-revenue company', () => {
    const state = makeTestState();
    const valuation = calculateValuation(state);
    // Garage stage base is 100_000, with pricing multiplier for subscription (1.5x)
    // and bubble multiplier, traction valuation > floor
    expect(valuation).toBeGreaterThanOrEqual(100_000);
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
          typicalCustomerCount: 5000,
          revenuePerCustomer: 20,
          priceSensitivity: 0.5,
          defaultPricing: 'subscription' as const,
          defaultPrice: 25,
          customerGrowthRate: 1.08,
          baseChurnRate: 0.04,
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

  it('returns 0 for dead company stage', () => {
    const state = makeTestState({
      company: {
        name: 'TestCo',
        stage: 'dead',
        valuation: 0,
        culture: 60,
        reputation: 50,
        weekFounded: 1,
      },
    });

    const valuation = calculateValuation(state);
    expect(valuation).toBe(0);
  });

  it('higher bubble index produces higher valuation', () => {
    const makeMarketState = (bubbleIndex: number) => makeTestState({
      finances: {
        cash: 100_000,
        weeklyRevenue: 2000,
        weeklyBurn: 1000,
        pricingModel: 'subscription',
        pricePerUnit: 50,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 4000,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
      product: {
        name: 'TestCo',
        features: [makeFeature()],
        overallQuality: 70,
        techDebtTotal: 0,
        pmfScore: 50,
        customers: 50,
        churnRate: 0.05,
        bugs: 0,
      },
      market: {
        segment: 'ai-devtools',
        segmentData: {
          id: 'ai-devtools',
          name: 'AI Developer Tools',
          description: 'Test',
          size: 50000,
          growthRate: 0.2,
          competitionIntensity: 75,
          regulatoryRisk: 15,
          customerDemand: ['code-generation'],
          typicalCustomerCount: 5000,
          revenuePerCustomer: 20,
          priceSensitivity: 0.5,
          defaultPricing: 'subscription' as const,
          defaultPrice: 25,
          customerGrowthRate: 1.08,
          baseChurnRate: 0.04,
        },
        competitors: [],
        bubbleIndex,
        bubbleTrend: 2,
        talentMarketHeat: 70,
        investorSentiment: 65,
      },
    });

    const lowBubble = calculateValuation(makeMarketState(10));
    const highBubble = calculateValuation(makeMarketState(90));
    expect(highBubble).toBeGreaterThan(lowBubble);
  });

  it('higher PMF score increases revenue-based valuation', () => {
    const makeWithPMF = (pmfScore: number) => makeTestState({
      finances: {
        cash: 100_000,
        weeklyRevenue: 10_000,
        weeklyBurn: 5000,
        pricingModel: 'subscription',
        pricePerUnit: 100,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 20_000,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
      product: {
        name: 'TestCo',
        features: [],
        overallQuality: 70,
        techDebtTotal: 0,
        pmfScore,
        customers: 1000,
        churnRate: 0.05,
        bugs: 0,
      },
    });

    const lowPMF = calculateValuation(makeWithPMF(10));
    const highPMF = calculateValuation(makeWithPMF(90));
    expect(highPMF).toBeGreaterThan(lowPMF);
  });

  it('subscription pricing gets higher multiplier than usage-based', () => {
    const makeWithPricing = (pricingModel: 'subscription' | 'usage-based') => makeTestState({
      finances: {
        cash: 100_000,
        weeklyRevenue: 0,
        weeklyBurn: 0,
        pricingModel,
        pricePerUnit: 25,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
      product: {
        name: 'TestCo',
        features: [makeFeature()],
        overallQuality: 70,
        techDebtTotal: 0,
        pmfScore: 50,
        customers: 100,
        churnRate: 0.05,
        bugs: 0,
      },
    });

    const usageVal = calculateValuation(makeWithPricing('usage-based'));
    const subVal = calculateValuation(makeWithPricing('subscription'));
    expect(subVal).toBeGreaterThanOrEqual(usageVal);
  });

  it('larger team increases valuation via team multiplier', () => {
    const makeWithTeam = (members: GameState['team']['members']) => makeTestState({
      team: {
        members,
        candidates: [],
        pendingOffers: [],
        teamSize: members.length,
        avgSalary: 3000,
        morale: 80,
        aiAgents: [],
      },
      product: {
        name: 'TestCo',
        features: [makeFeature()],
        overallQuality: 70,
        techDebtTotal: 0,
        pmfScore: 50,
        customers: 100,
        churnRate: 0.05,
        bugs: 0,
      },
    });

    const smallTeam = calculateValuation(makeWithTeam([]));
    const bigTeam = calculateValuation(makeWithTeam([
      { id: 'm1', name: 'A', role: 'engineer', skill: 50, salary: 3000, morale: 80, weekHired: 1, traits: [], boosts: {} },
      { id: 'm2', name: 'B', role: 'engineer', skill: 50, salary: 3000, morale: 80, weekHired: 1, traits: [], boosts: {} },
      { id: 'm3', name: 'C', role: 'engineer', skill: 50, salary: 3000, morale: 80, weekHired: 1, traits: [], boosts: {} },
      { id: 'm4', name: 'D', role: 'engineer', skill: 50, salary: 3000, morale: 80, weekHired: 1, traits: [], boosts: {} },
      { id: 'm5', name: 'E', role: 'engineer', skill: 50, salary: 3000, morale: 80, weekHired: 1, traits: [], boosts: {} },
    ]));

    expect(bigTeam).toBeGreaterThan(smallTeam);
  });

  it('AI agents count toward team multiplier', () => {
    // Need enough product/customers so valuation is above the stage floor
    const baseOverrides = {
      product: {
        name: 'TestCo',
        features: [
          makeFeature({ id: 'f1' }),
          makeFeature({ id: 'f2' }),
          makeFeature({ id: 'f3' }),
        ],
        overallQuality: 70,
        techDebtTotal: 0,
        pmfScore: 50,
        customers: 1000,
        churnRate: 0.05,
        bugs: 0,
      },
      finances: {
        cash: 100_000,
        weeklyRevenue: 0,
        weeklyBurn: 0,
        pricingModel: 'subscription' as const,
        pricePerUnit: 50,
        fundingHistory: [] as any[],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
    };

    const stateNoAgents = makeTestState({
      ...baseOverrides,
      team: {
        members: [],
        candidates: [],
        pendingOffers: [],
        teamSize: 0,
        avgSalary: 0,
        morale: 80,
        aiAgents: [],
      },
    });
    const stateWithAgents = makeTestState({
      ...baseOverrides,
      team: {
        members: [],
        candidates: [],
        pendingOffers: [],
        teamSize: 0,
        avgSalary: 0,
        morale: 80,
        aiAgents: [
          makeAIAgent({ id: 'a1' }),
          makeAIAgent({ id: 'a2' }),
          makeAIAgent({ id: 'a3' }),
        ],
      },
    });

    const valNoAgents = calculateValuation(stateNoAgents);
    const valWithAgents = calculateValuation(stateWithAgents);
    expect(valWithAgents).toBeGreaterThan(valNoAgents);
  });

  it('more shipped features increase valuation via product multiplier', () => {
    const makeWithFeatures = (features: Feature[]) => makeTestState({
      product: {
        name: 'TestCo',
        features,
        overallQuality: 70,
        techDebtTotal: 0,
        pmfScore: 50,
        customers: 100,
        churnRate: 0.05,
        bugs: 0,
      },
    });

    const noFeatures = calculateValuation(makeWithFeatures([]));
    const manyFeatures = calculateValuation(makeWithFeatures([
      makeFeature({ id: 'f1' }),
      makeFeature({ id: 'f2' }),
      makeFeature({ id: 'f3' }),
      makeFeature({ id: 'f4' }),
    ]));

    expect(manyFeatures).toBeGreaterThan(noFeatures);
  });

  it('more customers increase valuation via customer multiplier', () => {
    const makeWithCustomers = (customers: number) => makeTestState({
      product: {
        name: 'TestCo',
        features: [],
        overallQuality: 70,
        techDebtTotal: 0,
        pmfScore: 50,
        customers,
        churnRate: 0.05,
        bugs: 0,
      },
    });

    const fewCustomers = calculateValuation(makeWithCustomers(1));
    const manyCustomers = calculateValuation(makeWithCustomers(10_000));
    expect(manyCustomers).toBeGreaterThan(fewCustomers);
  });

  it('revenue-based valuation dominates at high ARR', () => {
    // At $500K+ ARR, revenueWeight = 1.0, so traction is ignored
    // revenueValuation = 10000 * 52 * 15 * bubbleMultiplier * pmfMultiplier
    const state = makeTestState({
      finances: {
        cash: 1_000_000,
        weeklyRevenue: 10_000,
        weeklyBurn: 5000,
        pricingModel: 'subscription',
        pricePerUnit: 100,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 20_000,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
      product: {
        name: 'TestCo',
        features: [],
        overallQuality: 50,
        techDebtTotal: 0,
        pmfScore: 50,
        customers: 1000,
        churnRate: 0.05,
        bugs: 0,
      },
    });

    // ARR = 10000 * 52 = 520_000 > 500_000 → revenueWeight = 1.0
    const annualRevenue = 10_000 * 52;
    const revenueWeight = Math.min(1.0, annualRevenue / 500_000);
    expect(revenueWeight).toBe(1.0);

    const valuation = calculateValuation(state);
    // bubbleMultiplier = 0.3 + (60/100)*2.7 = 0.3 + 1.62 = 1.92 (default bubble=60)
    // pmfMultiplier = 0.5 + (50/100)*1.5 = 0.5 + 0.75 = 1.25
    // revenueValuation = 520000 * 15 * 1.92 * 1.25 = 18_720_000
    const expectedBubble = 0.3 + (60 / 100) * 2.7;
    const expectedPmf = 0.5 + (50 / 100) * 1.5;
    const expectedRevVal = annualRevenue * 15 * expectedBubble * expectedPmf;
    expect(valuation).toBe(Math.round(expectedRevVal));
  });

  it('stage base scales with company stage', () => {
    const makeWithStage = (stage: GameState['company']['stage']) => makeTestState({
      company: {
        name: 'TestCo',
        stage,
        valuation: 0,
        culture: 60,
        reputation: 50,
        weekFounded: 1,
      },
    });

    const garageVal = calculateValuation(makeWithStage('garage'));
    const seedVal = calculateValuation(makeWithStage('seed'));
    const seriesAVal = calculateValuation(makeWithStage('series-a'));

    expect(seedVal).toBeGreaterThan(garageVal);
    expect(seriesAVal).toBeGreaterThan(seedVal);
  });

  it('valuation is at least the stage base (floor)', () => {
    // Even with terrible metrics, valuation should not drop below stage base
    const state = makeTestState({
      company: {
        name: 'TestCo',
        stage: 'seed',
        valuation: 0,
        culture: 0,
        reputation: 0,
        weekFounded: 1,
      },
      product: {
        name: 'TestCo',
        features: [],
        overallQuality: 0,
        techDebtTotal: 100,
        pmfScore: 0,
        customers: 0,
        churnRate: 1,
        bugs: 100,
      },
      market: {
        segment: 'ai-devtools',
        segmentData: {
          id: 'ai-devtools',
          name: 'AI Developer Tools',
          description: 'Test',
          size: 50000,
          growthRate: 0.2,
          competitionIntensity: 75,
          regulatoryRisk: 15,
          customerDemand: ['code-generation'],
          typicalCustomerCount: 5000,
          revenuePerCustomer: 20,
          priceSensitivity: 0.5,
          defaultPricing: 'subscription' as const,
          defaultPrice: 25,
          customerGrowthRate: 1.08,
          baseChurnRate: 0.04,
        },
        competitors: [],
        bubbleIndex: 0,  // minimum bubble
        bubbleTrend: -5,
        talentMarketHeat: 0,
        investorSentiment: 0,
      },
    });

    const valuation = calculateValuation(state);
    expect(valuation).toBeGreaterThanOrEqual(3_000_000); // seed stage base
  });

  it('handles unknown pricing model with default multiplier of 1.0', () => {
    const state = makeTestState({
      finances: {
        cash: 100_000,
        weeklyRevenue: 0,
        weeklyBurn: 0,
        pricingModel: 'unknown-model' as any,
        pricePerUnit: 25,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
    });

    // Should not throw, should use default multiplier of 1.0
    const valuation = calculateValuation(state);
    expect(valuation).toBeGreaterThan(0);
  });
});

describe('calculateWeeklyBurn (extended)', () => {
  it('uses members array for salary when members exist', () => {
    const state = makeTestState({
      team: {
        members: [
          { id: 'm1', name: 'A', role: 'engineer', skill: 50, salary: 3000, morale: 80, weekHired: 1, traits: [], boosts: {} },
          { id: 'm2', name: 'B', role: 'designer', skill: 60, salary: 4000, morale: 80, weekHired: 1, traits: [], boosts: {} },
        ],
        candidates: [],
        pendingOffers: [],
        teamSize: 2,
        avgSalary: 3500,
        morale: 80,
        aiAgents: [],
      },
    });

    const burn = calculateWeeklyBurn(state);
    // salaries: 3000 + 4000 = 7000
    // base: 100 (garage)
    // per-person overhead: 2 * 50 = 100
    // total: 7200
    expect(burn).toBe(7200);
  });

  it('falls back to teamSize * avgSalary when members is undefined', () => {
    const state = makeTestState({
      team: {
        members: undefined as any,
        candidates: [],
        pendingOffers: [],
        teamSize: 3,
        avgSalary: 4000,
        morale: 80,
        aiAgents: [],
      },
    });

    const burn = calculateWeeklyBurn(state);
    // salaries: 3 * 4000 = 12000
    // base: 100 (garage)
    // per-person overhead: 3 * 50 = 150
    // total: 12250
    expect(burn).toBe(12250);
  });

  it('sums costs from multiple AI agents', () => {
    const state = makeTestState({
      team: {
        members: [],
        candidates: [],
        pendingOffers: [],
        teamSize: 0,
        avgSalary: 0,
        morale: 80,
        aiAgents: [
          makeAIAgent({ id: 'a1', costPerWeek: 200 }),
          makeAIAgent({ id: 'a2', costPerWeek: 300 }),
          makeAIAgent({ id: 'a3', costPerWeek: 500 }),
        ],
      },
    });

    const burn = calculateWeeklyBurn(state);
    // salaries: 0
    // AI: 200 + 300 + 500 = 1000
    // base: 100 (garage)
    // per-person overhead: 0 * 50 = 0
    // total: 1100
    expect(burn).toBe(1100);
  });

  it('uses higher base cost for non-garage, non-pre-seed stages', () => {
    const state = makeTestState({
      company: {
        name: 'TestCo',
        stage: 'seed',
        valuation: 3_000_000,
        culture: 60,
        reputation: 50,
        weekFounded: 1,
      },
      team: {
        members: [],
        candidates: [],
        pendingOffers: [],
        teamSize: 0,
        avgSalary: 0,
        morale: 80,
        aiAgents: [],
      },
    });

    const burn = calculateWeeklyBurn(state);
    // base: 500 (seed stage)
    // per-person: 0
    // total: 500
    expect(burn).toBe(500);
  });

  it('uses low base cost for pre-seed stage', () => {
    const state = makeTestState({
      company: {
        name: 'TestCo',
        stage: 'pre-seed',
        valuation: 500_000,
        culture: 60,
        reputation: 50,
        weekFounded: 1,
      },
      team: {
        members: [],
        candidates: [],
        pendingOffers: [],
        teamSize: 0,
        avgSalary: 0,
        morale: 80,
        aiAgents: [],
      },
    });

    const burn = calculateWeeklyBurn(state);
    // base: 100 (pre-seed is treated like garage)
    expect(burn).toBe(100);
  });

  it('scales per-person overhead with team size', () => {
    const members = Array.from({ length: 10 }, (_, i) => ({
      id: `m${i}`,
      name: `Member ${i}`,
      role: 'engineer' as const,
      skill: 50,
      salary: 1000,
      morale: 80,
      weekHired: 1,
      traits: [] as string[],
      boosts: {} as Record<string, number>,
    }));

    const state = makeTestState({
      team: {
        members,
        candidates: [],
        pendingOffers: [],
        teamSize: 10,
        avgSalary: 1000,
        morale: 80,
        aiAgents: [],
      },
    });

    const burn = calculateWeeklyBurn(state);
    // salaries: 10 * 1000 = 10000
    // base: 100 (garage)
    // per-person: 10 * 50 = 500
    // total: 10600
    expect(burn).toBe(10600);
  });

  it('does NOT include marketingSpend (handled separately in simulation)', () => {
    const state = makeTestState({
      team: {
        members: [],
        candidates: [],
        pendingOffers: [],
        teamSize: 0,
        avgSalary: 0,
        morale: 80,
        aiAgents: [],
      },
      finances: {
        cash: 100_000,
        weeklyRevenue: 0,
        weeklyBurn: 0,
        pricingModel: 'subscription',
        pricePerUnit: 25,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 5000,
        lastPricingChangeWeek: 0,
      },
    });

    const burn = calculateWeeklyBurn(state);
    // marketingSpend is NOT included in calculateWeeklyBurn
    // only base fixed cost: 100
    expect(burn).toBe(100);
  });
});

describe('calculateAvgMorale (extended)', () => {
  it('returns team.morale when members array is empty', () => {
    const state = makeTestState({
      team: {
        members: [],
        candidates: [],
        pendingOffers: [],
        teamSize: 0,
        avgSalary: 0,
        morale: 75,
        aiAgents: [],
      },
    });

    expect(calculateAvgMorale(state)).toBe(75);
  });

  it('blends individual member morale with team-wide morale', () => {
    // Members avg morale: (90+70)/2 = 80
    // Team morale: 60
    // Blended: round((80+60)/2) = 70
    const state = makeTestState({
      team: {
        members: [
          { id: 'm1', name: 'A', role: 'engineer', skill: 50, salary: 3000, morale: 90, weekHired: 1, traits: [], boosts: {} },
          { id: 'm2', name: 'B', role: 'engineer', skill: 50, salary: 3000, morale: 70, weekHired: 1, traits: [], boosts: {} },
        ],
        candidates: [],
        pendingOffers: [],
        teamSize: 2,
        avgSalary: 3000,
        morale: 60,
        aiAgents: [],
      },
    });

    expect(calculateAvgMorale(state)).toBe(70);
  });

  it('returns team.morale when members is undefined', () => {
    const state = makeTestState({
      team: {
        members: undefined as any,
        candidates: [],
        pendingOffers: [],
        teamSize: 3,
        avgSalary: 3000,
        morale: 55,
        aiAgents: [],
      },
    });

    // undefined is falsy, so the if-condition fails, returns team.morale
    expect(calculateAvgMorale(state)).toBe(55);
  });

  it('handles single member — blends with team morale', () => {
    // Member morale: 100, team morale: 50
    // Blended: round((100+50)/2) = 75
    const state = makeTestState({
      team: {
        members: [
          { id: 'm1', name: 'A', role: 'engineer', skill: 50, salary: 3000, morale: 100, weekHired: 1, traits: [], boosts: {} },
        ],
        candidates: [],
        pendingOffers: [],
        teamSize: 1,
        avgSalary: 3000,
        morale: 50,
        aiAgents: [],
      },
    });

    expect(calculateAvgMorale(state)).toBe(75);
  });

  it('handles all members with identical morale', () => {
    // All members: morale 80, team morale: 80
    // Blended: round((80+80)/2) = 80
    const state = makeTestState({
      team: {
        members: [
          { id: 'm1', name: 'A', role: 'engineer', skill: 50, salary: 3000, morale: 80, weekHired: 1, traits: [], boosts: {} },
          { id: 'm2', name: 'B', role: 'engineer', skill: 50, salary: 3000, morale: 80, weekHired: 1, traits: [], boosts: {} },
          { id: 'm3', name: 'C', role: 'engineer', skill: 50, salary: 3000, morale: 80, weekHired: 1, traits: [], boosts: {} },
        ],
        candidates: [],
        pendingOffers: [],
        teamSize: 3,
        avgSalary: 3000,
        morale: 80,
        aiAgents: [],
      },
    });

    expect(calculateAvgMorale(state)).toBe(80);
  });

  it('rounds the blended result', () => {
    // Members avg morale: (90+70+60)/3 = 73.333...
    // Team morale: 50
    // Blended: round((73.333+50)/2) = round(61.666) = 62
    const state = makeTestState({
      team: {
        members: [
          { id: 'm1', name: 'A', role: 'engineer', skill: 50, salary: 3000, morale: 90, weekHired: 1, traits: [], boosts: {} },
          { id: 'm2', name: 'B', role: 'engineer', skill: 50, salary: 3000, morale: 70, weekHired: 1, traits: [], boosts: {} },
          { id: 'm3', name: 'C', role: 'engineer', skill: 50, salary: 3000, morale: 60, weekHired: 1, traits: [], boosts: {} },
        ],
        candidates: [],
        pendingOffers: [],
        teamSize: 3,
        avgSalary: 3000,
        morale: 50,
        aiAgents: [],
      },
    });

    expect(calculateAvgMorale(state)).toBe(62);
  });

  it('handles zero morale across the board', () => {
    const state = makeTestState({
      team: {
        members: [
          { id: 'm1', name: 'A', role: 'engineer', skill: 50, salary: 3000, morale: 0, weekHired: 1, traits: [], boosts: {} },
        ],
        candidates: [],
        pendingOffers: [],
        teamSize: 1,
        avgSalary: 3000,
        morale: 0,
        aiAgents: [],
      },
    });

    expect(calculateAvgMorale(state)).toBe(0);
  });
});
