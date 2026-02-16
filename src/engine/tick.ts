import type {
  GameState,
  WeekSummary,
  Feature,
  FundingRound,
  FundingStage,
  CompanyStage,
  EventLogEntry,
} from '../types/index.ts';
import type { PlayerDecision } from '../types/decisions.ts';
import { simulateWeek } from './simulation.ts';
import { processEvents } from './events.ts';
import {
  calculateWeeklyBurn,
  calculateValuation,
  calculateAvgMorale,
  calculatePMF,
} from './derived.ts';
import { generateId } from '../utils/id.ts';

// ─── Decision application ─────────────────────────────────────────────

function applyDecisions(
  state: GameState,
  decisions: PlayerDecision[],
): GameState {
  let next = state;

  for (const decision of decisions) {
    next = applySingleDecision(next, decision);
  }

  return next;
}

function applySingleDecision(
  state: GameState,
  decision: PlayerDecision,
): GameState {
  switch (decision.type) {
    case 'hire':
      return applyHire(state, decision.candidateId);
    case 'fire':
      return applyFire(state, decision.employeeId);
    case 'assign-team':
      return applyAssignTeam(state, decision.assignments);
    case 'start-feature':
      return applyStartFeature(state, decision.name, decision.description, decision.marketRelevance);
    case 'set-pricing':
      return applySetPricing(state, decision.model, decision.pricePerUnit);
    case 'respond-to-event':
      return applyEventResponse(state, decision.decisionId, decision.optionId);
    case 'hire-ai-agent':
      return applyHireAIAgent(state, decision);
    case 'fire-ai-agent':
      return applyFireAIAgent(state, decision.agentId);
    case 'seek-funding':
      return applySeekFunding(state, decision.targetStage);
    case 'change-segment':
      return state; // Complex pivot, placeholder
    case 'post-job':
      return state; // Generates hiring pipeline entries, placeholder
  }
}

function applyHire(state: GameState, candidateId: string): GameState {
  const candidate = state.team.hiringPipeline.find((c) => c.id === candidateId);
  if (!candidate) return state;

  const newEmployee = {
    id: generateId(),
    name: candidate.name,
    role: candidate.role,
    skill: candidate.skill,
    salary: candidate.salaryExpectation,
    morale: 75,
    loyalty: 40,
    aiSentiment: Math.round(Math.random() * 60 - 20), // -20 to 40
    weekHired: state.meta.week,
    assignedTo: null,
  };

  return {
    ...state,
    team: {
      ...state.team,
      employees: [...state.team.employees, newEmployee],
      hiringPipeline: state.team.hiringPipeline.filter(
        (c) => c.id !== candidateId,
      ),
    },
  };
}

function applyFire(state: GameState, employeeId: string): GameState {
  const employee = state.team.employees.find((e) => e.id === employeeId);
  if (!employee) return state;

  // Firing costs: 4 weeks severance
  const severance = employee.salary * 4;

  // Morale hit on remaining employees
  const updatedEmployees = state.team.employees
    .filter((e) => e.id !== employeeId)
    .map((e) => ({
      ...e,
      morale: Math.max(0, e.morale - 5),
    }));

  return {
    ...state,
    team: {
      ...state.team,
      employees: updatedEmployees,
    },
    finances: {
      ...state.finances,
      cash: state.finances.cash - severance,
    },
  };
}

function applyAssignTeam(
  state: GameState,
  assignments: { entityId: string; entityType: 'employee' | 'agent'; featureId: string | null }[],
): GameState {
  let employees = [...state.team.employees];
  let agents = [...state.team.aiAgents];
  const features = state.product.features.map((f) => ({
    ...f,
    assignedEmployees: [...f.assignedEmployees],
    assignedAgents: [...f.assignedAgents],
  }));

  for (const assignment of assignments) {
    if (assignment.entityType === 'employee') {
      employees = employees.map((e) =>
        e.id === assignment.entityId
          ? { ...e, assignedTo: assignment.featureId }
          : e,
      );
      // Update feature assignments
      for (const feature of features) {
        feature.assignedEmployees = feature.assignedEmployees.filter(
          (id) => id !== assignment.entityId,
        );
        if (assignment.featureId === feature.id) {
          feature.assignedEmployees.push(assignment.entityId);
        }
      }
    } else {
      agents = agents.map((a) =>
        a.id === assignment.entityId
          ? { ...a, assignedTo: assignment.featureId }
          : a,
      );
      for (const feature of features) {
        feature.assignedAgents = feature.assignedAgents.filter(
          (id) => id !== assignment.entityId,
        );
        if (assignment.featureId === feature.id) {
          feature.assignedAgents.push(assignment.entityId);
        }
      }
    }
  }

  return {
    ...state,
    team: { ...state.team, employees, aiAgents: agents },
    product: { ...state.product, features },
  };
}

