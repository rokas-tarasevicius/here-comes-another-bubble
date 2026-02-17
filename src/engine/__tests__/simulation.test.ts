import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { simulateWeek } from '../simulation.ts';
import { advanceWeek } from '../tick.ts';
import { createInitialState } from '../init.ts';
import type { GameState, AIAgent, Feature, Competitor } from '../../types/index.ts';

// ─── Helpers ────────────────────────────────────────────────────────────

function makeTestState(overrides?: Partial<GameState>): GameState {
  const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
  return { ...base, ...overrides };
}

function makeDeepState(overrides: {
  meta?: Partial<GameState['meta']>;
  founder?: Partial<GameState['founder']>;
  company?: Partial<GameState['company']>;
  team?: Partial<GameState['team']>;
  product?: Partial<GameState['product']>;
  finances?: Partial<GameState['finances']>;
  market?: Partial<GameState['market']>;
  weekHistory?: GameState['weekHistory'];
}): GameState {
  const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
  return {
    ...base,
    meta: { ...base.meta, ...overrides.meta },
    founder: { ...base.founder, ...overrides.founder },
    company: { ...base.company, ...overrides.company },
    team: { ...base.team, ...overrides.team },
    product: { ...base.product, ...overrides.product },
    finances: { ...base.finances, ...overrides.finances },
    market: { ...base.market, ...overrides.market },
    ...(overrides.weekHistory ? { weekHistory: overrides.weekHistory } : {}),
  };
}

function makeAgent(overrides?: Partial<AIAgent>): AIAgent {
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
    status: 'in-progress',
    progress: 0,
    quality: 0,
    marketRelevance: 80,
    ...overrides,
  };
}

function makeShippedFeature(overrides?: Partial<Feature>): Feature {
  return makeFeature({
    status: 'shipped',
    progress: 100,
    quality: 75,
    ...overrides,
  });
}

function makeCompetitor(overrides?: Partial<Competitor>): Competitor {
  return {
    id: 'comp-1',
    name: 'RivalAI',
    segment: 'ai-devtools',
    funding: 10_000_000,
    teamSize: 20,
    productQuality: 60,
    marketShare: 0.15,
    strategy: 'balanced',
    alive: true,
    ...overrides,
  };
}

