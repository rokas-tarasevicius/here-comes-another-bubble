import type { GameState, Feature, Employee, Competitor, HiringCandidate, EmployeeRole, EventLogEntry, PendingDecision, AIAgentType } from '../types/index.ts';
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

  // Tech debt consequence: slows feature progress
  const techDebtTotal = state.product.techDebtTotal;
  let techDebtSlowdown = 1.0;
  if (techDebtTotal > 50) {
    techDebtSlowdown = 0.8; // 20% slower
  }
  if (techDebtTotal > 70) {
    techDebtSlowdown = 0.6; // 40% slower
  }
  if (techDebtTotal > 85) {
    techDebtSlowdown = 0.4; // 60% slower
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

    // Apply strategy multipliers and tech debt slowdown
    const totalProgress = (humanProgress + aiProgress) * featureProgressMultiplier * techDebtSlowdown;
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
  const newTechDebtTotal = updatedFeatures.length > 0
    ? Math.round(
        updatedFeatures.reduce((s, f) => s + f.techDebt, 0) / updatedFeatures.length,
      )
    : 0;

  // Bugs accumulate from tech debt
  const newBugs = Math.max(
    0,
    state.product.bugs + Math.floor(newTechDebtTotal / 25) - (shippedFeatures.length > 0 ? 1 : 0),
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
      techDebtTotal: newTechDebtTotal,
      bugs: newBugs,
    },
  };
}

// ─── Tech Debt Consequences ──────────────────────────────────────────

/**
 * Apply consequences of accumulated tech debt beyond feature slowdown.
 * - techDebt > 70: random production outage, 5-10% churn spike
 * - techDebt > 85: team morale penalty
 * - Natural tech debt reduction when engineers aren't building features (refactoring)
 */
function simulateTechDebtConsequences(state: GameState): GameState {
  const techDebt = state.product.techDebtTotal;
  let customers = state.product.customers;
  let churnRate = state.product.churnRate;
  const newLogEntries: EventLogEntry[] = [];
  let moralePenalty = 0;

  // Production outage risk at high tech debt
  if (techDebt > 70 && Math.random() < 0.15) {
    // 15% chance per week of a production outage
    const churnSpike = 0.05 + Math.random() * 0.05; // 5-10% churn spike
    const lostCustomers = Math.round(customers * churnSpike);
    customers = Math.max(0, customers - lostCustomers);

    newLogEntries.push({
      id: generateId(),
      week: state.meta.week,
      eventId: 'tech-debt-outage',
      title: 'Production Outage!',
      description: `Your codebase buckled under its own weight. ${lostCustomers} customers churned during the downtime. Tech debt is ${techDebt}% — maybe it's time to refactor.`,
      category: 'product',
    });
  }

  // Engineers hate working on spaghetti code
  if (techDebt > 85) {
    moralePenalty = 3; // Applied per employee in morale simulation
    newLogEntries.push({
      id: generateId(),
      week: state.meta.week,
      eventId: 'tech-debt-morale',
      title: 'Engineers Frustrated',
      description: 'Your engineers are drowning in tech debt. Every small change breaks three other things. Morale is suffering.',
      category: 'team',
    });
  }

  // Natural tech debt reduction: unassigned engineers do refactoring
  const assignedEmployeeIds = new Set(
    state.product.features
      .filter((f) => f.status === 'in-progress')
      .flatMap((f) => f.assignedEmployees),
  );
  const unassignedEngineers = state.team.employees.filter(
    (e) =>
      !assignedEmployeeIds.has(e.id) &&
      (e.role === 'engineer' || e.role === 'senior-engineer' || e.role === 'devops'),
  );

  // Each unassigned engineer reduces tech debt slightly
  let techDebtReduction = 0;
  for (const eng of unassignedEngineers) {
    techDebtReduction += (eng.skill / 100) * 1.5; // 0.6-1.35 per engineer per week
  }

  // Apply tech debt reduction to all features
  const updatedFeatures = state.product.features.map((feature): Feature => {
    if (techDebtReduction <= 0) return feature;
    return {
      ...feature,
      techDebt: Math.max(0, Math.round((feature.techDebt - techDebtReduction) * 10) / 10),
    };
  });

  // Recalculate total tech debt after reduction
  const newTechDebtTotal = updatedFeatures.length > 0
    ? Math.round(
        updatedFeatures.reduce((s, f) => s + f.techDebt, 0) / updatedFeatures.length,
      )
    : 0;

  // Apply morale penalty to employees from high tech debt
  const updatedEmployees = moralePenalty > 0
    ? state.team.employees.map((emp) => {
        if (emp.role === 'engineer' || emp.role === 'senior-engineer' || emp.role === 'devops') {
          return { ...emp, morale: clamp(emp.morale - moralePenalty, 0, 100) };
        }
        return emp;
      })
    : state.team.employees;

  return {
    ...state,
    team: {
      ...state.team,
      employees: updatedEmployees,
    },
    product: {
      ...state.product,
      features: updatedFeatures,
      techDebtTotal: newTechDebtTotal,
      customers,
      churnRate,
    },
    eventLog: [...state.eventLog, ...newLogEntries],
  };
}