function applyStartFeature(
  state: GameState,
  name: string,
  description: string,
  marketRelevance: number,
): GameState {
  const newFeature: Feature = {
    id: generateId(),
    name,
    description,
    status: 'in-progress',
    progress: 0,
    quality: 0,
    techDebt: 0,
    marketRelevance,
    assignedEmployees: [],
    assignedAgents: [],
  };

  return {
    ...state,
    product: {
      ...state.product,
      features: [...state.product.features, newFeature],
    },
  };
}

function applySetPricing(
  state: GameState,
  model: GameState['finances']['pricingModel'],
  pricePerUnit: number,
): GameState {
  return {
    ...state,
    finances: {
      ...state.finances,
      pricingModel: model,
      pricePerUnit,
    },
  };
}

function applyEventResponse(
  state: GameState,
  decisionId: string,
  optionId: string,
): GameState {
  const pending = state.pendingDecisions.find((d) => d.id === decisionId);
  if (!pending) return state;

  const option = pending.options.find((o) => o.id === optionId);
  if (!option) return state;

  // Apply effects via structuredClone + mutation
  let next = structuredClone(state);

  for (const effect of option.effects) {
    const parts = effect.path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let target: any = next;
    for (let i = 0; i < parts.length - 1; i++) {
      target = target[parts[i]];
      if (target === undefined) break;
    }
    if (target === undefined) continue;

    const lastKey = parts[parts.length - 1];
    const current = target[lastKey] as number;

    switch (effect.operation) {
      case 'add':
        target[lastKey] = current + effect.value;
        break;
      case 'set':
        target[lastKey] = effect.value;
        break;
      case 'multiply':
        target[lastKey] = current * effect.value;
        break;
    }
  }

  // Remove from pending, mark in log
  next = {
    ...next,
    pendingDecisions: next.pendingDecisions.filter((d) => d.id !== decisionId),
    eventLog: next.eventLog.map((entry) =>
      entry.decisionId === decisionId
        ? { ...entry, resolvedOptionId: optionId }
        : entry,
    ),
  };

  return next;
}

function applyHireAIAgent(
  state: GameState,
  decision: {
    name: string;
    agentType: string;
    provider: string;
    capability: number;
    costPerWeek: number;
    reliability: number;
  },
): GameState {
  const newAgent = {
    id: generateId(),
    name: decision.name,
    type: decision.agentType as GameState['team']['aiAgents'][number]['type'],
    provider: decision.provider,
    capability: decision.capability,
    costPerWeek: decision.costPerWeek,
    reliability: decision.reliability,
    assignedTo: null,
  };

  return {
    ...state,
    team: {
      ...state.team,
      aiAgents: [...state.team.aiAgents, newAgent],
    },
  };
}

function applyFireAIAgent(state: GameState, agentId: string): GameState {
  return {
    ...state,
    team: {
      ...state.team,
      aiAgents: state.team.aiAgents.filter((a) => a.id !== agentId),
    },
  };
}

// ─── Funding mechanics ────────────────────────────────────────────────

/** Map company stage to the funding stage it unlocks */
const STAGE_TO_FUNDING: Record<string, { fundingStage: FundingStage; nextCompanyStage: CompanyStage; minAmount: number; maxAmount: number; minDilution: number; maxDilution: number }> = {
  'garage':    { fundingStage: 'pre-seed',  nextCompanyStage: 'pre-seed',  minAmount: 250_000,    maxAmount: 500_000,     minDilution: 0.10, maxDilution: 0.15 },
  'pre-seed':  { fundingStage: 'seed',      nextCompanyStage: 'seed',      minAmount: 1_000_000,  maxAmount: 3_000_000,   minDilution: 0.15, maxDilution: 0.20 },
  'seed':      { fundingStage: 'series-a',  nextCompanyStage: 'series-a',  minAmount: 5_000_000,  maxAmount: 15_000_000,  minDilution: 0.20, maxDilution: 0.25 },
  'series-a':  { fundingStage: 'series-b',  nextCompanyStage: 'series-b',  minAmount: 20_000_000, maxAmount: 50_000_000,  minDilution: 0.15, maxDilution: 0.20 },
  'series-b':  { fundingStage: 'series-c',  nextCompanyStage: 'series-c',  minAmount: 50_000_000, maxAmount: 150_000_000, minDilution: 0.10, maxDilution: 0.15 },
};

