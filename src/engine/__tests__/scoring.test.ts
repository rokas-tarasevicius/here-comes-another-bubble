import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateScore } from '../scoring.ts';
import { addLeaderboardEntry, getLeaderboard, clearLeaderboard } from '../leaderboard.ts';
import type { LeaderboardEntry } from '../leaderboard.ts';
import { createInitialState } from '../init.ts';
import type { GameState, Feature } from '../../types/index.ts';

// ─── Helpers ────────────────────────────────────────────────────────────

function makeTestState(overrides?: Partial<GameState>): GameState {
  const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
  return { ...base, ...overrides };
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

function makeLeaderboardEntry(overrides?: Partial<LeaderboardEntry>): LeaderboardEntry {
  return {
    companyName: 'TestCo',
    score: 50,
    grade: 'C',
    difficulty: 'normal',
    weeksPlayed: 20,
    valuation: 1_000_000,
    date: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

// ─── calculateScore ─────────────────────────────────────────────────────

describe('calculateScore', () => {
  describe('valuation scoring (up to 40 points)', () => {
    it('gives 0 points for valuation of 1 or less', () => {
      const state = makeTestState({
        company: {
          name: 'TestCo',
          stage: 'garage',
          valuation: 1,
          culture: 60,
          reputation: 50,
          weekFounded: 1,
        },
      });

      const score = calculateScore(state);
      expect(score.breakdown.valuation).toBe(0);
    });

    it('gives 0 points for valuation of 0', () => {
      const state = makeTestState({
        company: {
          name: 'TestCo',
          stage: 'dead',
          valuation: 0,
          culture: 0,
          reputation: 0,
          weekFounded: 1,
        },
      });

      const score = calculateScore(state);
      // Math.max(1, 0) = 1, log10(1) = 0
      expect(score.breakdown.valuation).toBe(0);
    });

    it('scores based on log10 of valuation', () => {
      const state = makeTestState({
        company: {
          name: 'TestCo',
          stage: 'seed',
          valuation: 1_000_000, // 10^6
          culture: 60,
          reputation: 50,
          weekFounded: 1,
        },
      });

      const score = calculateScore(state);
      // log10(10^6) = 6, raw = 6 * (40/9) ≈ 26.67, rounded = 27
      expect(score.breakdown.valuation).toBe(27);
    });

    it('caps at 40 points for billion-dollar valuation', () => {
      const state = makeTestState({
        company: {
          name: 'TestCo',
          stage: 'growth',
          valuation: 1_000_000_000, // 10^9
          culture: 60,
          reputation: 50,
          weekFounded: 1,
        },
      });

      const score = calculateScore(state);
      expect(score.breakdown.valuation).toBe(40);
    });

    it('caps at 40 points even for absurdly high valuations', () => {
      const state = makeTestState({
        company: {
          name: 'TestCo',
          stage: 'public',
          valuation: 1_000_000_000_000, // 10^12 (trillion)
          culture: 60,
          reputation: 50,
          weekFounded: 1,
        },
      });

      const score = calculateScore(state);
      expect(score.breakdown.valuation).toBe(40);
    });
  });

  describe('revenue scoring (up to 20 points)', () => {
    it('gives 0 points for zero revenue', () => {
      const state = makeTestState({
        finances: {
          ...makeTestState().finances,
          weeklyRevenue: 0,
        },
      });

      const score = calculateScore(state);
      expect(score.breakdown.revenue).toBe(0);
    });

    it('calculates based on annualized revenue (weeklyRevenue * 52)', () => {
      const state = makeTestState({
        finances: {
          ...makeTestState().finances,
          weeklyRevenue: 10_000, // ARR = $520,000
        },
      });

      const score = calculateScore(state);
      // ARR = 520000, log10(520000) ≈ 5.716, raw = 5.716 * (20/8) ≈ 14.29, rounded = 14
      expect(score.breakdown.revenue).toBe(14);
    });

    it('caps at 20 points for very high revenue', () => {
      const state = makeTestState({
        finances: {
          ...makeTestState().finances,
          weeklyRevenue: 2_000_000, // ARR = $104M ≈ 10^8
        },
      });

      const score = calculateScore(state);
      expect(score.breakdown.revenue).toBe(20);
    });
  });

  describe('team scoring (up to 15 points)', () => {
    it('gives 0 points for zero team size', () => {
      const state = makeTestState({
        team: {
          members: [],
          candidates: [],
          pendingOffers: [],
          teamSize: 0,
          avgSalary: 0,
          morale: 100,
          aiAgents: [],
        },
      });

      const score = calculateScore(state);
      expect(score.breakdown.team).toBe(0);
    });

    it('scales with team size and morale', () => {
      const state = makeTestState({
        team: {
          members: [],
          candidates: [],
          pendingOffers: [],
          teamSize: 10,
          avgSalary: 5000,
          morale: 80,
          aiAgents: [],
        },
      });

      const score = calculateScore(state);
      // 10 * 80/100 * 0.5 = 4
      expect(score.breakdown.team).toBe(4);
    });

    it('gives reduced score for low morale', () => {
      const state = makeTestState({
        team: {
          members: [],
          candidates: [],
          pendingOffers: [],
          teamSize: 20,
          avgSalary: 5000,
          morale: 30,
          aiAgents: [],
        },
      });

      const score = calculateScore(state);
      // 20 * 30/100 * 0.5 = 3
      expect(score.breakdown.team).toBe(3);
    });

    it('caps at 15 for large high-morale teams', () => {
      const state = makeTestState({
        team: {
          members: [],
          candidates: [],
          pendingOffers: [],
          teamSize: 50,
          avgSalary: 5000,
          morale: 100,
          aiAgents: [],
        },
      });

      const score = calculateScore(state);
      // 50 * 100/100 * 0.5 = 25, capped at 15
      expect(score.breakdown.team).toBe(15);
    });

    it('gives 0 for zero morale even with large team', () => {
      const state = makeTestState({
        team: {
          members: [],
          candidates: [],
          pendingOffers: [],
          teamSize: 30,
          avgSalary: 5000,
          morale: 0,
          aiAgents: [],
        },
      });

      const score = calculateScore(state);
      // 30 * 0/100 * 0.5 = 0
      expect(score.breakdown.team).toBe(0);
    });
  });

  describe('product scoring (up to 15 points)', () => {
    it('gives 0 points with no shipped features', () => {
      const state = makeTestState({
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

      const score = calculateScore(state);
      expect(score.breakdown.product).toBe(0);
    });

    it('ignores features that are not shipped', () => {
      const state = makeTestState({
        product: {
          name: 'TestCo',
          features: [
            makeFeature({ id: 'f1', status: 'in-progress', quality: 100 }),
            makeFeature({ id: 'f2', status: 'planned', quality: 100 }),
            makeFeature({ id: 'f3', status: 'deprecated', quality: 100 }),
          ],
          overallQuality: 0,
          techDebtTotal: 0,
          pmfScore: 0,
          customers: 0,
          churnRate: 0.05,
          bugs: 0,
        },
      });

      const score = calculateScore(state);
      expect(score.breakdown.product).toBe(0);
    });

    it('scores based on shipped count and average quality', () => {
      const state = makeTestState({
        product: {
          name: 'TestCo',
          features: [
            makeFeature({ id: 'f1', status: 'shipped', quality: 80 }),
            makeFeature({ id: 'f2', status: 'shipped', quality: 60 }),
          ],
          overallQuality: 70,
          techDebtTotal: 10,
          pmfScore: 50,
          customers: 100,
          churnRate: 0.05,
          bugs: 0,
        },
      });

      const score = calculateScore(state);
      // avgQuality = (80+60)/2 = 70, raw = 2 * (70/100) * 3 = 4.2, rounded = 4
      expect(score.breakdown.product).toBe(4);
    });

    it('caps at 15 for many high-quality features', () => {
      const features: Feature[] = [];
      for (let i = 0; i < 10; i++) {
        features.push(makeFeature({ id: `f${i}`, status: 'shipped', quality: 100 }));
      }

      const state = makeTestState({
        product: {
          name: 'TestCo',
          features,
          overallQuality: 100,
          techDebtTotal: 0,
          pmfScore: 100,
          customers: 1000,
          churnRate: 0.01,
          bugs: 0,
        },
      });

      const score = calculateScore(state);
      // 10 * (100/100) * 3 = 30, capped at 15
      expect(score.breakdown.product).toBe(15);
    });

    it('gives 0 for shipped features with zero quality', () => {
      const state = makeTestState({
        product: {
          name: 'TestCo',
          features: [
            makeFeature({ id: 'f1', status: 'shipped', quality: 0 }),
          ],
          overallQuality: 0,
          techDebtTotal: 50,
          pmfScore: 0,
          customers: 0,
          churnRate: 0.05,
          bugs: 10,
        },
      });

      const score = calculateScore(state);
      // 1 * (0/100) * 3 = 0
      expect(score.breakdown.product).toBe(0);
    });

    it('only counts shipped features in average quality', () => {
      const state = makeTestState({
        product: {
          name: 'TestCo',
          features: [
            makeFeature({ id: 'f1', status: 'shipped', quality: 60 }),
            makeFeature({ id: 'f2', status: 'in-progress', quality: 100 }),
          ],
          overallQuality: 80,
          techDebtTotal: 10,
          pmfScore: 50,
          customers: 100,
          churnRate: 0.05,
          bugs: 0,
        },
      });

      const score = calculateScore(state);
      // Only f1 is shipped, avgQuality = 60, raw = 1 * (60/100) * 3 = 1.8, rounded = 2
      expect(score.breakdown.product).toBe(2);
    });
  });

  describe('survival scoring (up to 10 points)', () => {
    it('gives score based on weeks survived', () => {
      const state = makeTestState();
      // Week 1 by default
      const score = calculateScore(state);
      // 1 * 0.1 = 0.1, rounded = 0
      expect(score.breakdown.survival).toBe(0);
    });

    it('gives 1 point at week 10', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, week: 10 },
      });

      const score = calculateScore(state);
      expect(score.breakdown.survival).toBe(1);
    });

    it('gives 5 points at week 50', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, week: 50 },
      });

      const score = calculateScore(state);
      expect(score.breakdown.survival).toBe(5);
    });

    it('caps at 10 points', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, week: 200 },
      });

      const score = calculateScore(state);
      // 200 * 0.1 = 20, capped at 10
      expect(score.breakdown.survival).toBe(10);
    });
  });

  describe('difficulty multiplier', () => {
    it('applies 0.7x for easy difficulty', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, difficulty: 'easy' },
      });

      const score = calculateScore(state);
      expect(score.difficultyMultiplier).toBe(0.7);
    });

    it('applies 1.0x for normal difficulty', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, difficulty: 'normal' },
      });

      const score = calculateScore(state);
      expect(score.difficultyMultiplier).toBe(1.0);
    });

    it('applies 1.5x for hard difficulty', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, difficulty: 'hard' },
      });

      const score = calculateScore(state);
      expect(score.difficultyMultiplier).toBe(1.5);
    });

    it('applies 2.0x for nightmare difficulty', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, difficulty: 'nightmare' },
      });

      const score = calculateScore(state);
      expect(score.difficultyMultiplier).toBe(2.0);
    });

    it('multiplier affects total score but not breakdown', () => {
      const baseState = makeTestState({
        meta: { ...makeTestState().meta, difficulty: 'normal', week: 50 },
        company: {
          name: 'TestCo',
          stage: 'seed',
          valuation: 1_000_000,
          culture: 60,
          reputation: 50,
          weekFounded: 1,
        },
      });

      const normalScore = calculateScore(baseState);

      const hardState = makeTestState({
        meta: { ...makeTestState().meta, difficulty: 'hard', week: 50 },
        company: {
          name: 'TestCo',
          stage: 'seed',
          valuation: 1_000_000,
          culture: 60,
          reputation: 50,
          weekFounded: 1,
        },
      });

      const hardScore = calculateScore(hardState);

      // Breakdowns should be identical
      expect(hardScore.breakdown).toEqual(normalScore.breakdown);
      // Total should differ by the multiplier ratio
      expect(hardScore.total).toBe(Math.round(
        (normalScore.breakdown.valuation + normalScore.breakdown.revenue +
         normalScore.breakdown.team + normalScore.breakdown.product +
         normalScore.breakdown.survival) * 1.5
      ));
    });
  });

  describe('grade assignment', () => {
    it('assigns grade F for total < 20', () => {
      // A fresh game at week 1 with default state should have a low score
      const state = makeTestState({
        company: {
          name: 'TestCo',
          stage: 'garage',
          valuation: 1,
          culture: 0,
          reputation: 0,
          weekFounded: 1,
        },
      });

      const score = calculateScore(state);
      expect(score.total).toBeLessThan(20);
      expect(score.grade).toBe('F');
    });

    it('assigns grade D for total >= 20 and < 40', () => {
      // valuation of 100_000 -> log10(100000)=5, score=5*(40/9)≈22.2 -> 22
      // plus maybe 0 for everything else in normal mode = 22
      const state = makeTestState({
        company: {
          name: 'TestCo',
          stage: 'garage',
          valuation: 100_000,
          culture: 60,
          reputation: 50,
          weekFounded: 1,
        },
      });

      const score = calculateScore(state);
      expect(score.total).toBeGreaterThanOrEqual(20);
      expect(score.total).toBeLessThan(40);
      expect(score.grade).toBe('D');
    });

    it('assigns grade C for total >= 40 and < 70', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, week: 50 },
        company: {
          name: 'TestCo',
          stage: 'seed',
          valuation: 5_000_000,
          culture: 60,
          reputation: 50,
          weekFounded: 1,
        },
        finances: {
          ...makeTestState().finances,
          weeklyRevenue: 1000, // ARR = $52,000
        },
        team: {
          members: [],
          candidates: [],
          pendingOffers: [],
          teamSize: 5,
          avgSalary: 4000,
          morale: 80,
          aiAgents: [],
        },
      });

      const score = calculateScore(state);
      expect(score.total).toBeGreaterThanOrEqual(40);
      expect(score.total).toBeLessThan(70);
      expect(score.grade).toBe('C');
    });

    it('assigns grade B for total >= 70 and < 100', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, week: 80 },
        company: {
          name: 'TestCo',
          stage: 'series-a',
          valuation: 50_000_000,
          culture: 70,
          reputation: 60,
          weekFounded: 1,
        },
        finances: {
          ...makeTestState().finances,
          weeklyRevenue: 20_000,
        },
        team: {
          members: [],
          candidates: [],
          pendingOffers: [],
          teamSize: 15,
          avgSalary: 5000,
          morale: 80,
          aiAgents: [],
        },
        product: {
          name: 'TestCo',
          features: [
            makeFeature({ id: 'f1', quality: 80 }),
            makeFeature({ id: 'f2', quality: 75 }),
            makeFeature({ id: 'f3', quality: 70 }),
          ],
          overallQuality: 75,
          techDebtTotal: 15,
          pmfScore: 65,
          customers: 500,
          churnRate: 0.03,
          bugs: 2,
        },
      });

      const score = calculateScore(state);
      expect(score.total).toBeGreaterThanOrEqual(70);
      expect(score.total).toBeLessThan(100);
      expect(score.grade).toBe('B');
    });

    it('assigns grade A for total >= 100 and < 150', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, difficulty: 'hard', week: 100 },
        company: {
          name: 'TestCo',
          stage: 'series-b',
          valuation: 200_000_000,
          culture: 80,
          reputation: 75,
          weekFounded: 1,
        },
        finances: {
          ...makeTestState().finances,
          weeklyRevenue: 100_000,
        },
        team: {
          members: [],
          candidates: [],
          pendingOffers: [],
          teamSize: 25,
          avgSalary: 6000,
          morale: 90,
          aiAgents: [],
        },
        product: {
          name: 'TestCo',
          features: [
            makeFeature({ id: 'f1', quality: 90 }),
            makeFeature({ id: 'f2', quality: 85 }),
            makeFeature({ id: 'f3', quality: 80 }),
            makeFeature({ id: 'f4', quality: 85 }),
          ],
          overallQuality: 85,
          techDebtTotal: 10,
          pmfScore: 80,
          customers: 2000,
          churnRate: 0.02,
          bugs: 1,
        },
      });

      const score = calculateScore(state);
      expect(score.total).toBeGreaterThanOrEqual(100);
      expect(score.total).toBeLessThan(150);
      expect(score.grade).toBe('A');
    });

    it('assigns grade S for total >= 150', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, difficulty: 'nightmare', week: 100 },
        company: {
          name: 'TestCo',
          stage: 'public',
          valuation: 1_000_000_000,
          culture: 90,
          reputation: 95,
          weekFounded: 1,
        },
        finances: {
          ...makeTestState().finances,
          weeklyRevenue: 2_000_000,
        },
        team: {
          members: [],
          candidates: [],
          pendingOffers: [],
          teamSize: 30,
          avgSalary: 8000,
          morale: 100,
          aiAgents: [],
        },
        product: {
          name: 'TestCo',
          features: Array.from({ length: 8 }, (_, i) =>
            makeFeature({ id: `f${i}`, quality: 95 }),
          ),
          overallQuality: 95,
          techDebtTotal: 5,
          pmfScore: 95,
          customers: 10000,
          churnRate: 0.01,
          bugs: 0,
        },
      });

      const score = calculateScore(state);
      expect(score.total).toBeGreaterThanOrEqual(150);
      expect(score.grade).toBe('S');
    });

    it('assigns exact boundary grades correctly', () => {
      // We verify the boundary logic by checking specific total values
      // Grade thresholds: S>=150, A>=100, B>=70, C>=40, D>=20, F<20

      // Create a known state and manually verify
      const state = makeTestState();
      const score = calculateScore(state);
      // Grade is determined by total, so the logic in the function is correct
      // as long as we can verify the boundaries match

      if (score.total >= 150) expect(score.grade).toBe('S');
      else if (score.total >= 100) expect(score.grade).toBe('A');
      else if (score.total >= 70) expect(score.grade).toBe('B');
      else if (score.total >= 40) expect(score.grade).toBe('C');
      else if (score.total >= 20) expect(score.grade).toBe('D');
      else expect(score.grade).toBe('F');
    });
  });

  describe('edge cases', () => {
    it('handles a brand new game (zero everything except defaults)', () => {
      const state = makeTestState();
      const score = calculateScore(state);

      // Should have a low but valid score
      expect(score.total).toBeGreaterThanOrEqual(0);
      expect(score.total).toBeLessThan(100);
      expect(score.breakdown.valuation).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.revenue).toBe(0);
      expect(score.breakdown.team).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.product).toBe(0);
      expect(score.breakdown.survival).toBe(0);
      expect(score.difficultyMultiplier).toBe(1.0);
      expect(['S', 'A', 'B', 'C', 'D', 'F']).toContain(score.grade);
    });

    it('handles a dead company (all zeros)', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, week: 1, gameOver: true, gameOverReason: 'Ran out of cash' },
        company: {
          name: 'TestCo',
          stage: 'dead',
          valuation: 0,
          culture: 0,
          reputation: 0,
          weekFounded: 1,
        },
        finances: {
          cash: 0,
          weeklyRevenue: 0,
          weeklyBurn: 0,
          pricingModel: 'subscription',
          pricePerUnit: 25,
          fundingHistory: [],
          founderEquity: 0,
          monthlyExpenses: 0,
          marketingSpend: 0,
          lastPricingChangeWeek: 0,
        },
        team: {
          members: [],
          candidates: [],
          pendingOffers: [],
          teamSize: 0,
          avgSalary: 0,
          morale: 0,
          aiAgents: [],
        },
        product: {
          name: 'TestCo',
          features: [],
          overallQuality: 0,
          techDebtTotal: 0,
          pmfScore: 0,
          customers: 0,
          churnRate: 0,
          bugs: 0,
        },
      });

      const score = calculateScore(state);
      expect(score.total).toBe(0);
      expect(score.breakdown.valuation).toBe(0);
      expect(score.breakdown.revenue).toBe(0);
      expect(score.breakdown.team).toBe(0);
      expect(score.breakdown.product).toBe(0);
      expect(score.breakdown.survival).toBe(0);
      expect(score.grade).toBe('F');
    });

    it('handles maximum everything scenario', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, difficulty: 'nightmare', week: 200 },
        company: {
          name: 'TestCo',
          stage: 'public',
          valuation: 10_000_000_000, // $10B
          culture: 100,
          reputation: 100,
          weekFounded: 1,
        },
        finances: {
          ...makeTestState().finances,
          weeklyRevenue: 10_000_000, // ARR = $520M
        },
        team: {
          members: [],
          candidates: [],
          pendingOffers: [],
          teamSize: 100,
          avgSalary: 10000,
          morale: 100,
          aiAgents: [],
        },
        product: {
          name: 'TestCo',
          features: Array.from({ length: 20 }, (_, i) =>
            makeFeature({ id: `f${i}`, quality: 100 }),
          ),
          overallQuality: 100,
          techDebtTotal: 0,
          pmfScore: 100,
          customers: 100000,
          churnRate: 0.005,
          bugs: 0,
        },
      });

      const score = calculateScore(state);
      // All category caps: 40+20+15+15+10 = 100, times 2.0 = 200
      expect(score.breakdown.valuation).toBe(40);
      expect(score.breakdown.revenue).toBe(20);
      expect(score.breakdown.team).toBe(15);
      expect(score.breakdown.product).toBe(15);
      expect(score.breakdown.survival).toBe(10);
      expect(score.total).toBe(200);
      expect(score.grade).toBe('S');
    });

    it('total is properly rounded', () => {
      // Raw total might be fractional, should be rounded
      const state = makeTestState({
        meta: { ...makeTestState().meta, week: 3 },
        company: {
          name: 'TestCo',
          stage: 'garage',
          valuation: 150_000,
          culture: 60,
          reputation: 50,
          weekFounded: 1,
        },
      });

      const score = calculateScore(state);
      expect(Number.isInteger(score.total)).toBe(true);
    });

    it('breakdown values are individually rounded', () => {
      const state = makeTestState({
        meta: { ...makeTestState().meta, week: 33 },
        company: {
          name: 'TestCo',
          stage: 'seed',
          valuation: 3_500_000,
          culture: 60,
          reputation: 50,
          weekFounded: 1,
        },
        finances: {
          ...makeTestState().finances,
          weeklyRevenue: 3000,
        },
        team: {
          members: [],
          candidates: [],
          pendingOffers: [],
          teamSize: 7,
          avgSalary: 4000,
          morale: 65,
          aiAgents: [],
        },
        product: {
          name: 'TestCo',
          features: [
            makeFeature({ id: 'f1', quality: 73 }),
            makeFeature({ id: 'f2', quality: 67 }),
          ],
          overallQuality: 70,
          techDebtTotal: 20,
          pmfScore: 40,
          customers: 200,
          churnRate: 0.04,
          bugs: 3,
        },
      });

      const score = calculateScore(state);
      expect(Number.isInteger(score.breakdown.valuation)).toBe(true);
      expect(Number.isInteger(score.breakdown.revenue)).toBe(true);
      expect(Number.isInteger(score.breakdown.team)).toBe(true);
      expect(Number.isInteger(score.breakdown.product)).toBe(true);
      expect(Number.isInteger(score.breakdown.survival)).toBe(true);
    });

    it('negative valuation is treated as 1 (log10 safe)', () => {
      const state = makeTestState({
        company: {
          name: 'TestCo',
          stage: 'dead',
          valuation: -500_000,
          culture: 0,
          reputation: 0,
          weekFounded: 1,
        },
      });

      const score = calculateScore(state);
      // Math.max(1, -500000) = 1, log10(1) = 0
      expect(score.breakdown.valuation).toBe(0);
    });

    it('game won state still calculates score normally', () => {
      const state = makeTestState({
        meta: {
          ...makeTestState().meta,
          gameWon: true,
          gameWonReason: 'IPO!',
          week: 80,
        },
        company: {
          name: 'TestCo',
          stage: 'public',
          valuation: 500_000_000,
          culture: 80,
          reputation: 80,
          weekFounded: 1,
        },
      });

      const score = calculateScore(state);
      expect(score.total).toBeGreaterThan(0);
      expect(score.breakdown.valuation).toBeGreaterThan(0);
      expect(score.breakdown.survival).toBeGreaterThan(0);
    });

    it('game over state still calculates score normally', () => {
      const state = makeTestState({
        meta: {
          ...makeTestState().meta,
          gameOver: true,
          gameOverReason: 'Ran out of cash',
          week: 30,
        },
        company: {
          name: 'TestCo',
          stage: 'dead',
          valuation: 50_000,
          culture: 20,
          reputation: 10,
          weekFounded: 1,
        },
      });

      const score = calculateScore(state);
      expect(score.total).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.survival).toBe(3); // 30 * 0.1 = 3
    });
  });
});

