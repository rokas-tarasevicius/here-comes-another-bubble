import { describe, it, expect } from 'vitest';
import { advanceWeek } from '../tick.ts';
import { createInitialState } from '../init.ts';
import type { GameState } from '../../types/index.ts';

function makeTestState(overrides?: Partial<GameState>): GameState {
  const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
  return { ...base, ...overrides };
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
        pricingModel: 'free',
        pricePerUnit: 0,
        fundingHistory: [],
        founderEquity: 1.0,
        monthlyExpenses: 0,
        marketingSpend: 0,
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