const INVESTOR_NAMES = [
  'Andreessen Horowitz', 'Sequoia Capital', 'Lightspeed Ventures',
  'Greylock Partners', 'Benchmark', 'Accel', 'Index Ventures',
  'Tiger Global', 'Founders Fund', 'Y Combinator', 'General Catalyst',
  'Khosla Ventures', 'Bessemer Venture Partners', 'NEA', 'Spark Capital',
];

function applySeekFunding(state: GameState, targetStage: string): GameState {
  const currentStage = state.company.stage;
  const config = STAGE_TO_FUNDING[currentStage];

  // Can't raise if at growth/public/dead or no valid next stage
  if (!config) {
    const logEntry: EventLogEntry = {
      id: generateId(),
      week: state.meta.week,
      eventId: 'funding-not-available',
      title: 'Funding Not Available',
      description: 'No funding rounds available at your current stage.',
      category: 'funding',
    };
    return {
      ...state,
      eventLog: [...state.eventLog, logEntry],
    };
  }

  // Calculate fundraising success probability
  const investorSentimentFactor = state.market.investorSentiment / 100;     // 0-1
  const revenueFactor = Math.min(state.finances.weeklyRevenue / 5000, 1);   // 0-1
  const teamSizeFactor = Math.min((state.team.employees.length + state.team.aiAgents.length) / 10, 1); // 0-1
  const pmfFactor = state.product.pmfScore / 100;                           // 0-1
  const founderBizFactor = state.founder.bizSkill / 100;                    // 0-1
  const founderNetworkFactor = state.founder.network / 100;                 // 0-1
  const reputationFactor = state.company.reputation / 100;                  // 0-1

  // Weighted success probability
  const rawProb =
    investorSentimentFactor * 0.20 +
    revenueFactor * 0.15 +
    teamSizeFactor * 0.10 +
    pmfFactor * 0.15 +
    founderBizFactor * 0.15 +
    founderNetworkFactor * 0.10 +
    reputationFactor * 0.15;

  // Clamp between 10% and 85%
  const successProb = Math.max(0.10, Math.min(0.85, rawProb));

  const roll = Math.random();
  if (roll > successProb) {
    // Funding failed
    const logEntry: EventLogEntry = {
      id: generateId(),
      week: state.meta.week,
      eventId: 'funding-rejected',
      title: 'Investors Passed',
      description: `You pitched for ${config.fundingStage} funding but investors weren't convinced. "${Math.random() < 0.5 ? 'Come back when you have more traction.' : 'Interesting space, but we\'re going to pass for now.'}"`,
      category: 'funding',
    };
    return {
      ...state,
      company: {
        ...state.company,
        reputation: Math.max(0, state.company.reputation - 2),
      },
      founder: {
        ...state.founder,
        reputation: Math.max(0, state.founder.reputation - 1),
      },
      eventLog: [...state.eventLog, logEntry],
    };
  }

  // Funding succeeded
  const dilution = config.minDilution + Math.random() * (config.maxDilution - config.minDilution);
  const amount = Math.round(config.minAmount + Math.random() * (config.maxAmount - config.minAmount));
  const investorName = INVESTOR_NAMES[Math.floor(Math.random() * INVESTOR_NAMES.length)];

  const roundValuation = Math.round(amount / dilution);

  const fundingRound: FundingRound = {
    stage: config.fundingStage,
    amount,
    valuation: roundValuation,
    dilution: Math.round(dilution * 100) / 100,
    investorName,
    weekClosed: state.meta.week,
  };

  const logEntry: EventLogEntry = {
    id: generateId(),
    week: state.meta.week,
    eventId: 'funding-raised',
    title: `${config.fundingStage.charAt(0).toUpperCase() + config.fundingStage.slice(1)} Raised!`,
    description: `${investorName} led your ${config.fundingStage} round: $${(amount / 1_000_000).toFixed(1)}M at a $${(roundValuation / 1_000_000).toFixed(1)}M valuation. ${Math.round(dilution * 100)}% dilution. Time to spend it wisely.`,
    category: 'funding',
  };

  return {
    ...state,
    company: {
      ...state.company,
      stage: config.nextCompanyStage,
      valuation: roundValuation,
      reputation: Math.min(100, state.company.reputation + 5),
    },
    finances: {
      ...state.finances,
      cash: state.finances.cash + amount,
      fundingHistory: [...state.finances.fundingHistory, fundingRound],
      founderEquity: Math.round((state.finances.founderEquity * (1 - dilution)) * 1000) / 1000,
    },
    founder: {
      ...state.founder,
      reputation: Math.min(100, state.founder.reputation + 3),
      network: Math.min(100, state.founder.network + 2),
    },
    eventLog: [...state.eventLog, logEntry],
  };
}

