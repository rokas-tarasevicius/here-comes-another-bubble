import type { GameState } from '../types/index.ts';

export interface GameScore {
  total: number;
  breakdown: {
    valuation: number;
    revenue: number;
    team: number;
    product: number;
    survival: number;
  };
  difficultyMultiplier: number;
  grade: string; // S, A, B, C, D, F
}

export function calculateScore(state: GameState): GameScore {
  // Valuation score: log scale, max ~40 points
  const valuation = Math.min(40, Math.log10(Math.max(1, state.company.valuation)) * (40 / 9));

  // Revenue score: max ~20 points
  const arr = state.finances.weeklyRevenue * 52;
  const revenue = Math.min(20, Math.log10(Math.max(1, arr)) * (20 / 8));

  // Team score: max ~15 points
  const team = Math.min(15, (state.team.teamSize * state.team.morale / 100) * 0.5);

  // Product score: max ~15 points
  const shipped = state.product.features.filter(f => f.status === 'shipped');
  const avgQuality = shipped.length > 0
    ? shipped.reduce((sum, f) => sum + f.quality, 0) / shipped.length
    : 0;
  const product = Math.min(15, shipped.length * (avgQuality / 100) * 3);

  // Survival score: max ~10 points
  const survival = Math.min(10, state.meta.week * 0.1);

  // Difficulty multiplier
  const difficultyMultiplier =
    state.meta.difficulty === 'nightmare' ? 2.0 :
    state.meta.difficulty === 'hard' ? 1.5 :
    state.meta.difficulty === 'normal' ? 1.0 :
    0.7; // easy

  const rawTotal = valuation + revenue + team + product + survival;
  const total = Math.round(rawTotal * difficultyMultiplier);

  // Grade thresholds
  const grade =
    total >= 150 ? 'S' :
    total >= 100 ? 'A' :
    total >= 70 ? 'B' :
    total >= 40 ? 'C' :
    total >= 20 ? 'D' : 'F';

  return {
    total,
    breakdown: {
      valuation: Math.round(valuation),
      revenue: Math.round(revenue),
      team: Math.round(team),
      product: Math.round(product),
      survival: Math.round(survival),
    },
    difficultyMultiplier,
    grade,
  };
}
