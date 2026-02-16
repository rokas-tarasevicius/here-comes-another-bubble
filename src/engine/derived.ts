import type { GameState } from '../types/index.ts';

/**
 * Calculate how many weeks of runway remain.
 * Returns Infinity if burn is zero or negative (i.e. profitable).
 */
export function calculateRunway(state: GameState): number {
  const burn = calculateWeeklyBurn(state);
  const netBurn = burn - state.finances.weeklyRevenue;
  if (netBurn <= 0) return Infinity;
  return state.finances.cash / netBurn;
}

/**
 * Calculate total weekly burn: salaries + AI costs + fixed overhead.
 */
export function calculateWeeklyBurn(state: GameState): number {
  const salaries = state.team.employees.reduce(
    (sum, emp) => sum + emp.salary,
    0,
  );
  const aiCosts = state.team.aiAgents.reduce(
    (sum, agent) => sum + agent.costPerWeek,
    0,
  );
  // Fixed costs: office/infra — roughly $500/week base + $50 per person
  const fixedCosts = 500 + state.team.employees.length * 50;
  return salaries + aiCosts + fixedCosts;
}

/**
 * Calculate team velocity — a measure of how much work gets done per week.
 * Human contribution: skill * morale / 100
 * AI contribution: capability * reliability / 100
 */
export function calculateTeamVelocity(state: GameState): number {
  const humanVelocity = state.team.employees.reduce(
    (sum, emp) => sum + (emp.skill * emp.morale) / 100,
    0,
  );
  const aiVelocity = state.team.aiAgents.reduce(
    (sum, agent) => sum + (agent.capability * agent.reliability) / 100,
    0,
  );
  return humanVelocity + aiVelocity;
}

/**
 * Calculate Product-Market Fit score (0-100).
 * Based on how well shipped features match market demand.
 */
export function calculatePMF(state: GameState): number {
  const demand = state.market.segmentData.customerDemand;
  if (demand.length === 0) return 0;

  const shippedFeatures = state.product.features.filter(
    (f) => f.status === 'shipped',
  );
  if (shippedFeatures.length === 0) return 0;

  // Average market relevance of shipped features, weighted by quality
  const totalRelevanceQuality = shippedFeatures.reduce(
    (sum, f) => sum + (f.marketRelevance * f.quality) / 100,
    0,
  );
  const avgRelevanceQuality = totalRelevanceQuality / shippedFeatures.length;

  // Coverage: how many demand areas are addressed
  const coverage = Math.min(shippedFeatures.length / demand.length, 1);

  return Math.round(avgRelevanceQuality * 0.7 + coverage * 100 * 0.3);
}

/**
 * Calculate average morale across all employees.
 * Returns 100 if there are no employees.
 */
export function calculateAvgMorale(state: GameState): number {
  const employees = state.team.employees;
  if (employees.length === 0) return 100;

  const total = employees.reduce((sum, emp) => sum + emp.morale, 0);
  return Math.round(total / employees.length);
}

/**
 * Calculate company valuation.
 * Formula: ARR * revenue multiple * bubble multiplier * PMF multiplier
 */
export function calculateValuation(state: GameState): number {
  const annualRevenue = state.finances.weeklyRevenue * 52;

  // Revenue multiple based on growth (typical SaaS: 10-30x)
  const baseMultiple = 15;

  // Bubble multiplier: at bubble index 50 = 1x, at 100 = 3x, at 0 = 0.3x
  const bubbleMultiplier = 0.3 + (state.market.bubbleIndex / 100) * 2.7;

  // PMF multiplier: 0.5 at PMF=0, 2.0 at PMF=100
  const pmfMultiplier = 0.5 + (state.product.pmfScore / 100) * 1.5;

  const valuation = annualRevenue * baseMultiple * bubbleMultiplier * pmfMultiplier;

  // Floor valuation at $100k for early stage
  return Math.max(Math.round(valuation), 100_000);
}