// ─── Calendar advancement ─────────────────────────────────────────────

function advanceCalendar(state: GameState): GameState {
  let { year, month, day } = state.meta;

  day += 7;

  // Simple month-day logic (approximate, 30-day months)
  const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  while (day > daysInMonth[month]) {
    day -= daysInMonth[month];
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return {
    ...state,
    meta: {
      ...state.meta,
      week: state.meta.week + 1,
      year,
      month,
      day,
    },
  };
}

// ─── Week summary ─────────────────────────────────────────────────────

function createWeekSummary(state: GameState): WeekSummary {
  return {
    week: state.meta.week,
    cash: state.finances.cash,
    revenue: state.finances.weeklyRevenue,
    burn: state.finances.weeklyBurn,
    customers: state.product.customers,
    valuation: state.company.valuation,
    teamSize: state.team.employees.length + state.team.aiAgents.length,
    avgMorale: state.team.avgMorale,
    pmfScore: state.product.pmfScore,
    bubbleIndex: state.market.bubbleIndex,
    eventsCount: state.eventLog.filter((e) => e.week === state.meta.week).length,
  };
}

// ─── Regulatory heat simulation ───────────────────────────────────────

function simulateRegulatoryHeat(state: GameState): GameState {
  const isRegulatedSegment = state.market.segment === 'ai-healthcare' || state.market.segment === 'ai-fintech';
  if (!isRegulatedSegment) return state;

  let heatDelta = 0;

  // Base regulatory pressure in regulated industries
  const regulatoryRisk = state.market.segmentData.regulatoryRisk;
  heatDelta += regulatoryRisk * 0.005; // slow accumulation based on segment risk

  // Moving fast increases regulatory heat
  if (state.meta.growthStrategy === 'move-fast') {
    heatDelta += 0.5;
  }

  // High growth attracts regulatory attention
  if (state.product.customers > 100) {
    heatDelta += 0.2;
  }
  if (state.product.customers > 500) {
    heatDelta += 0.3;
  }

  // Quality-first approach reduces regulatory heat
  if (state.meta.growthStrategy === 'quality-first') {
    heatDelta -= 0.3;
  }

  // Low product quality increases regulatory concern
  if (state.product.overallQuality < 40 && state.product.customers > 20) {
    heatDelta += 0.4;
  }

  // Random regulatory noise
  heatDelta += (Math.random() - 0.5) * 0.5;

  const newHeat = Math.max(0, Math.min(100, state.meta.regulatoryHeat + heatDelta));

  return {
    ...state,
    meta: {
      ...state.meta,
      regulatoryHeat: Math.round(newHeat * 10) / 10,
    },
  };
}

// ─── Check game over conditions ───────────────────────────────────────

function formatDollars(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function checkGameOver(state: GameState): GameState {
  // Already over or won - don't check again
  if (state.meta.gameOver || state.meta.gameWon) return state;

  // 1. Out of cash
  if (state.finances.cash <= 0) {
    return {
      ...state,
      meta: {
        ...state.meta,
        gameOver: true,
        gameOverReason: 'Ran out of cash. Your startup is dead.',
      },
    };
  }

  // 2. Bubble Pop: bubble drops below 15 AND company has raised funding
  const hasFunding = state.finances.fundingHistory.length > 0;
  if (state.market.bubbleIndex < 15 && hasFunding) {
    return {
      ...state,
      meta: {
        ...state.meta,
        gameOver: true,
        gameOverReason: 'The bubble popped. Your AI startup was just another casualty.',
      },
    };
  }

  // 3. Team Revolt: avg morale drops below 15
  if (state.team.employees.length > 0 && state.team.avgMorale < 15) {
    return {
      ...state,
      meta: {
        ...state.meta,
        gameOver: true,
        gameOverReason: "Your team staged a walkout. Nobody wants to build your 'disruptive AI solution' anymore.",
      },
    };
  }

  // 4. Regulatory Shutdown: regulatoryHeat exceeds 80 in healthcare/fintech
  const isRegulatedSegment = state.market.segment === 'ai-healthcare' || state.market.segment === 'ai-fintech';
  if (isRegulatedSegment && state.meta.regulatoryHeat > 80) {
    return {
      ...state,
      meta: {
        ...state.meta,
        gameOver: true,
        gameOverReason: "The regulators shut you down. Turns out 'move fast and break things' doesn't work in regulated industries.",
      },
    };
  }

  // 5. Acqui-hire Loss: valuation < $50K AND team > 3 AND random check
  if (state.company.valuation < 50_000 && state.team.employees.length > 3 && Math.random() < 0.15) {
    return {
      ...state,
      meta: {
        ...state.meta,
        gameOver: true,
        gameOverReason: 'Google acqui-hired your team. You get a signing bonus and a badge. Your startup dream dies in a Googleplex conference room.',
      },
    };
  }

  return state;
}

// ─── Check win conditions ─────────────────────────────────────────────

function checkWinCondition(state: GameState): GameState {
  // Already over or won - don't check again
  if (state.meta.gameOver || state.meta.gameWon) return state;

  // 1. IPO Win: company stage is 'public' AND valuation > $1B
  if (state.company.stage === 'public' && state.company.valuation > 1_000_000_000) {
    return {
      ...state,
      meta: {
        ...state.meta,
        gameWon: true,
        gameWonReason: `You did it! IPO day. Your AI company is worth ${formatDollars(state.company.valuation)}. Time to vest and complain about the stock price.`,
        score: calculateFinalScore(state),
      },
    };
  }

  // 2. Profitable Exit: valuation > $500M AND random acquisition offer
  if (state.company.valuation > 500_000_000 && Math.random() < 0.05) {
    const acquirers = ['Google', 'Microsoft', 'Apple', 'Meta', 'Amazon', 'Nvidia', 'Salesforce'];
    const acquirer = acquirers[Math.floor(Math.random() * acquirers.length)];
    return {
      ...state,
      meta: {
        ...state.meta,
        gameWon: true,
        gameWonReason: `${acquirer} just acquired your company for ${formatDollars(Math.round(state.company.valuation * 1.3))}. Your equity is worth ${formatDollars(Math.round(state.company.valuation * 1.3 * state.finances.founderEquity))}. Not bad for a startup that started in a garage.`,
        score: calculateFinalScore(state),
      },
    };
  }

  // 3. Unicorn Status: valuation > $1B without being public
  if (state.company.valuation > 1_000_000_000 && state.company.stage !== 'public') {
    return {
      ...state,
      meta: {
        ...state.meta,
        gameWon: true,
        gameWonReason: `Unicorn status achieved! Your company is valued at ${formatDollars(state.company.valuation)}. You're on the cover of TechCrunch and your parents finally understand what you do. Kind of.`,
        score: calculateFinalScore(state),
      },
    };
  }

  return state;
}

function calculateFinalScore(state: GameState): number {
  let score = 0;

  // Valuation component (0-400 points)
  score += Math.min(400, Math.round(state.company.valuation / 2_500_000));

  // Revenue component (0-200 points)
  score += Math.min(200, Math.round(state.finances.weeklyRevenue / 25));

  // Team size component (0-100 points)
  score += Math.min(100, (state.team.employees.length + state.team.aiAgents.length) * 5);

  // Equity retention bonus (0-200 points)
  score += Math.round(state.finances.founderEquity * 200);

  // Speed bonus: fewer weeks = higher score (0-100 points)
  score += Math.max(0, 100 - state.meta.week);

  return score;
}

// ─── Main tick ────────────────────────────────────────────────────────

/**
 * Advance the game by one week.
 *
 * 1. Apply player decisions
 * 2. Run simulation
 * 3. Process events
 * 4. Update derived metrics
 * 5. Advance calendar
 * 6. Record week history
 * 7. Check game over
 *
 * Pure function: returns a new GameState.
 */
export function advanceWeek(
  state: GameState,
  decisions: PlayerDecision[],
): GameState {
  // 1. Apply player decisions
  let next = applyDecisions(state, decisions);

  // 2. Run simulation
  next = simulateWeek(next);

  // 3. Process events
  next = processEvents(next);

  // 4. Update derived metrics
  const burn = calculateWeeklyBurn(next);
  const valuation = calculateValuation(next);
  const avgMorale = calculateAvgMorale(next);
  const pmfScore = calculatePMF(next);

  next = {
    ...next,
    finances: { ...next.finances, weeklyBurn: burn },
    company: { ...next.company, valuation },
    team: { ...next.team, avgMorale },
    product: { ...next.product, pmfScore },
  };

  // 5. Advance calendar
  next = advanceCalendar(next);

  // 6. Simulate regulatory heat for regulated segments
  next = simulateRegulatoryHeat(next);

  // 7. Record week history
  const summary = createWeekSummary(next);
  next = {
    ...next,
    weekHistory: [...next.weekHistory, summary],
  };

  // 8. Check game over
  next = checkGameOver(next);

  // 9. Check win conditions
  next = checkWinCondition(next);

  return next;
}
