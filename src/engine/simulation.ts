import type { GameState, Feature, Employee, Competitor } from '../types/index.ts';
import { calculateWeeklyBurn, calculatePMF } from './derived.ts';

/**
 * Clamp a number between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Simple seeded-ish random helper (uses Math.random — deterministic seeds
 * can be added later).
 */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ─── Product Development ──────────────────────────────────────────────

function simulateProductDevelopment(state: GameState): GameState {
  const updatedFeatures = state.product.features.map((feature): Feature => {
    if (feature.status !== 'in-progress') return feature;

    // Find assigned humans and agents
    const assignedHumans = state.team.employees.filter(
      (e) => feature.assignedEmployees.includes(e.id),
    );
    const assignedAgents = state.team.aiAgents.filter(
      (a) => feature.assignedAgents.includes(a.id),
    );

    // Human contribution: steady quality, moderate speed
    const humanProgress = assignedHumans.reduce(
      (sum, emp) => sum + (emp.skill * emp.morale) / 10000 * 8, // ~4-8 points per skilled human per week
      0,
    );
    const humanQualityBoost = assignedHumans.length > 0
      ? assignedHumans.reduce((sum, emp) => sum + emp.skill, 0) / assignedHumans.length / 100
      : 0;

    // AI contribution: fast but accumulates tech debt
    const aiProgress = assignedAgents.reduce(
      (sum, agent) => sum + (agent.capability * agent.reliability) / 10000 * 12, // ~6-12 points per capable agent
      0,
    );
    const aiTechDebtIncrease = assignedAgents.reduce(
      (sum, agent) => sum + (100 - agent.reliability) / 100 * 3, // less reliable = more debt
      0,
    );

    const totalProgress = humanProgress + aiProgress;
    const newProgress = clamp(feature.progress + totalProgress, 0, 100);

    // Quality trends toward human skill contribution, AI doesn't help much
    const targetQuality = assignedHumans.length > 0
      ? 40 + humanQualityBoost * 50
      : 30;
    const newQuality = clamp(
      feature.quality + (targetQuality - feature.quality) * 0.1,
      0,
      100,
    );

    const newTechDebt = clamp(feature.techDebt + aiTechDebtIncrease, 0, 100);

    // Auto-ship when progress hits 100
    const newStatus = newProgress >= 100 ? 'shipped' as const : feature.status;

    return {
      ...feature,
      progress: Math.round(newProgress * 10) / 10,
      quality: Math.round(newQuality),
      techDebt: Math.round(newTechDebt * 10) / 10,
      status: newStatus,
    };
  });

  const shippedFeatures = updatedFeatures.filter((f) => f.status === 'shipped');
  const overallQuality = shippedFeatures.length > 0
    ? Math.round(
        shippedFeatures.reduce((s, f) => s + f.quality, 0) / shippedFeatures.length,
      )
    : state.product.overallQuality;
  const techDebtTotal = updatedFeatures.length > 0
    ? Math.round(
        updatedFeatures.reduce((s, f) => s + f.techDebt, 0) / updatedFeatures.length,
      )
    : 0;

  // Bugs accumulate from tech debt
  const newBugs = Math.max(
    0,
    state.product.bugs + Math.floor(techDebtTotal / 25) - (shippedFeatures.length > 0 ? 1 : 0),
  );

  return {
    ...state,
    product: {
      ...state.product,
      features: updatedFeatures,
      overallQuality,
      techDebtTotal,
      bugs: newBugs,
    },
  };
}

// ─── Revenue ──────────────────────────────────────────────────────────

function simulateRevenue(state: GameState): GameState {
  const qualityModifier = state.product.overallQuality / 100;
  const bugPenalty = Math.max(0, 1 - state.product.bugs * 0.02);
  const revenue =
    state.product.customers * state.finances.pricePerUnit * qualityModifier * bugPenalty;

  return {
    ...state,
    finances: {
      ...state.finances,
      weeklyRevenue: Math.round(revenue * 100) / 100,
    },
  };
}

// ─── Burn ─────────────────────────────────────────────────────────────

function simulateBurn(state: GameState): GameState {
  const burn = calculateWeeklyBurn(state);
  const netCashChange = state.finances.weeklyRevenue - burn;

  return {
    ...state,
    finances: {
      ...state.finances,
      weeklyBurn: burn,
      cash: Math.round((state.finances.cash + netCashChange) * 100) / 100,
      monthlyExpenses: burn * 4,
    },
  };
}

// ─── Market ───────────────────────────────────────────────────────────

