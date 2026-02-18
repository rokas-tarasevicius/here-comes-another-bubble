import type {
  GameState,
  WeekSummary,
  Feature,
  FundingRound,
  FundingStage,
  CompanyStage,
  EventLogEntry,
  TeamMember,
  Candidate,
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
import { randomName, TRAIT_POOL } from '../data/names.ts';

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
    case 'hire-team':
      return applyHireTeam(state, decision.count, decision.salary);
    case 'fire-team':
      return applyFireTeam(state, decision.count);
    case 'set-marketing-budget':
      return applySetMarketingBudget(state, decision.amount);
    case 'set-growth-strategy':
      return applySetGrowthStrategy(state, decision.strategy);
    case 'change-segment':
      return state; // Complex pivot, placeholder
  }
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
    marketRelevance,
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
  const currentModel = state.finances.pricingModel;
  const week = state.meta.week;
  const lastChange = state.finances.lastPricingChangeWeek ?? 0;
  let next = state;

  // Task 6: Prevent switching more than once every 8 weeks
  if (currentModel !== model && (week - lastChange) < 8 && lastChange > 0) {
    const logEntry: EventLogEntry = {
      id: generateId(),
      week,
      eventId: 'pricing-switch-blocked',
      title: 'Pricing Change Too Soon',
      description: 'You changed pricing recently. Wait at least 8 weeks between pricing model changes.',
      category: 'product',
    };
    return {
      ...state,
      finances: { ...state.finances, pricePerUnit }, // Allow price adjustments within same model
      eventLog: [...state.eventLog, logEntry],
    };
  }

  // Task 6: Switching costs when changing pricing MODEL (not just price)
  if (currentModel !== model && state.product.customers > 0) {
    let customerLoss = 0.15; // Default: lose 15% of customers
    let reputationLoss = -5;

    const lostCustomers = Math.round(state.product.customers * customerLoss);
    const logEntry: EventLogEntry = {
      id: generateId(),
      week,
      eventId: 'pricing-switch-penalty',
      title: 'Pricing Model Changed',
      description: `Switching from ${currentModel} to ${model} caused ${lostCustomers} customers to churn. Customers don't like pricing changes.`,
      category: 'product',
    };

    next = {
      ...state,
      product: {
        ...state.product,
        customers: Math.max(0, state.product.customers - lostCustomers),
      },
      company: {
        ...state.company,
        reputation: Math.max(0, state.company.reputation + reputationLoss),
      },
      eventLog: [...state.eventLog, logEntry],
    };
  }

  return {
    ...next,
    finances: {
      ...next.finances,
      pricingModel: model,
      pricePerUnit,
      lastPricingChangeWeek: currentModel !== model ? week : next.finances.lastPricingChangeWeek,
    },
  };
}

function applyHireTeam(state: GameState, count: number, salary: number): GameState {
  if (count <= 0) return state;
  const hiringCost = count * salary * 2;
  if (state.finances.cash < hiringCost) {
    return {
      ...state,
      eventLog: [...state.eventLog, {
        id: generateId(),
        week: state.meta.week,
        eventId: 'hire-insufficient-funds',
        title: 'Cannot Afford Hire',
        description: `You need $${hiringCost.toLocaleString()} to hire ${count} people but only have $${Math.round(state.finances.cash).toLocaleString()}.`,
        category: 'team',
      }],
    };
  }

  const roles: Array<'engineer' | 'designer' | 'marketer' | 'sales' | 'ops'> = ['engineer', 'designer', 'marketer', 'sales', 'ops'];
  const newMembers: TeamMember[] = [];
  for (let i = 0; i < count; i++) {
    newMembers.push({
      id: generateId(),
      name: `Team Member ${(state.team.members?.length ?? state.team.teamSize) + i + 1}`,
      role: roles[Math.floor(Math.random() * 2)],
      skill: 40 + Math.floor(Math.random() * 30),
      salary,
      morale: 75,
      weekHired: state.meta.week,
      traits: [],
      boosts: {},
    });
  }

  const allMembers = [...(state.team.members ?? []), ...newMembers];
  const newSize = allMembers.length;
  const newAvg = newSize > 0 ? Math.round(allMembers.reduce((s, m) => s + m.salary, 0) / newSize) : salary;
  const culturePenalty = count >= 3 ? -5 : count >= 2 ? -3 : 0;

  return {
    ...state,
    team: {
      ...state.team,
      members: allMembers,
      teamSize: newSize,
      avgSalary: newAvg,
    },
    company: {
      ...state.company,
      culture: Math.max(0, state.company.culture + culturePenalty),
    },
    finances: {
      ...state.finances,
      cash: state.finances.cash - hiringCost,
    },
    eventLog: [...state.eventLog, {
      id: generateId(),
      week: state.meta.week,
      eventId: 'team-hired',
      title: `Hired ${count} Team Member${count > 1 ? 's' : ''}`,
      description: `Hired ${count} new team member${count > 1 ? 's' : ''} at $${salary.toLocaleString()}/wk avg. Signing cost: $${hiringCost.toLocaleString()}.`,
      category: 'team',
    }],
  };
}