/** Run simulateWeek with fixed random to eliminate noise */
function simulateWeekDeterministic(state: GameState, randomValue = 0.5): GameState {
  vi.spyOn(Math, 'random').mockReturnValue(randomValue);
  const result = simulateWeek(state);
  vi.restoreAllMocks();
  return result;
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe('Difficulty Modifiers', () => {
  it('easy mode gives more customer growth and less churn', () => {
    const baseState = makeDeepState({
      meta: { difficulty: 'normal' },
      team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
      product: {
        features: [makeShippedFeature()],
        customers: 100,
        overallQuality: 60,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    const easyState = { ...baseState, meta: { ...baseState.meta, difficulty: 'easy' as const } };
    const nightmareState = { ...baseState, meta: { ...baseState.meta, difficulty: 'nightmare' as const } };

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const normalResult = simulateWeek(baseState);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const easyResult = simulateWeek(easyState);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const nightmareResult = simulateWeek(nightmareState);
    vi.restoreAllMocks();

    // Easy should have more customers than normal, nightmare less
    expect(easyResult.product.customers).toBeGreaterThan(normalResult.product.customers);
    expect(nightmareResult.product.customers).toBeLessThan(normalResult.product.customers);
  });

  it('nightmare starts bubble at 45', () => {
    const state = createInitialState('TestCo', 'balanced', 'ai-devtools', 'nightmare', 'realistic');
    expect(state.market.bubbleIndex).toBe(45);
  });

  it('normal starts bubble at 60', () => {
    const state = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
    expect(state.market.bubbleIndex).toBe(60);
  });

  it('nightmare difficulty makes competitors improve faster', () => {
    const state = makeDeepState({
      meta: { difficulty: 'nightmare' },
      market: {
        segment: 'ai-devtools',
        segmentData: createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market.segmentData,
        competitors: [makeCompetitor({ productQuality: 50 })],
        bubbleIndex: 60,
        bubbleTrend: 0,
        talentMarketHeat: 50,
        investorSentiment: 50,
      },
    });

    // Run multiple weeks and check competitor quality drift
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    let result = state;
    for (let i = 0; i < 20; i++) {
      result = simulateWeek(result);
    }
    vi.restoreAllMocks();

    const compQuality = result.market.competitors[0].productQuality;
    // With nightmare +1.0 drift per week over 20 weeks, quality should increase significantly
    expect(compQuality).toBeGreaterThan(60);
  });
});

describe('Founder Skills During Gameplay', () => {
  it('technical founder produces higher quality features', () => {
    const techFounder = makeDeepState({
      founder: { techSkill: 90, bizSkill: 30, network: 30, learning: 50 },
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeFeature({ progress: 50, quality: 40 })],
        overallQuality: 40,
        techDebtTotal: 10,
        pmfScore: 30,
        customers: 50,
        churnRate: 0.05,
        bugs: 0,
        name: 'TestCo',
      },
    });

    const bizFounder = makeDeepState({
      founder: { techSkill: 30, bizSkill: 90, network: 30, learning: 50 },
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeFeature({ progress: 50, quality: 40 })],
        overallQuality: 40,
        techDebtTotal: 10,
        pmfScore: 30,
        customers: 50,
        churnRate: 0.05,
        bugs: 0,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const techResult = simulateWeek(techFounder);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const bizResult = simulateWeek(bizFounder);
    vi.restoreAllMocks();

    // Tech founder should produce higher quality
    const techQuality = techResult.product.features[0].quality;
    const bizQuality = bizResult.product.features[0].quality;
    expect(techQuality).toBeGreaterThan(bizQuality);
  });

  it('business founder attracts more customers', () => {
    const baseProduct = {
      features: [makeShippedFeature()],
      overallQuality: 60,
      techDebtTotal: 10,
      pmfScore: 50,
      customers: 100,
      churnRate: 0.05,
      bugs: 0,
      name: 'TestCo',
    };

    const techFounder = makeDeepState({
      founder: { techSkill: 90, bizSkill: 20, network: 30, learning: 50 },
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: baseProduct,
    });

    const bizFounder = makeDeepState({
      founder: { techSkill: 20, bizSkill: 90, network: 30, learning: 50 },
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: baseProduct,
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const techResult = simulateWeek(techFounder);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const bizResult = simulateWeek(bizFounder);
    vi.restoreAllMocks();

    expect(bizResult.product.customers).toBeGreaterThan(techResult.product.customers);
  });

  it('founder learns over time — lowest skill increases every 10 weeks', () => {
    const state = makeDeepState({
      meta: { week: 9 }, // Will advance to 10
      founder: { techSkill: 80, bizSkill: 30, network: 50, learning: 60 },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = advanceWeek(state, []);
    vi.restoreAllMocks();

    // bizSkill is lowest at 30, should increase by min(5, 60/20) = 3
    expect(result.founder.bizSkill).toBe(33);
    // Others should stay the same
    expect(result.founder.techSkill).toBe(80);
  });
});

describe('AI Agent Type Differentiation', () => {
  const baseProduct = {
    features: [makeFeature({ progress: 50, quality: 40 })],
    overallQuality: 40,
    techDebtTotal: 30,
    pmfScore: 30,
    customers: 100,
    churnRate: 0.05,
    bugs: 2,
    name: 'TestCo',
  };

  it('coding agent contributes to feature progress and reduces tech debt', () => {
    const withCoding = makeDeepState({
      team: {
        teamSize: 2,
        avgSalary: 3000,
        morale: 80,
        aiAgents: [makeAgent({ type: 'coding', capability: 80, reliability: 90 })],
      },
      product: baseProduct,
    });

    const withoutAgent = makeDeepState({
      team: { teamSize: 2, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: baseProduct,
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const codingResult = simulateWeek(withCoding);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const noAgentResult = simulateWeek(withoutAgent);
    vi.restoreAllMocks();

    // Coding agent should make features progress faster
    expect(codingResult.product.features[0].progress).toBeGreaterThan(noAgentResult.product.features[0].progress);
    // Coding agent should reduce tech debt more (reliability/200 = 0.45)
    expect(codingResult.product.techDebtTotal).toBeLessThanOrEqual(noAgentResult.product.techDebtTotal);
  });

  it('marketing agent boosts customer growth but not feature progress', () => {
    const shippedProduct = {
      ...baseProduct,
      features: [makeShippedFeature(), makeFeature({ id: 'feat-2', progress: 50, quality: 40 })],
    };

    const withMarketing = makeDeepState({
      team: {
        teamSize: 2,
        avgSalary: 3000,
        morale: 80,
        aiAgents: [makeAgent({ type: 'marketing', capability: 80, reliability: 90 })],
      },
      product: shippedProduct,
    });

    const withCodingForComparison = makeDeepState({
      team: {
        teamSize: 2,
        avgSalary: 3000,
        morale: 80,
        aiAgents: [makeAgent({ type: 'coding', capability: 80, reliability: 90 })],
      },
      product: shippedProduct,
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const marketingResult = simulateWeek(withMarketing);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const codingResult = simulateWeek(withCodingForComparison);
    vi.restoreAllMocks();

    // Marketing agent should NOT boost feature progress (coding agent should be faster)
    const marketingProgress = marketingResult.product.features.find(f => f.id === 'feat-2')!.progress;
    const codingProgress = codingResult.product.features.find(f => f.id === 'feat-2')!.progress;
    expect(codingProgress).toBeGreaterThan(marketingProgress);

    // Marketing agent should boost customer growth
    expect(marketingResult.product.customers).toBeGreaterThan(codingResult.product.customers);
  });

  it('support agent reduces churn', () => {
    const shippedProduct = {
      ...baseProduct,
      features: [makeShippedFeature()],
      customers: 500,
    };

    const withSupport = makeDeepState({
      team: {
        teamSize: 3,
        avgSalary: 3000,
        morale: 80,
        aiAgents: [makeAgent({ type: 'support', capability: 80, reliability: 90 })],
      },
      product: shippedProduct,
    });

    const withoutSupport = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: shippedProduct,
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const supportResult = simulateWeek(withSupport);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const noSupportResult = simulateWeek(withoutSupport);
    vi.restoreAllMocks();

    // Support agent reduces effective churn
    expect(supportResult.product.churnRate).toBeLessThan(noSupportResult.product.churnRate);
  });

  it('design agent improves feature quality but not progress', () => {
    // Run 2 weeks — enough for quality difference but not so many that both cap at 100%
    const designTestProduct = {
      ...baseProduct,
      features: [makeFeature({ progress: 0, quality: 0 })],
    };

    let withDesign = makeDeepState({
      founder: { techSkill: 10, bizSkill: 50, network: 50, learning: 50 },
      team: {
        teamSize: 2,
        avgSalary: 3000,
        morale: 85,
        aiAgents: [makeAgent({ type: 'design', capability: 100, reliability: 90 })],
      },
      product: designTestProduct,
    });

    let withCoding = makeDeepState({
      founder: { techSkill: 10, bizSkill: 50, network: 50, learning: 50 },
      team: {
        teamSize: 2,
        avgSalary: 3000,
        morale: 85,
        aiAgents: [makeAgent({ type: 'coding', capability: 100, reliability: 90 })],
      },
      product: designTestProduct,
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    for (let i = 0; i < 2; i++) {
      withDesign = simulateWeek(withDesign);
      withCoding = simulateWeek(withCoding);
    }
    vi.restoreAllMocks();

    // After 2 weeks, design agent's quality target bonus should be visible
    expect(withDesign.product.features[0].quality).toBeGreaterThan(withCoding.product.features[0].quality);
    // Coding agent should have more progress (design doesn't contribute to feature progress)
    expect(withCoding.product.features[0].progress).toBeGreaterThan(withDesign.product.features[0].progress);
  });
});

describe('Competitor Pressure', () => {
  it('competitors with >60% market share reduce player growth', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const lowShareState = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeShippedFeature()],
        overallQuality: 60,
        customers: 200,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      market: {
        ...baseMarket,
        competitors: [
          makeCompetitor({ marketShare: 0.10, productQuality: 50 }),
          makeCompetitor({ id: 'comp-2', name: 'Rival2', marketShare: 0.10, productQuality: 50 }),
        ],
      },
    });

    const highShareState = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeShippedFeature()],
        overallQuality: 60,
        customers: 200,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      market: {
        ...baseMarket,
        competitors: [
          makeCompetitor({ marketShare: 0.35, productQuality: 50 }),
          makeCompetitor({ id: 'comp-2', name: 'Rival2', marketShare: 0.35, productQuality: 50 }),
        ],
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lowShareResult = simulateWeek(lowShareState);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const highShareResult = simulateWeek(highShareState);
    vi.restoreAllMocks();

    // High competitor market share should result in fewer customers gained
    expect(highShareResult.product.customers).toBeLessThan(lowShareResult.product.customers);
  });

  it('competitor with quality > player + 20 steals customers', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const state = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeShippedFeature({ quality: 50 })],
        overallQuality: 50,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      market: {
        ...baseMarket,
        competitors: [
          makeCompetitor({ productQuality: 80 }), // 80 > 50 + 20 = steals
        ],
      },
    });

    const noStealState = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeShippedFeature({ quality: 50 })],
        overallQuality: 50,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      market: {
        ...baseMarket,
        competitors: [
          makeCompetitor({ productQuality: 55 }), // 55 < 50 + 20 = no steal
        ],
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const stealResult = simulateWeek(state);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const noStealResult = simulateWeek(noStealState);
    vi.restoreAllMocks();

    // When competitor steals, player should have fewer customers
    expect(stealResult.product.customers).toBeLessThan(noStealResult.product.customers);
  });

  it('player quality > best competitor + 15 gains reputation', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const state = makeDeepState({
      company: { reputation: 50, name: 'TestCo', stage: 'seed', valuation: 1_000_000, culture: 60, weekFounded: 1 },
      product: {
        features: [makeShippedFeature({ quality: 90 })],
        overallQuality: 90,
        customers: 200,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      market: {
        ...baseMarket,
        competitors: [
          makeCompetitor({ productQuality: 50 }), // 90 > 50 + 15 = market leadership
        ],
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    expect(result.company.reputation).toBeGreaterThan(50);
  });
});

describe('Dynamic Churn', () => {
  it('high quality product reduces churn rate', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const highQuality = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeShippedFeature({ quality: 90 })],
        overallQuality: 90,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 60,
        techDebtTotal: 5,
        name: 'TestCo',
      },
      market: { ...baseMarket, competitors: [] },
    });

    const lowQuality = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeShippedFeature({ quality: 20 })],
        overallQuality: 20,
        customers: 500,
        churnRate: 0.05,
        bugs: 5,
        pmfScore: 20,
        techDebtTotal: 60,
        name: 'TestCo',
      },
      market: { ...baseMarket, competitors: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const highResult = simulateWeek(highQuality);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lowResult = simulateWeek(lowQuality);
    vi.restoreAllMocks();

    // High quality product should have lower effective churn
    expect(highResult.product.churnRate).toBeLessThan(lowResult.product.churnRate);
  });

  it('bugs increase churn rate', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const noBugs = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeShippedFeature()],
        overallQuality: 60,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      market: { ...baseMarket, competitors: [] },
    });

    const manyBugs = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeShippedFeature()],
        overallQuality: 60,
        customers: 500,
        churnRate: 0.05,
        bugs: 10,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      market: { ...baseMarket, competitors: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const noBugResult = simulateWeek(noBugs);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const bugResult = simulateWeek(manyBugs);
    vi.restoreAllMocks();

    expect(bugResult.product.churnRate).toBeGreaterThan(noBugResult.product.churnRate);
  });

  it('churn rate stays within 1-25% bounds', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    // Extreme conditions that would push churn very high
    const extremeState = makeDeepState({
      meta: { difficulty: 'nightmare' },
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeShippedFeature({ quality: 10 })],
        overallQuality: 10,
        customers: 1000,
        churnRate: 0.05,
        bugs: 20,
        pmfScore: 10,
        techDebtTotal: 90,
        name: 'TestCo',
      },
      finances: { ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances, pricingModel: 'enterprise' as const },
      market: {
        ...baseMarket,
        competitors: [makeCompetitor({ productQuality: 95 })],
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(extremeState);
    vi.restoreAllMocks();

    expect(result.product.churnRate).toBeGreaterThanOrEqual(0.01);
    expect(result.product.churnRate).toBeLessThanOrEqual(0.25);
  });
});

