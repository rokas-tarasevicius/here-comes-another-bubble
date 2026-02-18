import { describe, it, expect, vi } from 'vitest';
import { simulateWeek } from '../simulation.ts';
import { createInitialState } from '../init.ts';
import type { GameState, AIAgent, Feature, Competitor } from '../../types/index.ts';

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

// Helper to create a base state with sensible defaults for customer testing
function makeCustomerState(overrides: {
  meta?: Partial<GameState['meta']>;
  founder?: Partial<GameState['founder']>;
  company?: Partial<GameState['company']>;
  team?: Partial<GameState['team']>;
  product?: Partial<GameState['product']>;
  finances?: Partial<GameState['finances']>;
  market?: Partial<GameState['market']>;
} = {}) {
  const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
  return makeDeepState({
    meta: { difficulty: 'normal', ...overrides.meta },
    founder: { techSkill: 50, bizSkill: 50, network: 50, learning: 50, ...overrides.founder },
    company: { stage: 'seed', name: 'TestCo', valuation: 1_000_000, culture: 60, reputation: 50, weekFounded: 1, ...overrides.company },
    team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [], ...overrides.team },
    product: {
      features: [makeShippedFeature({ quality: 60, marketRelevance: 80 })],
      overallQuality: 60,
      customers: 200,
      churnRate: 0.05,
      bugs: 0,
      pmfScore: 50,
      techDebtTotal: 10,
      name: 'TestCo',
      ...overrides.product,
    },
    finances: {
      ...base.finances,
      pricingModel: 'subscription' as const,
      pricePerUnit: 20,
      marketingSpend: 0,
      ...overrides.finances,
    },
    market: {
      ...base.market,
      competitors: [],
      ...overrides.market,
    },
  });
}

// ─── Customer Simulation Tests ─────────────────────────────────────────