function simulateMarket(state: GameState): GameState {
  // Bubble index drifts with trend + noise
  const bubbleNoise = rand(-3, 3);
  const newBubbleIndex = clamp(
    state.market.bubbleIndex + state.market.bubbleTrend + bubbleNoise,
    0,
    100,
  );

  // Trend mean-reverts slightly and occasionally flips
  let newTrend = state.market.bubbleTrend * 0.95 + rand(-0.5, 0.5);
  // If bubble is extreme, push trend back
  if (newBubbleIndex > 90) newTrend -= 0.5;
  if (newBubbleIndex < 10) newTrend += 0.5;

  // Talent market heat correlates with bubble
  const newTalentHeat = clamp(
    state.market.talentMarketHeat * 0.9 + newBubbleIndex * 0.1 + rand(-2, 2),
    0,
    100,
  );

  // Investor sentiment correlates with bubble
  const newInvestorSentiment = clamp(
    state.market.investorSentiment * 0.85 + newBubbleIndex * 0.15 + rand(-3, 3),
    0,
    100,
  );

  // Competitors evolve slightly
  const updatedCompetitors = state.market.competitors.map(
    (comp): Competitor => {
      if (!comp.alive) return comp;
      const qualityDelta = rand(-1, 1.5);
      const shareDelta = rand(-0.005, 0.005);
      // Small chance of competitor dying
      const dies = comp.funding < 1_000_000 && Math.random() < 0.01;
      return {
        ...comp,
        productQuality: clamp(comp.productQuality + qualityDelta, 0, 100),
        marketShare: clamp(comp.marketShare + shareDelta, 0, 1),
        alive: !dies,
      };
    },
  );

  return {
    ...state,
    market: {
      ...state.market,
      bubbleIndex: Math.round(newBubbleIndex * 10) / 10,
      bubbleTrend: Math.round(newTrend * 100) / 100,
      talentMarketHeat: Math.round(newTalentHeat),
      investorSentiment: Math.round(newInvestorSentiment),
      competitors: updatedCompetitors,
    },
  };
}

// ─── Morale ───────────────────────────────────────────────────────────

function simulateMorale(state: GameState): GameState {
  if (state.team.employees.length === 0) return state;

  const totalTeamSize = state.team.employees.length + state.team.aiAgents.length;
  const aiRatio = totalTeamSize > 0 ? state.team.aiAgents.length / totalTeamSize : 0;

  const updatedEmployees = state.team.employees.map((emp): Employee => {
    let moraleDelta = 0;

    // AI ratio effect: each employee reacts based on their aiSentiment
    // Negative sentiment + high AI ratio = morale drop
    const aiEffect = aiRatio * (emp.aiSentiment < 0 ? emp.aiSentiment / 50 : emp.aiSentiment / 200);
    moraleDelta += aiEffect;

    // Overwork: if assigned to a feature, slight morale drain
    if (emp.assignedTo) {
      moraleDelta -= 1;
    }

    // Natural drift toward 50
    moraleDelta += (50 - emp.morale) * 0.02;

    // Culture: good work-life balance helps
    moraleDelta += (state.company.culture.workLifeBalance - 50) * 0.01;

    // Random noise
    moraleDelta += rand(-2, 2);

    const newMorale = clamp(Math.round(emp.morale + moraleDelta), 0, 100);

    return { ...emp, morale: newMorale };
  });

  const avgMorale =
    updatedEmployees.length > 0
      ? Math.round(
          updatedEmployees.reduce((s, e) => s + e.morale, 0) /
            updatedEmployees.length,
        )
      : 100;

  return {
    ...state,
    team: {
      ...state.team,
      employees: updatedEmployees,
      avgMorale,
    },
  };
}

// ─── Hiring Pipeline ──────────────────────────────────────────────────

function simulateHiringPipeline(state: GameState): GameState {
  // Expire candidates whose weeks-to-decide has run out
  const remaining = state.team.hiringPipeline
    .map((c) => ({ ...c, weeksToDecide: c.weeksToDecide - 1 }))
    .filter((c) => c.weeksToDecide > 0);

  // Don't add new candidates — they come from PostJobDecision or events
  // (Randomly add a small chance of inbound candidate based on reputation)
  // Keeping pipeline simple for now; actual generation driven by decisions

  return {
    ...state,
    team: {
      ...state.team,
      hiringPipeline: remaining,
    },
  };
}

// ─── Customers ────────────────────────────────────────────────────────

function simulateCustomers(state: GameState): GameState {
  const pmf = calculatePMF(state);
  const currentCustomers = state.product.customers;

  // Organic growth from PMF: higher PMF = more growth
  const pmfGrowth = (pmf / 100) * (currentCustomers * 0.05 + 2);

  // Market growth
  const marketGrowthRate = state.market.segmentData.growthRate / 52; // weekly
  const marketGrowth = currentCustomers * marketGrowthRate;

  // Churn
  const churned = currentCustomers * state.product.churnRate / 4; // weekly churn (monthly rate / 4)

  // Must have shipped something and not be free to get paying customers
  const hasShippedProduct = state.product.features.some(
    (f) => f.status === 'shipped',
  );
  const growth = hasShippedProduct ? pmfGrowth + marketGrowth : 0;

  const newCustomers = Math.max(0, Math.round(currentCustomers + growth - churned));

  return {
    ...state,
    product: {
      ...state.product,
      customers: newCustomers,
      pmfScore: pmf,
    },
  };
}

// ─── Main simulation entry point ──────────────────────────────────────

/**
 * Run all simulation sub-systems for one week.
 * Pure function: returns a new GameState.
 */
export function simulateWeek(state: GameState): GameState {
  let next = state;
  next = simulateProductDevelopment(next);
  next = simulateCustomers(next);
  next = simulateRevenue(next);
  next = simulateBurn(next);
  next = simulateMarket(next);
  next = simulateMorale(next);
  next = simulateHiringPipeline(next);
  return next;
}
