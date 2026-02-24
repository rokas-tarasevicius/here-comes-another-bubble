import { describe, it, expect, vi } from 'vitest';
import { createInitialState } from '../init.ts';
import { advanceWeek } from '../tick.ts';
import { calculateCurrentPricingTier, calculateMaxPrice, calculateWeeklyBurn } from '../derived.ts';
import { CERTIFICATION_DEFS, getScaledCertCost } from '../../data/compliance.ts';
import type { GameState } from '../../types/index.ts';

// ─── Helpers ──────────────────────────────────────────────────────────

function makeDeepState(overrides: {
  meta?: Partial<GameState['meta']>;
  founder?: Partial<GameState['founder']>;
  company?: Partial<GameState['company']>;
  team?: Partial<GameState['team']>;
  product?: Partial<GameState['product']>;
  finances?: Partial<GameState['finances']>;
  market?: Partial<GameState['market']>;
  compliance?: Partial<GameState['compliance']>;
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
    compliance: overrides.compliance
      ? { ...base.compliance, ...overrides.compliance }
      : base.compliance,
  };
}

// ─── Initialization ───────────────────────────────────────────────────

describe('compliance initialization', () => {
  it('creates compliance state with all 8 certifications', () => {
    const state = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
    expect(state.compliance).toBeDefined();
    expect(state.compliance.certifications).toHaveLength(8);
    expect(state.compliance.totalComplianceCost).toBe(0);
  });

  it('marks certs without prerequisites as available', () => {
    const state = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
    const gdpr = state.compliance.certifications.find((c) => c.id === 'gdpr');
    const soc2t1 = state.compliance.certifications.find((c) => c.id === 'soc2-type1');
    expect(gdpr?.status).toBe('available');
    expect(soc2t1?.status).toBe('available');
  });

  it('marks certs with prerequisites as locked', () => {
    const state = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
    const soc2t2 = state.compliance.certifications.find((c) => c.id === 'soc2-type2');
    const fedramp = state.compliance.certifications.find((c) => c.id === 'fedramp');
    expect(soc2t2?.status).toBe('locked');
    expect(fedramp?.status).toBe('locked');
  });
});

// ─── Pricing Tiers ────────────────────────────────────────────────────

describe('pricing tiers', () => {
  it('new game starts at tier 1', () => {
    const state = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
    expect(calculateCurrentPricingTier(state)).toBe(1);
  });

  it('max price at tier 1 is 2x default', () => {
    const state = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
    // ai-devtools default price is $25
    expect(calculateMaxPrice(state)).toBe(50); // 25 * 2
  });

  it('qualifies for tier 2 with 3+ engineers, 2+ features, 30+ quality', () => {
    const state = makeDeepState({
      team: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').team,
        members: Array.from({ length: 4 }, (_, i) => ({
          id: `eng-${i}`,
          name: `Eng ${i}`,
          role: 'engineer' as const,
          skill: 60,
          salary: 4000,
          morale: 80,
          weekHired: 1,
          traits: [],
          boosts: {},
        })),
        teamSize: 4,
      },
      product: {
        ...createInitialState('X', 'balanced', 'ai-devtools', 'normal', 'realistic').product,
        overallQuality: 35,
        features: [
          { id: 'f1', name: 'F1', description: '', status: 'shipped', progress: 100, quality: 35, marketRelevance: 50 },
          { id: 'f2', name: 'F2', description: '', status: 'shipped', progress: 100, quality: 35, marketRelevance: 50 },
        ],
      },
    });
    expect(calculateCurrentPricingTier(state)).toBe(2);
    expect(calculateMaxPrice(state)).toBe(250); // 25 * 10
  });
});

// ─── Weekly Burn Includes Compliance ──────────────────────────────────