describe('simulateCustomers', () => {
  // ── Customer growth with shipped vs unshipped features ──

  it('shipped features produce significantly more customer growth than unshipped', () => {
    const shipped = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 70, marketRelevance: 80 })],
        overallQuality: 70,
        customers: 100,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    const unshipped = makeCustomerState({
      product: {
        features: [makeFeature({ progress: 50, quality: 40, marketRelevance: 80 })],
        overallQuality: 0,
        customers: 100,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 0,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const shippedResult = simulateWeek(shipped);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const unshippedResult = simulateWeek(unshipped);
    vi.restoreAllMocks();

    expect(shippedResult.product.customers).toBeGreaterThan(unshippedResult.product.customers);
  });

  it('higher quality shipped features produce more growth than lower quality', () => {
    const highQuality = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 90, marketRelevance: 90 })],
        overallQuality: 90,
        customers: 200,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 70,
        techDebtTotal: 5,
        name: 'TestCo',
      },
    });

    const lowQuality = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 30, marketRelevance: 40 })],
        overallQuality: 30,
        customers: 200,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 20,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const highResult = simulateWeek(highQuality);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lowResult = simulateWeek(lowQuality);
    vi.restoreAllMocks();

    expect(highResult.product.customers).toBeGreaterThan(lowResult.product.customers);
  });

  // ── PMF-driven growth calculation ──

  it('higher PMF drives more customer growth', () => {
    const highPMF = makeCustomerState({
      product: {
        features: [
          makeShippedFeature({ quality: 90, marketRelevance: 95 }),
          makeShippedFeature({ id: 'feat-2', quality: 85, marketRelevance: 90 }),
        ],
        overallQuality: 87,
        customers: 200,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 75,
        techDebtTotal: 5,
        name: 'TestCo',
      },
    });

    const lowPMF = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 25, marketRelevance: 20 })],
        overallQuality: 25,
        customers: 200,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 10,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const highResult = simulateWeek(highPMF);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lowResult = simulateWeek(lowPMF);
    vi.restoreAllMocks();

    expect(highResult.product.customers).toBeGreaterThan(lowResult.product.customers);
    expect(highResult.product.pmfScore).toBeGreaterThan(lowResult.product.pmfScore);
  });

  it('PMF is zero when no features are shipped', () => {
    // Use low progress so simulateProductDevelopment does NOT auto-ship the feature
    const state = makeCustomerState({
      product: {
        features: [makeFeature({ progress: 10, quality: 20 })],
        overallQuality: 0,
        customers: 50,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 0,
        techDebtTotal: 0,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(state);
    vi.restoreAllMocks();

    // Feature should still be in-progress (progress < 100), so PMF stays 0
    expect(result.product.features[0].status).toBe('in-progress');
    expect(result.product.pmfScore).toBe(0);
  });

  // ── Churn rate calculation ──

  it('base churn depends on pricing model', () => {
    const freeModel = makeCustomerState({
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
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'free' as const,
        pricePerUnit: 0,
      },
    });

    const enterpriseModel = makeCustomerState({
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
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'enterprise' as const,
        pricePerUnit: 100,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const freeResult = simulateWeek(freeModel);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const enterpriseResult = simulateWeek(enterpriseModel);
    vi.restoreAllMocks();

    // Free pricing has 0.08 base churn, enterprise has 0.01
    expect(freeResult.product.churnRate).toBeGreaterThan(enterpriseResult.product.churnRate);
  });

  it('quality bonus reduces churn when quality > 50, increases when < 50', () => {
    const highQuality = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 90 })],
        overallQuality: 90,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 5,
        name: 'TestCo',
      },
    });

    const lowQuality = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 20 })],
        overallQuality: 20,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 5,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const highResult = simulateWeek(highQuality);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lowResult = simulateWeek(lowQuality);
    vi.restoreAllMocks();

    // Quality 90: qualityBonus = -(90-50)/500 = -0.08 (reduces churn)
    // Quality 20: qualityBonus = -(20-50)/500 = +0.06 (increases churn)
    expect(highResult.product.churnRate).toBeLessThan(lowResult.product.churnRate);
  });

  it('competitor pull adds to churn when competitor quality > player quality', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const withStrongComp = makeCustomerState({
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
        competitors: [makeCompetitor({ productQuality: 80 })],
      },
    });

    const withWeakComp = makeCustomerState({
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
        competitors: [makeCompetitor({ productQuality: 40 })],
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const strongResult = simulateWeek(withStrongComp);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const weakResult = simulateWeek(withWeakComp);
    vi.restoreAllMocks();

    expect(strongResult.product.churnRate).toBeGreaterThan(weakResult.product.churnRate);
  });

  // ── Marketing effect on customer growth ──

  it('marketing spend increases customer growth', () => {
    const noMarketing = makeCustomerState({
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'subscription' as const,
        pricePerUnit: 20,
        marketingSpend: 0,
      },
    });

    const withMarketing = makeCustomerState({
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'subscription' as const,
        pricePerUnit: 20,
        marketingSpend: 5000,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const noMarketingResult = simulateWeek(noMarketing);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const withMarketingResult = simulateWeek(withMarketing);
    vi.restoreAllMocks();

    expect(withMarketingResult.product.customers).toBeGreaterThan(noMarketingResult.product.customers);
  });

  it('marketing agent boosts customer growth even without marketing spend', () => {
    const noAgent = makeCustomerState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
    });

    const withAgent = makeCustomerState({
      team: {
        teamSize: 3,
        avgSalary: 3000,
        morale: 80,
        aiAgents: [makeAgent({ type: 'marketing', capability: 80, reliability: 90 })],
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const noAgentResult = simulateWeek(noAgent);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const withAgentResult = simulateWeek(withAgent);
    vi.restoreAllMocks();

    // Marketing agent adds capability/50 = 80/50 = 1.6 to marketingEffect
    expect(withAgentResult.product.customers).toBeGreaterThan(noAgentResult.product.customers);
  });

  // ── Word-of-mouth viral coefficient ──

  it('word-of-mouth multiplier activates when average shipped quality > 70', () => {
    const highQuality = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 85, marketRelevance: 80 })],
        overallQuality: 85,
        customers: 300,
        churnRate: 0.03,
        bugs: 0,
        pmfScore: 60,
        techDebtTotal: 5,
        name: 'TestCo',
      },
    });

    const mediumQuality = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 65, marketRelevance: 80 })],
        overallQuality: 65,
        customers: 300,
        churnRate: 0.03,
        bugs: 0,
        pmfScore: 60,
        techDebtTotal: 5,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const highResult = simulateWeek(highQuality);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const mediumResult = simulateWeek(mediumQuality);
    vi.restoreAllMocks();

    // Quality 85: wordOfMouthMultiplier = 1.0 + (85-70)/100 = 1.15
    // Quality 65: wordOfMouthMultiplier = 1.0 (no bonus)
    expect(highResult.product.customers).toBeGreaterThan(mediumResult.product.customers);
  });

  it('word-of-mouth does not activate when average shipped quality <= 70', () => {
    const exactly70 = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 70, marketRelevance: 80 })],
        overallQuality: 70,
        customers: 300,
        churnRate: 0.03,
        bugs: 0,
        pmfScore: 60,
        techDebtTotal: 5,
        name: 'TestCo',
      },
    });

    const below70 = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 60, marketRelevance: 80 })],
        overallQuality: 60,
        customers: 300,
        churnRate: 0.03,
        bugs: 0,
        pmfScore: 60,
        techDebtTotal: 5,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const exactly70Result = simulateWeek(exactly70);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const below70Result = simulateWeek(below70);
    vi.restoreAllMocks();

    // Both have wordOfMouthMultiplier = 1.0
    // Difference comes only from PMF, not WoM
    const diff = exactly70Result.product.customers - below70Result.product.customers;
    expect(diff).toBeGreaterThanOrEqual(0);
  });

  // ── Pre-launch growth ──

  it('pre-launch state gets some growth from marketing and founder hustle', () => {
    const preLaunch = makeCustomerState({
      founder: { techSkill: 50, bizSkill: 80, network: 50, learning: 50 },
      product: {
        features: [makeFeature({ progress: 60, quality: 40, marketRelevance: 80 })],
        overallQuality: 0,
        customers: 10,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 0,
        techDebtTotal: 0,
        name: 'TestCo',
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'subscription' as const,
        pricePerUnit: 20,
        marketingSpend: 2000,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(preLaunch);
    vi.restoreAllMocks();

    // Some growth should happen even without a shipped product
    expect(result.product.customers).toBeGreaterThanOrEqual(10);
  });

  it('pre-launch growth is less than post-launch growth', () => {
    const baseOverrides = {
      founder: { techSkill: 50, bizSkill: 70, network: 50, learning: 50 },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'subscription' as const,
        pricePerUnit: 20,
        marketingSpend: 1000,
      },
    };

    // Use low progress so feature does NOT auto-ship in simulateProductDevelopment
    const preLaunch = makeCustomerState({
      ...baseOverrides,
      product: {
        features: [makeFeature({ progress: 10, quality: 20, marketRelevance: 80 })],
        overallQuality: 0,
        customers: 100,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 0,
        techDebtTotal: 0,
        name: 'TestCo',
      },
    });

    const postLaunch = makeCustomerState({
      ...baseOverrides,
      product: {
        features: [makeShippedFeature({ quality: 60, marketRelevance: 80 })],
        overallQuality: 60,
        customers: 100,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 40,
        techDebtTotal: 0,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const preLaunchResult = simulateWeek(preLaunch);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const postLaunchResult = simulateWeek(postLaunch);
    vi.restoreAllMocks();

    // Verify the pre-launch feature did not auto-ship
    expect(preLaunchResult.product.features[0].status).toBe('in-progress');
    expect(postLaunchResult.product.customers).toBeGreaterThan(preLaunchResult.product.customers);
  });

  // ── No-product growth ──

  it('no features at all gives minimal growth from founder hustle and marketing', () => {
    const noProduct = makeCustomerState({
      founder: { techSkill: 50, bizSkill: 80, network: 50, learning: 50 },
      product: {
        features: [],
        overallQuality: 0,
        customers: 0,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 0,
        techDebtTotal: 0,
        name: 'TestCo',
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'free' as const,
        marketingSpend: 1000,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(noProduct);
    vi.restoreAllMocks();

    expect(result.product.customers).toBeGreaterThanOrEqual(0);
  });

  it('no product and no marketing gives essentially zero growth', () => {
    const bare = makeCustomerState({
      founder: { techSkill: 50, bizSkill: 30, network: 30, learning: 50 },
      company: { reputation: 10, name: 'TestCo', stage: 'garage', valuation: 100_000, culture: 60, weekFounded: 1 },
      product: {
        features: [],
        overallQuality: 0,
        customers: 0,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 0,
        techDebtTotal: 0,
        name: 'TestCo',
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'free' as const,
        marketingSpend: 0,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(bare);
    vi.restoreAllMocks();

    // founderBizGrowth = 30/100 * 3.0 = 0.9
    // noProductGrowth = (0 * 0.2 + 0.9 * 0.3) * 1.0 = 0.27 -> rounds to 0
    expect(result.product.customers).toBeLessThanOrEqual(1);
  });

  // ── First-ship bonus for < 50 customers ──

  it('first-ship bonus gives extra growth when customers < 50', () => {
    const fewCustomers = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 60, marketRelevance: 80 })],
        overallQuality: 60,
        customers: 10,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 40,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    const manyCustomers = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 60, marketRelevance: 80 })],
        overallQuality: 60,
        customers: 100,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 40,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const fewResult = simulateWeek(fewCustomers);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const manyResult = simulateWeek(manyCustomers);
    vi.restoreAllMocks();

    // First-ship bonus at 10 customers: max(0, (50 - 10) * 0.1) = 4.0
    const fewGrowthRate = (fewResult.product.customers - 10) / 10;
    const manyGrowthRate = (manyResult.product.customers - 100) / 100;

    // Few customers should have much higher relative growth rate
    expect(fewGrowthRate).toBeGreaterThan(manyGrowthRate);
  });

  it('first-ship bonus is zero at exactly 50 customers', () => {
    const at50 = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 60, marketRelevance: 80 })],
        overallQuality: 60,
        customers: 50,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 40,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    const at51 = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 60, marketRelevance: 80 })],
        overallQuality: 60,
        customers: 51,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 40,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const at50Result = simulateWeek(at50);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const at51Result = simulateWeek(at51);
    vi.restoreAllMocks();

    // At 50: firstShipBonus = max(0, (50-50)*0.1) = 0
    // At 51: no first-ship code path at all
    const growthAt50 = at50Result.product.customers - 50;
    const growthAt51 = at51Result.product.customers - 51;
    expect(Math.abs(growthAt50 - growthAt51)).toBeLessThanOrEqual(2);
  });

  // ── Bubble index modifier effect ──

  it('high bubble index (> 85) boosts customer growth', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const highBubble = makeCustomerState({
      market: { ...baseMarket, bubbleIndex: 90, bubbleTrend: 0, competitors: [] },
    });

    const normalBubble = makeCustomerState({
      market: { ...baseMarket, bubbleIndex: 60, bubbleTrend: 0, competitors: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const highResult = simulateWeek(highBubble);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const normalResult = simulateWeek(normalBubble);
    vi.restoreAllMocks();

    // Bubble > 85: bubbleCustomerModifier = 1.3
    expect(highResult.product.customers).toBeGreaterThan(normalResult.product.customers);
  });

  it('low bubble index (< 25) reduces customer growth', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const lowBubble = makeCustomerState({
      market: { ...baseMarket, bubbleIndex: 20, bubbleTrend: 0, competitors: [] },
    });

    const normalBubble = makeCustomerState({
      market: { ...baseMarket, bubbleIndex: 60, bubbleTrend: 0, competitors: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lowResult = simulateWeek(lowBubble);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const normalResult = simulateWeek(normalBubble);
    vi.restoreAllMocks();

    // Bubble < 25: bubbleCustomerModifier = 0.6
    expect(lowResult.product.customers).toBeLessThan(normalResult.product.customers);
  });

  // ── Competitor stealing customers ──

  it('competitor with quality > player + 20 steals customers', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const withStealer = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 40 })],
        overallQuality: 40,
        customers: 1000,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 30,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      market: {
        ...baseMarket,
        competitors: [makeCompetitor({ productQuality: 70 })], // 70 > 40 + 20
      },
    });

    const withoutStealer = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 40 })],
        overallQuality: 40,
        customers: 1000,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 30,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      market: {
        ...baseMarket,
        competitors: [makeCompetitor({ productQuality: 55 })], // 55 < 40 + 20
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const stealResult = simulateWeek(withStealer);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const noStealResult = simulateWeek(withoutStealer);
    vi.restoreAllMocks();

    expect(stealResult.product.customers).toBeLessThan(noStealResult.product.customers);
  });

  it('multiple competitors can each steal customers independently', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const oneThief = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 30 })],
        overallQuality: 30,
        customers: 1000,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 20,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      market: {
        ...baseMarket,
        competitors: [makeCompetitor({ productQuality: 60 })],
      },
    });

    const twoThieves = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 30 })],
        overallQuality: 30,
        customers: 1000,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 20,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      market: {
        ...baseMarket,
        competitors: [
          makeCompetitor({ id: 'comp-1', productQuality: 60 }),
          makeCompetitor({ id: 'comp-2', name: 'Rival2', productQuality: 65 }),
        ],
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const oneResult = simulateWeek(oneThief);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const twoResult = simulateWeek(twoThieves);
    vi.restoreAllMocks();

    // Two thieves steal 2% each = 4% total vs one thief at 2%
    expect(twoResult.product.customers).toBeLessThan(oneResult.product.customers);
  });

  // ── Edge cases ──

  it('customers never go below 0', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const extremeChurn = makeCustomerState({
      meta: { difficulty: 'nightmare' },
      product: {
        features: [makeShippedFeature({ quality: 5 })],
        overallQuality: 5,
        customers: 3,
        churnRate: 0.25,
        bugs: 20,
        pmfScore: 5,
        techDebtTotal: 90,
        name: 'TestCo',
      },
      market: {
        ...baseMarket,
        competitors: [
          makeCompetitor({ productQuality: 90 }),
          makeCompetitor({ id: 'comp-2', name: 'Rival2', productQuality: 85 }),
        ],
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(extremeChurn);
    vi.restoreAllMocks();

    expect(result.product.customers).toBeGreaterThanOrEqual(0);
  });

  it('zero customers still allows growth (new user acquisition)', () => {
    const zeroCustomers = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 60, marketRelevance: 80 })],
        overallQuality: 60,
        customers: 0,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 40,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = simulateWeek(zeroCustomers);
    vi.restoreAllMocks();

    // baseMinGrowth = 2, plus PMF growth = (pmf/100)*(0*0.05+2) = pmf/100*2
    expect(result.product.customers).toBeGreaterThan(0);
  });

  it('churn rate is always clamped between 1% and 25%', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    // Push churn very low
    const lowChurnState = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 95 })],
        overallQuality: 95,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 80,
        techDebtTotal: 0,
        name: 'TestCo',
      },
      team: {
        teamSize: 5,
        avgSalary: 3000,
        morale: 90,
        aiAgents: [
          makeAgent({ type: 'support', capability: 100, reliability: 100 }),
          makeAgent({ id: 'a2', type: 'support', capability: 100, reliability: 100 }),
        ],
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'enterprise' as const,
        pricePerUnit: 100,
      },
      meta: { acquisitionChannel: 'community' },
      market: { ...baseMarket, competitors: [] },
    });

    // Push churn very high
    const highChurnState = makeCustomerState({
      meta: { difficulty: 'nightmare' },
      product: {
        features: [makeShippedFeature({ quality: 5 })],
        overallQuality: 5,
        customers: 500,
        churnRate: 0.05,
        bugs: 20,
        pmfScore: 5,
        techDebtTotal: 90,
        name: 'TestCo',
      },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'free' as const,
      },
      market: {
        ...baseMarket,
        competitors: [makeCompetitor({ productQuality: 95 })],
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lowResult = simulateWeek(lowChurnState);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const highResult = simulateWeek(highChurnState);
    vi.restoreAllMocks();

    expect(lowResult.product.churnRate).toBeGreaterThanOrEqual(0.01);
    expect(lowResult.product.churnRate).toBeLessThanOrEqual(0.25);
    expect(highResult.product.churnRate).toBeGreaterThanOrEqual(0.01);
    expect(highResult.product.churnRate).toBeLessThanOrEqual(0.25);
  });

  // ── Growth strategy effects ──

  it('growth-hack strategy boosts customer growth over sustainable', () => {
    const growthHack = makeCustomerState({
      meta: { growthStrategy: 'growth-hack' },
    });

    const sustainable = makeCustomerState({
      meta: { growthStrategy: 'sustainable' },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const growthResult = simulateWeek(growthHack);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const sustainableResult = simulateWeek(sustainable);
    vi.restoreAllMocks();

    // growth-hack: 1.5x, sustainable: 0.8x
    expect(growthResult.product.customers).toBeGreaterThan(sustainableResult.product.customers);
  });

  // ── Pricing model growth bonus ──

  it('free pricing model gives higher growth than enterprise', () => {
    const freeModel = makeCustomerState({
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'free' as const,
        pricePerUnit: 0,
      },
    });

    const enterpriseModel = makeCustomerState({
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'enterprise' as const,
        pricePerUnit: 100,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const freeResult = simulateWeek(freeModel);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const enterpriseResult = simulateWeek(enterpriseModel);
    vi.restoreAllMocks();

    // Free: pricingGrowthBonus = 2.0, Enterprise: 0.4
    expect(freeResult.product.customers).toBeGreaterThan(enterpriseResult.product.customers);
  });

  // ── Competitor market share pressure ──

  it('high competitor market share (> 80%) reduces growth significantly', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const dominantComp = makeCustomerState({
      market: {
        ...baseMarket,
        competitors: [
          makeCompetitor({ marketShare: 0.45, productQuality: 50 }),
          makeCompetitor({ id: 'comp-2', name: 'Rival2', marketShare: 0.40, productQuality: 50 }),
        ],
      },
    });

    const weakComp = makeCustomerState({
      market: {
        ...baseMarket,
        competitors: [makeCompetitor({ marketShare: 0.10, productQuality: 50 })],
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const dominantResult = simulateWeek(dominantComp);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const weakResult = simulateWeek(weakComp);
    vi.restoreAllMocks();

    // 0.85 > 0.8 -> competitorPressure = 0.5
    expect(dominantResult.product.customers).toBeLessThan(weakResult.product.customers);
  });

  // ── Support agent reduces churn ──

  it('support agents reduce effective churn rate and retain more customers', () => {
    const withSupport = makeCustomerState({
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
      team: {
        teamSize: 3,
        avgSalary: 3000,
        morale: 80,
        aiAgents: [makeAgent({ type: 'support', capability: 80, reliability: 90 })],
      },
    });

    const withoutSupport = makeCustomerState({
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
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const supportResult = simulateWeek(withSupport);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const noSupportResult = simulateWeek(withoutSupport);
    vi.restoreAllMocks();

    expect(supportResult.product.churnRate).toBeLessThan(noSupportResult.product.churnRate);
    expect(supportResult.product.customers).toBeGreaterThan(noSupportResult.product.customers);
  });

  // ── Analytics agent boosts PMF ──

  it('analytics agent boosts effective PMF score and customer growth', () => {
    const withAnalytics = makeCustomerState({
      team: {
        teamSize: 3,
        avgSalary: 3000,
        morale: 80,
        aiAgents: [makeAgent({ type: 'analytics', capability: 80, reliability: 90 })],
      },
    });

    const withoutAnalytics = makeCustomerState({
      team: { teamSize: 3, avgSalary: 3000, morale: 80, aiAgents: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const analyticsResult = simulateWeek(withAnalytics);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const noAnalyticsResult = simulateWeek(withoutAnalytics);
    vi.restoreAllMocks();

    // Analytics boost: capability/200 = 0.4, effectivePMF = pmf * 1.4
    expect(analyticsResult.product.pmfScore).toBeGreaterThan(noAnalyticsResult.product.pmfScore);
    expect(analyticsResult.product.customers).toBeGreaterThan(noAnalyticsResult.product.customers);
  });

  // ── User-growth product focus ──

  it('user-growth product focus boosts customer growth', () => {
    const userGrowth = makeCustomerState({
      meta: { productFocus: 'user-growth' },
    });

    const newFeatures = makeCustomerState({
      meta: { productFocus: 'new-features' },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const userGrowthResult = simulateWeek(userGrowth);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const newFeaturesResult = simulateWeek(newFeatures);
    vi.restoreAllMocks();

    // user-growth: 1.4x, new-features: 1.0x
    expect(userGrowthResult.product.customers).toBeGreaterThan(newFeaturesResult.product.customers);
  });

  // ── Acquisition channel effects ──

  it('content-seo channel compounds growth over weeks', () => {
    const earlySeo = makeCustomerState({
      meta: { acquisitionChannel: 'content-seo', contentSeoWeeks: 2 },
    });

    const lateSeo = makeCustomerState({
      meta: { acquisitionChannel: 'content-seo', contentSeoWeeks: 10 },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const earlyResult = simulateWeek(earlySeo);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lateResult = simulateWeek(lateSeo);
    vi.restoreAllMocks();

    // Early: 1.04x, Late: 1.20x
    expect(lateResult.product.customers).toBeGreaterThan(earlyResult.product.customers);
  });

  it('community channel reduces churn compared to organic', () => {
    const community = makeCustomerState({
      meta: { acquisitionChannel: 'community' },
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
    });

    const organic = makeCustomerState({
      meta: { acquisitionChannel: 'organic' },
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
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const communityResult = simulateWeek(community);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const organicResult = simulateWeek(organic);
    vi.restoreAllMocks();

    expect(communityResult.product.churnRate).toBeLessThan(organicResult.product.churnRate);
  });

  it('viral-loops channel adds extra customers when quality > 50', () => {
    const viralHighQuality = makeCustomerState({
      meta: { acquisitionChannel: 'viral-loops' },
      product: {
        features: [makeShippedFeature({ quality: 80 })],
        overallQuality: 80,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 60,
        techDebtTotal: 5,
        name: 'TestCo',
      },
    });

    const organicHighQuality = makeCustomerState({
      meta: { acquisitionChannel: 'organic' },
      product: {
        features: [makeShippedFeature({ quality: 80 })],
        overallQuality: 80,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 60,
        techDebtTotal: 5,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const viralResult = simulateWeek(viralHighQuality);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const organicResult = simulateWeek(organicHighQuality);
    vi.restoreAllMocks();

    expect(viralResult.product.customers).toBeGreaterThan(organicResult.product.customers);
  });

  it('viral-loops channel gives no bonus when quality <= 50', () => {
    const viralLowQuality = makeCustomerState({
      meta: { acquisitionChannel: 'viral-loops' },
      product: {
        features: [makeShippedFeature({ quality: 45 })],
        overallQuality: 45,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 40,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    const organicLowQuality = makeCustomerState({
      meta: { acquisitionChannel: 'organic' },
      product: {
        features: [makeShippedFeature({ quality: 45 })],
        overallQuality: 45,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 40,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const viralResult = simulateWeek(viralLowQuality);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const organicResult = simulateWeek(organicLowQuality);
    vi.restoreAllMocks();

    expect(viralResult.product.customers).toBe(organicResult.product.customers);
  });

  // ── Difficulty modifiers ──

  it('easy difficulty gives more customers and less churn than hard', () => {
    const easy = makeCustomerState({
      meta: { difficulty: 'easy' },
      product: {
        features: [makeShippedFeature({ quality: 50 })],
        overallQuality: 50,
        customers: 300,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    const hard = makeCustomerState({
      meta: { difficulty: 'hard' },
      product: {
        features: [makeShippedFeature({ quality: 50 })],
        overallQuality: 50,
        customers: 300,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const easyResult = simulateWeek(easy);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const hardResult = simulateWeek(hard);
    vi.restoreAllMocks();

    expect(easyResult.product.customers).toBeGreaterThan(hardResult.product.customers);
    expect(easyResult.product.churnRate).toBeLessThan(hardResult.product.churnRate);
  });

  // ── Founder biz skill effect ──

  it('high biz skill founder drives more customer growth', () => {
    const highBiz = makeCustomerState({
      founder: { techSkill: 30, bizSkill: 90, network: 50, learning: 50 },
    });

    const lowBiz = makeCustomerState({
      founder: { techSkill: 30, bizSkill: 20, network: 50, learning: 50 },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const highResult = simulateWeek(highBiz);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lowResult = simulateWeek(lowBiz);
    vi.restoreAllMocks();

    expect(highResult.product.customers).toBeGreaterThan(lowResult.product.customers);
  });

  // ── Reputation effect on growth ──

  it('higher reputation drives more customer growth', () => {
    // Use more customers (1000) so the reputation growth difference is visible after rounding
    const highRep = makeCustomerState({
      company: { reputation: 95, name: 'TestCo', stage: 'seed', valuation: 1_000_000, culture: 60, weekFounded: 1 },
      product: {
        features: [makeShippedFeature({ quality: 60, marketRelevance: 80 })],
        overallQuality: 60,
        customers: 1000,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    const lowRep = makeCustomerState({
      company: { reputation: 5, name: 'TestCo', stage: 'seed', valuation: 1_000_000, culture: 60, weekFounded: 1 },
      product: {
        features: [makeShippedFeature({ quality: 60, marketRelevance: 80 })],
        overallQuality: 60,
        customers: 1000,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 50,
        techDebtTotal: 10,
        name: 'TestCo',
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const highResult = simulateWeek(highRep);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lowResult = simulateWeek(lowRep);
    vi.restoreAllMocks();

    // reputationGrowth = reputation/100 * 1.5: 1.425 vs 0.075
    expect(highResult.product.customers).toBeGreaterThan(lowResult.product.customers);
  });

  // ── Sales outreach channel ──

  it('sales-outreach adds direct conversions when team >= 3', () => {
    const salesOutreach = makeCustomerState({
      meta: { acquisitionChannel: 'sales-outreach' },
      founder: { techSkill: 50, bizSkill: 80, network: 50, learning: 50 },
      team: { teamSize: 5, avgSalary: 3000, morale: 80, aiAgents: [] },
    });

    const organicSameTeam = makeCustomerState({
      meta: { acquisitionChannel: 'organic' },
      founder: { techSkill: 50, bizSkill: 80, network: 50, learning: 50 },
      team: { teamSize: 5, avgSalary: 3000, morale: 80, aiAgents: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const salesResult = simulateWeek(salesOutreach);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const organicResult = simulateWeek(organicSameTeam);
    vi.restoreAllMocks();

    expect(salesResult.product.customers).toBeGreaterThan(organicResult.product.customers);
  });

  it('sales-outreach gives no bonus with team < 3', () => {
    const salesSmallTeam = makeCustomerState({
      meta: { acquisitionChannel: 'sales-outreach' },
      founder: { techSkill: 50, bizSkill: 80, network: 50, learning: 50 },
      team: { teamSize: 2, avgSalary: 3000, morale: 80, aiAgents: [] },
    });

    const organicSmallTeam = makeCustomerState({
      meta: { acquisitionChannel: 'organic' },
      founder: { techSkill: 50, bizSkill: 80, network: 50, learning: 50 },
      team: { teamSize: 2, avgSalary: 3000, morale: 80, aiAgents: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const salesResult = simulateWeek(salesSmallTeam);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const organicResult = simulateWeek(organicSmallTeam);
    vi.restoreAllMocks();

    expect(salesResult.product.customers).toBe(organicResult.product.customers);
  });

  // ── Paid ads channel ──

  it('paid-ads channel doubles marketing spend effectiveness', () => {
    const paidAds = makeCustomerState({
      meta: { acquisitionChannel: 'paid-ads' },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'subscription' as const,
        pricePerUnit: 20,
        marketingSpend: 3000,
      },
    });

    const organic = makeCustomerState({
      meta: { acquisitionChannel: 'organic' },
      finances: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').finances,
        pricingModel: 'subscription' as const,
        pricePerUnit: 20,
        marketingSpend: 3000,
      },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const paidResult = simulateWeek(paidAds);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const organicResult = simulateWeek(organic);
    vi.restoreAllMocks();

    expect(paidResult.product.customers).toBeGreaterThan(organicResult.product.customers);
  });

  // ── Dead competitors ──

  it('dead competitors do not steal customers or exert market pressure', () => {
    const baseMarket = createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').market;

    const deadComp = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 40 })],
        overallQuality: 40,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 30,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      market: {
        ...baseMarket,
        competitors: [makeCompetitor({ productQuality: 90, marketShare: 0.5, alive: false })],
      },
    });

    const noComp = makeCustomerState({
      product: {
        features: [makeShippedFeature({ quality: 40 })],
        overallQuality: 40,
        customers: 500,
        churnRate: 0.05,
        bugs: 0,
        pmfScore: 30,
        techDebtTotal: 10,
        name: 'TestCo',
      },
      market: { ...baseMarket, competitors: [] },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const deadResult = simulateWeek(deadComp);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const noCompResult = simulateWeek(noComp);
    vi.restoreAllMocks();

    expect(deadResult.product.customers).toBe(noCompResult.product.customers);
    expect(deadResult.product.churnRate).toBe(noCompResult.product.churnRate);
  });
});
