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
  const salaries = state.team.members
    ? state.team.members.reduce((sum, m) => sum + m.salary, 0)
    : state.team.teamSize * state.team.avgSalary;
  const aiCosts = state.team.aiAgents.reduce(
    (sum, agent) => sum + agent.costPerWeek,
    0,
  );
  // Fixed costs: infrastructure and overhead
  // Garage stage: just cloud hosting ($100/wk). As you grow, costs scale.
  const isGarage = state.company.stage === 'garage' || state.company.stage === 'pre-seed';
  const baseCost = isGarage ? 100 : 500;
  const fixedCosts = baseCost + state.team.teamSize * 50;
  return salaries + aiCosts + fixedCosts;
}

/**
 * Calculate team velocity — a measure of how much work gets done per week.
 * Human contribution: teamSize * morale/100 * 60 (base productivity per person)
 * AI contribution: capability * reliability / 100
 */
export function calculateTeamVelocity(state: GameState): number {
  const humanVelocity = state.team.teamSize * (state.team.morale / 100) * 60;
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
 * Calculate average morale. With simplified types, just return team.morale.
 */
export function calculateAvgMorale(state: GameState): number {
  if (state.team.members && state.team.members.length > 0) {
    const avgMemberMorale = state.team.members.reduce((sum, m) => sum + m.morale, 0) / state.team.members.length;
    // Blend individual morale with team-wide morale
    return Math.round((avgMemberMorale + state.team.morale) / 2);
  }
  return state.team.morale;
}

/**
 * Calculate company valuation.
 * Pre-revenue: stage-based base + team/product/customer/bubble multipliers
 * Post-revenue: ARR * revenue multiple * bubble * PMF
 * The two are blended so there's no sudden jump.
 */
export function calculateValuation(state: GameState): number {
  // ── Stage-based valuation (matters most pre-revenue) ──
  const stageBaseValuation: Record<string, number> = {
    'garage': 100_000,
    'pre-seed': 500_000,
    'seed': 3_000_000,
    'series-a': 15_000_000,
    'series-b': 50_000_000,
    'series-c': 150_000_000,
    'growth': 500_000_000,
    'public': 1_000_000_000,
    'dead': 0,
  };
  const stageBase = stageBaseValuation[state.company.stage] ?? 100_000;

  // Team multiplier: more people = more valuable (1.0 to 2.0)
  const totalTeam = state.team.teamSize + state.team.aiAgents.length;
  const teamMultiplier = 1.0 + Math.min(1.0, totalTeam / 20);

  // Product multiplier: quality and shipped features matter (0.5 to 2.0)
  const shippedCount = state.product.features.filter(f => f.status === 'shipped').length;
  const qualityFactor = state.product.overallQuality / 100;
  const productMultiplier = 0.5 + Math.min(1.5, shippedCount * 0.25 + qualityFactor * 0.5);

  // Customer multiplier: traction increases value (1.0 to 3.0)
  const customerMultiplier = 1.0 + Math.min(2.0, Math.log10(Math.max(1, state.product.customers)) * 0.5);

  // Bubble multiplier: market conditions (0.3 to 3.0)
  const bubbleMultiplier = 0.3 + (state.market.bubbleIndex / 100) * 2.7;

  // PMF multiplier (0.5 to 2.0)
  const pmfMultiplier = 0.5 + (state.product.pmfScore / 100) * 1.5;

  // Pricing model valuation multiplier: investors value recurring revenue models higher
  const pricingValuationMap: Record<string, number> = {
    'subscription': 1.5,
    'enterprise': 1.8,
    'usage-based': 1.2,
    'free': 0.6,
    'one-time': 1.0,
  };
  const pricingMultiplier = pricingValuationMap[state.finances.pricingModel] ?? 1.0;

  const tractionValuation = stageBase * teamMultiplier * productMultiplier * customerMultiplier * bubbleMultiplier * pricingMultiplier;

  // ── Revenue-based valuation (matters post-revenue) ──
  const annualRevenue = state.finances.weeklyRevenue * 52;
  const revenueMultiple = 15; // Typical SaaS: 10-30x
  const revenueValuation = annualRevenue * revenueMultiple * bubbleMultiplier * pmfMultiplier;

  // Blend: use the higher of the two, weighted by revenue presence
  // As revenue grows, revenue-based valuation dominates
  const revenueWeight = Math.min(1.0, annualRevenue / 500_000); // Full weight at $500K ARR
  const valuation = tractionValuation * (1 - revenueWeight) + revenueValuation * revenueWeight;

  // Always at least the stage base (can't be worth less than your funding implies)
  return Math.max(Math.round(valuation), stageBase);
}