// ─── Revenue ──────────────────────────────────────────────────────────

/**
 * Better revenue model based on pricing type:
 * - free: 0 revenue
 * - freemium: 5% of users pay
 * - subscription: stable recurring, customer count * price
 * - usage-based: variable, tied to quality and customer activity
 * - enterprise: fewer customers but high ARPU, longer sales cycles
 * - one-time: burst then flat
 */
function simulateRevenue(state: GameState): GameState {
  const qualityModifier = state.product.overallQuality / 100;
  const bugPenalty = Math.max(0, 1 - state.product.bugs * 0.02);
  const customers = state.product.customers;
  const pricePerUnit = state.finances.pricePerUnit;
  let revenue = 0;

  switch (state.finances.pricingModel) {
    case 'free':
      // No revenue but helps with growth (handled in simulateCustomers)
      revenue = 0;
      break;

    case 'freemium': {
      // 5% of users convert to paid
      const payingUsers = Math.floor(customers * 0.05);
      revenue = payingUsers * pricePerUnit * qualityModifier * bugPenalty;
      break;
    }

    case 'subscription':
      // Stable recurring revenue
      revenue = customers * pricePerUnit * qualityModifier * bugPenalty;
      break;

    case 'usage-based': {
      // Variable: tied to product quality and customer activity
      // Higher quality = more engagement = more usage
      const activityMultiplier = 0.5 + qualityModifier * 1.0; // 0.5x to 1.5x
      const weeklyNoise = 1 + (Math.random() - 0.5) * 0.3; // ±15% variance
      revenue = customers * pricePerUnit * activityMultiplier * bugPenalty * weeklyNoise;
      break;
    }

    case 'enterprise': {
      // Fewer customers but high ARPU (10x-20x multiplier on price)
      // Longer sales cycles simulated by slower customer acquisition
      const enterpriseMultiplier = 15;
      revenue = customers * pricePerUnit * enterpriseMultiplier * qualityModifier * bugPenalty;
      break;
    }

    case 'one-time': {
      // Burst of revenue from new customers only, then flat
      // Estimate: only new customers this week generate one-time revenue
      const prevCustomers = state.weekHistory.length > 0
        ? state.weekHistory[state.weekHistory.length - 1].customers
        : 0;
      const newCustomers = Math.max(0, customers - prevCustomers);
      revenue = newCustomers * pricePerUnit * qualityModifier * bugPenalty;
      break;
    }
  }

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

  // Add marketing spend to burn
  const marketingBurn = state.finances.marketingSpend;

  const burn = Math.round(baseBurn * burnMultiplier + marketingBurn);
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
  // Occasional "bubble event" — massive shift (±15-25 points)
  let bubbleShock = 0;
  if (Math.random() < 0.02) { // 2% chance per week
    bubbleShock = (Math.random() < 0.5 ? 1 : -1) * rand(15, 25);
  }

  // Bubble index drifts with trend + noise + potential shock
  const bubbleNoise = rand(-3, 3);
  const newBubbleIndex = clamp(
    state.market.bubbleIndex + state.market.bubbleTrend + bubbleNoise + bubbleShock,
    0,
    100,
  );

  // Trend mean-reverts slightly and occasionally flips
  let newTrend = state.market.bubbleTrend * 0.95 + rand(-0.5, 0.5);
  // If bubble is extreme, push trend back
  if (newBubbleIndex > 90) newTrend -= 0.5;
  if (newBubbleIndex < 10) newTrend += 0.5;

  // Talent market heat correlates with bubble
  let newTalentHeat = clamp(
    state.market.talentMarketHeat * 0.9 + newBubbleIndex * 0.1 + rand(-2, 2),
    0,
    100,
  );

  // Investor sentiment correlates with bubble
  let newInvestorSentiment = clamp(
    state.market.investorSentiment * 0.85 + newBubbleIndex * 0.15 + rand(-3, 3),
    0,
    100,
  );

  // Irrational Exuberance: bubble > 85
  let competitorDeathBoost = 0;
  if (newBubbleIndex > 85) {
    // Investor sentiment spikes
    newInvestorSentiment = clamp(newInvestorSentiment + rand(2, 5), 0, 100);
    // Talent market heats up (everyone wants to join startups)
    newTalentHeat = clamp(newTalentHeat + rand(1, 3), 0, 100);
    // Higher chance of competitors dying (overextended)
    competitorDeathBoost = 0.03;
  }

  // Market Correction: bubble < 25
  if (newBubbleIndex < 25) {
    // Investors ghost everyone
    newInvestorSentiment = clamp(newInvestorSentiment - rand(2, 5), 0, 100);
    // Talent leaves for stable jobs
    newTalentHeat = clamp(newTalentHeat - rand(2, 4), 0, 100);
  }

  // Competitors evolve slightly
  const updatedCompetitors = state.market.competitors.map(
    (comp): Competitor => {
      if (!comp.alive) return comp;
      const qualityDelta = rand(-1, 1.5);
      const shareDelta = rand(-0.005, 0.005);
      // Small chance of competitor dying (boosted during exuberance)
      const deathChance = (comp.funding < 1_000_000 ? 0.01 : 0) + competitorDeathBoost;
      const dies = Math.random() < deathChance;
      return {
        ...comp,
        productQuality: clamp(comp.productQuality + qualityDelta, 0, 100),
        marketShare: clamp(comp.marketShare + shareDelta, 0, 1),
        alive: !dies,
      };
    },
  );

  // Generate event log entries for bubble events
  const newLogEntries: EventLogEntry[] = [];
  if (bubbleShock !== 0) {
    newLogEntries.push({
      id: generateId(),
      week: state.meta.week,
      eventId: bubbleShock > 0 ? 'market-shock-up' : 'market-shock-down',
      title: bubbleShock > 0 ? 'Market Euphoria' : 'Market Panic',
      description: bubbleShock > 0
        ? 'A wave of AI hype swept through the market. Valuations are surging, VCs are throwing money around, and everyone thinks they\'re a genius.'
        : 'Market shock hit. Investors are pulling back, valuations are compressing, and the word "sustainable" is suddenly trendy again.',
      category: 'market',
    });
  }

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
    eventLog: [...state.eventLog, ...newLogEntries],
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

    // Low bubble / market correction hurts morale (job insecurity)
    if (state.market.bubbleIndex < 25) {
      moraleDelta -= 1;
    }

    // High tech debt hurts engineering morale (already handled in tech debt consequences,
    // but give a general mood penalty)
    if (state.product.techDebtTotal > 60) {
      moraleDelta -= 0.5;
    }

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

// ─── Employee Quitting ───────────────────────────────────────────────

/**
 * Employees with very low morale may quit.
 * - morale < 20: 30% chance of quitting each week
 * - morale < 10: 60% chance of quitting
 * - When employees quit: remaining employees get morale hit
 * - Key person risk: if highest-skill employee quits, bigger morale hit
 */
function simulateEmployeeQuitting(state: GameState): GameState {
  if (state.team.employees.length === 0) return state;

  const employees = state.team.employees;
  const highestSkill = Math.max(...employees.map((e) => e.skill));

  const quitters: Employee[] = [];
  const survivors: Employee[] = [];

  for (const emp of employees) {
    let quitChance = 0;
    if (emp.morale < 10) {
      quitChance = 0.60;
    } else if (emp.morale < 20) {
      quitChance = 0.30;
    }

    // Low loyalty increases quit chance
    if (emp.loyalty < 20) {
      quitChance += 0.10;
    }

    // Talent market heat: hot market = more options elsewhere
    if (state.market.talentMarketHeat > 70) {
      quitChance += 0.05;
    }

    if (quitChance > 0 && Math.random() < quitChance) {
      quitters.push(emp);
    } else {
      survivors.push(emp);
    }
  }

  if (quitters.length === 0) return state;

  // Calculate morale hit on remaining employees
  let baseMoraleHit = quitters.length * 3; // 3 points per quitter

  // Key person risk: if the highest-skill employee quit
  const keyPersonQuit = quitters.some((q) => q.skill === highestSkill);
  if (keyPersonQuit) {
    baseMoraleHit += 5; // Extra hit for losing your best person
  }

  const updatedSurvivors = survivors.map((emp) => ({
    ...emp,
    morale: clamp(emp.morale - baseMoraleHit, 0, 100),
  }));

  // Clean up feature assignments for quitters
  const quitterIds = new Set(quitters.map((q) => q.id));
  const updatedFeatures = state.product.features.map((feature) => ({
    ...feature,
    assignedEmployees: feature.assignedEmployees.filter((id) => !quitterIds.has(id)),
  }));

  // Generate event log entries
  const newLogEntries: EventLogEntry[] = quitters.map((emp) => ({
    id: generateId(),
    week: state.meta.week,
    eventId: 'employee-quit',
    title: `${emp.name} Quit`,
    description: emp.skill === highestSkill
      ? `${emp.name} (${emp.role}), your highest-skilled team member, walked out. The team is shaken.`
      : `${emp.name} (${emp.role}) quit. Morale was at ${emp.morale}%. They said something about "work-life balance" on their way out.`,
    category: 'team',
  }));

  return {
    ...state,
    team: {
      ...state.team,
      employees: updatedSurvivors,
    },
    product: {
      ...state.product,
      features: updatedFeatures,
    },
    eventLog: [...state.eventLog, ...newLogEntries],
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

  // Low bubble: talent leaves for stable jobs, fewer candidates
  const bubblePenalty = state.market.bubbleIndex < 25 ? 0.5 : 1.0;
  const adjustedCount = Math.max(1, Math.round(candidateCount * bubblePenalty));

  const newCandidates: HiringCandidate[] = [];
  // Cap pipeline at 8 to avoid unbounded growth
  for (let i = 0; i < adjustedCount && remaining.length + newCandidates.length < 8; i++) {
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

  // Bubble affects customer acquisition
  let bubbleCustomerModifier = 1.0;
  if (state.market.bubbleIndex > 85) {
    // Irrational exuberance: more hype customers
    bubbleCustomerModifier = 1.3;
  } else if (state.market.bubbleIndex < 25) {
    // Market correction: customers cancel, harder to acquire
    bubbleCustomerModifier = 0.6;
  }

  // Reputation-driven organic growth
  const reputationGrowth = (state.company.reputation / 100) * 1.5; // 0-1.5 extra customers/week

  // Word of mouth multiplier: based on shipped features quality
  const shippedFeatures = state.product.features.filter((f) => f.status === 'shipped');
  const avgShippedQuality = shippedFeatures.length > 0
    ? shippedFeatures.reduce((s, f) => s + f.quality, 0) / shippedFeatures.length
    : 0;
  const wordOfMouthMultiplier = avgShippedQuality > 70
    ? 1.0 + (avgShippedQuality - 70) / 100 // up to 1.3x for quality=100
    : 1.0;

  // Marketing spend effect
  const marketingEffect = state.finances.marketingSpend > 0
    ? Math.sqrt(state.finances.marketingSpend / 1000) * 2 // diminishing returns
    : 0;

  // Free pricing model: faster user growth (but no revenue)
  const pricingGrowthBonus = state.finances.pricingModel === 'free' ? 1.5
    : state.finances.pricingModel === 'freemium' ? 1.3
    : state.finances.pricingModel === 'enterprise' ? 0.5 // fewer but bigger customers
    : 1.0;

  // Churn
  let churnRate = state.product.churnRate;
  // Tech debt > 70 causes churn spike (on top of outage churn from tech debt consequences)
  if (state.product.techDebtTotal > 70) {
    churnRate += 0.02; // extra 2% monthly churn
  }
  const churned = currentCustomers * churnRate / 4; // weekly churn (monthly rate / 4)

  // Must have shipped something to get customers
  const hasShippedProduct = state.product.features.some(
    (f) => f.status === 'shipped',
  );
  const growth = hasShippedProduct
    ? (pmfGrowth + marketGrowth + reputationGrowth + marketingEffect) *
      customerGrowthMultiplier * bubbleCustomerModifier * wordOfMouthMultiplier * pricingGrowthBonus
    : 0;

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

// ─── Marketing Spend ─────────────────────────────────────────────────

/**
 * Simulate marketing spend adjustments based on growth strategy.
 * growth-hack strategy increases marketing spend over time.
 */
function simulateMarketingSpend(state: GameState): GameState {
  const strategy = state.meta.growthStrategy;
  let marketingSpend = state.finances.marketingSpend;

  if (strategy === 'growth-hack') {
    // Auto-increase marketing spend weekly for growth-hack strategy
    // Scale with company stage
    const stageMultipliers: Record<string, number> = {
      'garage': 200,
      'pre-seed': 500,
      'seed': 1000,
      'series-a': 2500,
      'series-b': 5000,
      'series-c': 10000,
      'growth': 20000,
      'public': 30000,
    };
    const targetSpend = stageMultipliers[state.company.stage] ?? 200;
    // Gradually ramp toward target
    marketingSpend = marketingSpend + (targetSpend - marketingSpend) * 0.2;
    marketingSpend = Math.round(marketingSpend);
  } else if (strategy === 'sustainable') {
    // Minimal marketing
    marketingSpend = Math.max(0, marketingSpend * 0.8);
    marketingSpend = Math.round(marketingSpend);
  }
  // Other strategies: marketing spend stays as-is unless modified by events

  return {
    ...state,
    finances: {
      ...state.finances,
      marketingSpend,
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

// ─── Auto Decision Generation ─────────────────────────────────────────

/**
 * Generate PendingDecision entries each week so the game is decision-driven.
 * Players make choices about hiring, features, strategy, and AI agents
 * through these generated decisions instead of navigating to separate screens.
 */
function generateAutoDecisions(state: GameState): GameState {
  const newDecisions: PendingDecision[] = [];
  const newLogEntries: EventLogEntry[] = [];
  const week = state.meta.week;

  // --- HIRING DECISIONS ---
  // Every week, offer 1-2 candidates from the hiring pipeline as decisions
  const pipeline = state.team.hiringPipeline;
  const maxHireDecisions = Math.min(2, pipeline.length);
  for (let i = 0; i < maxHireDecisions; i++) {
    const candidate = pipeline[i];
    // Skip if there's already a pending decision for this candidate
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === `auto-hire-${candidate.id}`,
    );
    if (alreadyPending) continue;

    const decisionId = generateId();
    const roleLabel = candidate.role
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    newDecisions.push({
      id: decisionId,
      eventId: `auto-hire-${candidate.id}`,
      prompt: `Resume on your desk: ${candidate.name}, ${roleLabel}. Skill level ${candidate.skill}/100, wants $${candidate.salaryExpectation.toLocaleString()}/week.`,
      options: [
        {
          id: `hire_${candidate.id}`,
          label: 'Hire Them',
          description: `Add ${candidate.name} to the team at $${candidate.salaryExpectation.toLocaleString()}/wk`,
          effects: [
            { path: 'company.reputation', operation: 'add', value: 1 },
          ],
        },
        {
          id: 'pass',
          label: 'Pass',
          description: 'Not the right fit right now.',
          effects: [],
        },
      ],
      deadline: week + 3,
      defaultOptionId: 'pass',
    });

    newLogEntries.push({
      id: generateId(),
      week,
      eventId: `auto-hire-${candidate.id}`,
      title: `${candidate.name} Applied`,
      description: `${candidate.name} wants to join as ${roleLabel}.`,
      category: 'team',
      decisionId,
    });
  }

  // --- FEATURE DECISIONS (every 2-3 weeks) ---
  if (week % 2 === 0 || Math.random() < 0.4) {
    const demands = state.market.segmentData.customerDemand;
    const existingNames = state.product.features.map((f) =>
      f.name.toLowerCase(),
    );
    const unbuilt = demands.filter(
      (d) =>
        !existingNames.some((s) =>
          s.includes(d.replace(/-/g, ' ')),
        ),
    );

    if (unbuilt.length > 0) {
      const feature = unbuilt[Math.floor(Math.random() * unbuilt.length)];
      // Skip if there's already a pending decision for this feature
      const alreadyPending = state.pendingDecisions.some(
        (d) => d.eventId === `auto-feature-${feature}`,
      );

      if (!alreadyPending) {
        const featureName = feature
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const relevance = 60 + Math.floor(Math.random() * 30); // 60-90
        const decisionId = generateId();

        newDecisions.push({
          id: decisionId,
          eventId: `auto-feature-${feature}`,
          prompt: `Your team has a proposal: build "${featureName}". Customers are asking for it and it could improve product-market fit.`,
          options: [
            {
              id: `feature_${feature}_${relevance}`,
              label: 'Build It',
              description: `Start development on ${featureName} (relevance: ${relevance}%)`,
              effects: [
                { path: 'company.reputation', operation: 'add', value: 1 },
              ],
            },
            {
              id: 'defer',
              label: 'Not Now',
              description: 'Focus on other priorities.',
              effects: [],
            },
          ],
          deadline: week + 3,
          defaultOptionId: 'defer',
        });

        newLogEntries.push({
          id: generateId(),
          week,
          eventId: `auto-feature-${feature}`,
          title: `Feature Proposal: ${featureName}`,
          description: `The team wants to build ${featureName}.`,
          category: 'product',
          decisionId,
        });
      }
    }
  }

  // --- GROWTH STRATEGY DECISIONS (every 8-12 weeks) ---
  if (week > 4 && week % 8 === 0) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-strategy-pivot',
    );

    if (!alreadyPending) {
      const strategies = ['move-fast', 'quality-first', 'growth-hack', 'sustainable'];
      const current = state.meta.growthStrategy;
      const alternatives = strategies.filter((s) => s !== current);
      const suggested =
        alternatives[Math.floor(Math.random() * alternatives.length)];
      const suggestedLabel = suggested
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const currentLabel = current
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: 'auto-strategy-pivot',
        prompt: `Your board advisor suggests switching from "${currentLabel}" to "${suggestedLabel}" strategy. The market conditions might favor a change.`,
        options: [
          {
            id: `strategy_${suggested}`,
            label: `Switch to ${suggestedLabel}`,
            description: `Change growth strategy to ${suggestedLabel}`,
            effects: [
              { path: 'company.reputation', operation: 'add', value: 1 },
            ],
          },
          {
            id: 'keep',
            label: 'Stay the Course',
            description: `Keep running ${currentLabel}`,
            effects: [],
          },
        ],
        deadline: week + 4,
        defaultOptionId: 'keep',
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: 'auto-strategy-pivot',
        title: 'Strategy Review',
        description: 'Time to review your growth strategy.',
        category: 'market',
        decisionId,
      });
    }
  }

  // --- AI AGENT DECISIONS (every 4-6 weeks, after week 3) ---
  if (week > 3 && (week % 5 === 0 || Math.random() < 0.15)) {
    const providers = [
      { name: 'OpenAI', cost: 500, capability: 75, reliability: 80 },
      { name: 'Anthropic', cost: 600, capability: 80, reliability: 85 },
      { name: 'Google DeepMind', cost: 450, capability: 70, reliability: 75 },
      { name: 'Mistral', cost: 300, capability: 60, reliability: 70 },
      { name: 'Cohere', cost: 250, capability: 55, reliability: 72 },
    ];
    const agentTypes: AIAgentType[] = [
      'coding',
      'design',
      'marketing',
      'analytics',
      'support',
    ];
    const provider =
      providers[Math.floor(Math.random() * providers.length)];
    const agentType =
      agentTypes[Math.floor(Math.random() * agentTypes.length)];
    const typeLabel =
      agentType.charAt(0).toUpperCase() + agentType.slice(1);

    // Skip if there's already a pending decision for this provider
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === `auto-ai-agent-${provider.name}`,
    );

    if (!alreadyPending) {
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: `auto-ai-agent-${provider.name}`,
        prompt: `${provider.name} is offering their ${typeLabel} AI agent at $${provider.cost}/week. Capability: ${provider.capability}/100, Reliability: ${provider.reliability}/100.`,
        options: [
          {
            id: `ai_${provider.name}_${agentType}_${provider.cost}_${provider.capability}_${provider.reliability}`,
            label: `Deploy ${typeLabel} Agent`,
            description: `Add ${provider.name} ${typeLabel} agent ($${provider.cost}/wk)`,
            effects: [
              {
                path: 'finances.cash',
                operation: 'add',
                value: -provider.cost * 2,
              }, // setup fee
            ],
          },
          {
            id: 'decline',
            label: 'Decline',
            description: 'Not interested right now.',
            effects: [],
          },
        ],
        deadline: week + 3,
        defaultOptionId: 'decline',
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: `auto-ai-agent-${provider.name}`,
        title: `AI Agent Offer: ${provider.name}`,
        description: `${provider.name} pitches their ${typeLabel} agent.`,
        category: 'product',
        decisionId,
      });
    }
  }

  return {
    ...state,
    pendingDecisions: [...state.pendingDecisions, ...newDecisions],
    eventLog: [...state.eventLog, ...newLogEntries],
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
  next = simulateTechDebtConsequences(next);
  next = simulateCustomers(next);
  next = simulateRevenue(next);
  next = simulateMarketingSpend(next);
  next = simulateBurn(next);
  next = simulateMarket(next);
  next = simulateMorale(next);
  next = simulateEmployeeQuitting(next);
  next = simulateHiringPipeline(next);
  next = simulateStageProgression(next);
  next = generateAutoDecisions(next);
  return next;
}
