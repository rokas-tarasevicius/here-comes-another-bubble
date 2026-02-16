import type { GameState, Feature, Employee, Competitor, HiringCandidate, EmployeeRole } from '../types/index.ts';
import { calculateWeeklyBurn, calculatePMF } from './derived.ts';
import { generateId } from '../utils/id.ts';

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
  // BUG 5 fix: Auto-assign up to 2 unassigned employees to in-progress features
  // that have no assigned employees or agents
  const allAssignedEmployeeIds = new Set(
    state.product.features.flatMap((f) => f.assignedEmployees),
  );
  const unassignedEmployees = state.team.employees.filter(
    (e) => !allAssignedEmployeeIds.has(e.id) && e.assignedTo === null,
  );

  let unassignedPool = [...unassignedEmployees];
  const featureAssignmentUpdates: Map<string, string[]> = new Map();

  for (const feature of state.product.features) {
    if (feature.status !== 'in-progress') continue;
    if (feature.assignedEmployees.length > 0 || feature.assignedAgents.length > 0) continue;
    if (unassignedPool.length === 0) break;

    const toAssign = unassignedPool.slice(0, 2);
    unassignedPool = unassignedPool.slice(toAssign.length);
    featureAssignmentUpdates.set(feature.id, toAssign.map((e) => e.id));
  }

  // Apply growth strategy modifiers (BUG 7 fix)
  const strategy = state.meta.growthStrategy;
  let featureProgressMultiplier = 1.0;
  let techDebtMultiplier = 1.0;
  let qualityMultiplier = 1.0;
  if (strategy === 'move-fast') {
    featureProgressMultiplier = 1.3;
    techDebtMultiplier = 1.5;
    qualityMultiplier = 0.8;
  } else if (strategy === 'quality-first') {
    featureProgressMultiplier = 0.7;
    techDebtMultiplier = 0.5;
    qualityMultiplier = 1.3;
  }

  const updatedFeatures = state.product.features.map((feature): Feature => {
    if (feature.status !== 'in-progress') return feature;

    // Apply auto-assignments from BUG 5 fix
    const extraAssignees = featureAssignmentUpdates.get(feature.id) ?? [];
    const effectiveAssignedEmployees = [...feature.assignedEmployees, ...extraAssignees];

    // Find assigned humans and agents
    const assignedHumans = state.team.employees.filter(
      (e) => effectiveAssignedEmployees.includes(e.id),
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

    // Apply strategy multipliers (BUG 7 fix)
    const totalProgress = (humanProgress + aiProgress) * featureProgressMultiplier;
    const newProgress = clamp(feature.progress + totalProgress, 0, 100);

    // Quality trends toward human skill contribution, AI doesn't help much
    const targetQuality = (assignedHumans.length > 0
      ? 40 + humanQualityBoost * 50
      : 30) * qualityMultiplier;
    const newQuality = clamp(
      feature.quality + (targetQuality - feature.quality) * 0.1,
      0,
      100,
    );

    const newTechDebt = clamp(feature.techDebt + aiTechDebtIncrease * techDebtMultiplier, 0, 100);

    // Auto-ship when progress hits 100
    const newStatus = newProgress >= 100 ? 'shipped' as const : feature.status;

    return {
      ...feature,
      assignedEmployees: effectiveAssignedEmployees,
      progress: Math.round(newProgress * 10) / 10,
      quality: Math.round(newQuality),
      techDebt: Math.round(newTechDebt * 10) / 10,
      status: newStatus,
    };
  });

  // Also update employee assignedTo for auto-assigned employees
  const employeeFeatureMap = new Map<string, string>();
  for (const [featureId, empIds] of featureAssignmentUpdates) {
    for (const eid of empIds) {
      employeeFeatureMap.set(eid, featureId);
    }
  }
  const updatedEmployees = state.team.employees.map((emp) => {
    const assignedFeatureId = employeeFeatureMap.get(emp.id);
    if (assignedFeatureId) {
      return { ...emp, assignedTo: assignedFeatureId };
    }
    return emp;
  });

  const shippedFeatures = updatedFeatures.filter((f) => f.status === 'shipped');
  // BUG 6 fix: When no features are shipped, overallQuality should be 0
  const overallQuality = shippedFeatures.length > 0
    ? Math.round(
        shippedFeatures.reduce((s, f) => s + f.quality, 0) / shippedFeatures.length,
      )
    : 0;
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
    team: {
      ...state.team,
      employees: updatedEmployees,
    },
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
  const baseBurn = calculateWeeklyBurn(state);

  // BUG 7 fix: Apply growth strategy burn multiplier
  const strategy = state.meta.growthStrategy;
  let burnMultiplier = 1.0;
  if (strategy === 'growth-hack') {
    burnMultiplier = 1.2;
  } else if (strategy === 'sustainable') {
    burnMultiplier = 0.85;
  }

  const burn = Math.round(baseBurn * burnMultiplier);
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

// ─── Candidate generation data ───────────────────────────────────────

const CANDIDATE_FIRST_NAMES = [
  'Maya', 'Liam', 'Priya', 'Noah', 'Sofia', 'Ethan', 'Aisha', 'Marcus',
  'Zoe', 'Carlos', 'Riley', 'Dev', 'Hana', 'Tyler', 'Nadia', 'Jake',
  'Mei', 'Omar', 'Chloe', 'Sanjay', 'Emma', 'Kai', 'Layla', 'Finn',
];

const CANDIDATE_LAST_NAMES = [
  'Kim', 'Patel', 'Rodriguez', 'Nguyen', 'Smith', 'Wang', 'Johnson',
  'Müller', 'Garcia', 'Ali', 'Chen', 'Brown', 'Singh', 'Lopez', 'Lee',
  'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
];

const ROLE_SALARY_RANGES: Record<EmployeeRole, { min: number; max: number; skillMin: number; skillMax: number }> = {
  'engineer': { min: 2_500, max: 4_000, skillMin: 40, skillMax: 70 },
  'senior-engineer': { min: 4_000, max: 6_500, skillMin: 65, skillMax: 90 },
  'designer': { min: 2_200, max: 4_000, skillMin: 45, skillMax: 80 },
  'pm': { min: 2_800, max: 5_000, skillMin: 50, skillMax: 80 },
  'marketer': { min: 2_000, max: 3_800, skillMin: 40, skillMax: 75 },
  'sales': { min: 2_000, max: 4_500, skillMin: 40, skillMax: 80 },
  'data-scientist': { min: 3_000, max: 5_500, skillMin: 50, skillMax: 85 },
  'devops': { min: 3_000, max: 5_000, skillMin: 50, skillMax: 80 },
  'exec': { min: 5_000, max: 8_000, skillMin: 60, skillMax: 90 },
};

const HIREABLE_ROLES: EmployeeRole[] = [
  'engineer', 'senior-engineer', 'designer', 'pm', 'marketer',
  'sales', 'data-scientist', 'devops',
];

function generateCandidate(): HiringCandidate {
  const firstName = CANDIDATE_FIRST_NAMES[Math.floor(Math.random() * CANDIDATE_FIRST_NAMES.length)];
  const lastName = CANDIDATE_LAST_NAMES[Math.floor(Math.random() * CANDIDATE_LAST_NAMES.length)];
  const role = HIREABLE_ROLES[Math.floor(Math.random() * HIREABLE_ROLES.length)];
  const range = ROLE_SALARY_RANGES[role];

  const skill = Math.round(rand(range.skillMin, range.skillMax));
  // Higher skill candidates demand higher salaries
  const skillFactor = (skill - range.skillMin) / (range.skillMax - range.skillMin);
  const salaryExpectation = Math.round(range.min + skillFactor * (range.max - range.min));

  return {
    id: generateId(),
    name: `${firstName} ${lastName}`,
    role,
    skill,
    salaryExpectation,
    weeksToDecide: Math.floor(rand(2, 5)),
  };
}

function simulateHiringPipeline(state: GameState): GameState {
  // Expire candidates whose weeks-to-decide has run out
  const remaining = state.team.hiringPipeline
    .map((c) => ({ ...c, weeksToDecide: c.weeksToDecide - 1 }))
    .filter((c) => c.weeksToDecide > 0);

  // BUG 8 fix: Generate 1-3 random inbound candidates per week
  // based on company reputation and talent market heat
  const reputation = state.company.reputation;
  const talentHeat = state.market.talentMarketHeat;

  // Base: 1 candidate per week. Higher reputation and cooler talent market = more applicants
  const baseCount = 1;
  const reputationBonus = reputation > 50 ? 1 : 0;
  const heatBonus = talentHeat < 50 ? 1 : 0; // Cold talent market = easier to attract
  const maxCandidates = Math.min(baseCount + reputationBonus + heatBonus, 3);
  const candidateCount = Math.max(1, Math.floor(rand(1, maxCandidates + 1)));

  const newCandidates: HiringCandidate[] = [];
  // Cap pipeline at 8 to avoid unbounded growth
  for (let i = 0; i < candidateCount && remaining.length + newCandidates.length < 8; i++) {
    newCandidates.push(generateCandidate());
  }

  return {
    ...state,
    team: {
      ...state.team,
      hiringPipeline: [...remaining, ...newCandidates],
    },
  };
}

// ─── Customers ────────────────────────────────────────────────────────

function simulateCustomers(state: GameState): GameState {
  const pmf = calculatePMF(state);
  const currentCustomers = state.product.customers;

  // BUG 7 fix: Apply growth strategy customer multiplier
  const strategy = state.meta.growthStrategy;
  let customerGrowthMultiplier = 1.0;
  if (strategy === 'growth-hack') {
    customerGrowthMultiplier = 1.5;
  } else if (strategy === 'sustainable') {
    customerGrowthMultiplier = 0.8;
  }

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
  const growth = hasShippedProduct ? (pmfGrowth + marketGrowth) * customerGrowthMultiplier : 0;

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

// ─── Stage Progression ───────────────────────────────────────────────

/**
 * BUG 4 fix: Advance company stage based on metrics.
 * Pure function: returns a new GameState.
 */
function simulateStageProgression(state: GameState): GameState {
  const { stage } = state.company;
  const valuation = state.company.valuation;
  const teamSize = state.team.employees.length + state.team.aiAgents.length;
  const revenue = state.finances.weeklyRevenue;
  const customers = state.product.customers;
  const hasFunding = state.finances.fundingHistory.length > 0;

  let newStage = stage;

  switch (stage) {
    case 'garage':
      if (hasFunding || valuation > 500_000) {
        newStage = 'pre-seed';
      }
      break;
    case 'pre-seed':
      if (valuation > 2_000_000 && teamSize > 5) {
        newStage = 'seed';
      }
      break;
    case 'seed':
      if (valuation > 10_000_000 && revenue > 0 && teamSize > 10) {
        newStage = 'series-a';
      }
      break;
    case 'series-a':
      if (valuation > 50_000_000 && customers > 500) {
        newStage = 'series-b';
      }
      break;
    case 'series-b':
      if (valuation > 200_000_000) {
        newStage = 'series-c';
      }
      break;
    case 'series-c':
      if (valuation > 500_000_000) {
        newStage = 'growth';
      }
      break;
    case 'growth':
      if (valuation > 1_000_000_000) {
        newStage = 'public';
      }
      break;
    // 'public' and 'dead' don't progress further
  }

  if (newStage === stage) return state;

  return {
    ...state,
    company: {
      ...state.company,
      stage: newStage,
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
  next = simulateStageProgression(next);
  return next;
}