describe('compliance burn', () => {
  it('includes in-progress certification costs in weekly burn', () => {
    const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
    const baseBurn = calculateWeeklyBurn(base);

    const stateWithCert = makeDeepState({
      compliance: {
        certifications: base.compliance.certifications.map((c) =>
          c.id === 'gdpr'
            ? { ...c, status: 'in-progress' as const, weeklySpend: 1500, weeksRemaining: 8, weeksTotal: 8 }
            : c
        ),
        totalComplianceCost: 0,
      },
    });
    const certBurn = calculateWeeklyBurn(stateWithCert);
    expect(certBurn).toBe(baseBurn + 1500);
  });
});

// ─── Compliance Simulation ────────────────────────────────────────────

describe('compliance simulation', () => {
  it('progresses in-progress certifications each week', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // suppress random events

    const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
    const state = makeDeepState({
      finances: { ...base.finances, cash: 500_000 },
      compliance: {
        certifications: base.compliance.certifications.map((c) =>
          c.id === 'gdpr'
            ? { ...c, status: 'in-progress' as const, weeklySpend: 1500, weeksRemaining: 8, weeksTotal: 8, weekStarted: 1 }
            : c
        ),
        totalComplianceCost: 15_000,
      },
    });

    const next = advanceWeek(state, []);
    const gdpr = next.compliance.certifications.find((c) => c.id === 'gdpr')!;
    expect(gdpr.weeksRemaining).toBeLessThan(8);
    expect(gdpr.totalSpent).toBeGreaterThan(0);

    vi.restoreAllMocks();
  });

  it('completes certification when weeks remaining reaches 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
    const state = makeDeepState({
      finances: { ...base.finances, cash: 500_000 },
      compliance: {
        certifications: base.compliance.certifications.map((c) =>
          c.id === 'gdpr'
            ? { ...c, status: 'in-progress' as const, weeklySpend: 1500, weeksRemaining: 0.5, weeksTotal: 8, weekStarted: 1 }
            : c
        ),
        totalComplianceCost: 15_000,
      },
    });

    const next = advanceWeek(state, []);
    const gdpr = next.compliance.certifications.find((c) => c.id === 'gdpr')!;
    expect(gdpr.status).toBe('completed');
    expect(gdpr.weekCompleted).toBeDefined();

    vi.restoreAllMocks();
  });

  it('unlocks dependent certs when prerequisite completes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
    const state = makeDeepState({
      finances: { ...base.finances, cash: 500_000 },
      compliance: {
        certifications: base.compliance.certifications.map((c) => {
          if (c.id === 'soc2-type1') {
            return { ...c, status: 'in-progress' as const, weeklySpend: 2000, weeksRemaining: 0.5, weeksTotal: 10, weekStarted: 1 };
          }
          return c;
        }),
        totalComplianceCost: 25_000,
      },
    });

    // SOC 2 Type II and HIPAA should be locked
    const soc2t2Before = state.compliance.certifications.find((c) => c.id === 'soc2-type2')!;
    expect(soc2t2Before.status).toBe('locked');

    const next = advanceWeek(state, []);

    // SOC 2 Type I should be completed
    const soc2t1 = next.compliance.certifications.find((c) => c.id === 'soc2-type1')!;
    expect(soc2t1.status).toBe('completed');

    // SOC 2 Type II and HIPAA should now be available
    const soc2t2 = next.compliance.certifications.find((c) => c.id === 'soc2-type2')!;
    expect(soc2t2.status).toBe('available');

    const hipaa = next.compliance.certifications.find((c) => c.id === 'hipaa')!;
    expect(hipaa.status).toBe('available');

    vi.restoreAllMocks();
  });

  it('expedite spending accelerates progress', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
    const scaled = getScaledCertCost(CERTIFICATION_DEFS['gdpr'], 'normal');

    // State with 1x spending
    const state1x = makeDeepState({
      finances: { ...base.finances, cash: 500_000 },
      compliance: {
        certifications: base.compliance.certifications.map((c) =>
          c.id === 'gdpr'
            ? { ...c, status: 'in-progress' as const, weeklySpend: scaled.weeklyCost, weeksRemaining: 8, weeksTotal: 8, weekStarted: 1 }
            : c
        ),
        totalComplianceCost: 15_000,
      },
    });

    // State with 3x spending (max expedite)
    const state3x = makeDeepState({
      finances: { ...base.finances, cash: 500_000 },
      compliance: {
        certifications: base.compliance.certifications.map((c) =>
          c.id === 'gdpr'
            ? { ...c, status: 'in-progress' as const, weeklySpend: scaled.weeklyCost * 3, weeksRemaining: 8, weeksTotal: 8, weekStarted: 1 }
            : c
        ),
        totalComplianceCost: 15_000,
      },
    });

    const next1x = advanceWeek(state1x, []);
    const next3x = advanceWeek(state3x, []);

    const remaining1x = next1x.compliance.certifications.find((c) => c.id === 'gdpr')!.weeksRemaining;
    const remaining3x = next3x.compliance.certifications.find((c) => c.id === 'gdpr')!.weeksRemaining;

    // 3x spending should progress faster (lower remaining)
    expect(remaining3x).toBeLessThan(remaining1x);

    vi.restoreAllMocks();
  });

  it('auto-pauses certification if cash would go negative', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
    const state = makeDeepState({
      finances: { ...base.finances, cash: 0 },
      compliance: {
        certifications: base.compliance.certifications.map((c) =>
          c.id === 'gdpr'
            ? { ...c, status: 'in-progress' as const, weeklySpend: 1500, weeksRemaining: 8, weeksTotal: 8, weekStarted: 1 }
            : c
        ),
        totalComplianceCost: 15_000,
      },
    });

    const next = advanceWeek(state, []);
    const gdpr = next.compliance.certifications.find((c) => c.id === 'gdpr')!;
    expect(gdpr.status).toBe('available'); // paused back to available

    vi.restoreAllMocks();
  });
});