function applyFireTeam(state: GameState, count: number): GameState {
  const memberCount = state.team.members?.length ?? state.team.teamSize;
  if (count <= 0 || memberCount === 0) return state;
  const actual = Math.min(count, memberCount);
  const newMembers = (state.team.members ?? []).slice(0, -actual);
  const newSize = newMembers.length;
  const newAvg = newSize > 0 ? Math.round(newMembers.reduce((s, m) => s + m.salary, 0) / newSize) : 0;
  const moralePenalty = actual >= 3 ? -12 : actual >= 2 ? -8 : -4;
  return {
    ...state,
    team: {
      ...state.team,
      members: newMembers,
      teamSize: newSize,
      avgSalary: newAvg,
      morale: Math.max(0, state.team.morale + moralePenalty),
    },
    company: {
      ...state.company,
      culture: Math.max(0, state.company.culture - actual * 3),
      reputation: Math.max(0, state.company.reputation - actual),
    },
    eventLog: [...state.eventLog, {
      id: generateId(),
      week: state.meta.week,
      eventId: 'team-fired',
      title: `Let Go ${actual} Team Member${actual > 1 ? 's' : ''}`,
      description: `${actual} team member${actual > 1 ? 's' : ''} ${actual > 1 ? 'were' : 'was'} let go. Remaining team morale took a hit.`,
      category: 'team',
    }],
  };
}

function applySetMarketingBudget(state: GameState, amount: number): GameState {
  return {
    ...state,
    finances: {
      ...state.finances,
      marketingSpend: Math.max(0, Math.round(amount)),
    },
  };
}

