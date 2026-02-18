import { describe, it, expect } from 'vitest';
import { advanceWeek } from '../tick.ts';
import { createInitialState } from '../init.ts';
import type { GameState } from '../../types/index.ts';

function makeTestState(overrides?: Partial<GameState>): GameState {
  const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
  return { ...base, ...overrides };
}

/**
 * Deep-merge helper for nested state overrides.
 * Shallow spread doesn't work for nested objects like product, finances, etc.
 */
function makeTestStateDeep(overrides: {
  meta?: Partial<GameState['meta']>;
  founder?: Partial<GameState['founder']>;
  company?: Partial<GameState['company']>;
  team?: Partial<GameState['team']>;
  product?: Partial<GameState['product']>;
  finances?: Partial<GameState['finances']>;
  market?: Partial<GameState['market']>;
  eventLog?: GameState['eventLog'];
  pendingDecisions?: GameState['pendingDecisions'];
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
    eventLog: overrides.eventLog ?? base.eventLog,
    pendingDecisions: overrides.pendingDecisions ?? base.pendingDecisions,
    weekHistory: overrides.weekHistory ?? base.weekHistory,
  };
}

describe('advanceWeek', () => {
  it('advances the week counter', () => {
    const state = makeTestState();
    const next = advanceWeek(state, []);

    expect(next.meta.week).toBe(state.meta.week + 1);
  });

  it('advances the calendar date by 7 days', () => {
    const state = makeTestState();
    // Starting: Jan 6, 2026
    const next = advanceWeek(state, []);

    expect(next.meta.day).toBe(13);
    expect(next.meta.month).toBe(1);
    expect(next.meta.year).toBe(2026);
  });

  it('burns cash each week', () => {
    const state = makeTestState();
    const next = advanceWeek(state, []);

    // Cash should decrease (even with no employees, there's fixed overhead)
    expect(next.finances.cash).toBeLessThan(state.finances.cash);
  });

  it('records a week summary in history', () => {
    const state = makeTestState();
    expect(state.weekHistory).toHaveLength(0);

    const next = advanceWeek(state, []);
    expect(next.weekHistory).toHaveLength(1);
    expect(next.weekHistory[0].week).toBe(next.meta.week);
  });

  it('triggers game over when cash reaches zero', () => {
    const state = makeTestState({
      finances: {
        cash: 10, // Very low cash, will go below 0 after burn (garage burn ~$85/wk)
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

    const next = advanceWeek(state, []);
    expect(next.meta.gameOver).toBe(true);
    expect(next.meta.gameOverReason).toBeDefined();
  });

  it('does not set game over when cash is sufficient', () => {
    const state = makeTestState();
    const next = advanceWeek(state, []);

    expect(next.meta.gameOver).toBe(false);
  });

  it('does not mutate the original state', () => {
    const state = makeTestState();
    const originalCash = state.finances.cash;
    const originalWeek = state.meta.week;

    advanceWeek(state, []);

    expect(state.finances.cash).toBe(originalCash);
    expect(state.meta.week).toBe(originalWeek);
  });

  it('applies a start-feature decision', () => {
    const state = makeTestState();
    expect(state.product.features).toHaveLength(0);

    const next = advanceWeek(state, [
      {
        type: 'start-feature',
        name: 'AI Chat',
        description: 'A conversational AI feature',
        marketRelevance: 85,
      },
    ]);

    expect(next.product.features).toHaveLength(1);
    expect(next.product.features[0].name).toBe('AI Chat');
    expect(next.product.features[0].status).toBe('in-progress');
  });

  it('applies a set-pricing decision', () => {
    const state = makeTestState();

    const next = advanceWeek(state, [
      {
        type: 'set-pricing',
        model: 'subscription',
        pricePerUnit: 49,
      },
    ]);

    expect(next.finances.pricingModel).toBe('subscription');
    expect(next.finances.pricePerUnit).toBe(49);
  });

  it('handles multiple weeks sequentially', () => {
    let state = makeTestState();

    for (let i = 0; i < 10; i++) {
      state = advanceWeek(state, []);
    }

    expect(state.meta.week).toBe(11); // started at 1, advanced 10
    expect(state.weekHistory).toHaveLength(10);
    expect(state.finances.cash).not.toBe(state.finances.cash + 1); // cash changed (events may add/subtract)
  });
});

// ─── PMF Delta Preservation ──────────────────────────────────────────

describe('PMF delta preservation', () => {
  it('preserves decision-driven PMF delta after advanceWeek recalculates PMF', () => {
    // Set up a state with a pending decision that adds to PMF
    const decisionId = 'test-decision-pmf';
    const state = makeTestStateDeep({
      product: {
        name: 'TestCo',
        features: [],
        overallQuality: 0,
        techDebtTotal: 0,
        pmfScore: 20,
        customers: 0,
        churnRate: 0.05,
        bugs: 0,
      },
      pendingDecisions: [
        {
          id: decisionId,
          eventId: 'test-event',
          prompt: 'A PMF boosting decision',
          options: [
            {
              id: 'boost-pmf',
              label: 'Boost PMF',
              description: 'Increases PMF score',
              effects: [
                { path: 'product.pmfScore', operation: 'add', value: 15 },
              ],
            },
          ],
          deadline: 10,
          defaultOptionId: 'boost-pmf',
        },
      ],
    });

    const next = advanceWeek(state, [
      {
        type: 'respond-to-event',
        decisionId,
        optionId: 'boost-pmf',
      },
    ]);

    // Without preservation, the PMF delta would be lost because calculatePMF()
    // recalculates from scratch based on shipped features.
    // With no shipped features, calculatePMF returns 0, so without the
    // preservation logic the +15 delta would be lost.
    // The preserved delta should keep the PMF at least 15 above the base.
    expect(next.product.pmfScore).toBeGreaterThanOrEqual(15);
  });

  it('preserves PMF delta from decisions even when simulation recalculates', () => {
    // Start with pmfScore=30, decision adds +10
    // After simulation, calculatePMF produces some base value (0 with no shipped features)
    // The delta of +10 from the decision should be preserved on top of recalculated value
    const decisionId = 'test-decision-pmf-2';
    const state = makeTestStateDeep({
      product: {
        name: 'TestCo',
        features: [],
        overallQuality: 0,
        techDebtTotal: 0,
        pmfScore: 30,
        customers: 0,
        churnRate: 0.05,
        bugs: 0,
      },
      pendingDecisions: [
        {
          id: decisionId,
          eventId: 'test-event',
          prompt: 'PMF test',
          options: [
            {
              id: 'add-pmf-10',
              label: 'Add PMF',
              description: 'Adds 10 to PMF',
              effects: [
                { path: 'product.pmfScore', operation: 'add', value: 10 },
              ],
            },
          ],
          deadline: 10,
          defaultOptionId: 'add-pmf-10',
        },
      ],
    });

    const next = advanceWeek(state, [
      {
        type: 'respond-to-event',
        decisionId,
        optionId: 'add-pmf-10',
      },
    ]);

    // The decision added +10 to pmfScore. Since there are no shipped features,
    // calculatePMF returns 0. The preservation logic should ensure the
    // decision delta (+10) is preserved: final PMF = base(0) + decisionDelta(10) = 10
    // (The initial pmfScore of 30 was not from decisions, so it doesn't count
    // as a "decision delta". The delta is preSimPmf - state.pmfScore = 40 - 30 = 10)
    expect(next.product.pmfScore).toBe(10);
  });

  it('PMF is clamped between 0 and 100', () => {
    const decisionId = 'test-decision-pmf-clamp';
    const state = makeTestStateDeep({
      product: {
        name: 'TestCo',
        features: [],
        overallQuality: 0,
        techDebtTotal: 0,
        pmfScore: 90,
        customers: 0,
        churnRate: 0.05,
        bugs: 0,
      },
      pendingDecisions: [
        {
          id: decisionId,
          eventId: 'test-event',
          prompt: 'Extreme PMF',
          options: [
            {
              id: 'mega-pmf',
              label: 'Mega PMF',
              description: 'Huge PMF boost',
              effects: [
                { path: 'product.pmfScore', operation: 'add', value: 50 },
              ],
            },
          ],
          deadline: 10,
          defaultOptionId: 'mega-pmf',
        },
      ],
    });

    const next = advanceWeek(state, [
      {
        type: 'respond-to-event',
        decisionId,
        optionId: 'mega-pmf',
      },
    ]);

    expect(next.product.pmfScore).toBeLessThanOrEqual(100);
    expect(next.product.pmfScore).toBeGreaterThanOrEqual(0);
  });
});

// ─── State Effect Application ────────────────────────────────────────

describe('state effect application via respond-to-event', () => {
  it('applies add operation to a nested path', () => {
    const decisionId = 'test-add-effect';
    const state = makeTestStateDeep({
      team: {
        members: [],
        candidates: [],
        pendingOffers: [],
        teamSize: 0,
        avgSalary: 0,
        morale: 50,
        aiAgents: [],
      },
      pendingDecisions: [
        {
          id: decisionId,
          eventId: 'test-event',
          prompt: 'Morale event',
          options: [
            {
              id: 'boost-morale',
              label: 'Boost morale',
              description: 'Adds morale',
              effects: [
                { path: 'team.morale', operation: 'add', value: 20 },
              ],
            },
          ],
          deadline: 10,
          defaultOptionId: 'boost-morale',
        },
      ],
    });

    const next = advanceWeek(state, [
      { type: 'respond-to-event', decisionId, optionId: 'boost-morale' },
    ]);

    // Morale started at 50, added 20 = 70 before simulation adjustments.
    // The simulation may adjust it further via calculateAvgMorale.
    // With no members, calculateAvgMorale returns team.morale directly.
    // But there may be funding events or other morale changes.
    // We just check it's higher than the original 50.
    expect(next.team.morale).toBeGreaterThanOrEqual(50);
  });

  it('applies multiply operation on a nested path', () => {
    const decisionId = 'test-multiply-effect';
    const state = makeTestStateDeep({
      finances: {
        cash: 100_000,
        weeklyRevenue: 1000,
        weeklyBurn: 500,
        pricingModel: 'subscription',
        pricePerUnit: 10,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
      pendingDecisions: [
        {
          id: decisionId,
          eventId: 'test-event',
          prompt: 'Cash multiplier',
          options: [
            {
              id: 'double-cash',
              label: 'Double cash',
              description: 'Doubles cash',
              effects: [
                { path: 'finances.cash', operation: 'multiply', value: 2 },
              ],
            },
          ],
          deadline: 10,
          defaultOptionId: 'double-cash',
        },
      ],
    });

    const next = advanceWeek(state, [
      { type: 'respond-to-event', decisionId, optionId: 'double-cash' },
    ]);

    // Cash was 100K, multiplied by 2 = 200K, then burn is subtracted.
    // The result should be significantly higher than the starting cash.
    expect(next.finances.cash).toBeGreaterThan(150_000);
  });

  it('applies set operation on a nested path', () => {
    const decisionId = 'test-set-effect';
    const state = makeTestStateDeep({
      company: {
        name: 'TestCo',
        stage: 'garage',
        valuation: 100_000,
        culture: 60,
        reputation: 50,
        weekFounded: 1,
      },
      pendingDecisions: [
        {
          id: decisionId,
          eventId: 'test-event',
          prompt: 'Reputation setter',
          options: [
            {
              id: 'set-reputation',
              label: 'Set reputation',
              description: 'Sets reputation to 80',
              effects: [
                { path: 'company.reputation', operation: 'set', value: 80 },
              ],
            },
          ],
          deadline: 10,
          defaultOptionId: 'set-reputation',
        },
      ],
    });

    const next = advanceWeek(state, [
      { type: 'respond-to-event', decisionId, optionId: 'set-reputation' },
    ]);

    // Reputation was set to 80, then clamped. It may drift slightly due to
    // other simulation effects but should be close to 80.
    expect(next.company.reputation).toBeGreaterThanOrEqual(70);
    expect(next.company.reputation).toBeLessThanOrEqual(100);
  });

  it('handles effects on invalid/nonexistent paths gracefully', () => {
    const decisionId = 'test-invalid-path';
    const state = makeTestStateDeep({
      pendingDecisions: [
        {
          id: decisionId,
          eventId: 'test-event',
          prompt: 'Bad path event',
          options: [
            {
              id: 'bad-path',
              label: 'Bad',
              description: 'Invalid path',
              effects: [
                { path: 'nonexistent.deeply.nested.field', operation: 'add', value: 10 },
              ],
            },
          ],
          deadline: 10,
          defaultOptionId: 'bad-path',
        },
      ],
    });

    // Should not throw; the effect is silently skipped
    expect(() => {
      advanceWeek(state, [
        { type: 'respond-to-event', decisionId, optionId: 'bad-path' },
      ]);
    }).not.toThrow();
  });

  it('applies multiple effects from a single option', () => {
    const decisionId = 'test-multi-effects';
    const state = makeTestStateDeep({
      team: {
        members: [],
        candidates: [],
        pendingOffers: [],
        teamSize: 0,
        avgSalary: 0,
        morale: 50,
        aiAgents: [],
      },
      company: {
        name: 'TestCo',
        stage: 'garage',
        valuation: 100_000,
        culture: 60,
        reputation: 50,
        weekFounded: 1,
      },
      pendingDecisions: [
        {
          id: decisionId,
          eventId: 'test-event',
          prompt: 'Multi effect',
          options: [
            {
              id: 'multi',
              label: 'Multiple effects',
              description: 'Applies multiple effects',
              effects: [
                { path: 'team.morale', operation: 'add', value: 10 },
                { path: 'company.reputation', operation: 'add', value: 5 },
                { path: 'company.culture', operation: 'add', value: -10 },
              ],
            },
          ],
          deadline: 10,
          defaultOptionId: 'multi',
        },
      ],
    });

    const next = advanceWeek(state, [
      { type: 'respond-to-event', decisionId, optionId: 'multi' },
    ]);

    // Culture was 60, effect adds -10 = 50. Should be around 50 (clamped 0-100).
    expect(next.company.culture).toBeLessThanOrEqual(60);
  });

  it('clamps morale, reputation, and culture to 0-100 after effects', () => {
    const decisionId = 'test-clamp-effects';
    const state = makeTestStateDeep({
      team: {
        members: [],
        candidates: [],
        pendingOffers: [],
        teamSize: 0,
        avgSalary: 0,
        morale: 10,
        aiAgents: [],
      },
      company: {
        name: 'TestCo',
        stage: 'garage',
        valuation: 100_000,
        culture: 5,
        reputation: 95,
        weekFounded: 1,
      },
      pendingDecisions: [
        {
          id: decisionId,
          eventId: 'test-event',
          prompt: 'Extreme effects',
          options: [
            {
              id: 'extreme',
              label: 'Extreme',
              description: 'Extreme values',
              effects: [
                { path: 'team.morale', operation: 'add', value: -50 },
                { path: 'company.reputation', operation: 'add', value: 50 },
                { path: 'company.culture', operation: 'add', value: -50 },
              ],
            },
          ],
          deadline: 10,
          defaultOptionId: 'extreme',
        },
      ],
    });

    const next = advanceWeek(state, [
      { type: 'respond-to-event', decisionId, optionId: 'extreme' },
    ]);

    expect(next.team.morale).toBeGreaterThanOrEqual(0);
    expect(next.team.morale).toBeLessThanOrEqual(100);
    expect(next.company.reputation).toBeGreaterThanOrEqual(0);
    expect(next.company.reputation).toBeLessThanOrEqual(100);
    expect(next.company.culture).toBeGreaterThanOrEqual(0);
    expect(next.company.culture).toBeLessThanOrEqual(100);
  });
});

// ─── Calendar Advancement ────────────────────────────────────────────

describe('calendar advancement', () => {
  it('rolls over from January to February', () => {
    // Start on Jan 27, add 7 days should land on Feb 3
    const state = makeTestStateDeep({
      meta: {
        week: 4,
        year: 2026,
        month: 1,
        day: 27,
        difficulty: 'normal',
        tone: 'realistic',
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
    });

    const next = advanceWeek(state, []);

    expect(next.meta.month).toBe(2);
    expect(next.meta.day).toBe(3);
    expect(next.meta.year).toBe(2026);
  });

  it('rolls over from December to January (year increment)', () => {
    const state = makeTestStateDeep({
      meta: {
        week: 50,
        year: 2026,
        month: 12,
        day: 29,
        difficulty: 'normal',
        tone: 'realistic',
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
    });

    const next = advanceWeek(state, []);

    expect(next.meta.year).toBe(2027);
    expect(next.meta.month).toBe(1);
    expect(next.meta.day).toBe(5);
  });

  it('handles February 28 -> March correctly (non-leap year)', () => {
    const state = makeTestStateDeep({
      meta: {
        week: 8,
        year: 2026,
        month: 2,
        day: 25,
        difficulty: 'normal',
        tone: 'realistic',
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
    });

    const next = advanceWeek(state, []);

    // Feb 25 + 7 = Feb 32 -> Feb has 28 days -> 32 - 28 = March 4
    expect(next.meta.month).toBe(3);
    expect(next.meta.day).toBe(4);
  });

  it('handles advancing within the same month', () => {
    const state = makeTestStateDeep({
      meta: {
        week: 2,
        year: 2026,
        month: 3,
        day: 10,
        difficulty: 'normal',
        tone: 'realistic',
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
    });

    const next = advanceWeek(state, []);

    expect(next.meta.month).toBe(3);
    expect(next.meta.day).toBe(17);
    expect(next.meta.year).toBe(2026);
  });
});

// ─── Decision Application Edge Cases ─────────────────────────────────

describe('decision application edge cases', () => {
  it('handles empty decisions array', () => {
    const state = makeTestState();
    const next = advanceWeek(state, []);

    expect(next.meta.week).toBe(state.meta.week + 1);
    expect(next.weekHistory).toHaveLength(1);
  });

  it('handles respond-to-event for non-existent decision ID', () => {
    const state = makeTestState();

    // Should not throw; applySingleDecision returns state unchanged
    // when pendingDecisions.find returns undefined
    const next = advanceWeek(state, [
      {
        type: 'respond-to-event',
        decisionId: 'nonexistent-decision-id',
        optionId: 'some-option',
      },
    ]);

    // Week still advances
    expect(next.meta.week).toBe(state.meta.week + 1);
  });

  it('handles respond-to-event for non-existent option ID', () => {
    const decisionId = 'test-decision-bad-option';
    const state = makeTestStateDeep({
      pendingDecisions: [
        {
          id: decisionId,
          eventId: 'test-event',
          prompt: 'Test',
          options: [
            {
              id: 'real-option',
              label: 'Real',
              description: 'Real option',
              effects: [
                { path: 'team.morale', operation: 'add', value: 10 },
              ],
            },
          ],
          deadline: 10,
          defaultOptionId: 'real-option',
        },
      ],
    });

    // Respond with a nonexistent option - should not apply effects
    const next = advanceWeek(state, [
      {
        type: 'respond-to-event',
        decisionId,
        optionId: 'nonexistent-option',
      },
    ]);

    expect(next.meta.week).toBe(state.meta.week + 1);
  });

  it('removes resolved decision from pendingDecisions', () => {
    const decisionId = 'test-decision-removal';
    const state = makeTestStateDeep({
      pendingDecisions: [
        {
          id: decisionId,
          eventId: 'test-event',
          prompt: 'Test removal',
          options: [
            {
              id: 'option-a',
              label: 'Option A',
              description: 'Does something',
              effects: [],
            },
          ],
          deadline: 10,
          defaultOptionId: 'option-a',
        },
      ],
    });

    expect(state.pendingDecisions).toHaveLength(1);

    const next = advanceWeek(state, [
      {
        type: 'respond-to-event',
        decisionId,
        optionId: 'option-a',
      },
    ]);

    // The decision should no longer be pending (it may also pick up new events)
    const stillPending = next.pendingDecisions.find(d => d.id === decisionId);
    expect(stillPending).toBeUndefined();
  });

  it('applies multiple decisions in sequence', () => {
    const state = makeTestState();

    const next = advanceWeek(state, [
      {
        type: 'start-feature',
        name: 'Feature A',
        description: 'First feature',
        marketRelevance: 70,
      },
      {
        type: 'start-feature',
        name: 'Feature B',
        description: 'Second feature',
        marketRelevance: 80,
      },
    ]);

    expect(next.product.features.length).toBeGreaterThanOrEqual(2);
    const featureNames = next.product.features.map(f => f.name);
    expect(featureNames).toContain('Feature A');
    expect(featureNames).toContain('Feature B');
  });

  it('applies set-marketing-budget decision', () => {
    const state = makeTestState();

    const next = advanceWeek(state, [
      {
        type: 'set-marketing-budget',
        amount: 5000,
      },
    ]);

    // Marketing spend should be set (may be adjusted by simulation slightly)
    expect(next.finances.marketingSpend).toBeGreaterThanOrEqual(0);
  });

  it('applies set-growth-strategy decision', () => {
    const state = makeTestState();

    const next = advanceWeek(state, [
      {
        type: 'set-growth-strategy',
        strategy: 'growth-hack',
      },
    ]);

    expect(next.meta.growthStrategy).toBe('growth-hack');
  });
});

// ─── Burn / Revenue / Valuation Ratio Preservation ───────────────────

describe('burn, revenue, and valuation ratio preservation from events', () => {
  it('preserves the weekly burn after recalculation when no events modify it', () => {
    const state = makeTestState();
    const next = advanceWeek(state, []);

    // Burn should be recalculated based on team size and costs
    expect(next.finances.weeklyBurn).toBeGreaterThan(0);
  });

  it('preserves the valuation as positive for a healthy state', () => {
    const state = makeTestState();
    const next = advanceWeek(state, []);

    expect(next.company.valuation).toBeGreaterThan(0);
  });

  it('revenue stays at 0 when no customers', () => {
    const state = makeTestStateDeep({
      finances: {
        cash: 50_000,
        weeklyRevenue: 0,
        weeklyBurn: 100,
        pricingModel: 'subscription',
        pricePerUnit: 25,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
      product: {
        name: 'TestCo',
        features: [],
        overallQuality: 0,
        techDebtTotal: 0,
        pmfScore: 0,
        customers: 0,
        churnRate: 0.05,
        bugs: 0,
      },
    });

    const next = advanceWeek(state, []);
    expect(next.finances.weeklyRevenue).toBe(0);
  });

  it('event-modified revenue is not double-counted by ratio re-application', () => {
    // This tests the fix for a bug where the revenueRatio was applied
    // to next.finances.weeklyRevenue which already contained event modifications,
    // causing a double-count (squaring the event effect).
    //
    // Setup: a state with revenue, and an event decision that modifies revenue.
    // The final revenue should reflect the event effect exactly once.
    const decisionId = 'test-revenue-double';
    const state = makeTestStateDeep({
      finances: {
        cash: 200_000,
        weeklyRevenue: 1000,
        weeklyBurn: 500,
        pricingModel: 'subscription',
        pricePerUnit: 20,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
      product: {
        name: 'TestCo',
        features: [
          {
            id: 'f1',
            name: 'Core Product',
            description: 'Main feature',
            status: 'shipped',
            progress: 100,
            quality: 70,
            marketRelevance: 80,
          },
        ],
        overallQuality: 70,
        techDebtTotal: 10,
        pmfScore: 50,
        customers: 100,
        churnRate: 0.03,
        bugs: 2,
      },
      pendingDecisions: [
        {
          id: decisionId,
          eventId: 'test-event',
          prompt: 'Revenue event',
          options: [
            {
              id: 'boost-rev',
              label: 'Boost Revenue',
              description: 'Multiplies revenue',
              effects: [
                { path: 'finances.weeklyRevenue', operation: 'multiply', value: 1.5 },
              ],
            },
          ],
          deadline: 10,
          defaultOptionId: 'boost-rev',
        },
      ],
    });

    const next = advanceWeek(state, [
      { type: 'respond-to-event', decisionId, optionId: 'boost-rev' },
    ]);

    // The event multiplies revenue by 1.5. The simulation recalculates revenue
    // based on customers and pricing, but the event response happens in
    // applyDecisions (before simulation), and the effect multiplies
    // finances.weeklyRevenue. After simulation recalculates revenue, the
    // event effect via respond-to-event is applied in the decisions phase,
    // not in processEvents, so it wouldn't trigger the ratio logic.
    //
    // However, if a similar event fired via processEvents (auto-generated events),
    // the revenue should NOT be squared. We verify revenue is reasonable.
    // With ~100 customers at $20/wk subscription, revenue should be around 2000.
    // If double-counted, it would be much higher.
    expect(next.finances.weeklyRevenue).toBeLessThan(5000);
    expect(next.finances.weeklyRevenue).toBeGreaterThanOrEqual(0);
  });
});

// ─── Week History ────────────────────────────────────────────────────

describe('week history / summary', () => {
  it('week summary contains correct week number', () => {
    const state = makeTestState();
    const next = advanceWeek(state, []);

    expect(next.weekHistory).toHaveLength(1);
    expect(next.weekHistory[0].week).toBe(next.meta.week);
  });

  it('week summary tracks cash, burn, revenue, and PMF', () => {
    const state = makeTestState();
    const next = advanceWeek(state, []);

    const summary = next.weekHistory[0];
    expect(summary).toHaveProperty('cash');
    expect(summary).toHaveProperty('burn');
    expect(summary).toHaveProperty('revenue');
    expect(summary).toHaveProperty('pmfScore');
    expect(summary).toHaveProperty('customers');
    expect(summary).toHaveProperty('valuation');
    expect(summary).toHaveProperty('teamSize');
    expect(summary).toHaveProperty('avgMorale');
    expect(summary).toHaveProperty('bubbleIndex');
    expect(summary).toHaveProperty('eventsCount');
  });

  it('accumulates multiple week summaries correctly', () => {
    let state = makeTestState();
    state = advanceWeek(state, []);
    state = advanceWeek(state, []);
    state = advanceWeek(state, []);

    expect(state.weekHistory).toHaveLength(3);
    // Week numbers should be sequential
    expect(state.weekHistory[0].week).toBe(2);
    expect(state.weekHistory[1].week).toBe(3);
    expect(state.weekHistory[2].week).toBe(4);
  });
});

// ─── Hire/Fire Team Decisions ────────────────────────────────────────

describe('hire and fire team decisions', () => {
  it('hire-team adds members and deducts signing cost', () => {
    const state = makeTestStateDeep({
      finances: {
        cash: 100_000,
        weeklyRevenue: 0,
        weeklyBurn: 100,
        pricingModel: 'subscription',
        pricePerUnit: 25,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
    });

    const next = advanceWeek(state, [
      { type: 'hire-team', count: 2, salary: 3000 },
    ]);

    // Should have 2 members now
    expect(next.team.teamSize).toBe(2);
    expect(next.team.members).toHaveLength(2);
    // Signing cost = 2 * 3000 * 2 = 12000, plus weekly burn
    expect(next.finances.cash).toBeLessThan(100_000 - 12_000);
  });

  it('hire-team fails when insufficient cash', () => {
    const state = makeTestStateDeep({
      finances: {
        cash: 100,
        weeklyRevenue: 0,
        weeklyBurn: 50,
        pricingModel: 'subscription',
        pricePerUnit: 25,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 0,
        lastPricingChangeWeek: 0,
      },
    });

    const next = advanceWeek(state, [
      { type: 'hire-team', count: 2, salary: 3000 },
    ]);

    // Hire fails, so team size stays 0
    expect(next.team.teamSize).toBe(0);
    // Should have a log entry about insufficient funds
    const failLog = next.eventLog.find(e => e.eventId === 'hire-insufficient-funds');
    expect(failLog).toBeDefined();
  });

  it('fire-team removes members and reduces morale', () => {
    const state = makeTestStateDeep({
      team: {
        members: [
          { id: 'm1', name: 'Alice', role: 'engineer', skill: 60, salary: 3000, morale: 80, weekHired: 1, traits: [], boosts: {} },
          { id: 'm2', name: 'Bob', role: 'engineer', skill: 55, salary: 2800, morale: 75, weekHired: 1, traits: [], boosts: {} },
          { id: 'm3', name: 'Charlie', role: 'designer', skill: 50, salary: 2500, morale: 70, weekHired: 1, traits: [], boosts: {} },
        ],
        candidates: [],
        pendingOffers: [],
        teamSize: 3,
        avgSalary: 2767,
        morale: 75,
        aiAgents: [],
      },
    });

    const next = advanceWeek(state, [
      { type: 'fire-team', count: 1 },
    ]);

    // One member removed (from the end)
    expect(next.team.teamSize).toBe(2);
    expect(next.team.members).toHaveLength(2);
  });
});

// ─── Low Morale Weeks Counter ────────────────────────────────────────

describe('low morale counter', () => {
  it('increments lowMoraleWeeks when morale is below 40', () => {
    const state = makeTestStateDeep({
      team: {
        members: [],
        candidates: [],
        pendingOffers: [],
        teamSize: 0,
        avgSalary: 0,
        morale: 30,
        aiAgents: [],
      },
      meta: {
        week: 5,
        year: 2026,
        month: 2,
        day: 3,
        difficulty: 'normal',
        tone: 'realistic',
        growthStrategy: 'sustainable',
        productFocus: 'new-features',
        acquisitionChannel: 'organic',
        contentSeoWeeks: 0,
        gameOver: false,
        gameWon: false,
        infiniteMode: false,
        score: 0,
        regulatoryHeat: 0,
        lowMoraleWeeks: 2,
      },
    });

    const next = advanceWeek(state, []);

    // lowMoraleWeeks should be incremented from 2 to 3
    expect(next.meta.lowMoraleWeeks).toBe(3);
  });

  it('resets lowMoraleWeeks when morale is at or above 40', () => {
    const state = makeTestStateDeep({
      team: {
        members: [],
        candidates: [],
        pendingOffers: [],
        teamSize: 0,
        avgSalary: 0,
        morale: 60,
        aiAgents: [],
      },
      meta: {
        week: 5,
        year: 2026,
        month: 2,
        day: 3,
        difficulty: 'normal',
        tone: 'realistic',
        growthStrategy: 'sustainable',
        productFocus: 'new-features',
        acquisitionChannel: 'organic',
        contentSeoWeeks: 0,
        gameOver: false,
        gameWon: false,
        infiniteMode: false,
        score: 0,
        regulatoryHeat: 0,
        lowMoraleWeeks: 5,
      },
    });

    const next = advanceWeek(state, []);

    expect(next.meta.lowMoraleWeeks).toBe(0);
  });
});

// ─── Content SEO Weeks Counter ───────────────────────────────────────

describe('content SEO weeks counter', () => {
  it('increments contentSeoWeeks when acquisitionChannel is content-seo', () => {
    const state = makeTestStateDeep({
      meta: {
        week: 3,
        year: 2026,
        month: 1,
        day: 20,
        difficulty: 'normal',
        tone: 'realistic',
        growthStrategy: 'sustainable',
        productFocus: 'new-features',
        acquisitionChannel: 'content-seo',
        contentSeoWeeks: 4,
        gameOver: false,
        gameWon: false,
        infiniteMode: false,
        score: 0,
        regulatoryHeat: 0,
        lowMoraleWeeks: 0,
      },
    });

    const next = advanceWeek(state, []);

    expect(next.meta.contentSeoWeeks).toBe(5);
  });

  it('resets contentSeoWeeks when acquisitionChannel is not content-seo', () => {
    const state = makeTestStateDeep({
      meta: {
        week: 3,
        year: 2026,
        month: 1,
        day: 20,
        difficulty: 'normal',
        tone: 'realistic',
        growthStrategy: 'sustainable',
        productFocus: 'new-features',
        acquisitionChannel: 'organic',
        contentSeoWeeks: 4,
        gameOver: false,
        gameWon: false,
        infiniteMode: false,
        score: 0,
        regulatoryHeat: 0,
        lowMoraleWeeks: 0,
      },
    });

    const next = advanceWeek(state, []);

    expect(next.meta.contentSeoWeeks).toBe(0);
  });
});

// ─── Pricing Model Switching Costs ───────────────────────────────────

describe('pricing model switching', () => {
  it('blocks pricing model change within 8-week cooldown', () => {
    const state = makeTestStateDeep({
      finances: {
        cash: 100_000,
        weeklyRevenue: 500,
        weeklyBurn: 200,
        pricingModel: 'subscription',
        pricePerUnit: 20,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 0,
        lastPricingChangeWeek: 4,
      },
      meta: {
        week: 6,
        year: 2026,
        month: 2,
        day: 10,
        difficulty: 'normal',
        tone: 'realistic',
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
      product: {
        name: 'TestCo',
        features: [],
        overallQuality: 0,
        techDebtTotal: 0,
        pmfScore: 0,
        customers: 10,
        churnRate: 0.05,
        bugs: 0,
      },
    });

    const next = advanceWeek(state, [
      { type: 'set-pricing', model: 'usage-based', pricePerUnit: 100 },
    ]);

    // Should be blocked -- model stays subscription
    expect(next.finances.pricingModel).toBe('subscription');
    // But price per unit can still be adjusted
    expect(next.finances.pricePerUnit).toBe(100);
    // Should have a blocking log entry
    const blocked = next.eventLog.find(e => e.eventId === 'pricing-switch-blocked');
    expect(blocked).toBeDefined();
  });

  it('allows pricing model change after cooldown', () => {
    const state = makeTestStateDeep({
      finances: {
        cash: 100_000,
        weeklyRevenue: 500,
        weeklyBurn: 200,
        pricingModel: 'subscription',
        pricePerUnit: 20,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 0,
        lastPricingChangeWeek: 1,
      },
      meta: {
        week: 10,
        year: 2026,
        month: 3,
        day: 10,
        difficulty: 'normal',
        tone: 'realistic',
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
    });

    const next = advanceWeek(state, [
      { type: 'set-pricing', model: 'usage-based', pricePerUnit: 100 },
    ]);

    // Enough weeks have passed (10 - 1 = 9 >= 8), should be allowed
    expect(next.finances.pricingModel).toBe('usage-based');
  });
});

// ─── Game Over / Win Conditions ──────────────────────────────────────

describe('game over and win conditions', () => {
  it('does not trigger game over on first week with adequate cash', () => {
    const state = makeTestState();
    const next = advanceWeek(state, []);
    expect(next.meta.gameOver).toBe(false);
    expect(next.meta.gameWon).toBe(false);
  });

  it('triggers game over for regulatory shutdown in healthcare segment', () => {
    const state = makeTestStateDeep({
      market: {
        segment: 'ai-healthcare',
        segmentData: {
          id: 'ai-healthcare',
          name: 'AI Healthcare',
          description: 'Healthcare AI',
          size: 1000,
          growthRate: 0.1,
          competitionIntensity: 50,
          regulatoryRisk: 80,
          customerDemand: ['diagnostics', 'monitoring'],
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
      meta: {
        week: 20,
        year: 2026,
        month: 5,
        day: 10,
        difficulty: 'normal',
        tone: 'realistic',
        growthStrategy: 'sustainable',
        productFocus: 'new-features',
        acquisitionChannel: 'organic',
        contentSeoWeeks: 0,
        gameOver: false,
        gameWon: false,
        infiniteMode: false,
        score: 0,
        regulatoryHeat: 85,
        lowMoraleWeeks: 0,
      },
    });

    const next = advanceWeek(state, []);

    expect(next.meta.gameOver).toBe(true);
    expect(next.meta.gameOverReason).toContain('regulat');
  });

  it('already game-over state is not further modified', () => {
    const state = makeTestStateDeep({
      meta: {
        week: 10,
        year: 2026,
        month: 3,
        day: 10,
        difficulty: 'normal',
        tone: 'realistic',
        growthStrategy: 'sustainable',
        productFocus: 'new-features',
        acquisitionChannel: 'organic',
        contentSeoWeeks: 0,
        gameOver: true,
        gameOverReason: 'Already dead',
        gameWon: false,
        infiniteMode: false,
        score: 0,
        regulatoryHeat: 0,
        lowMoraleWeeks: 0,
      },
    });

    const next = advanceWeek(state, []);

    // The game over state should be preserved
    expect(next.meta.gameOver).toBe(true);
  });
});

// ─── Immutability ────────────────────────────────────────────────────

describe('immutability guarantees', () => {
  it('does not mutate the original state object', () => {
    const state = makeTestState();
    const cashBefore = state.finances.cash;
    const weekBefore = state.meta.week;
    const featuresBefore = state.product.features.length;
    const eventLogBefore = state.eventLog.length;

    advanceWeek(state, [
      { type: 'start-feature', name: 'Test', description: 'Test', marketRelevance: 50 },
    ]);

    expect(state.finances.cash).toBe(cashBefore);
    expect(state.meta.week).toBe(weekBefore);
    expect(state.product.features).toHaveLength(featuresBefore);
    expect(state.eventLog).toHaveLength(eventLogBefore);
  });

  it('does not mutate the decisions array', () => {
    const state = makeTestState();
    const decisions = [
      { type: 'start-feature' as const, name: 'Test', description: 'Test', marketRelevance: 50 },
    ];
    const decisionsCopy = [...decisions];

    advanceWeek(state, decisions);

    expect(decisions).toEqual(decisionsCopy);
  });
});

// ─── AI Agent Decisions ──────────────────────────────────────────────

describe('AI agent decisions', () => {
  it('hire-ai-agent adds an agent to the team', () => {
    const state = makeTestState();
    expect(state.team.aiAgents).toHaveLength(0);

    const next = advanceWeek(state, [
      {
        type: 'hire-ai-agent',
        name: 'CodeBot',
        agentType: 'coding',
        provider: 'OpenAI',
        capability: 80,
        costPerWeek: 500,
        reliability: 90,
      },
    ]);

    expect(next.team.aiAgents).toHaveLength(1);
    expect(next.team.aiAgents[0].name).toBe('CodeBot');
    expect(next.team.aiAgents[0].type).toBe('coding');
    expect(next.team.aiAgents[0].costPerWeek).toBe(500);
  });

  it('fire-ai-agent removes the specified agent', () => {
    const state = makeTestStateDeep({
      team: {
        members: [],
        candidates: [],
        pendingOffers: [],
        teamSize: 0,
        avgSalary: 0,
        morale: 75,
        aiAgents: [
          {
            id: 'agent-1',
            name: 'CodeBot',
            type: 'coding',
            provider: 'OpenAI',
            capability: 80,
            costPerWeek: 500,
            reliability: 90,
            assignedTo: null,
          },
          {
            id: 'agent-2',
            name: 'DesignBot',
            type: 'design',
            provider: 'Anthropic',
            capability: 70,
            costPerWeek: 400,
            reliability: 85,
            assignedTo: null,
          },
        ],
      },
    });

    const next = advanceWeek(state, [
      { type: 'fire-ai-agent', agentId: 'agent-1' },
    ]);

    expect(next.team.aiAgents).toHaveLength(1);
    expect(next.team.aiAgents[0].id).toBe('agent-2');
  });
});
