import type { GameState, PricingTier } from '../types/index.ts';
import { PRICING_TIERS, getScaledTierRequirements, checkTierCertsRequirement } from '../data/compliance.ts';

/**
 * Calculate revenue growth momentum (0–1).
 * Looks at last 8 weeks of revenue history, computes weighted WoW growth rates
 * (recent weeks weighted more heavily via exponential decay), and factors in
 * absolute revenue increase. Maps through a curve to produce a 0–1 score.
 */
export function calculateRevenueGrowthMomentum(state: GameState): number {
  const history = state.weekHistory;
  if (history.length < 2) return 0;

  // Take last 8 weeks (or whatever is available)
  const recent = history.slice(-8);
  if (recent.length < 2) return 0;

  // Compute week-over-week growth rates with exponential decay weighting
  let weightedGrowthSum = 0;
  let weightSum = 0;
  const decayFactor = 0.7; // older weeks decay by 30% each step back

  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i - 1].revenue;
    const curr = recent[i].revenue;
    // Weight: most recent pair gets highest weight
    const weight = Math.pow(decayFactor, recent.length - 1 - i);

    let growthRate: number;
    if (prev <= 0) {
      // Going from $0 to something positive counts as strong growth
      growthRate = curr > 0 ? 0.5 : 0;
    } else {
      growthRate = (curr - prev) / prev;
    }

    weightedGrowthSum += growthRate * weight;
    weightSum += weight;
  }

  const avgGrowthRate = weightSum > 0 ? weightedGrowthSum / weightSum : 0;

  // Also factor absolute revenue increase (going $0→$5K matters)
  const oldestRevenue = recent[0].revenue;
  const newestRevenue = recent[recent.length - 1].revenue;
  const absoluteIncrease = newestRevenue - oldestRevenue;
  // Normalize: $10K increase over the window → 0.5 bonus
  const absoluteFactor = Math.min(0.3, Math.max(0, absoluteIncrease / 30_000));

  // Map growth rate through a curve:
  // flat/declining → ~0, 10% WoW → ~0.4, 25% WoW → ~0.65, 50%+ WoW → ~0.9+
  let momentum: number;
  if (avgGrowthRate <= 0) {
    momentum = Math.max(0, 0.05 + avgGrowthRate); // declining → near 0
  } else if (avgGrowthRate <= 0.10) {
    momentum = avgGrowthRate * 4; // 0–10% → 0–0.4
  } else if (avgGrowthRate <= 0.25) {
    momentum = 0.4 + (avgGrowthRate - 0.10) * (0.25 / 0.15); // 10–25% → 0.4–0.65
  } else if (avgGrowthRate <= 0.50) {
    momentum = 0.65 + (avgGrowthRate - 0.25) * (0.25 / 0.25); // 25–50% → 0.65–0.9
  } else {
    momentum = 0.9 + Math.min(0.1, (avgGrowthRate - 0.50) * 0.2); // 50%+ → 0.9–1.0
  }

  // Add absolute factor
  momentum = Math.min(1, momentum + absoluteFactor);

  return Math.max(0, Math.min(1, momentum));
}

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
 * Calculate total weekly burn: salaries + AI costs + fixed overhead + marketing.
 */
export function calculateWeeklyBurn(state: GameState): number {
  const salaries = state.team.members
    ? state.team.members.reduce((sum, m) => sum + m.salary, 0)
    : state.team.teamSize * state.team.avgSalary;
  const aiCosts = state.team.aiAgents.reduce(
    (sum, agent) => sum + agent.costPerWeek,
    0,
  );
  // Fixed costs: infrastructure, overhead, and founder living expenses
  // Garage stage: cloud hosting + founder living costs (~$500/wk). As you grow, costs scale.
  const stageCosts: Record<string, number> = {
    'garage': 500,
    'pre-seed': 700,
    'seed': 1200,
    'series-a': 2500,
    'series-b': 5000,
    'series-c': 8000,
    'series-d': 15_000,
    'series-e': 25_000,
    'series-f': 40_000,
    'growth': 60_000,
    'public': 100_000,
  };
  const baseCost = stageCosts[state.company.stage] ?? 500;
  const fixedCosts = baseCost + state.team.teamSize * 50;
  const complianceCosts = state.compliance
    ? state.compliance.certifications
        .filter((c) => c.status === 'in-progress')
        .reduce((sum, c) => sum + c.weeklySpend, 0)
    : 0;
  return salaries + aiCosts + fixedCosts + (state.finances.marketingSpend ?? 0) + complianceCosts;
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
    'series-d': 400_000_000,
    'series-e': 1_000_000_000,
    'series-f': 3_000_000_000,
    'growth': 5_000_000_000,
    'public': 10_000_000_000,
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
    'usage-based': 1.2,
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

/**
 * Calculate the current pricing tier the player qualifies for.
 * Checks engineers, shipped features, quality, and certifications against tier requirements.
 */
export function calculateCurrentPricingTier(state: GameState): PricingTier {
  const engineers = state.team.members.filter((m) => m.role === 'engineer').length;
  const shippedFeatures = state.product.features.filter((f) => f.status === 'shipped').length;
  const quality = state.product.overallQuality;
  const completedCerts = state.compliance
    ? state.compliance.certifications.filter((c) => c.status === 'completed').map((c) => c.id)
    : [];
  const difficulty = state.meta.difficulty;
  const segment = state.market.segment;

  let currentTier: PricingTier = 1;

  for (const tierDef of PRICING_TIERS) {
    if (tierDef.tier === 1) continue;
    const scaled = getScaledTierRequirements(tierDef, difficulty);
    const meetsEngineers = engineers >= scaled.requiredEngineers;
    const meetsFeatures = shippedFeatures >= tierDef.requiredShippedFeatures;
    const meetsQuality = quality >= scaled.requiredQuality;
    const meetsCerts = checkTierCertsRequirement(tierDef, completedCerts, segment);

    if (meetsEngineers && meetsFeatures && meetsQuality && meetsCerts) {
      currentTier = tierDef.tier;
    } else {
      break;
    }
  }

  return currentTier;
}

/**
 * Calculate the maximum price allowed by the current pricing tier.
 */
export function calculateMaxPrice(state: GameState): number {
  const tier = calculateCurrentPricingTier(state);
  const tierDef = PRICING_TIERS.find((t) => t.tier === tier)!;
  const defaultPrice = state.market.segmentData.defaultPrice;
  return Math.round(defaultPrice * tierDef.priceMultiplierMax);
}

/**
 * Calculate the minimum price allowed by the current pricing tier.
 */
export function calculateMinPrice(state: GameState): number {
  const tier = calculateCurrentPricingTier(state);
  const tierDef = PRICING_TIERS.find((t) => t.tier === tier)!;
  const defaultPrice = state.market.segmentData.defaultPrice;
  return Math.max(1, Math.round(defaultPrice * tierDef.priceMultiplierMin));
}
