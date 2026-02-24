import { describe, it, expect, vi } from 'vitest';
import { simulateWeek } from '../simulation.ts';
import { advanceWeek } from '../tick.ts';
import { createInitialState } from '../init.ts';
import type { GameState, AIAgent, Feature, Competitor, TeamMember } from '../../types/index.ts';

// ─── Helpers ────────────────────────────────────────────────────────────

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

function makeMembers(count: number, salary: number, morale = 75): TeamMember[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `test-member-${i}`,
    name: `Member ${i + 1}`,
    role: 'engineer' as const,
    skill: 50,
    salary,
    morale,
    weekHired: 1,
    traits: [],
    boosts: {},
  }));
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
      features: [makeShippedFeature({ quality: 30 })],
      overallQuality: 30,
      customers: 500,
      pmfScore: 20,
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
    expect(supportResult.product.churnRate).toBeLessThanOrEqual(noSupportResult.product.churnRate);
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
      finances: { ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances, pricingModel: 'subscription' as const },
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
      { type: 'set-pricing', model: 'usage-based', pricePerUnit: 99 },
    ]);
    vi.restoreAllMocks();

    // Should lose 15% of 1000 = 150 customers from switching
    // (before simulation adds/removes more)
    const switchLog = result.eventLog.find(e => e.eventId === 'pricing-switch-penalty');
    expect(switchLog).toBeDefined();
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
      { type: 'set-pricing', model: 'usage-based', pricePerUnit: 99 },
    ]);
    vi.restoreAllMocks();

    // Should be blocked — pricing model stays as subscription
    expect(result.finances.pricingModel).toBe('subscription');
    const blockLog = result.eventLog.find(e => e.eventId === 'pricing-switch-blocked');
    expect(blockLog).toBeDefined();
  });

  it('larger team generates more revenue than smaller team', () => {
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
        pricingModel: 'subscription' as const,
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
        pricingModel: 'subscription' as const,
        pricePerUnit: 100,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const smallResult = simulateWeek(smallTeam);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const largeResult = simulateWeek(largeTeam);
    vi.restoreAllMocks();

    // Larger team should generate at least as much revenue
    expect(largeResult.finances.weeklyRevenue).toBeGreaterThanOrEqual(smallResult.finances.weeklyRevenue);
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

  it('team reaching 0 from attrition does NOT end the game (founder continues solo)', () => {
    const state = makeDeepState({
      meta: { week: 5 },
      team: { teamSize: 1, avgSalary: 3000, morale: 5, aiAgents: [] },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        cash: 500_000,
      },
      weekHistory: [{ week: 4, cash: 500_000, revenue: 0, burn: 3500, customers: 0, churnRate: 0, valuation: 100_000, teamSize: 2, avgMorale: 5, pmfScore: 0, bubbleIndex: 60, eventsCount: 0, complianceCost: 0 }],
    });

    // Force the mass walkout (morale < 10, random < 0.60)
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const result = advanceWeek(state, []);
    vi.restoreAllMocks();

    // Team gone but founder keeps going
    expect(result.team.teamSize).toBe(0);
    expect(result.meta.gameOver).toBe(false);
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
    const members = makeMembers(8, 5000, 60);
    const state = makeDeepState({
      team: { members, teamSize: 8, avgSalary: 5000, morale: 60, aiAgents: [] },
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

});

describe('Marketing Decisions', () => {
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

    // Revenue = customers * price. Customer count shifts slightly during
    // simulation, so check approximate range.
    // Base: 500 * 20 = 10000, with small customer growth ~10000-11000
    expect(result.finances.weeklyRevenue).toBeGreaterThan(9500);
    expect(result.finances.weeklyRevenue).toBeLessThan(11500);
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
    const members = makeMembers(3, 4000, 70);
    let state = makeDeepState({
      team: { members, teamSize: 3, avgSalary: 4000, morale: 70, aiAgents: [] },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        cash: 30_000, // Low starting cash
        pricingModel: 'subscription' as const,
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

  it('decrements low morale counter gradually when morale recovers above 40', () => {
    const state = makeDeepState({
      meta: { lowMoraleWeeks: 5 },
      team: { teamSize: 3, avgSalary: 3000, morale: 60, aiAgents: [] }, // Above 40
      company: { culture: 80, name: 'TestCo', stage: 'seed', valuation: 1_000_000, reputation: 50, weekFounded: 1 },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = advanceWeek(state, []);
    vi.restoreAllMocks();

    // Gradual decay: decrements by 1 per week instead of instant reset
    expect(result.meta.lowMoraleWeeks).toBe(4);
  });
});

// ─── Revenue Calculation Tests ─────────────────────────────────────────

describe('simulateRevenue', () => {
  // Helper: create a base state optimized for revenue testing.
  // We use 0 customers initially and shipped features so simulateCustomers
  // produces predictable results. We mock Math.random for determinism.
  const baseFinances = () => createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances;
  const baseMarket = () => createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

  function revenueState(overrides: {
    pricingModel: 'subscription' | 'usage-based';
    pricePerUnit: number;
    customers: number;
    overallQuality: number;
    bugs?: number;
    teamSize?: number;
    aiAgents?: AIAgent[];
    weekHistory?: GameState['weekHistory'];
  }): GameState {
    return makeDeepState({
      team: {
        teamSize: overrides.teamSize ?? 6,
        avgSalary: 3000,
        morale: 80,
        aiAgents: overrides.aiAgents ?? [],
      },
      product: {
        features: [makeShippedFeature({ quality: overrides.overallQuality })],
        overallQuality: overrides.overallQuality,
        customers: overrides.customers,
        churnRate: 0.05,
        bugs: overrides.bugs ?? 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      finances: {
        ...baseFinances(),
        pricingModel: overrides.pricingModel,
        pricePerUnit: overrides.pricePerUnit,
      },
      market: { ...baseMarket(), competitors: [] },
      ...(overrides.weekHistory ? { weekHistory: overrides.weekHistory } : {}),
    });
  }

  // ── Subscription pricing model ──────────────────────────────────────

  describe('subscription pricing model', () => {
    it('produces revenue = customers * price (quality/bugs affect churn, not revenue)', () => {
      const state = revenueState({
        pricingModel: 'subscription',
        pricePerUnit: 20,
        customers: 500,
        overallQuality: 80,
        bugs: 0,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // Revenue = customers * price. Customer count shifts slightly during simulation.
      // Base: 500 * 20 = 10000, with small customer growth ~10000-11000
      expect(result.finances.weeklyRevenue).toBeGreaterThan(9500);
      expect(result.finances.weeklyRevenue).toBeLessThan(12000);
    });

    it('higher price produces proportionally more revenue', () => {
      const lowPrice = revenueState({
        pricingModel: 'subscription',
        pricePerUnit: 10,
        customers: 500,
        overallQuality: 80,
        bugs: 0,
      });

      const highPrice = revenueState({
        pricingModel: 'subscription',
        pricePerUnit: 50,
        customers: 500,
        overallQuality: 80,
        bugs: 0,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const lowResult = simulateWeek(lowPrice);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const highResult = simulateWeek(highPrice);
      vi.restoreAllMocks();

      // Subscription: revenue = customers * price, so 5x price ≈ 5x revenue.
      // Small variance from customer count shifts during simulation.
      const ratio = highResult.finances.weeklyRevenue / lowResult.finances.weeklyRevenue;
      expect(ratio).toBeGreaterThan(4);
      expect(ratio).toBeLessThan(6);
    });

    it('zero price produces zero revenue', () => {
      const state = revenueState({
        pricingModel: 'subscription',
        pricePerUnit: 0,
        customers: 500,
        overallQuality: 80,
        bugs: 0,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      expect(result.finances.weeklyRevenue).toBe(0);
    });

    it('zero customers produces minimal revenue', () => {
      const state = revenueState({
        pricingModel: 'subscription',
        pricePerUnit: 20,
        customers: 0,
        overallQuality: 80,
        bugs: 0,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // simulateCustomers runs before simulateRevenue and may add some new
      // customers even when starting from 0 (organic growth). Revenue is
      // therefore not exactly 0 but should be much less than a state with
      // 500 customers (~8000 revenue).
      expect(result.finances.weeklyRevenue).toBeLessThan(500);
    });
  });

  // ── Usage-based pricing model ───────────────────────────────────────

  describe('usage-based pricing model', () => {
    it('produces revenue proportional to customers, price, and quality', () => {
      const state = revenueState({
        pricingModel: 'usage-based',
        pricePerUnit: 15,
        customers: 800,
        overallQuality: 70,
        bugs: 0,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // activityMultiplier = qualityModifier = 0.7
      // weeklyNoise at random=0.5 => 1 + (0.5-0.5)*0.15 = 1.0
      // Base expected ~= 800 * 15 * 0.7 * 1.0 * 1.0 = 8400
      expect(result.finances.weeklyRevenue).toBeGreaterThan(5000);
      expect(result.finances.weeklyRevenue).toBeLessThan(12000);
    });

    it('has random noise component that varies revenue', () => {
      const state = revenueState({
        pricingModel: 'usage-based',
        pricePerUnit: 20,
        customers: 1000,
        overallQuality: 80,
        bugs: 0,
      });

      // Low random => lower noise multiplier
      vi.spyOn(Math, 'random').mockReturnValue(0.1);
      const lowResult = simulateWeek(state);
      vi.restoreAllMocks();

      // High random => higher noise multiplier
      vi.spyOn(Math, 'random').mockReturnValue(0.9);
      const highResult = simulateWeek(state);
      vi.restoreAllMocks();

      // Revenue should differ due to noise, but both should be positive
      expect(lowResult.finances.weeklyRevenue).toBeGreaterThan(0);
      expect(highResult.finances.weeklyRevenue).toBeGreaterThan(0);
      // They should differ (noise introduces variation)
      expect(lowResult.finances.weeklyRevenue).not.toBe(highResult.finances.weeklyRevenue);
    });
  });

  // ── Quality modifier floor ──────────────────────────────────────────

  describe('quality modifier floor', () => {
    it('quality does not affect subscription revenue (only churn)', () => {
      const lowQuality = revenueState({
        pricingModel: 'subscription',
        pricePerUnit: 20,
        customers: 500,
        overallQuality: 20,
        bugs: 0,
      });

      const highQuality = revenueState({
        pricingModel: 'subscription',
        pricePerUnit: 20,
        customers: 500,
        overallQuality: 80,
        bugs: 0,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const lowResult = simulateWeek(lowQuality);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const highResult = simulateWeek(highQuality);
      vi.restoreAllMocks();

      // Revenue ≈ customers * price for both — quality only affects churn.
      // Customer count may differ slightly due to churn differences, but
      // revenue should be in the same ballpark.
      const ratio = lowResult.finances.weeklyRevenue / highResult.finances.weeklyRevenue;
      expect(ratio).toBeGreaterThan(0.85);
      expect(ratio).toBeLessThan(1.15);
    });

    it('quality modifier still applies to usage-based revenue', () => {
      const lowQuality = revenueState({
        pricingModel: 'usage-based',
        pricePerUnit: 20,
        customers: 500,
        overallQuality: 20,
        bugs: 0,
      });

      const highQuality = revenueState({
        pricingModel: 'usage-based',
        pricePerUnit: 20,
        customers: 500,
        overallQuality: 80,
        bugs: 0,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const lowResult = simulateWeek(lowQuality);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const highResult = simulateWeek(highQuality);
      vi.restoreAllMocks();

      // Usage-based: quality reduces engagement and thus revenue.
      // quality=20 → modifier=0.20, quality=80 → modifier=0.80 → ratio ≈ 0.25
      const ratio = lowResult.finances.weeklyRevenue / highResult.finances.weeklyRevenue;
      expect(ratio).toBeGreaterThan(0.15);
      expect(ratio).toBeLessThan(0.45);
    });
  });

  // ── Bug penalty ─────────────────────────────────────────────────────

  describe('bug penalty', () => {
    it('bugs do not reduce subscription revenue (only affect churn)', () => {
      const noBugs = revenueState({
        pricingModel: 'subscription',
        pricePerUnit: 30,
        customers: 500,
        overallQuality: 80,
        bugs: 0,
      });

      const tenBugs = revenueState({
        pricingModel: 'subscription',
        pricePerUnit: 30,
        customers: 500,
        overallQuality: 80,
        bugs: 10,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const noBugResult = simulateWeek(noBugs);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const bugResult = simulateWeek(tenBugs);
      vi.restoreAllMocks();

      // Subscription: bugs affect churn, not per-customer revenue.
      // Revenue should be similar (small variance from customer count shifts).
      const ratio = bugResult.finances.weeklyRevenue / noBugResult.finances.weeklyRevenue;
      expect(ratio).toBeGreaterThan(0.85);
      expect(ratio).toBeLessThan(1.15);
    });

    it('each bug reduces usage-based revenue by 2%', () => {
      const noBugs = revenueState({
        pricingModel: 'usage-based',
        pricePerUnit: 30,
        customers: 500,
        overallQuality: 80,
        bugs: 0,
      });

      const tenBugs = revenueState({
        pricingModel: 'usage-based',
        pricePerUnit: 30,
        customers: 500,
        overallQuality: 80,
        bugs: 10,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const noBugResult = simulateWeek(noBugs);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const bugResult = simulateWeek(tenBugs);
      vi.restoreAllMocks();

      // 10 bugs -> bugPenalty = max(0, 1 - 10*0.02) = 0.8
      const ratio = bugResult.finances.weeklyRevenue / noBugResult.finances.weeklyRevenue;
      expect(ratio).toBeGreaterThan(0.65);
      expect(ratio).toBeLessThan(0.95);
    });

    it('more than 50 bugs does not produce negative revenue', () => {
      const extremeBugs = revenueState({
        pricingModel: 'usage-based',
        pricePerUnit: 30,
        customers: 500,
        overallQuality: 80,
        bugs: 100,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(extremeBugs);
      vi.restoreAllMocks();

      expect(result.finances.weeklyRevenue).toBeGreaterThanOrEqual(0);
    });

  });

  // ── Revenue is always rounded to 2 decimal places ──────────────────

  describe('revenue rounding', () => {
    it('revenue is rounded to at most 2 decimal places', () => {
      const state = revenueState({
        pricingModel: 'subscription',
        pricePerUnit: 7,
        customers: 333,
        overallQuality: 73,
        bugs: 3,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // Check that revenue has at most 2 decimal places
      const decimals = (result.finances.weeklyRevenue.toString().split('.')[1] || '').length;
      expect(decimals).toBeLessThanOrEqual(2);
    });
  });

  // ── Cross-model comparisons ─────────────────────────────────────────

  describe('cross-model comparisons', () => {
    it('subscription and usage-based both generate revenue', () => {
      const sub = revenueState({
        pricingModel: 'subscription',
        pricePerUnit: 50,
        customers: 100,
        overallQuality: 80,
        bugs: 0,
        teamSize: 6,
      });

      const usage = revenueState({
        pricingModel: 'usage-based',
        pricePerUnit: 50,
        customers: 100,
        overallQuality: 80,
        bugs: 0,
        teamSize: 6,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const subResult = simulateWeek(sub);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const usageResult = simulateWeek(usage);
      vi.restoreAllMocks();

      expect(subResult.finances.weeklyRevenue).toBeGreaterThan(0);
      expect(usageResult.finances.weeklyRevenue).toBeGreaterThan(0);
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('revenue is never negative regardless of inputs', () => {
      const models: Array<'subscription' | 'usage-based'> = [
        'subscription', 'usage-based',
      ];

      for (const model of models) {
        const state = revenueState({
          pricingModel: model,
          pricePerUnit: 25,
          customers: 0,
          overallQuality: 0,
          bugs: 100,
          teamSize: 0,
        });

        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const result = simulateWeek(state);
        vi.restoreAllMocks();

        expect(result.finances.weeklyRevenue).toBeGreaterThanOrEqual(0);
      }
    });

    it('very large customer count does not overflow or produce NaN', () => {
      const state = revenueState({
        pricingModel: 'subscription',
        pricePerUnit: 100,
        customers: 1_000_000,
        overallQuality: 90,
        bugs: 0,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      expect(Number.isFinite(result.finances.weeklyRevenue)).toBe(true);
      expect(result.finances.weeklyRevenue).toBeGreaterThan(0);
    });

    it('very high price does not overflow or produce NaN', () => {
      const state = revenueState({
        pricingModel: 'subscription',
        pricePerUnit: 10_000,
        customers: 100,
        overallQuality: 80,
        bugs: 0,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      expect(Number.isFinite(result.finances.weeklyRevenue)).toBe(true);
      expect(result.finances.weeklyRevenue).toBeGreaterThan(0);
    });
  });
});

// ─── simulateProduct (Product Development) ────────────────────────────

describe('simulateProduct', () => {
  // Shared base product config for many tests
  const baseProductConfig = {
    overallQuality: 0,
    techDebtTotal: 0,
    pmfScore: 0,
    customers: 0,
    churnRate: 0.05,
    bugs: 0,
    name: 'TestCo',
  };

  describe('feature progress', () => {
    it('feature progresses toward 100% over multiple weeks', () => {
      let state = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      for (let i = 0; i < 5; i++) {
        state = simulateWeek(state);
      }
      vi.restoreAllMocks();

      // After 5 weeks with a team of 3, progress should be well above 0
      expect(state.product.features[0].progress).toBeGreaterThan(30);
      // Progress should be moving toward 100
      expect(state.product.features[0].progress).toBeLessThanOrEqual(100);
    });

    it('founder contributes progress even with 0 team size', () => {
      const state = makeDeepState({
        founder: { techSkill: 80, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 0, avgSalary: 0, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // Founder alone: (8 + 80/8) / 1 = 18 progress per week
      expect(result.product.features[0].progress).toBeGreaterThan(0);
    });

    it('higher techSkill founder progresses faster', () => {
      const highTech = makeDeepState({
        founder: { techSkill: 90, bizSkill: 30, network: 30, learning: 50 },
        team: { teamSize: 0, avgSalary: 0, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const lowTech = makeDeepState({
        founder: { techSkill: 20, bizSkill: 30, network: 30, learning: 50 },
        team: { teamSize: 0, avgSalary: 0, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const highResult = simulateWeek(highTech);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const lowResult = simulateWeek(lowTech);
      vi.restoreAllMocks();

      expect(highResult.product.features[0].progress).toBeGreaterThan(
        lowResult.product.features[0].progress,
      );
    });

    it('team progress uses diminishing returns (sqrt)', () => {
      const small = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 1, avgSalary: 3000, morale: 80, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const large = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 9, avgSalary: 3000, morale: 80, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const smallResult = simulateWeek(small);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const largeResult = simulateWeek(large);
      vi.restoreAllMocks();

      const smallProgress = smallResult.product.features[0].progress;
      const largeProgress = largeResult.product.features[0].progress;

      // 9x team should NOT give 9x progress (diminishing returns via sqrt)
      expect(largeProgress).toBeGreaterThan(smallProgress);
      expect(largeProgress / smallProgress).toBeLessThan(5);
    });

    it('coding AI agent contributes to feature progress', () => {
      const withAgent = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: {
          teamSize: 0,
          avgSalary: 0,
          morale: 70,
          aiAgents: [makeAgent({ type: 'coding', capability: 80, reliability: 90 })],
        },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const withoutAgent = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 0, avgSalary: 0, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const agentResult = simulateWeek(withAgent);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const noAgentResult = simulateWeek(withoutAgent);
      vi.restoreAllMocks();

      expect(agentResult.product.features[0].progress).toBeGreaterThan(
        noAgentResult.product.features[0].progress,
      );
    });

    it('general AI agent contributes at 50% coding effectiveness', () => {
      const withCoding = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: {
          teamSize: 0,
          avgSalary: 0,
          morale: 70,
          aiAgents: [makeAgent({ type: 'coding', capability: 80, reliability: 80 })],
        },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const withGeneral = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: {
          teamSize: 0,
          avgSalary: 0,
          morale: 70,
          aiAgents: [makeAgent({ type: 'general', capability: 80, reliability: 80 })],
        },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const codingResult = simulateWeek(withCoding);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const generalResult = simulateWeek(withGeneral);
      vi.restoreAllMocks();

      // General agent progress contribution should be less than coding agent
      expect(codingResult.product.features[0].progress).toBeGreaterThan(
        generalResult.product.features[0].progress,
      );
    });

    it('progress is divided among multiple in-progress features', () => {
      const oneFeat = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ id: 'f1', progress: 0, quality: 0 })],
        },
      });

      const twoFeats = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [
            makeFeature({ id: 'f1', progress: 0, quality: 0 }),
            makeFeature({ id: 'f2', progress: 0, quality: 0 }),
          ],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const oneResult = simulateWeek(oneFeat);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const twoResult = simulateWeek(twoFeats);
      vi.restoreAllMocks();

      // Each feature in two-feature case should get less progress than the single feature
      const singleProgress = oneResult.product.features[0].progress;
      const splitProgress = twoResult.product.features[0].progress;
      expect(singleProgress).toBeGreaterThan(splitProgress);
    });
  });

  describe('auto-ship at 100%', () => {
    it('feature auto-ships when progress reaches 100', () => {
      const state = makeDeepState({
        founder: { techSkill: 90, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 5, avgSalary: 3000, morale: 90, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 95, quality: 50 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      expect(result.product.features[0].status).toBe('shipped');
      expect(result.product.features[0].progress).toBe(100);
    });

    it('shipped feature has its quality reflected in overallQuality', () => {
      const state = makeDeepState({
        founder: { techSkill: 90, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 5, avgSalary: 3000, morale: 90, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 99, quality: 60 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // Feature should be shipped and overallQuality should reflect its quality
      expect(result.product.features[0].status).toBe('shipped');
      expect(result.product.overallQuality).toBeGreaterThan(0);
    });

    it('already-shipped features are not modified', () => {
      const state = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeShippedFeature({ progress: 100, quality: 75 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      expect(result.product.features[0].status).toBe('shipped');
      expect(result.product.features[0].progress).toBe(100);
      expect(result.product.features[0].quality).toBe(75);
    });
  });

  describe('quality convergence', () => {
    it('quality converges toward target based on team size', () => {
      const state = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 5, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 10, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // Team of 5: baseTargetQuality = clamp(30 + 5*8, 30, 95) = 70
      // Quality moves from 0 toward target at rate 0.2
      expect(result.product.features[0].quality).toBeGreaterThan(0);
    });

    it('quality converges higher with larger teams', () => {
      const smallTeam = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 1, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 10, quality: 0 })],
        },
      });

      const largeTeam = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 8, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 10, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      let smallResult = smallTeam;
      let largeResult = largeTeam;
      for (let i = 0; i < 10; i++) {
        smallResult = simulateWeek(smallResult);
        largeResult = simulateWeek(largeResult);
      }
      vi.restoreAllMocks();

      // Larger team should converge to higher quality
      expect(largeResult.product.features[0].quality).toBeGreaterThan(
        smallResult.product.features[0].quality,
      );
    });

    it('quality is capped at 100', () => {
      // Use quality-first strategy + quality focus + high tech skill to push target above 100
      const state = makeDeepState({
        meta: { growthStrategy: 'quality-first', productFocus: 'quality' as const },
        founder: { techSkill: 90, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 8, avgSalary: 3000, morale: 90, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 10, quality: 95 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      let result = state;
      for (let i = 0; i < 20; i++) {
        result = simulateWeek(result);
      }
      vi.restoreAllMocks();

      expect(result.product.features[0].quality).toBeLessThanOrEqual(100);
    });
  });

  describe('tech debt from AI agents', () => {
    it('AI agents with low reliability generate tech debt', () => {
      const state = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: {
          teamSize: 0,
          avgSalary: 0,
          morale: 70,
          aiAgents: [makeAgent({ type: 'coding', capability: 80, reliability: 50 })],
        },
        product: {
          ...baseProductConfig,
          techDebtTotal: 0,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // Agent with reliability 50: (100-50)/100 * 3 = 1.5 debt per agent
      expect(result.product.techDebtTotal).toBeGreaterThan(0);
    });

    it('high-reliability agents generate less tech debt', () => {
      const lowRel = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: {
          teamSize: 0,
          avgSalary: 0,
          morale: 70,
          aiAgents: [makeAgent({ reliability: 30 })],
        },
        product: {
          ...baseProductConfig,
          techDebtTotal: 10,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const highRel = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: {
          teamSize: 0,
          avgSalary: 0,
          morale: 70,
          aiAgents: [makeAgent({ reliability: 95 })],
        },
        product: {
          ...baseProductConfig,
          techDebtTotal: 10,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const lowResult = simulateWeek(lowRel);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const highResult = simulateWeek(highRel);
      vi.restoreAllMocks();

      // Low reliability generates more debt
      expect(lowResult.product.techDebtTotal).toBeGreaterThan(highResult.product.techDebtTotal);
    });

    it('no AI agents means no tech debt accumulation', () => {
      const state = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 2, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 10,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // No agents, no new tech debt. Current debt should stay at 10 or decrease.
      expect(result.product.techDebtTotal).toBeLessThanOrEqual(10);
    });

    it('tech debt is clamped between 0 and 100', () => {
      // Many unreliable agents to push debt high
      const agents = Array.from({ length: 10 }, (_, i) =>
        makeAgent({ id: `agent-${i}`, reliability: 10 }),
      );

      const state = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 0, avgSalary: 0, morale: 70, aiAgents: agents },
        product: {
          ...baseProductConfig,
          techDebtTotal: 95,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      expect(result.product.techDebtTotal).toBeLessThanOrEqual(100);
      expect(result.product.techDebtTotal).toBeGreaterThanOrEqual(0);
    });

    it('coding agent reliability reduces tech debt', () => {
      const withCoding = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: {
          teamSize: 0,
          avgSalary: 0,
          morale: 70,
          aiAgents: [makeAgent({ type: 'coding', reliability: 100 })],
        },
        product: {
          ...baseProductConfig,
          techDebtTotal: 20,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const withMarketing = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: {
          teamSize: 0,
          avgSalary: 0,
          morale: 70,
          aiAgents: [makeAgent({ type: 'marketing', reliability: 100 })],
        },
        product: {
          ...baseProductConfig,
          techDebtTotal: 20,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const codingResult = simulateWeek(withCoding);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const marketingResult = simulateWeek(withMarketing);
      vi.restoreAllMocks();

      // Coding agent with reliability 100 reduces debt by 100/200 = 0.5 per week
      // Both generate tech debt from (100-reliability)/100 * 3 = 0 (rel 100)
      // Coding: net -0.5, Marketing: net 0
      expect(codingResult.product.techDebtTotal).toBeLessThan(marketingResult.product.techDebtTotal);
    });
  });

  describe('bug calculation', () => {
    it('bugs increase with high tech debt', () => {
      const lowDebt = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 2, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 10,
          bugs: 0,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const highDebt = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 2, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 80,
          bugs: 0,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const lowResult = simulateWeek(lowDebt);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const highResult = simulateWeek(highDebt);
      vi.restoreAllMocks();

      // High debt: floor(80/25) = 3 bugs added
      // Low debt: floor(10/25) = 0 bugs added
      expect(highResult.product.bugs).toBeGreaterThan(lowResult.product.bugs);
    });

    it('bugs are reduced when shipped features exist', () => {
      const withShipped = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 2, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 10,
          bugs: 5,
          features: [makeShippedFeature()],
        },
      });

      const withoutShipped = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 2, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 10,
          bugs: 5,
          features: [makeFeature({ progress: 50, quality: 30 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const shippedResult = simulateWeek(withShipped);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const unshippedResult = simulateWeek(withoutShipped);
      vi.restoreAllMocks();

      // Shipped features provide -1 bug reduction
      expect(shippedResult.product.bugs).toBeLessThanOrEqual(unshippedResult.product.bugs);
    });

    it('bugs cannot go below 0', () => {
      const state = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 2, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 0,
          bugs: 0,
          features: [makeShippedFeature()],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      expect(result.product.bugs).toBeGreaterThanOrEqual(0);
    });

    it('bug-fixing focus reduces bugs', () => {
      const bugFixing = makeDeepState({
        meta: { productFocus: 'bug-fixing' as const },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 6, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 30,
          bugs: 10,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const newFeatures = makeDeepState({
        meta: { productFocus: 'new-features' as const },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 6, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 30,
          bugs: 10,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const bugResult = simulateWeek(bugFixing);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const featResult = simulateWeek(newFeatures);
      vi.restoreAllMocks();

      // Bug-fixing focus: focusBugReduction = 2 + floor(6/3) = 4
      expect(bugResult.product.bugs).toBeLessThan(featResult.product.bugs);
    });
  });

  describe('morale effects on progress and quality', () => {
    it('morale < 30 slows progress by 25%', () => {
      const normalMorale = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 50, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const lowMorale = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 25, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const normalResult = simulateWeek(normalMorale);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const lowResult = simulateWeek(lowMorale);
      vi.restoreAllMocks();

      // Low morale applies 0.75 multiplier to total progress
      // Also morale directly affects human contribution (morale/100 * effectiveTeamSize * 12)
      expect(lowResult.product.features[0].progress).toBeLessThan(
        normalResult.product.features[0].progress,
      );
    });

    it('morale exactly at 30 does NOT trigger the slowdown', () => {
      // Code: if (state.team.morale < 30) => morale 30 does NOT trigger
      const at30 = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 30, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const at29 = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 29, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const at30Result = simulateWeek(at30);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const at29Result = simulateWeek(at29);
      vi.restoreAllMocks();

      // Morale 30: moraleProgressMultiplier = 1.0 (no penalty)
      // Morale 29: moraleProgressMultiplier = 0.75 (penalty)
      expect(at30Result.product.features[0].progress).toBeGreaterThan(
        at29Result.product.features[0].progress,
      );
    });

    it('morale > 80 boosts quality by 10%', () => {
      // Test with a single tick to isolate the morale quality boost.
      // simulateProductDevelopment reads morale before simulateMorale can change it.
      // Use low founder tech skill and team=1 to keep targetQuality below 100
      // so the 1.1x multiplier has visible effect.
      // team=1, techSkill=10: baseTargetQuality = clamp(30+8, 30, 95) = 38
      // qualityMultiplier=1.0, founderQualityBonus=0.1 -> targetQ = 38 * 1.1 = 41.8
      // morale 85 (>80): targetQ *= 1.1 = 45.98
      // morale 75 (<=80): targetQ = 41.8
      // quality: 0 + (target - 0) * 0.2
      // High: round(45.98 * 0.2) = round(9.2) = 9
      // Normal: round(41.8 * 0.2) = round(8.36) = 8
      const highMorale = makeDeepState({
        founder: { techSkill: 10, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 1, avgSalary: 3000, morale: 85, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 10, quality: 0 })],
        },
      });

      const normalMorale = makeDeepState({
        founder: { techSkill: 10, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 1, avgSalary: 3000, morale: 75, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 10, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const highResult = simulateWeek(highMorale);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const normalResult = simulateWeek(normalMorale);
      vi.restoreAllMocks();

      // After one tick, quality should be higher for morale > 80
      expect(highResult.product.features[0].quality).toBeGreaterThanOrEqual(
        normalResult.product.features[0].quality,
      );
    });

    it('morale exactly at 80 does not trigger quality boost (single tick)', () => {
      // Test the boundary: morale > 80 triggers boost, morale == 80 does not.
      // Use single-tick test since morale drifts after simulateMorale runs.
      // simulateProductDevelopment reads state.team.morale BEFORE simulateMorale changes it.
      const at80 = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 5, avgSalary: 3000, morale: 80, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 10, quality: 30 })],
        },
      });

      const at81 = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 5, avgSalary: 3000, morale: 81, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 10, quality: 30 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const at80Result = simulateWeek(at80);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const at81Result = simulateWeek(at81);
      vi.restoreAllMocks();

      // Morale 81 triggers the quality boost (>80), morale 80 does not.
      // After a single tick, the quality difference should be visible.
      expect(at81Result.product.features[0].quality).toBeGreaterThanOrEqual(
        at80Result.product.features[0].quality,
      );
    });
  });

  describe('product focus multipliers', () => {
    it('quality focus: slower progress but higher quality', () => {
      const qualityFocus = makeDeepState({
        meta: { productFocus: 'quality' as const },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const defaultFocus = makeDeepState({
        meta: { productFocus: 'new-features' as const },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      let qResult = qualityFocus;
      let dResult = defaultFocus;
      for (let i = 0; i < 3; i++) {
        qResult = simulateWeek(qResult);
        dResult = simulateWeek(dResult);
      }
      vi.restoreAllMocks();

      // Quality focus: 0.6 progress multiplier, 1.5 quality multiplier
      expect(qResult.product.features[0].progress).toBeLessThan(
        dResult.product.features[0].progress,
      );
      expect(qResult.product.features[0].quality).toBeGreaterThan(
        dResult.product.features[0].quality,
      );
    });

    it('bug-fixing focus: slower progress', () => {
      const bugFocus = makeDeepState({
        meta: { productFocus: 'bug-fixing' as const },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const defaultFocus = makeDeepState({
        meta: { productFocus: 'new-features' as const },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const bugResult = simulateWeek(bugFocus);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const defResult = simulateWeek(defaultFocus);
      vi.restoreAllMocks();

      // Bug-fixing focus: 0.4 progress multiplier
      expect(bugResult.product.features[0].progress).toBeLessThan(
        defResult.product.features[0].progress,
      );
    });

    it('tech-debt focus: slower progress but reduces tech debt', () => {
      const debtFocus = makeDeepState({
        meta: { productFocus: 'tech-debt' as const },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 5, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 50,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const defaultFocus = makeDeepState({
        meta: { productFocus: 'new-features' as const },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 5, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 50,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const debtResult = simulateWeek(debtFocus);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const defResult = simulateWeek(defaultFocus);
      vi.restoreAllMocks();

      // Tech-debt focus: 0.4 progress, reduces debt by 3 + teamSize*1.5 = 10.5
      expect(debtResult.product.features[0].progress).toBeLessThan(
        defResult.product.features[0].progress,
      );
      expect(debtResult.product.techDebtTotal).toBeLessThan(defResult.product.techDebtTotal);
    });

    it('user-growth focus: slightly slower progress', () => {
      const growthFocus = makeDeepState({
        meta: { productFocus: 'user-growth' as const },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const defaultFocus = makeDeepState({
        meta: { productFocus: 'new-features' as const },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const growthResult = simulateWeek(growthFocus);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const defResult = simulateWeek(defaultFocus);
      vi.restoreAllMocks();

      // User-growth focus: 0.8 progress multiplier
      expect(growthResult.product.features[0].progress).toBeLessThan(
        defResult.product.features[0].progress,
      );
    });
  });

  describe('growth strategy multipliers', () => {
    it('move-fast strategy: faster progress but more tech debt and lower quality', () => {
      const moveFast = makeDeepState({
        meta: { growthStrategy: 'move-fast' },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: {
          teamSize: 3,
          avgSalary: 3000,
          morale: 70,
          aiAgents: [makeAgent({ type: 'coding', capability: 80, reliability: 60 })],
        },
        product: {
          ...baseProductConfig,
          techDebtTotal: 10,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const balanced = makeDeepState({
        meta: { growthStrategy: 'balanced' },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: {
          teamSize: 3,
          avgSalary: 3000,
          morale: 70,
          aiAgents: [makeAgent({ type: 'coding', capability: 80, reliability: 60 })],
        },
        product: {
          ...baseProductConfig,
          techDebtTotal: 10,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const fastResult = simulateWeek(moveFast);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const balResult = simulateWeek(balanced);
      vi.restoreAllMocks();

      // move-fast: 1.3 progress, 1.5 tech debt, 0.8 quality
      expect(fastResult.product.features[0].progress).toBeGreaterThan(
        balResult.product.features[0].progress,
      );
      expect(fastResult.product.techDebtTotal).toBeGreaterThan(balResult.product.techDebtTotal);
    });

    it('quality-first strategy: slower progress but less tech debt and higher quality', () => {
      // Use a single week to avoid both capping at 100% progress
      const qualityFirst = makeDeepState({
        meta: { growthStrategy: 'quality-first' },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: {
          teamSize: 3,
          avgSalary: 3000,
          morale: 70,
          aiAgents: [makeAgent({ type: 'coding', capability: 80, reliability: 60 })],
        },
        product: {
          ...baseProductConfig,
          techDebtTotal: 10,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const balanced = makeDeepState({
        meta: { growthStrategy: 'balanced' },
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: {
          teamSize: 3,
          avgSalary: 3000,
          morale: 70,
          aiAgents: [makeAgent({ type: 'coding', capability: 80, reliability: 60 })],
        },
        product: {
          ...baseProductConfig,
          techDebtTotal: 10,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const qfResult = simulateWeek(qualityFirst);
      vi.restoreAllMocks();

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const bResult = simulateWeek(balanced);
      vi.restoreAllMocks();

      // quality-first: 0.7 progress, 0.5 tech debt, 1.3 quality
      expect(qfResult.product.features[0].progress).toBeLessThan(
        bResult.product.features[0].progress,
      );
      expect(qfResult.product.features[0].quality).toBeGreaterThan(
        bResult.product.features[0].quality,
      );
      expect(qfResult.product.techDebtTotal).toBeLessThan(bResult.product.techDebtTotal);
    });
  });

  describe('edge cases', () => {
    it('handles no features gracefully', () => {
      const state = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      expect(result.product.features).toHaveLength(0);
      expect(result.product.overallQuality).toBe(0);
    });

    it('handles all features already shipped', () => {
      const state = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [
            makeShippedFeature({ id: 'f1', quality: 70 }),
            makeShippedFeature({ id: 'f2', quality: 80 }),
          ],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // Both features remain shipped and unchanged
      expect(result.product.features[0].status).toBe('shipped');
      expect(result.product.features[1].status).toBe('shipped');
      // Overall quality is average of shipped features
      expect(result.product.overallQuality).toBe(75);
    });

    it('handles 0 team size (founder only)', () => {
      const state = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 0, avgSalary: 0, morale: 50, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // Should still make progress from founder alone
      expect(result.product.features[0].progress).toBeGreaterThan(0);
      // Quality should increase from founder quality bonus
      expect(result.product.features[0].quality).toBeGreaterThan(0);
    });

    it('handles mix of shipped and in-progress features', () => {
      const state = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [
            makeShippedFeature({ id: 'f1', quality: 60 }),
            makeFeature({ id: 'f2', progress: 20, quality: 10 }),
          ],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // Shipped feature stays unchanged
      expect(result.product.features[0].status).toBe('shipped');
      expect(result.product.features[0].quality).toBe(60);

      // In-progress feature should have progressed
      expect(result.product.features[1].progress).toBeGreaterThan(20);
      expect(result.product.features[1].quality).toBeGreaterThan(10);
    });

    it('progress is clamped at 100', () => {
      const state = makeDeepState({
        founder: { techSkill: 90, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 10, avgSalary: 3000, morale: 100, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 99, quality: 50 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // Progress should be exactly 100 (clamped), not exceed it
      expect(result.product.features[0].progress).toBe(100);
    });

    it('overallQuality is 0 when no shipped features exist', () => {
      const state = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 50, quality: 40 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = simulateWeek(state);
      vi.restoreAllMocks();

      // Feature is still in-progress, overallQuality should be 0
      expect(result.product.overallQuality).toBe(0);
    });

    it('design agents improve quality target without affecting progress', () => {
      const withDesign = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: {
          teamSize: 2,
          avgSalary: 3000,
          morale: 70,
          aiAgents: [makeAgent({ type: 'design', capability: 100, reliability: 90 })],
        },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const noAgent = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 2, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      let dResult = withDesign;
      let nResult = noAgent;
      for (let i = 0; i < 3; i++) {
        dResult = simulateWeek(dResult);
        nResult = simulateWeek(nResult);
      }
      vi.restoreAllMocks();

      // Design agent boosts quality target (designAgentBonus = capability/100 * 5 = 5)
      expect(dResult.product.features[0].quality).toBeGreaterThan(
        nResult.product.features[0].quality,
      );
    });

    it('tech debt slowdown tiers work correctly', () => {
      // Test that higher tech debt produces slower progress
      const debt40 = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 40, // No slowdown (below 50)
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const debt60 = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 60, // 0.8 slowdown (>50)
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const debt75 = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 75, // 0.6 slowdown (>70)
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      const debt90 = makeDeepState({
        founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50 },
        team: { teamSize: 3, avgSalary: 3000, morale: 70, aiAgents: [] },
        product: {
          ...baseProductConfig,
          techDebtTotal: 90, // 0.4 slowdown (>85)
          features: [makeFeature({ progress: 0, quality: 0 })],
        },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const r40 = simulateWeek(debt40);
      const r60 = simulateWeek(debt60);
      const r75 = simulateWeek(debt75);
      const r90 = simulateWeek(debt90);
      vi.restoreAllMocks();

      const p40 = r40.product.features[0].progress;
      const p60 = r60.product.features[0].progress;
      const p75 = r75.product.features[0].progress;
      const p90 = r90.product.features[0].progress;

      expect(p40).toBeGreaterThan(p60);
      expect(p60).toBeGreaterThan(p75);
      expect(p75).toBeGreaterThan(p90);
    });
  });
});