// ─── Full Game Loop ───────────────────────────────────────────────────

describe('full game loop with compliance', () => {
  it('can advance multiple weeks without crashing', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    let state = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');

    // Advance 10 weeks
    for (let i = 0; i < 10; i++) {
      state = advanceWeek(state, []);
      expect(state.compliance).toBeDefined();
      expect(state.compliance.certifications).toHaveLength(8);
    }

    expect(state.meta.week).toBe(11);
    expect(state.meta.gameOver).toBe(false);

    vi.restoreAllMocks();
  });

  it('compliance state persists across weeks', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const base = createInitialState('TestCo', 'balanced', 'ai-devtools', 'normal', 'realistic');
    let state = makeDeepState({
      finances: { ...base.finances, cash: 1_000_000 },
      compliance: {
        certifications: base.compliance.certifications.map((c) =>
          c.id === 'gdpr'
            ? { ...c, status: 'in-progress' as const, weeklySpend: 1500, weeksRemaining: 3, weeksTotal: 8, weekStarted: 1 }
            : c
        ),
        totalComplianceCost: 15_000,
      },
    });

    // Advance 5 weeks — GDPR should complete within this time
    for (let i = 0; i < 5; i++) {
      state = advanceWeek(state, []);
    }

    const gdpr = state.compliance.certifications.find((c) => c.id === 'gdpr')!;
    expect(gdpr.status).toBe('completed');
    expect(state.compliance.totalComplianceCost).toBeGreaterThan(15_000);

    vi.restoreAllMocks();
  });

  it('difficulty scaling affects cert costs', () => {
    const easy = createInitialState('TestCo', 'balanced', 'ai-devtools', 'easy', 'realistic');
    const hard = createInitialState('TestCo', 'balanced', 'ai-devtools', 'hard', 'realistic');

    const easyCost = getScaledCertCost(CERTIFICATION_DEFS['soc2-type1'], 'easy');
    const hardCost = getScaledCertCost(CERTIFICATION_DEFS['soc2-type1'], 'hard');

    expect(easyCost.initCost).toBeLessThan(hardCost.initCost);
    expect(easyCost.weeklyCost).toBeLessThan(hardCost.weeklyCost);
    expect(easyCost.baseDuration).toBeLessThan(hardCost.baseDuration);

    // Just verify states initialized properly
    expect(easy.compliance.certifications).toHaveLength(8);
    expect(hard.compliance.certifications).toHaveLength(8);
  });
});