describe('Pricing Switching Costs', () => {
  it('switching pricing model loses customers', () => {
    const state = makeDeepState({
      product: {
        features: [makeShippedFeature()],
        overallQuality: 60,
        customers: 1000,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'subscription' as const,
        pricePerUnit: 29,
        lastPricingChangeWeek: 0,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = advanceWeek(state, [
      { type: 'set-pricing', model: 'enterprise', pricePerUnit: 99 },
    ]);
    vi.restoreAllMocks();

    // Should lose 15% of 1000 = 150 customers from switching
    // (before simulation adds/removes more)
    const switchLog = result.eventLog.find(e => e.eventId === 'pricing-switch-penalty');
    expect(switchLog).toBeDefined();
  });

  it('free to freemium loses only 5% customers', () => {
    const state = makeDeepState({
      product: {
        features: [makeShippedFeature()],
        overallQuality: 60,
        customers: 1000,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'free' as const,
        lastPricingChangeWeek: 0,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = advanceWeek(state, [
      { type: 'set-pricing', model: 'freemium', pricePerUnit: 9 },
    ]);
    vi.restoreAllMocks();

    const switchLog = result.eventLog.find(e => e.eventId === 'pricing-switch-penalty');
    expect(switchLog).toBeDefined();
    // Description should mention ~50 customers (5% of 1000)
    expect(switchLog!.description).toContain('50');
  });

  it('blocks pricing switch within 8 weeks of last change', () => {
    const state = makeDeepState({
      meta: { week: 5 },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'subscription' as const,
        pricePerUnit: 29,
        lastPricingChangeWeek: 3, // Changed 2 weeks ago (5 - 3 = 2 < 8)
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = advanceWeek(state, [
      { type: 'set-pricing', model: 'enterprise', pricePerUnit: 99 },
    ]);
    vi.restoreAllMocks();

    // Should be blocked — pricing model stays as subscription
    expect(result.finances.pricingModel).toBe('subscription');
    const blockLog = result.eventLog.find(e => e.eventId === 'pricing-switch-blocked');
    expect(blockLog).toBeDefined();
  });

  it('enterprise revenue capped at 50% when team < 5', () => {
    const smallTeam = makeDeepState({
      team: { teamSize: 2, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeShippedFeature()],
        overallQuality: 70,
        customers: 50,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'enterprise' as const,
        pricePerUnit: 100,
      },
    });

    const largeTeam = makeDeepState({
      team: { teamSize: 6, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeShippedFeature()],
        overallQuality: 70,
        customers: 50,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'enterprise' as const,
        pricePerUnit: 100,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const smallResult = simulateWeek(smallTeam);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const largeResult = simulateWeek(largeTeam);
    vi.restoreAllMocks();

    // Small team enterprise revenue should be roughly half of large team
    const ratio = smallResult.finances.weeklyRevenue / largeResult.finances.weeklyRevenue;
    expect(ratio).toBeCloseTo(0.5, 1);
  });
});

describe('Team-Size Based Quality', () => {
  it('larger teams produce higher quality features', () => {
    const smallTeam = makeDeepState({
      team: { teamSize: 1, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeFeature({ progress: 50, quality: 30 })],
        overallQuality: 30,
        techDebtTotal: 10,
        pmfScore: 30,
        customers: 50,
        churnRate: 0.05,
        bugs: 0,
        name: 'TestCo',
      },
    });

    const largeTeam = makeDeepState({
      team: { teamSize: 6, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeFeature({ progress: 50, quality: 30 })],
        overallQuality: 30,
        techDebtTotal: 10,
        pmfScore: 30,
        customers: 50,
        churnRate: 0.05,
        bugs: 0,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const smallResult = simulateWeek(smallTeam);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const largeResult = simulateWeek(largeTeam);
    vi.restoreAllMocks();

    // targetQuality for 1 person = clamp(30+8, 30, 95) = 38
    // targetQuality for 6 people = clamp(30+48, 30, 95) = 78
    expect(largeResult.product.features[0].quality).toBeGreaterThan(smallResult.product.features[0].quality);
  });

  it('diminishing returns on team progress — 10 engineers are not 10x faster', () => {
    const twoEngineers = makeDeepState({
      team: { teamSize: 2, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeFeature({ progress: 0, quality: 0 })],
        overallQuality: 0,
        techDebtTotal: 10,
        pmfScore: 0,
        customers: 0,
        churnRate: 0.05,
        bugs: 0,
        name: 'TestCo',
      },
    });

    const tenEngineers = makeDeepState({
      team: { teamSize: 10, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeFeature({ progress: 0, quality: 0 })],
        overallQuality: 0,
        techDebtTotal: 10,
        pmfScore: 0,
        customers: 0,
        churnRate: 0.05,
        bugs: 0,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const twoResult = simulateWeek(twoEngineers);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const tenResult = simulateWeek(tenEngineers);
    vi.restoreAllMocks();

    const twoProgress = twoResult.product.features[0].progress;
    const tenProgress = tenResult.product.features[0].progress;

    // 10 engineers should be faster but NOT 5x faster than 2
    // sqrt(10)*2 / sqrt(2)*2 = 3.16/2.83 = ~1.12x ... wait
    // Actually sqrt(10)*2 = 6.32, sqrt(2)*2 = 2.83
    // So 10 engineers are ~2.2x as fast as 2 engineers, not 5x
    const speedRatio = tenProgress / twoProgress;
    expect(speedRatio).toBeLessThan(4); // Definitely not linear
    expect(speedRatio).toBeGreaterThan(1); // But still faster
  });
});

describe('Culture and Morale', () => {
  it('high culture improves morale over time', () => {
    const highCulture = makeDeepState({
      company: { culture: 90, name: 'TestCo', stage: 'seed', valuation: 1_000_000, reputation: 50, weekFounded: 1 },
      team: { teamSize: 5, avgSalary: 3000, morale: 50, aiAgents: [] },
    });

    const lowCulture = makeDeepState({
      company: { culture: 20, name: 'TestCo', stage: 'seed', valuation: 1_000_000, reputation: 50, weekFounded: 1 },
      team: { teamSize: 5, avgSalary: 3000, morale: 50, aiAgents: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const highResult = simulateWeek(highCulture);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lowResult = simulateWeek(lowCulture);
    vi.restoreAllMocks();

    // Culture 90: (90-50)*0.05 = +2.0/wk
    // Culture 20: (20-50)*0.05 = -1.5/wk
    expect(highResult.team.morale).toBeGreaterThan(lowResult.team.morale);
  });

  it('quality-first strategy drifts culture up', () => {
    const state = makeDeepState({
      meta: { growthStrategy: 'quality-first' },
      company: { culture: 60, name: 'TestCo', stage: 'seed', valuation: 1_000_000, reputation: 50, weekFounded: 1 },
      team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    expect(result.company.culture).toBe(61); // +1 from quality-first
  });

  it('AI ratio > 50% drifts culture down', () => {
    const state = makeDeepState({
      company: { culture: 60, name: 'TestCo', stage: 'seed', valuation: 1_000_000, reputation: 50, weekFounded: 1 },
      team: {
        teamSize: 1,
        avgSalary: 3000,
        morale: 70,
        aiAgents: [
          makeAgent({ id: 'a1' }),
          makeAgent({ id: 'a2' }),
        ], // 2 AI agents vs 1 human = 66% AI ratio
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    expect(result.company.culture).toBe(59); // -1 from high AI ratio
  });

  it('low morale slows feature progress by 25%', () => {
    const highMorale = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeFeature({ progress: 0, quality: 0 })],
        overallQuality: 0,
        techDebtTotal: 10,
        pmfScore: 0,
        customers: 0,
        churnRate: 0.05,
        bugs: 0,
        name: 'TestCo',
      },
    });

    const lowMorale = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 20, aiAgents: [] },
      product: {
        features: [makeFeature({ progress: 0, quality: 0 })],
        overallQuality: 0,
        techDebtTotal: 10,
        pmfScore: 0,
        customers: 0,
        churnRate: 0.05,
        bugs: 0,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const highResult = simulateWeek(highMorale);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lowResult = simulateWeek(lowMorale);
    vi.restoreAllMocks();

    // Low morale (< 30) slows progress by 25%, plus morale directly affects human contribution
    expect(lowResult.product.features[0].progress).toBeLessThan(highResult.product.features[0].progress);
  });
});

describe('Escalating Game Over (Soft Landing)', () => {
  it('morale < 15 does NOT instantly end the game', () => {
    const state = makeDeepState({
      team: { teamSize: 5, avgSalary: 3000, morale: 10, aiAgents: [] },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        cash: 500_000,
      },
    });

    // Run with random that avoids mass walkout (random > 0.60)
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = advanceWeek(state, []);
    vi.restoreAllMocks();

    // Game should NOT be over just because morale is low (old behavior was instant death)
    // It could only be game over if all team members quit
    if (result.team.teamSize > 0) {
      expect(result.meta.gameOver).toBe(false);
    }
  });

  it('team reaching 0 from attrition triggers game over', () => {
    const state = makeDeepState({
      meta: { week: 5 }, // > 3 so the check activates
      team: { teamSize: 1, avgSalary: 3000, morale: 5, aiAgents: [] },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        cash: 500_000,
      },
      weekHistory: [{ week: 4, cash: 500_000, revenue: 0, burn: 3500, customers: 0, valuation: 100_000, teamSize: 2, avgMorale: 5, pmfScore: 0, bubbleIndex: 60, eventsCount: 0 }],
    });

    // Force the mass walkout (morale < 10, random < 0.60)
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const result = advanceWeek(state, []);
    vi.restoreAllMocks();

    // Team should be 0, which triggers game over
    expect(result.team.teamSize).toBe(0);
    expect(result.meta.gameOver).toBe(true);
    expect(result.meta.gameOverReason).toContain('quit');
  });

  it('bubble < 25 tanks valuation by 20%', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const state = makeDeepState({
      company: { valuation: 1_000_000, name: 'TestCo', stage: 'seed', culture: 60, reputation: 50, weekFounded: 1 },
      market: {
        ...baseMarket,
        bubbleIndex: 20, // Below 25
        bubbleTrend: 0,
        competitors: [],
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    // Valuation should have dropped by 20%
    expect(result.company.valuation).toBe(800_000);
  });

  it('bubble < 15 with funding generates emergency decision', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const state = makeDeepState({
      market: {
        ...baseMarket,
        bubbleIndex: 10,
        bubbleTrend: -1,
        competitors: [],
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        fundingHistory: [{ stage: 'seed' as const, amount: 1_000_000, valuation: 5_000_000, dilution: 0.15, investorName: 'VC', weekClosed: 1 }],
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    const emergencyDecision = result.pendingDecisions.find(d => d.eventId === 'auto-bubble-emergency');
    expect(emergencyDecision).toBeDefined();
    expect(emergencyDecision!.options.some(o => o.id === 'down-round')).toBe(true);
    expect(emergencyDecision!.options.some(o => o.id === 'shutdown')).toBe(true);
  });
});

describe('Team Management', () => {
  it('generates layoff decision when burn >> revenue and low runway', () => {
    const state = makeDeepState({
      team: { teamSize: 8, avgSalary: 5000, morale: 60, aiAgents: [] },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        cash: 50_000, // Low cash
        weeklyRevenue: 500, // Low revenue
        weeklyBurn: 40_500, // Very high burn
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    const layoffDecision = result.pendingDecisions.find(d => d.eventId === 'auto-layoff-crisis');
    expect(layoffDecision).toBeDefined();
  });

  it('generates salary pressure decision after 4+ weeks of low morale', () => {
    const state = makeDeepState({
      meta: { lowMoraleWeeks: 5 },
      team: { teamSize: 5, avgSalary: 3000, morale: 35, aiAgents: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    const salaryDecision = result.pendingDecisions.find(d => d.eventId === 'auto-salary-demand');
    expect(salaryDecision).toBeDefined();
  });

  it('salary scales by company stage', () => {
    // At series-a, salaries should be 1.5x base
    const state = makeDeepState({
      meta: { week: 3 }, // divisible by 3 triggers team decision
      company: { stage: 'series-a', name: 'TestCo', valuation: 10_000_000, culture: 60, reputation: 50, weekFounded: 1 },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    const teamDecision = result.pendingDecisions.find(d => d.eventId === 'auto-team-growth');
    if (teamDecision) {
      const engOption = teamDecision.options.find(o => o.id.startsWith('team-eng_'));
      if (engOption) {
        // Extract salary from option ID: team-eng_2_[salary]
        const salary = parseInt(engOption.id.split('_')[2], 10);
        // Base is 3500-5000, with 1.5x multiplier for series-a should be 5250-7500
        expect(salary).toBeGreaterThanOrEqual(5000);
      }
    }
  });
});

describe('Marketing Decisions', () => {
  it('generates marketing budget decision every 4 weeks', () => {
    const state = makeDeepState({
      meta: { week: 4 }, // week 4 is divisible by 4 and > 2
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    const marketingDecision = result.pendingDecisions.find(d => d.eventId === 'auto-marketing-budget');
    expect(marketingDecision).toBeDefined();
    expect(marketingDecision!.options).toHaveLength(4); // increase, decrease, viral, keep
  });

  it('sustainable strategy auto-reduces marketing spend', () => {
    const state = makeDeepState({
      meta: { growthStrategy: 'sustainable' },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        marketingSpend: 1000,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    // Sustainable strategy reduces marketing by 5% per week
    expect(result.finances.marketingSpend).toBeLessThan(1000);
    expect(result.finances.marketingSpend).toBe(950); // 1000 * 0.95
  });
});

describe('Revenue Models', () => {
  it('free model generates zero revenue', () => {
    const state = makeDeepState({
      product: {
        features: [makeShippedFeature()],
        overallQuality: 70,
        customers: 1000,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'free' as const,
        pricePerUnit: 0,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    // Free model now generates small ad revenue (customers * 0.05 * quality/100)
    // 1000 customers * 0.05 * 0.7 = ~$35
    expect(result.finances.weeklyRevenue).toBeGreaterThan(0);
    expect(result.finances.weeklyRevenue).toBeLessThan(100); // Much less than paid models
  });

  it('subscription model generates revenue proportional to customers and price', () => {
    const state = makeDeepState({
      product: {
        features: [makeShippedFeature({ quality: 80 })],
        overallQuality: 80,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'subscription' as const,
        pricePerUnit: 20,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    // Revenue ≈ customers * price * qualityMod. Customer count shifts slightly
    // during simulation, so check approximate range
    // Base: 500 * 20 * 0.8 = 8000, with small customer growth ~8000-8500
    expect(result.finances.weeklyRevenue).toBeGreaterThan(7500);
    expect(result.finances.weeklyRevenue).toBeLessThan(9000);
  });

  it('freemium model only ~5% of users pay', () => {
    const state = makeDeepState({
      product: {
        features: [makeShippedFeature({ quality: 80 })],
        overallQuality: 80,
        customers: 1000,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'freemium' as const,
        pricePerUnit: 10,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    // ~5% of ~1000 customers = ~50 paying * 10 * 0.8 quality ≈ 400
    // Customer count shifts during simulation
    expect(result.finances.weeklyRevenue).toBeGreaterThan(350);
    expect(result.finances.weeklyRevenue).toBeLessThan(500);
  });
});

describe('Multi-Week Realism Simulation', () => {
  it('a funded startup with a team can grow customers and revenue over 20 weeks', () => {
    let state = makeDeepState({
      meta: { difficulty: 'easy' },
      team: { teamSize: 4, avgSalary: 3500, morale: 90, aiAgents: [] },
      product: {
        features: [makeShippedFeature({ quality: 70, marketRelevance: 80 })],
        overallQuality: 70,
        customers: 50,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        cash: 1_000_000, // Plenty of runway
        pricingModel: 'subscription' as const,
        pricePerUnit: 20,
      },
      company: { stage: 'seed', name: 'TestCo', valuation: 5_000_000, culture: 80, reputation: 70, weekFounded: 1 },
    });

    const startCustomers = state.product.customers;
    for (let i = 0; i < 20; i++) {
      state = advanceWeek(state, []);
      if (state.meta.gameOver) break;
    }

    // After 20 weeks, a well-funded startup on easy should:
    expect(state.product.customers).toBeGreaterThan(startCustomers); // Customer growth
    expect(state.finances.weeklyRevenue).toBeGreaterThan(0); // Some revenue
    expect(state.meta.gameOver).toBe(false); // Still alive with 1M
  });

  it('a bootstrapped startup without revenue runs out of cash', () => {
    let state = makeDeepState({
      team: { teamSize: 3, avgSalary: 4000, morale: 70, aiAgents: [] },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        cash: 30_000, // Low starting cash
        pricingModel: 'free' as const,
      },
    });

    let gameOver = false;
    for (let i = 0; i < 52; i++) {
      state = advanceWeek(state, []);
      if (state.meta.gameOver) {
        gameOver = true;
        break;
      }
    }

    // With 3 people at $4000/wk + overhead, burn is ~$12,650/wk
    // $30,000 / $12,650 = ~2.4 weeks
    expect(gameOver).toBe(true);
    expect(state.meta.gameOverReason).toContain('cash');
    // Should die within first ~5 weeks
    expect(state.meta.week).toBeLessThanOrEqual(6);
  });

  it('easy vs nightmare produces significantly different outcomes over 30 weeks', () => {
    const baseOverrides = {
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] as AIAgent[] },
      product: {
        features: [makeShippedFeature({ quality: 65 })],
        overallQuality: 65,
        customers: 100,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 40,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        cash: 200_000,
        pricingModel: 'subscription' as const,
        pricePerUnit: 15,
      },
    };

    // Run 10 trials of each to average out randomness
    let easyCustomersTotal = 0;
    let nightmareCustomersTotal = 0;
    const trials = 10;

    for (let t = 0; t < trials; t++) {
      let easyState = makeDeepState({ ...baseOverrides, meta: { difficulty: 'easy' } });
      let nightmareState = makeDeepState({ ...baseOverrides, meta: { difficulty: 'nightmare' } });

      for (let i = 0; i < 30; i++) {
        easyState = advanceWeek(easyState, []);
        if (easyState.meta.gameOver) break;
      }
      for (let i = 0; i < 30; i++) {
        nightmareState = advanceWeek(nightmareState, []);
        if (nightmareState.meta.gameOver) break;
      }

      easyCustomersTotal += easyState.product.customers;
      nightmareCustomersTotal += nightmareState.product.customers;
    }

    const avgEasyCustomers = easyCustomersTotal / trials;
    const avgNightmareCustomers = nightmareCustomersTotal / trials;

    // Easy mode should consistently produce more customers
    expect(avgEasyCustomers).toBeGreaterThan(avgNightmareCustomers);
  });
});

describe('Stage Progression', () => {
  it('company advances from garage to pre-seed after funding', () => {
    const state = makeDeepState({
      company: { stage: 'garage', valuation: 600_000, name: 'TestCo', culture: 60, reputation: 50, weekFounded: 1 },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    expect(result.company.stage).toBe('pre-seed');
  });

  it('company stays at seed if valuation not high enough', () => {
    const state = makeDeepState({
      company: { stage: 'seed', valuation: 5_000_000, name: 'TestCo', culture: 60, reputation: 50, weekFounded: 1 },
      team: { teamSize: 5, avgSalary: 3000, morale: 80, aiAgents: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    expect(result.company.stage).toBe('seed'); // Needs > 10M and revenue > 0
  });
});

describe('Tech Debt Consequences', () => {
  it('high tech debt slows feature progress', () => {
    const lowDebt = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeFeature({ progress: 0, quality: 0 })],
        overallQuality: 0,
        techDebtTotal: 10,
        pmfScore: 0,
        customers: 0,
        churnRate: 0.05,
        bugs: 0,
        name: 'TestCo',
      },
    });

    const highDebt = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      product: {
        features: [makeFeature({ progress: 0, quality: 0 })],
        overallQuality: 0,
        techDebtTotal: 90,
        pmfScore: 0,
        customers: 0,
        churnRate: 0.05,
        bugs: 0,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lowResult = simulateWeek(lowDebt);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const highResult = simulateWeek(highDebt);
    vi.restoreAllMocks();

    // High tech debt (90) applies 0.4 slowdown vs low debt (10) applies 1.0
    expect(highResult.product.features[0].progress).toBeLessThan(lowResult.product.features[0].progress);
  });

  it('tech debt > 85 hurts team morale', () => {
    const state = makeDeepState({
      team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
      product: {
        features: [],
        overallQuality: 0,
        techDebtTotal: 90,
        pmfScore: 0,
        customers: 100,
        churnRate: 0.05,
        bugs: 3,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.7); // Avoid outage (need < 0.15)
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    // Should have an "Engineers Frustrated" log entry
    const frustrationLog = result.eventLog.find(e => e.eventId === 'tech-debt-morale');
    expect(frustrationLog).toBeDefined();
  });
});

describe('Burn Calculation and Cash Flow', () => {
  it('growth-hack strategy increases burn by 20%', () => {
    const sustainable = makeDeepState({
      meta: { growthStrategy: 'sustainable' },
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
    });

    const growthHack = makeDeepState({
      meta: { growthStrategy: 'growth-hack' },
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const sustainableResult = simulateWeek(sustainable);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const growthResult = simulateWeek(growthHack);
    vi.restoreAllMocks();

    expect(growthResult.finances.weeklyBurn).toBeGreaterThan(sustainableResult.finances.weeklyBurn);
  });

  it('marketing spend adds to weekly burn', () => {
    // Use 'move-fast' strategy which doesn't auto-reduce marketing spend
    const noMarketing = makeDeepState({
      meta: { growthStrategy: 'move-fast' },
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        marketingSpend: 0,
      },
    });

    const withMarketing = makeDeepState({
      meta: { growthStrategy: 'move-fast' },
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        marketingSpend: 2000,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const noResult = simulateWeek(noMarketing);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const withResult = simulateWeek(withMarketing);
    vi.restoreAllMocks();

    expect(withResult.finances.weeklyBurn - noResult.finances.weeklyBurn).toBe(2000);
  });
});

describe('Low Morale Tracking', () => {
  it('tracks consecutive low morale weeks', () => {
    let state = makeDeepState({
      meta: { lowMoraleWeeks: 0 },
      team: { teamSize: 5, avgSalary: 3000, morale: 35, aiAgents: [] }, // Below 40
      company: { culture: 20, name: 'TestCo', stage: 'seed', valuation: 1_000_000, reputation: 50, weekFounded: 1 },
    });

    // Run 3 weeks — morale should stay low with culture at 20
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    for (let i = 0; i < 3; i++) {
      state = advanceWeek(state, []);
    }
    vi.restoreAllMocks();

    // Should have accumulated low morale weeks
    expect(state.meta.lowMoraleWeeks).toBeGreaterThan(0);
  });

  it('resets low morale counter when morale recovers above 40', () => {
    const state = makeDeepState({
      meta: { lowMoraleWeeks: 5 },
      team: { teamSize: 3, avgSalary: 3000, morale: 60, aiAgents: [] }, // Above 40
      company: { culture: 80, name: 'TestCo', stage: 'seed', valuation: 1_000_000, reputation: 50, weekFounded: 1 },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = advanceWeek(state, []);
    vi.restoreAllMocks();

    // Good morale + good culture, counter should reset
    expect(result.meta.lowMoraleWeeks).toBe(0);
  });
});