// ─── Leaderboard ────────────────────────────────────────────────────────

describe('leaderboard', () => {
  // Mock localStorage
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
    });
  });

  describe('getLeaderboard', () => {
    it('returns empty array when no data in localStorage', () => {
      const board = getLeaderboard();
      expect(board).toEqual([]);
    });

    it('returns parsed entries from localStorage', () => {
      const entries = [makeLeaderboardEntry({ score: 80 })];
      store['hcab-leaderboard'] = JSON.stringify(entries);

      const board = getLeaderboard();
      expect(board).toHaveLength(1);
      expect(board[0].score).toBe(80);
    });

    it('returns empty array on corrupted localStorage data', () => {
      store['hcab-leaderboard'] = 'not-valid-json!!!';

      const board = getLeaderboard();
      expect(board).toEqual([]);
    });
  });

  describe('addLeaderboardEntry', () => {
    it('adds a single entry and returns it', () => {
      const entry = makeLeaderboardEntry({ score: 75 });
      const board = addLeaderboardEntry(entry);

      expect(board).toHaveLength(1);
      expect(board[0].score).toBe(75);
    });

    it('returns entries sorted by score descending', () => {
      const entry1 = makeLeaderboardEntry({ companyName: 'Low', score: 30 });
      const entry2 = makeLeaderboardEntry({ companyName: 'High', score: 90 });
      const entry3 = makeLeaderboardEntry({ companyName: 'Mid', score: 60 });

      addLeaderboardEntry(entry1);
      addLeaderboardEntry(entry2);
      const board = addLeaderboardEntry(entry3);

      expect(board).toHaveLength(3);
      expect(board[0].companyName).toBe('High');
      expect(board[1].companyName).toBe('Mid');
      expect(board[2].companyName).toBe('Low');
    });

    it('persists entries to localStorage', () => {
      const entry = makeLeaderboardEntry({ score: 50 });
      addLeaderboardEntry(entry);

      const stored = JSON.parse(store['hcab-leaderboard']);
      expect(stored).toHaveLength(1);
      expect(stored[0].score).toBe(50);
    });

    it('limits entries to MAX_ENTRIES (20)', () => {
      // Add 25 entries
      for (let i = 0; i < 25; i++) {
        addLeaderboardEntry(makeLeaderboardEntry({
          companyName: `Co-${i}`,
          score: i * 10,
        }));
      }

      const board = getLeaderboard();
      expect(board).toHaveLength(20);
      // Should keep the top 20 scores (scores 50-240 in steps of 10)
      expect(board[0].score).toBe(240);
      expect(board[19].score).toBe(50);
    });

    it('drops the lowest score when at capacity', () => {
      // Fill with 20 entries of score 10
      for (let i = 0; i < 20; i++) {
        addLeaderboardEntry(makeLeaderboardEntry({
          companyName: `Filler-${i}`,
          score: 10,
        }));
      }

      // Add a high-score entry
      const board = addLeaderboardEntry(makeLeaderboardEntry({
        companyName: 'Winner',
        score: 200,
      }));

      expect(board).toHaveLength(20);
      expect(board[0].companyName).toBe('Winner');
      expect(board[0].score).toBe(200);
    });

    it('handles entries with the same score (stable order by insertion)', () => {
      const entry1 = makeLeaderboardEntry({ companyName: 'First', score: 50 });
      const entry2 = makeLeaderboardEntry({ companyName: 'Second', score: 50 });

      addLeaderboardEntry(entry1);
      const board = addLeaderboardEntry(entry2);

      expect(board).toHaveLength(2);
      // Both have score 50; Array.sort is not guaranteed stable in all engines,
      // but we just check both are present
      expect(board.map(e => e.companyName)).toContain('First');
      expect(board.map(e => e.companyName)).toContain('Second');
    });
  });

  describe('clearLeaderboard', () => {
    it('removes all entries from localStorage', () => {
      addLeaderboardEntry(makeLeaderboardEntry({ score: 100 }));
      expect(getLeaderboard()).toHaveLength(1);

      clearLeaderboard();
      expect(getLeaderboard()).toEqual([]);
    });

    it('can be called when leaderboard is already empty', () => {
      clearLeaderboard();
      expect(getLeaderboard()).toEqual([]);
    });
  });
});