function applySetGrowthStrategy(state: GameState, strategy: string): GameState {
  return {
    ...state,
    meta: {
      ...state.meta,
      growthStrategy: strategy,
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

  // Clamp percentage values after applying effects
  const clamp100 = (v: number) => Math.max(0, Math.min(100, v));
  next.team.morale = clamp100(next.team.morale);
  next.company.reputation = clamp100(next.company.reputation);
  next.company.culture = clamp100(next.company.culture);
  next.product.bugs = Math.max(0, next.product.bugs);
  next.product.techDebtTotal = Math.max(0, next.product.techDebtTotal);

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

  // --- Handle auto-generated decision side effects ---

  // Hiring via event response: increment teamSize (format: hire_[count]_[salary])
  if (optionId.startsWith('hire_')) {
    const hireParts = optionId.split('_');
    const hireCount = parseInt(hireParts[1], 10) || 1;
    const hireSalary = parseInt(hireParts[2], 10) || 3500;
    const newHireMembers: TeamMember[] = [];
    for (let i = 0; i < hireCount; i++) {
      newHireMembers.push({
        id: generateId(),
        name: `New Hire`,
        role: 'engineer',
        skill: 50 + Math.floor(Math.random() * 30),
        salary: hireSalary,
        morale: 80,
        weekHired: next.meta.week,
        traits: [],
        boosts: {},
      });
    }
    const allMembers = [...(next.team.members ?? []), ...newHireMembers];
    const newSize = allMembers.length;
    const newAvg = newSize > 0 ? Math.round(allMembers.reduce((s, m) => s + m.salary, 0) / newSize) : hireSalary;
    next = {
      ...next,
      team: {
        ...next.team,
        members: allMembers,
        teamSize: newSize,
        avgSalary: newAvg,
      },
    };
  }

  // Team expansion: team-eng_N_S or team-growth_N_S
  if (optionId.startsWith('team-eng_') || optionId.startsWith('team-growth_')) {
    const parts = optionId.split('_');
    const count = parseInt(parts[1], 10) || 2;
    const salary = parseInt(parts[2], 10) || 3500;
    const expandMembers: TeamMember[] = [];
    for (let i = 0; i < count; i++) {
      expandMembers.push({
        id: generateId(),
        name: `New Hire`,
        role: optionId.startsWith('team-eng_') ? 'engineer' : 'marketer',
        skill: 45 + Math.floor(Math.random() * 25),
        salary,
        morale: 75,
        weekHired: next.meta.week,
        traits: [],
        boosts: {},
      });
    }
    const allMembers = [...(next.team.members ?? []), ...expandMembers];
    const newSize = allMembers.length;
    const newAvg = newSize > 0 ? Math.round(allMembers.reduce((s, m) => s + m.salary, 0) / newSize) : salary;
    next = {
      ...next,
      team: {
        ...next.team,
        members: allMembers,
        teamSize: newSize,
        avgSalary: newAvg,
      },
    };
  }

  // Feature: create a new in-progress feature
  if (optionId.startsWith('feature_')) {
    const parts = optionId.split('_');
    // Format: feature_[slug-parts]_[relevance]
    const relevance = parseInt(parts[parts.length - 1], 10);
    const featureSlug = parts.slice(1, -1).join('-');
    const featureName = featureSlug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const newFeature: Feature = {
      id: generateId(),
      name: featureName,
      description: `Auto-generated feature: ${featureName}`,
      status: 'in-progress' as const,
      progress: 0,
      quality: 0,
      marketRelevance: isNaN(relevance) ? 70 : relevance,
    };
    next = {
      ...next,
      product: {
        ...next.product,
        features: [...next.product.features, newFeature],
      },
    };
  }

  // Strategy: change the growth strategy
  if (optionId.startsWith('strategy_')) {
    const strategy = optionId.replace('strategy_', '');
    next = {
      ...next,
      meta: {
        ...next.meta,
        growthStrategy: strategy,
      },
    };
  }

  // Task 10: Culture drift from hiring fast (2+ people in one decision)
  if (optionId.startsWith('team-eng_') || optionId.startsWith('team-growth_')) {
    const hParts = optionId.split('_');
    const hCount = parseInt(hParts[1], 10) || 2;
    if (hCount >= 2) {
      next = {
        ...next,
        company: {
          ...next.company,
          culture: Math.max(0, next.company.culture - 3), // Culture dilution
        },
      };
    }
  }

  // Task 8: Layoff handling (layoff_N reduces team size)
  if (optionId.startsWith('layoff_')) {
    const layoffParts = optionId.split('_');
    const layoffCount = parseInt(layoffParts[1], 10) || 1;
    const memberCount = next.team.members?.length ?? next.team.teamSize;
    const actualLayoffs = Math.min(memberCount, layoffCount);
    const newMembers = (next.team.members ?? []).slice(0, -actualLayoffs);
    const newSize = newMembers.length;
    const newAvg = newSize > 0 ? Math.round(newMembers.reduce((s, m) => s + m.salary, 0) / newSize) : 0;
    next = {
      ...next,
      team: {
        ...next.team,
        members: newMembers,
        teamSize: newSize,
        avgSalary: newAvg,
      },
      company: {
        ...next.company,
        culture: Math.max(0, next.company.culture - 10),
      },
    };
  }

  // Task 8: Refuse raise — 20% chance of losing 1 person
  const refuseRaiseMemberCount = next.team.members?.length ?? next.team.teamSize;
  if (optionId === 'refuse-raise' && refuseRaiseMemberCount > 0 && Math.random() < 0.2) {
    const refuseNewMembers = (next.team.members ?? []).slice(0, -1);
    const refuseNewSize = refuseNewMembers.length;
    const refuseNewAvg = refuseNewSize > 0 ? Math.round(refuseNewMembers.reduce((s, m) => s + m.salary, 0) / refuseNewSize) : 0;
    next = {
      ...next,
      team: {
        ...next.team,
        members: refuseNewMembers,
        teamSize: refuseNewSize,
        avgSalary: refuseNewAvg,
      },
      eventLog: [...next.eventLog, {
        id: generateId(),
        week: next.meta.week,
        eventId: 'raise-refused-quit',
        title: 'Team Member Quit Over Pay',
        description: 'After refusing the raise, one team member decided to leave for a better-paying opportunity.',
        category: 'team',
      }],
    };
  }

  // Task 9: Viral campaign — boost customers, 20% PR disaster chance
  if (optionId === 'viral-campaign') {
    const customerBoost = 50 + Math.floor(Math.random() * 150);
    const prDisaster = Math.random() < 0.2;
    next = {
      ...next,
      product: {
        ...next.product,
        customers: next.product.customers + customerBoost,
      },
      company: {
        ...next.company,
        reputation: prDisaster
          ? Math.max(0, next.company.reputation - 5)
          : Math.min(100, next.company.reputation + 3),
      },
      eventLog: [...next.eventLog, {
        id: generateId(),
        week: next.meta.week,
        eventId: prDisaster ? 'viral-pr-disaster' : 'viral-success',
        title: prDisaster ? 'Viral Campaign Backfired' : 'Viral Campaign Success!',
        description: prDisaster
          ? `The viral campaign attracted ${customerBoost} new customers but also triggered a PR disaster. Your reputation took a hit.`
          : `The viral campaign was a hit! ${customerBoost} new customers joined.`,
        category: 'market',
      }],
    };
  }

  // Funding prompt: auto-trigger seek funding
  if (optionId === 'seek-funding-now') {
    next = applySeekFunding(next, next.company.stage);
  }

  // Pricing decisions from auto-prompt
  if (optionId.startsWith('pricing_') && optionId !== 'pricing_stay_free') {
    const parts = optionId.split('_');
    // Format: pricing_[model]_[price]
    const model = parts[1] as GameState['finances']['pricingModel'];
    const price = parseInt(parts[2], 10) || 10;
    // Convert monthly price to weekly
    const weeklyPrice = Math.round(price / 4.33);
    next = {
      ...next,
      finances: {
        ...next.finances,
        pricingModel: model,
        pricePerUnit: weeklyPrice,
        lastPricingChangeWeek: next.meta.week,
      },
    };
  }

  // AI Agent: create and add the agent to the team
  if (optionId.startsWith('ai_')) {
    // Format: ai_[provider name]_[type]_[cost]_[capability]_[reliability]
    const parts = optionId.split('_');
    const reliability = parseInt(parts[parts.length - 1], 10);
    const capability = parseInt(parts[parts.length - 2], 10);
    const cost = parseInt(parts[parts.length - 3], 10);
    const agentType = parts[parts.length - 4];
    const providerName = parts.slice(1, -4).join(' ');
    const typeLabel =
      agentType.charAt(0).toUpperCase() + agentType.slice(1);

    const newAgent = {
      id: generateId(),
      name: `${providerName} ${typeLabel} Agent`,
      type: agentType as GameState['team']['aiAgents'][number]['type'],
      provider: providerName,
      capability: isNaN(capability) ? 70 : capability,
      costPerWeek: isNaN(cost) ? 500 : cost,
      reliability: isNaN(reliability) ? 75 : reliability,
      assignedTo: null,
    };
    next = {
      ...next,
      team: {
        ...next.team,
        aiAgents: [...next.team.aiAgents, newAgent],
      },
    };
  }

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

const STAGE_ORDER: CompanyStage[] = ['garage', 'pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'growth', 'public'];

export function applySeekFunding(state: GameState, targetStage: string): GameState {
  const currentStage = state.company.stage;
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const targetIdx = STAGE_ORDER.indexOf(targetStage as CompanyStage);

  // Use targetStage if it's a valid stage ahead of current, and has funding config
  let lookupStage = currentStage;
  if (targetIdx > currentIdx && STAGE_TO_FUNDING[targetStage]) {
    lookupStage = targetStage as CompanyStage;
  }

  const config = STAGE_TO_FUNDING[lookupStage];

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
  const investorSentimentFactor = state.market.investorSentiment / 100;
  const revenueFactor = Math.min(state.finances.weeklyRevenue / 5000, 1);
  const teamSizeFactor = Math.min((state.team.teamSize + state.team.aiAgents.length) / 10, 1);
  const pmfFactor = state.product.pmfScore / 100;
  const founderBizFactor = state.founder.bizSkill / 100;
  const founderNetworkFactor = state.founder.network / 100;
  const reputationFactor = state.company.reputation / 100;

  const rawProb =
    investorSentimentFactor * 0.20 +
    revenueFactor * 0.15 +
    teamSizeFactor * 0.10 +
    pmfFactor * 0.15 +
    founderBizFactor * 0.15 +
    founderNetworkFactor * 0.10 +
    reputationFactor * 0.15;

  const successProb = Math.max(0.10, Math.min(0.85, rawProb));

  const roll = Math.random();
  if (roll > successProb) {
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
      founderEquity: Math.max(0, Math.round((state.finances.founderEquity * (1 - dilution)) * 1000) / 1000),
    },
    founder: {
      ...state.founder,
      reputation: Math.min(100, state.founder.reputation + 3),
      network: Math.min(100, state.founder.network + 2),
    },
    eventLog: [...state.eventLog, logEntry],
  };
}

// ─── Milestone celebrations ──────────────────────────────────────────

function checkMilestones(state: GameState): GameState {
  const newLogEntries: EventLogEntry[] = [];
  const week = state.meta.week;
  const prevWeek = state.weekHistory.length > 0 ? state.weekHistory[state.weekHistory.length - 1] : null;

  // First feature shipped
  const shippedCount = state.product.features.filter(f => f.status === 'shipped').length;
  const prevShippedCount = state.eventLog.some(e => e.eventId === 'milestone-first-ship') ? Infinity : 0;
  if (shippedCount >= 1 && prevShippedCount === 0) {
    newLogEntries.push({
      id: generateId(),
      week,
      eventId: 'milestone-first-ship',
      title: 'First Feature Shipped!',
      description: 'You shipped your first feature! Now get it in front of users. Consider setting a pricing model.',
      category: 'product',
    });
  }

  // First customers
  if (state.product.customers > 0 && (!prevWeek || prevWeek.customers === 0)) {
    newLogEntries.push({
      id: generateId(),
      week,
      eventId: 'milestone-first-users',
      title: 'First Users!',
      description: `You have your first users! People are actually using your product. Keep building and growing.`,
      category: 'product',
    });
  }

  // Hit 10 customers - suggest pricing
  if (state.product.customers >= 10 && prevWeek && prevWeek.customers < 10) {
    newLogEntries.push({
      id: generateId(),
      week,
      eventId: 'milestone-10-users',
      title: '10 Users Milestone!',
      description: 'You have 10 users! Time to think about monetization. Set your pricing model in the Finance screen.',
      category: 'product',
    });
  }

  // Hit 100 customers
  if (state.product.customers >= 100 && prevWeek && prevWeek.customers < 100) {
    newLogEntries.push({
      id: generateId(),
      week,
      eventId: 'milestone-100-users',
      title: '100 Users!',
      description: 'Triple digits! Your product is gaining real traction. Investors will start noticing.',
      category: 'product',
    });
  }

  // Hit 1000 customers
  if (state.product.customers >= 1000 && prevWeek && prevWeek.customers < 1000) {
    newLogEntries.push({
      id: generateId(),
      week,
      eventId: 'milestone-1000-users',
      title: '1,000 Users!',
      description: 'A thousand users! You\'re building something people want. Time to scale.',
      category: 'product',
    });
  }

  // First revenue
  if (state.finances.weeklyRevenue > 0 && prevWeek && prevWeek.revenue === 0) {
    newLogEntries.push({
      id: generateId(),
      week,
      eventId: 'milestone-first-revenue',
      title: 'First Revenue!',
      description: `You\'re making money! $${Math.round(state.finances.weeklyRevenue)}/week might not sound like much, but every great company started here.`,
      category: 'funding',
    });
  }

  // First hire
  if (state.team.teamSize > 0 && prevWeek && prevWeek.teamSize === 0) {
    newLogEntries.push({
      id: generateId(),
      week,
      eventId: 'milestone-first-hire',
      title: 'First Hire!',
      description: 'You\'re no longer alone! Having a team means faster development but also more responsibility.',
      category: 'team',
    });
  }

  if (newLogEntries.length === 0) return state;

  return {
    ...state,
    eventLog: [...state.eventLog, ...newLogEntries],
  };
}

// ─── Calendar advancement ─────────────────────────────────────────────

function advanceCalendar(state: GameState): GameState {
  let { year, month, day } = state.meta;

  day += 7;

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
    teamSize: state.team.teamSize + state.team.aiAgents.length,
    avgMorale: state.team.morale,
    pmfScore: state.product.pmfScore,
    bubbleIndex: state.market.bubbleIndex,
    eventsCount: state.eventLog.filter((e) => e.week === state.meta.week).length,
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

  // 2. Team wiped out: escalating attrition reduced team to 0
  // Only trigger if the player HAD a team before (check week history for non-zero team)
  const hadTeamBefore = state.weekHistory.some(w => w.teamSize > 0);
  if (state.team.teamSize === 0 && hadTeamBefore && state.meta.week > 3) {
    return {
      ...state,
      meta: {
        ...state.meta,
        gameOver: true,
        gameOverReason: "Everyone quit. Your entire team walked out. There's nobody left to build your 'disruptive AI solution.'",
      },
    };
  }

  // 3. Shutdown chosen: player chose to shut down during bubble emergency
  const shutdownChosen = state.eventLog.some(
    (e) => e.eventId === 'auto-bubble-emergency' && e.resolvedOptionId === 'shutdown',
  );
  if (shutdownChosen) {
    return {
      ...state,
      meta: {
        ...state.meta,
        gameOver: true,
        gameOverReason: 'You chose to shut down. The remaining cash was returned to investors. The dream is over.',
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
  if (state.company.valuation < 50_000 && state.team.teamSize > 3 && Math.random() < 0.15) {
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
  if (state.meta.gameOver || state.meta.gameWon) return state;

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
  score += Math.min(400, Math.round(state.company.valuation / 2_500_000));
  score += Math.min(200, Math.round(state.finances.weeklyRevenue / 25));
  score += Math.min(100, (state.team.teamSize + state.team.aiAgents.length) * 5);
  score += Math.round(state.finances.founderEquity * 200);
  score += Math.max(0, 100 - state.meta.week);
  return score;
}

// ─── Regulatory heat simulation ───────────────────────────────────────

function simulateRegulatoryHeat(state: GameState): GameState {
  const isRegulatedSegment = state.market.segment === 'ai-healthcare' || state.market.segment === 'ai-fintech';
  if (!isRegulatedSegment) return state;

  let heatDelta = 0;
  const regulatoryRisk = state.market.segmentData.regulatoryRisk;
  heatDelta += regulatoryRisk * 0.005;

  if (state.meta.growthStrategy === 'move-fast') {
    heatDelta += 0.5;
  }

  if (state.product.customers > 100) {
    heatDelta += 0.2;
  }
  if (state.product.customers > 500) {
    heatDelta += 0.3;
  }

  if (state.meta.growthStrategy === 'quality-first') {
    heatDelta -= 0.3;
  }

  if (state.product.overallQuality < 40 && state.product.customers > 20) {
    heatDelta += 0.4;
  }

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

// ─── Main tick ────────────────────────────────────────────────────────

export function advanceWeek(
  state: GameState,
  decisions: PlayerDecision[],
): GameState {
  // 1. Apply player decisions
  let next = applyDecisions(state, decisions);

  // 1.5 Update counters before simulation reads them
  const lowMoraleWeeks = next.team.morale < 40
    ? (next.meta.lowMoraleWeeks ?? 0) + 1
    : 0;
  const contentSeoWeeks = next.meta.acquisitionChannel === 'content-seo'
    ? (next.meta.contentSeoWeeks ?? 0) + 1
    : 0;
  next = {
    ...next,
    meta: { ...next.meta, lowMoraleWeeks, contentSeoWeeks },
  };

  // 2. Run simulation (capture decision PMF bonus before simulation overwrites it)
  const preSimPmf = next.product.pmfScore;
  next = simulateWeek(next);
  const postSimPmf = next.product.pmfScore;
  // Decisions may have adjusted pmfScore before simulation recalculated it;
  // the simulation's calculatePMF() only considers shipped features, so we
  // preserve any decision-driven delta on top of the calculated value.
  const decisionPmfDelta = preSimPmf - state.product.pmfScore;
  if (decisionPmfDelta !== 0) {
    next = {
      ...next,
      product: {
        ...next.product,
        pmfScore: Math.max(0, Math.min(100, postSimPmf + decisionPmfDelta)),
      },
    };
  }

  // 2.5 Save pre-event values for derived state conflict resolution
  const preEventBurn = next.finances.weeklyBurn;
  const preEventRevenue = next.finances.weeklyRevenue;
  const preEventValuation = next.company.valuation;

  // 3. Process events (capture PMF before events so we can preserve event deltas)
  const preEventPmf = next.product.pmfScore;
  next = processEvents(next);

  // 3.5 Detect event-applied modifiers
  const postEventBurn = next.finances.weeklyBurn;
  const postEventRevenue = next.finances.weeklyRevenue;
  const postEventValuation = next.company.valuation;

  const burnRatio = preEventBurn > 0 && postEventBurn !== preEventBurn
    ? postEventBurn / preEventBurn : 1;
  const revenueRatio = preEventRevenue > 0 && postEventRevenue !== preEventRevenue
    ? postEventRevenue / preEventRevenue : 1;
  const valuationRatio = preEventValuation > 0 && postEventValuation !== preEventValuation
    ? postEventValuation / preEventValuation : 1;

  // 4. Update derived metrics, preserving event modifiers as multipliers
  let burn = calculateWeeklyBurn(next);
  let valuation = calculateValuation(next);
  const avgMorale = calculateAvgMorale(next);
  const basePmf = calculatePMF(next);

  // Preserve event-driven PMF adjustments on top of the recalculated base
  const eventPmfDelta = next.product.pmfScore - preEventPmf;
  const pmfScore = Math.max(0, Math.min(100, basePmf + decisionPmfDelta + eventPmfDelta));

  burn = Math.round(burn * burnRatio);
  const weeklyRevenue = Math.round(next.finances.weeklyRevenue * revenueRatio * 100) / 100;
  valuation = Math.round(valuation * valuationRatio);

  next = {
    ...next,
    finances: { ...next.finances, weeklyBurn: burn, weeklyRevenue },
    company: { ...next.company, valuation },
    team: { ...next.team, morale: avgMorale },
    product: { ...next.product, pmfScore },
  };

  // 5. Advance calendar
  next = advanceCalendar(next);

  // 5.5 Generate candidates every 4 weeks
  if (next.meta.week % 4 === 0) {
    const roles: Array<'engineer' | 'designer' | 'marketer' | 'sales' | 'ops'> = ['engineer', 'designer', 'marketer', 'sales', 'ops'];
    const numCandidates = 3 + Math.floor(Math.random() * 3); // 3-5 candidates
    const newCandidates: Candidate[] = [];
    for (let i = 0; i < numCandidates; i++) {
      const role = roles[Math.floor(Math.random() * roles.length)];
      const skill = 30 + Math.floor(Math.random() * 60);
      const baseSalary = role === 'engineer' ? 3500 : role === 'designer' ? 3000 : 2500;
      const skillBonus = Math.round(skill / 100 * 2000);
      const numTraits = Math.random() < 0.3 ? 2 : 1;
      const traits: string[] = [];
      const shuffledTraits = [...TRAIT_POOL].sort(() => Math.random() - 0.5);
      for (let t = 0; t < numTraits; t++) {
        traits.push(shuffledTraits[t]);
      }
      const boosts: Record<string, number> = {};
      for (const trait of traits) {
        if (trait === '10x-engineer') boosts.velocity = (boosts.velocity ?? 0) + 15;
        else if (trait === 'fast-learner') boosts.velocity = (boosts.velocity ?? 0) + 5;
        else if (trait === 'perfectionist') boosts.quality = (boosts.quality ?? 0) + 10;
        else if (trait === 'creative-thinker') boosts.quality = (boosts.quality ?? 0) + 5;
        else if (trait === 'data-driven') boosts.growth = (boosts.growth ?? 0) + 5;
        else if (trait === 'team-player') boosts.morale = (boosts.morale ?? 0) + 5;
        else if (trait === 'mentor') boosts.morale = (boosts.morale ?? 0) + 8;
        else if (trait === 'domain-expert') boosts.quality = (boosts.quality ?? 0) + 8;
        else if (trait === 'startup-veteran') { boosts.velocity = (boosts.velocity ?? 0) + 5; boosts.quality = (boosts.quality ?? 0) + 3; }
      }
      newCandidates.push({
        id: `cand-${next.meta.week}-${i}`,
        name: randomName(),
        role,
        skill,
        expectedSalary: baseSalary + skillBonus,
        traits,
        boosts,
        availableUntilWeek: next.meta.week + 2 + Math.floor(Math.random() * 3),
      });
    }
    // Remove expired candidates, add new ones
    const activeCandidates = next.team.candidates.filter(c => c.availableUntilWeek > next.meta.week);
    next = {
      ...next,
      team: {
        ...next.team,
        candidates: [...activeCandidates, ...newCandidates],
      },
    };
  } else {
    // Just expire old candidates
    const activeCandidates = next.team.candidates.filter(c => c.availableUntilWeek > next.meta.week);
    if (activeCandidates.length !== next.team.candidates.length) {
      next = {
        ...next,
        team: { ...next.team, candidates: activeCandidates },
      };
    }
  }

  // 5.6 Resolve pending offers
  const resolvedOffers = next.team.pendingOffers.filter(o => o.weekOffered < next.meta.week);
  const remainingOffers = next.team.pendingOffers.filter(o => o.weekOffered >= next.meta.week);

  if (resolvedOffers.length > 0) {
    let updatedMembers = [...next.team.members];
    let updatedCandidates = [...next.team.candidates];
    const offerLogEntries: EventLogEntry[] = [];
    let cashSpent = 0;

    for (const offer of resolvedOffers) {
      const candidate = updatedCandidates.find(c => c.id === offer.candidateId);
      if (!candidate) continue;

      // Acceptance probability based on salary ratio
      const salaryRatio = offer.offeredSalary / candidate.expectedSalary;
      let acceptProb = 0.6 * salaryRatio;
      if (salaryRatio >= 1.2) acceptProb = Math.min(0.95, acceptProb);
      if (salaryRatio < 0.8) acceptProb = Math.max(0.1, acceptProb * 0.5);
      acceptProb = Math.max(0.05, Math.min(0.95, acceptProb));

      const accepted = Math.random() < acceptProb;

      if (accepted) {
        const newMember: TeamMember = {
          id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: candidate.name,
          role: candidate.role,
          skill: candidate.skill,
          salary: offer.offeredSalary,
          morale: 80,
          weekHired: next.meta.week,
          traits: candidate.traits,
          boosts: candidate.boosts,
        };
        updatedMembers.push(newMember);
        updatedCandidates = updatedCandidates.filter(c => c.id !== candidate.id);
        cashSpent += offer.offeredSalary * 2; // signing bonus

        offerLogEntries.push({
          id: generateId(),
          week: next.meta.week,
          eventId: 'offer-accepted',
          title: `${candidate.name} Joined!`,
          description: `${candidate.name} (${candidate.role}, skill ${candidate.skill}) accepted your offer of $${offer.offeredSalary.toLocaleString()}/wk.`,
          category: 'team',
        });
      } else {
        updatedCandidates = updatedCandidates.filter(c => c.id !== candidate.id);
        offerLogEntries.push({
          id: generateId(),
          week: next.meta.week,
          eventId: 'offer-rejected',
          title: `${candidate.name} Declined`,
          description: `${candidate.name} declined your offer of $${offer.offeredSalary.toLocaleString()}/wk. They expected $${candidate.expectedSalary.toLocaleString()}/wk.`,
          category: 'team',
        });
      }
    }

    const newSize = updatedMembers.length;
    const newAvg = newSize > 0 ? Math.round(updatedMembers.reduce((s, m) => s + m.salary, 0) / newSize) : 0;

    next = {
      ...next,
      team: {
        ...next.team,
        members: updatedMembers,
        candidates: updatedCandidates,
        pendingOffers: remainingOffers,
        teamSize: newSize,
        avgSalary: newAvg,
      },
      finances: {
        ...next.finances,
        cash: next.finances.cash - cashSpent,
      },
      eventLog: [...next.eventLog, ...offerLogEntries],
    };
  }

  // 6. Simulate regulatory heat for regulated segments
  next = simulateRegulatoryHeat(next);

  // 7. Task 3: Founder skill learning — every 10 weeks, auto-increment lowest skill
  if (next.meta.week % 10 === 0 && next.founder.learning > 0) {
    const skillIncrement = Math.min(5, next.founder.learning / 20);
    const { techSkill, bizSkill, network } = next.founder;
    const minSkill = Math.min(techSkill, bizSkill, network);
    const updatedFounder = { ...next.founder };
    if (techSkill === minSkill) {
      updatedFounder.techSkill = Math.min(100, techSkill + skillIncrement);
    } else if (bizSkill === minSkill) {
      updatedFounder.bizSkill = Math.min(100, bizSkill + skillIncrement);
    } else {
      updatedFounder.network = Math.min(100, network + skillIncrement);
    }
    next = { ...next, founder: updatedFounder };
  }

  // 8. (lowMoraleWeeks and contentSeoWeeks now updated in step 1.5 before simulation)

  // 9. Task 10: Morale impact from funding events this week
  const fundingThisWeek = next.eventLog.filter(
    (e) => e.week === next.meta.week && e.eventId === 'funding-raised',
  );
  const rejectedThisWeek = next.eventLog.filter(
    (e) => e.week === next.meta.week && e.eventId === 'funding-rejected',
  );
  if (fundingThisWeek.length > 0) {
    next = {
      ...next,
      team: { ...next.team, morale: Math.min(100, next.team.morale + 5) },
    };
  }
  if (rejectedThisWeek.length > 0) {
    next = {
      ...next,
      team: { ...next.team, morale: Math.max(0, next.team.morale - 3) },
    };
  }

  // 10. Clamp all percentage values (safety net for entire pipeline)
  const clamp0100 = (v: number) => Math.max(0, Math.min(100, v));
  next = {
    ...next,
    team: { ...next.team, morale: clamp0100(next.team.morale) },
    company: {
      ...next.company,
      reputation: clamp0100(next.company.reputation),
      culture: clamp0100(next.company.culture),
    },
    market: {
      ...next.market,
      investorSentiment: clamp0100(next.market.investorSentiment),
      talentMarketHeat: clamp0100(next.market.talentMarketHeat),
    },
    product: {
      ...next.product,
      overallQuality: clamp0100(next.product.overallQuality),
    },
  };

  // 11. Check milestones
  next = checkMilestones(next);

  // 11. Record week history
  const summary = createWeekSummary(next);
  next = {
    ...next,
    weekHistory: [...next.weekHistory, summary],
  };

  // 12. Check game over
  next = checkGameOver(next);

  // 13. Check win conditions
  next = checkWinCondition(next);

  return next;
}
