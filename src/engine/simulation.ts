import type { GameState, Feature, Competitor, EventLogEntry, PendingDecision, AIAgentType } from '../types/index.ts';
import { calculateWeeklyBurn, calculatePMF } from './derived.ts';
import { generateId } from '../utils/id.ts';

/**
 * Clamp a number between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Simple random helper.
 */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ─── Difficulty Modifiers ────────────────────────────────────────────

function getDifficultyModifiers(difficulty: string) {
  switch (difficulty) {
    case 'easy':
      return { churnMultiplier: 0.7, customerGrowthMultiplier: 1.3, moraleDrift: 0.5, competitorQualityDrift: 0 };
    case 'hard':
      return { churnMultiplier: 1.3, customerGrowthMultiplier: 0.8, moraleDrift: 0, competitorQualityDrift: 0.5 };
    case 'nightmare':
      return { churnMultiplier: 1.6, customerGrowthMultiplier: 0.6, moraleDrift: 0, competitorQualityDrift: 1.0 };
    default: // normal
      return { churnMultiplier: 1.0, customerGrowthMultiplier: 1.0, moraleDrift: 0, competitorQualityDrift: 0 };
  }
}

// ─── Product Development ──────────────────────────────────────────────

function simulateProductDevelopment(state: GameState): GameState {
  // Apply growth strategy modifiers
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

  // Product focus modifiers
  const productFocus = state.meta.productFocus ?? 'new-features';
  let focusProgressMultiplier = 1.0;
  let focusQualityMultiplier = 1.0;
  let focusBugReduction = 0;
  let focusDebtReduction = 0;
  switch (productFocus) {
    case 'quality':
      focusProgressMultiplier = 0.6;
      focusQualityMultiplier = 1.5;
      break;
    case 'bug-fixing':
      focusProgressMultiplier = 0.4;
      focusBugReduction = 2 + Math.floor(state.team.teamSize / 3);
      break;
    case 'tech-debt':
      focusProgressMultiplier = 0.4;
      focusDebtReduction = 3 + state.team.teamSize * 1.5;
      break;
    case 'user-growth':
      focusProgressMultiplier = 0.8;
      // Bonus applied in simulateCustomers
      break;
    // 'new-features': default, no changes
  }

  // Tech debt consequence: slows feature progress
  const techDebtTotal = state.product.techDebtTotal;
  let techDebtSlowdown = 1.0;
  if (techDebtTotal > 50) techDebtSlowdown = 0.8;
  if (techDebtTotal > 70) techDebtSlowdown = 0.6;
  if (techDebtTotal > 85) techDebtSlowdown = 0.4;

  // Count in-progress features to divide work among them
  const inProgressFeatures = state.product.features.filter(f => f.status === 'in-progress');
  const featureCount = Math.max(1, inProgressFeatures.length);

  // Founder always contributes to progress — they're building in the garage!
  // techSkill directly drives how fast the founder builds
  // A technical founder (techSkill 80) ships MVP in ~5 weeks, biz founder (techSkill 20) in ~10
  const founderProgress = (8 + state.founder.techSkill / 8) / featureCount;

  // Task 12: Diminishing returns on team size for progress
  const effectiveTeamSize = Math.sqrt(state.team.teamSize) * 2;

  // Task 5: Only coding and general agents contribute to feature progress
  const codingAgentProgress = state.team.aiAgents.reduce((sum, agent) => {
    if (agent.type === 'coding') return sum + (agent.capability * agent.reliability) / 10000 * 12;
    if (agent.type === 'general') return sum + (agent.capability * agent.reliability) / 10000 * 6; // 50% effectiveness
    return sum;
  }, 0);

  // Task 5: Design agents contribute to quality, not progress
  const designAgentBonus = state.team.aiAgents.reduce((sum, agent) => {
    if (agent.type === 'design') return sum + agent.capability / 100 * 5;
    if (agent.type === 'general') return sum + agent.capability / 100 * 2.5; // 50%
    return sum;
  }, 0);

  // Task 5: Coding agents reduce tech debt
  const codingAgentDebtReduction = state.team.aiAgents.reduce((sum, agent) => {
    if (agent.type === 'coding') return sum + agent.reliability / 200;
    return sum;
  }, 0);

  // Human contribution using effective team size (diminishing returns)
  const totalHumanProgress = (effectiveTeamSize * (state.team.morale / 100) * 12) / featureCount;

  // AI contribution divided across features
  const totalAiProgress = codingAgentProgress / featureCount;

  const totalAiTechDebt = state.team.aiAgents.reduce(
    (sum, agent) => sum + (100 - agent.reliability) / 100 * 3,
    0,
  ) / featureCount;

  // Task 10: Morale affects progress
  let moraleProgressMultiplier = 1.0;
  if (state.team.morale < 30) {
    moraleProgressMultiplier = 0.75; // Low morale slows progress by 25%
  }

  // Task 3: Founder techSkill adds to quality multiplier (technical founders ship better code)
  const founderQualityBonus = state.founder.techSkill / 100;

  const updatedFeatures = state.product.features.map((feature): Feature => {
    if (feature.status !== 'in-progress') return feature;

    const totalProgress = (founderProgress + totalHumanProgress + totalAiProgress) * featureProgressMultiplier * techDebtSlowdown * moraleProgressMultiplier * focusProgressMultiplier;
    const newProgress = clamp(feature.progress + totalProgress, 0, 100);

    // Task 12: Quality based on team size, not flat
    const baseTargetQuality = clamp(30 + state.team.teamSize * 8 + designAgentBonus, 30, 95);
    let targetQuality = baseTargetQuality * (qualityMultiplier + founderQualityBonus) * focusQualityMultiplier;

    // Task 10: High morale boosts quality
    if (state.team.morale > 80) {
      targetQuality *= 1.1;
    }

    targetQuality = clamp(targetQuality, 0, 100);

    const newQuality = clamp(
      feature.quality + (targetQuality - feature.quality) * 0.2,
      0,
      100,
    );

    // Auto-ship when progress hits 100
    const newStatus = newProgress >= 100 ? 'shipped' as const : feature.status;

    return {
      ...feature,
      progress: Math.round(newProgress * 10) / 10,
      quality: Math.round(newQuality),
      status: newStatus,
    };
  });

  const shippedFeatures = updatedFeatures.filter((f) => f.status === 'shipped');
  const overallQuality = shippedFeatures.length > 0
    ? Math.round(shippedFeatures.reduce((s, f) => s + f.quality, 0) / shippedFeatures.length)
    : 0;

  // Tech debt accumulation from AI agents, reduced by coding agent maintenance and focus
  const newTechDebtTotal = clamp(
    state.product.techDebtTotal + totalAiTechDebt * techDebtMultiplier - codingAgentDebtReduction - focusDebtReduction,
    0,
    100,
  );

  // Bugs accumulate from tech debt, reduced by bug-fixing focus
  const newBugs = Math.max(
    0,
    state.product.bugs + Math.floor(newTechDebtTotal / 25) - (shippedFeatures.length > 0 ? 1 : 0) - focusBugReduction,
  );

  return {
    ...state,
    product: {
      ...state.product,
      features: updatedFeatures,
      overallQuality,
      techDebtTotal: Math.round(newTechDebtTotal * 10) / 10,
      bugs: newBugs,
    },
  };
}

// ─── Tech Debt Consequences ──────────────────────────────────────────

function simulateTechDebtConsequences(state: GameState): GameState {
  const techDebt = state.product.techDebtTotal;
  let customers = state.product.customers;
  const newLogEntries: EventLogEntry[] = [];
  let moralePenalty = 0;

  // Production outage risk at high tech debt
  if (techDebt > 70 && Math.random() < 0.15) {
    const churnSpike = 0.05 + Math.random() * 0.05;
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

  // Team hates working on spaghetti code
  if (techDebt > 85) {
    moralePenalty = 3;
    newLogEntries.push({
      id: generateId(),
      week: state.meta.week,
      eventId: 'tech-debt-morale',
      title: 'Engineers Frustrated',
      description: 'Your engineers are drowning in tech debt. Every small change breaks three other things. Morale is suffering.',
      category: 'team',
    });
  }

  // Natural tech debt reduction: proportional to team size when few features in progress
  const inProgressCount = state.product.features.filter(f => f.status === 'in-progress').length;
  let techDebtReduction = 0;
  if (inProgressCount <= 1 && state.team.teamSize > 0) {
    techDebtReduction = state.team.teamSize * 0.8;
  }

  const newTechDebtTotal = clamp(
    state.product.techDebtTotal - techDebtReduction,
    0,
    100,
  );

  // Apply morale penalty from high tech debt
  const newMorale = moralePenalty > 0
    ? clamp(state.team.morale - moralePenalty, 0, 100)
    : state.team.morale;

  return {
    ...state,
    team: {
      ...state.team,
      morale: newMorale,
    },
    product: {
      ...state.product,
      techDebtTotal: Math.round(newTechDebtTotal * 10) / 10,
      customers,
    },
    eventLog: [...state.eventLog, ...newLogEntries],
  };
}

// ─── Revenue ──────────────────────────────────────────────────────────

function simulateRevenue(state: GameState): GameState {
  const qualityModifier = state.product.overallQuality / 100;
  const bugPenalty = Math.max(0, 1 - state.product.bugs * 0.02);
  const customers = state.product.customers;
  const pricePerUnit = state.finances.pricePerUnit;
  let revenue = 0;

  switch (state.finances.pricingModel) {
    case 'free':
      // Even free products can generate some ad/data revenue
      revenue = customers * 0.05 * qualityModifier;
      break;

    case 'freemium': {
      const payingUsers = Math.floor(customers * 0.05);
      revenue = payingUsers * pricePerUnit * qualityModifier * bugPenalty;
      break;
    }

    case 'subscription':
      revenue = customers * pricePerUnit * qualityModifier * bugPenalty;
      break;

    case 'usage-based': {
      // Task 6: Tie revenue more closely to product quality
      const activityMultiplier = qualityModifier; // quality/100 instead of random
      const weeklyNoise = 1 + (Math.random() - 0.5) * 0.15; // reduced noise
      revenue = customers * pricePerUnit * activityMultiplier * bugPenalty * weeklyNoise;
      break;
    }

    case 'enterprise': {
      const enterpriseMultiplier = 15;
      let enterpriseRevenue = customers * pricePerUnit * enterpriseMultiplier * qualityModifier * bugPenalty;
      // Task 6: Enterprise requires team size >= 5 for full revenue
      const totalTeam = state.team.teamSize + state.team.aiAgents.length;
      if (totalTeam < 5) {
        enterpriseRevenue *= 0.5; // Cap at 50% if understaffed
      }
      revenue = enterpriseRevenue;
      break;
    }

    case 'one-time': {
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

  const strategy = state.meta.growthStrategy;
  let burnMultiplier = 1.0;
  if (strategy === 'growth-hack') {
    burnMultiplier = 1.2;
  } else if (strategy === 'sustainable') {
    burnMultiplier = 0.85;
  }

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
  const diffMods = getDifficultyModifiers(state.meta.difficulty);

  let bubbleShock = 0;
  if (Math.random() < 0.02) {
    bubbleShock = (Math.random() < 0.5 ? 1 : -1) * rand(15, 25);
  }

  const bubbleNoise = rand(-3, 3);
  const newBubbleIndex = clamp(
    state.market.bubbleIndex + state.market.bubbleTrend + bubbleNoise + bubbleShock,
    0,
    100,
  );

  let newTrend = state.market.bubbleTrend * 0.95 + rand(-0.5, 0.5);
  if (newBubbleIndex > 90) newTrend -= 0.5;
  if (newBubbleIndex < 10) newTrend += 0.5;

  let newTalentHeat = clamp(
    state.market.talentMarketHeat * 0.9 + newBubbleIndex * 0.1 + rand(-2, 2),
    0,
    100,
  );

  // Task 3: Founder network stabilizes investor sentiment
  const networkSentimentBonus = state.founder.network / 100 * 1.5;
  let newInvestorSentiment = clamp(
    state.market.investorSentiment * 0.85 + newBubbleIndex * 0.15 + rand(-3, 3) + networkSentimentBonus,
    0,
    100,
  );

  let competitorDeathBoost = 0;
  if (newBubbleIndex > 85) {
    newInvestorSentiment = clamp(newInvestorSentiment + rand(2, 5), 0, 100);
    newTalentHeat = clamp(newTalentHeat + rand(1, 3), 0, 100);
    competitorDeathBoost = 0.03;
  }

  if (newBubbleIndex < 25) {
    newInvestorSentiment = clamp(newInvestorSentiment - rand(2, 5), 0, 100);
    newTalentHeat = clamp(newTalentHeat - rand(2, 4), 0, 100);
  }

  // Task 11: Bubble < 25 tanks investor sentiment and valuation
  let valuationMultiplier = 1.0;
  if (newBubbleIndex < 25) {
    valuationMultiplier = 0.8; // 20% valuation drop
  }

  const updatedCompetitors = state.market.competitors.map(
    (comp): Competitor => {
      if (!comp.alive) return comp;
      // Task 2: Difficulty affects competitor quality drift
      const qualityDelta = rand(-1, 1.5) + diffMods.competitorQualityDrift;
      const shareDelta = rand(-0.005, 0.005);
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

  // Task 4: Competitor quality comparison affects reputation
  let reputationDelta = 0;
  const aliveCompetitors = updatedCompetitors.filter(c => c.alive);
  if (aliveCompetitors.length > 0) {
    const bestCompQuality = Math.max(...aliveCompetitors.map(c => c.productQuality));
    const worstCompQuality = Math.min(...aliveCompetitors.map(c => c.productQuality));

    if (state.product.overallQuality > bestCompQuality + 15) {
      reputationDelta += 2; // Market leadership
    }
    if (state.product.overallQuality < worstCompQuality - 10) {
      reputationDelta -= 1; // Falling behind
    }
  }

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
    company: {
      ...state.company,
      reputation: clamp(state.company.reputation + reputationDelta, 0, 100),
      valuation: Math.round(state.company.valuation * valuationMultiplier),
    },
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
  if (state.team.teamSize === 0) return state;

  const totalTeamSize = state.team.teamSize + state.team.aiAgents.length;
  const aiRatio = totalTeamSize > 0 ? state.team.aiAgents.length / totalTeamSize : 0;
  const diffMods = getDifficultyModifiers(state.meta.difficulty);

  let moraleDelta = 0;

  // AI ratio effect on morale
  moraleDelta += aiRatio * -0.5;

  // Natural drift toward 50 (easy mode drifts toward 60)
  const driftTarget = diffMods.moraleDrift > 0 ? 60 : 50;
  moraleDelta += (driftTarget - state.team.morale) * 0.02;
  moraleDelta += diffMods.moraleDrift; // Easy mode additional drift

  // Task 10: Culture effect amplified 5x (culture 80 = +1.5/wk, culture 20 = -1.5/wk)
  moraleDelta += (state.company.culture - 50) * 0.05;

  // Low bubble / market correction hurts morale (job insecurity)
  if (state.market.bubbleIndex < 25) {
    moraleDelta -= 1;
  }

  // High tech debt hurts morale
  if (state.product.techDebtTotal > 60) {
    moraleDelta -= 0.5;
  }

  // Random noise
  moraleDelta += rand(-2, 2);

  const newMorale = clamp(Math.round(state.team.morale + moraleDelta), 0, 100);

  // Task 10: Culture drift
  let cultureDelta = 0;
  // Quality-first strategy drifts culture up (capped at 80)
  if (state.meta.growthStrategy === 'quality-first' && state.company.culture < 80) {
    cultureDelta += 1;
  }
  // AI agent ratio > 50%: culture -1/week (humans feel replaceable)
  if (aiRatio > 0.5) {
    cultureDelta -= 1;
  }
  const newCulture = clamp(state.company.culture + cultureDelta, 0, 100);

  // Task 11: Escalating morale consequences (replacing instant death)
  const newLogEntries: EventLogEntry[] = [];
  let reputationDelta = 0;

  if (newMorale < 30 && newMorale >= 20) {
    newLogEntries.push({
      id: generateId(),
      week: state.meta.week,
      eventId: 'morale-warning',
      title: 'Team Unrest',
      description: 'Your team is unhappy. Productivity is dropping and people are updating their resumes.',
      category: 'team',
    });
    reputationDelta = -1;
  }

  return {
    ...state,
    team: {
      ...state.team,
      morale: newMorale,
    },
    company: {
      ...state.company,
      culture: newCulture,
      reputation: clamp(state.company.reputation + reputationDelta, 0, 100),
    },
    eventLog: [...state.eventLog, ...newLogEntries],
  };
}

// ─── Team Attrition ─────────────────────────────────────────────────

function simulateTeamAttrition(state: GameState): GameState {
  if (state.team.teamSize === 0) return state;

  const newLogEntries: EventLogEntry[] = [];
  let lostCount = 0;

  // Task 11: Escalating consequences instead of instant death
  if (state.team.morale < 10) {
    // Mass walkout risk: 60% chance of losing 50% of team
    if (Math.random() < 0.60) {
      lostCount = Math.max(1, Math.floor(state.team.teamSize * 0.5));
      newLogEntries.push({
        id: generateId(),
        week: state.meta.week,
        eventId: 'team-mass-walkout',
        title: 'Mass Walkout!',
        description: `${lostCount} team members staged a walkout. Morale was at ${state.team.morale}%. This is a crisis.`,
        category: 'team',
      });
    }
  } else if (state.team.morale < 20) {
    // 40% chance of losing 1 team member
    if (Math.random() < 0.40) {
      lostCount = 1;
      newLogEntries.push({
        id: generateId(),
        week: state.meta.week,
        eventId: 'team-attrition',
        title: 'Team Member Quit',
        description: `A team member walked out. Morale was at ${state.team.morale}%. They said something about "work-life balance."`,
        category: 'team',
      });
    }
  } else if (state.team.morale < 30) {
    // Occasional attrition even at moderate low morale
    if (Math.random() < 0.10) {
      lostCount = 1;
      newLogEntries.push({
        id: generateId(),
        week: state.meta.week,
        eventId: 'team-attrition',
        title: 'Team Member Quit',
        description: `A team member left for a better opportunity. Team morale is only ${state.team.morale}%.`,
        category: 'team',
      });
    }
  }

  // Talent market heat: hot market increases quit chance even at moderate morale
  if (lostCount === 0 && state.market.talentMarketHeat > 80 && state.team.morale < 50) {
    if (Math.random() < 0.05) {
      lostCount = 1;
      newLogEntries.push({
        id: generateId(),
        week: state.meta.week,
        eventId: 'team-poached',
        title: 'Team Member Poached',
        description: 'A competitor lured away one of your team members with a big offer. The talent market is brutal right now.',
        category: 'team',
      });
    }
  }

  if (lostCount === 0) return state;

  lostCount = Math.min(state.team.teamSize, lostCount);

  return {
    ...state,
    team: {
      ...state.team,
      teamSize: state.team.teamSize - lostCount,
      morale: clamp(state.team.morale - 5, 0, 100),
    },
    eventLog: [...state.eventLog, ...newLogEntries],
  };
}

// ─── Customers ────────────────────────────────────────────────────────

function simulateCustomers(state: GameState): GameState {
  const pmf = calculatePMF(state);
  const currentCustomers = state.product.customers;
  const diffMods = getDifficultyModifiers(state.meta.difficulty);

  const strategy = state.meta.growthStrategy;
  let customerGrowthMultiplier = 1.0;
  if (strategy === 'growth-hack') {
    customerGrowthMultiplier = 1.5;
  } else if (strategy === 'sustainable') {
    customerGrowthMultiplier = 0.8;
  }

  // Task 2: Difficulty affects customer growth
  customerGrowthMultiplier *= diffMods.customerGrowthMultiplier;

  // Task 5: Analytics agent boosts PMF calculation
  const analyticsBoost = state.team.aiAgents.reduce((sum, agent) => {
    if (agent.type === 'analytics') return sum + agent.capability / 200;
    if (agent.type === 'general') return sum + agent.capability / 400; // 50%
    return sum;
  }, 0);
  const effectivePMF = Math.min(100, pmf * (1 + analyticsBoost));

  const pmfGrowth = (effectivePMF / 100) * (currentCustomers * 0.05 + 2);
  const marketGrowthRate = state.market.segmentData.growthRate / 52;
  const marketGrowth = currentCustomers * marketGrowthRate;

  let bubbleCustomerModifier = 1.0;
  if (state.market.bubbleIndex > 85) {
    bubbleCustomerModifier = 1.3;
  } else if (state.market.bubbleIndex < 25) {
    bubbleCustomerModifier = 0.6;
  }

  const reputationGrowth = (state.company.reputation / 100) * 1.5;

  // Task 3: Founder bizSkill boosts customer growth (high biz founders hustle hard)
  const founderBizGrowth = state.founder.bizSkill / 100 * 3.0;

  const shippedFeatures = state.product.features.filter((f) => f.status === 'shipped');
  const avgShippedQuality = shippedFeatures.length > 0
    ? shippedFeatures.reduce((s, f) => s + f.quality, 0) / shippedFeatures.length
    : 0;
  const wordOfMouthMultiplier = avgShippedQuality > 70
    ? 1.0 + (avgShippedQuality - 70) / 100
    : 1.0;

  // Product focus: user-growth boosts customer growth
  const productFocus = state.meta.productFocus ?? 'new-features';
  const userGrowthBonus = productFocus === 'user-growth' ? 1.4 : 1.0;

  // Acquisition channel effects
  const channel = state.meta.acquisitionChannel ?? 'organic';
  let channelGrowthMultiplier = 1.0;
  let channelChurnReduction = 0;
  let channelExtraCustomers = 0;

  switch (channel) {
    case 'organic':
      // No bonus, no cost — pure PMF and word-of-mouth
      break;
    case 'content-seo': {
      // Compounds over time: +2% per week active, up to +20%
      const seoWeeks = state.meta.contentSeoWeeks ?? 0;
      const seoBonus = Math.min(0.20, seoWeeks * 0.02);
      channelGrowthMultiplier = 1.0 + seoBonus;
      break;
    }
    case 'paid-ads':
      // Marketing spend is 2x more effective but no compounding
      channelGrowthMultiplier = 1.0; // effectiveness comes from marketing spend boost below
      break;
    case 'community':
      // Reduces churn, moderate growth boost
      channelGrowthMultiplier = 1.1;
      channelChurnReduction = 0.01;
      break;
    case 'sales-outreach':
      // Best for enterprise, adds direct conversions based on team and bizSkill
      if (state.team.teamSize >= 3) {
        channelExtraCustomers = Math.floor(state.team.teamSize * 0.5 * (state.founder.bizSkill / 100));
      }
      break;
    case 'viral-loops':
      // Requires quality > 50. Exponential growth from existing users
      if (state.product.overallQuality > 50) {
        const viralCoefficient = (state.product.overallQuality - 50) / 200; // 0-0.25
        channelExtraCustomers = Math.floor(currentCustomers * viralCoefficient * 0.1);
      }
      break;
  }

  // Paid ads: double the marketing spend effectiveness
  const channelMarketingMultiplier = channel === 'paid-ads' ? 2.0 : 1.0;

  // Task 5: Marketing agents boost marketing effect
  const marketingAgentBonus = state.team.aiAgents.reduce((sum, agent) => {
    if (agent.type === 'marketing') return sum + agent.capability / 50;
    if (agent.type === 'general') return sum + agent.capability / 100; // 50%
    return sum;
  }, 0);

  const marketingEffect = state.finances.marketingSpend > 0
    ? Math.sqrt(state.finances.marketingSpend / 1000) * 2 * channelMarketingMultiplier + marketingAgentBonus
    : marketingAgentBonus;

  const pricingGrowthBonus = state.finances.pricingModel === 'free' ? 1.5
    : state.finances.pricingModel === 'freemium' ? 1.3
    : state.finances.pricingModel === 'enterprise' ? 0.5
    : 1.0;

  // Task 4: Competitor market share pressure
  const aliveCompetitors = state.market.competitors.filter(c => c.alive);
  let competitorPressure = 1.0;
  if (aliveCompetitors.length > 0) {
    const totalCompetitorShare = aliveCompetitors.reduce((sum, c) => sum + c.marketShare, 0);
    if (totalCompetitorShare > 0.8) {
      competitorPressure = 0.5; // 50% growth reduction
    } else if (totalCompetitorShare > 0.6) {
      competitorPressure = 0.7; // 30% growth reduction
    }
  }

  // Task 7: Dynamic churn calculation
  const baseChurn = state.product.churnRate;
  const qualityBonus = -(state.product.overallQuality - 50) / 500;
  const bugPenalty = state.product.bugs * 0.005;

  // Task 4: Competitor stealing customers
  const bestCompQuality = aliveCompetitors.length > 0
    ? Math.max(...aliveCompetitors.map(c => c.productQuality))
    : 0;
  const competitorPull = bestCompQuality > state.product.overallQuality ? 0.01 : 0;

  // Task 5: Support agents reduce churn
  const supportBonus = state.team.aiAgents.reduce((sum, agent) => {
    if (agent.type === 'support') return sum + 0.005;
    return sum;
  }, 0);

  const pricingChurnPenalty = state.finances.pricingModel === 'enterprise' ? 0.02 : 0;

  const effectiveChurn = clamp(
    (baseChurn + qualityBonus + bugPenalty + competitorPull - supportBonus + pricingChurnPenalty - channelChurnReduction) * diffMods.churnMultiplier,
    0.01,
    0.25,
  );
  const churned = currentCustomers * effectiveChurn / 4;

  // Task 4: Individual competitor customer stealing
  let competitorStolen = 0;
  for (const comp of aliveCompetitors) {
    if (comp.productQuality > state.product.overallQuality + 20) {
      competitorStolen += currentCustomers * 0.02;
    }
  }

  const hasShippedProduct = state.product.features.some(
    (f) => f.status === 'shipped',
  );
  const hasAnyProduct = state.product.features.length > 0;

  // Base minimum growth — even a crappy product gets some organic traffic
  const baseMinGrowth = hasShippedProduct ? 2 : 0;

  let growth: number;
  if (hasShippedProduct) {
    // Full growth engine: PMF, market, reputation, marketing, word-of-mouth, etc.
    growth = (pmfGrowth + marketGrowth + reputationGrowth + marketingEffect + founderBizGrowth + baseMinGrowth) *
      customerGrowthMultiplier * bubbleCustomerModifier * wordOfMouthMultiplier * pricingGrowthBonus * competitorPressure *
      userGrowthBonus * channelGrowthMultiplier + channelExtraCustomers;

    // First-ship bonus: initial users discover you (decays as you grow)
    if (currentCustomers < 50) {
      const firstShipBonus = Math.max(0, (50 - currentCustomers) * 0.1);
      growth += firstShipBonus;
    }
  } else if (hasAnyProduct) {
    // Pre-launch: features in progress but not shipped yet — early adopters / waitlist
    // Marketing, reputation, and founder hustle can bring in a trickle
    const preLaunchGrowth = (marketingEffect * 0.5 + reputationGrowth * 0.3 + founderBizGrowth * 0.5) *
      customerGrowthMultiplier * userGrowthBonus * channelGrowthMultiplier;
    growth = Math.max(0, preLaunchGrowth) + channelExtraCustomers * 0.3;
  } else {
    // No product at all — only founder hustle and marketing can bring tiny interest
    const noProductGrowth = (marketingEffect * 0.2 + founderBizGrowth * 0.3) * customerGrowthMultiplier;
    growth = Math.max(0, noProductGrowth);
  }

  const newCustomers = Math.max(0, Math.round(currentCustomers + growth - churned - competitorStolen));

  return {
    ...state,
    product: {
      ...state.product,
      customers: newCustomers,
      pmfScore: Math.round(effectivePMF),
      churnRate: Math.round(effectiveChurn * 1000) / 1000, // Store effective churn for UI
    },
  };
}

// ─── Marketing Spend ─────────────────────────────────────────────────

function simulateMarketingSpend(state: GameState): GameState {
  const strategy = state.meta.growthStrategy;
  let marketingSpend = state.finances.marketingSpend;

  // Task 9: Removed auto-ramping for growth-hack — player controls via decisions
  // Only sustainable strategy auto-reduces
  if (strategy === 'sustainable') {
    marketingSpend = Math.max(0, marketingSpend * 0.95);
    marketingSpend = Math.round(marketingSpend);
  }

  return {
    ...state,
    finances: {
      ...state.finances,
      marketingSpend,
    },
  };
}

// ─── Stage Progression ───────────────────────────────────────────────

function simulateStageProgression(state: GameState): GameState {
  const { stage } = state.company;
  const valuation = state.company.valuation;
  const teamSize = state.team.teamSize + state.team.aiAgents.length;
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

// ─── Auto Decision Generation (Tradeoff Decisions) ──────────────────

function generateAutoDecisions(state: GameState): GameState {
  const newDecisions: PendingDecision[] = [];
  const newLogEntries: EventLogEntry[] = [];
  const week = state.meta.week;

  // Task 8: Salary scaling by company stage
  const stageSalaryMultiplier: Record<string, number> = {
    'garage': 1.0,
    'pre-seed': 1.0,
    'seed': 1.2,
    'series-a': 1.5,
    'series-b': 1.8,
    'series-c': 1.8,
    'growth': 1.8,
    'public': 1.8,
  };
  const salaryScale = stageSalaryMultiplier[state.company.stage] ?? 1.0;

  // --- EARLY GAME: What to build first (week 1 only) ---
  if (week === 1 && state.product.features.length === 0) {
    const demands = state.market.segmentData.customerDemand;
    if (demands.length >= 2) {
      const shuffled = [...demands].sort(() => Math.random() - 0.5);
      const featureA = shuffled[0];
      const featureB = shuffled[1];
      const nameA = featureA.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const nameB = featureB.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: 'auto-first-feature',
        prompt: 'Welcome to your startup! What should you build first?',
        options: [
          {
            id: `feature_${featureA}_85`,
            label: `Build ${nameA}`,
            description: `High demand feature. Start building your MVP around ${nameA}.`,
            effects: [{ path: 'company.reputation', operation: 'add', value: 2 }],
          },
          {
            id: `feature_${featureB}_80`,
            label: `Build ${nameB}`,
            description: `Strong market need. ${nameB} could be your differentiator.`,
            effects: [{ path: 'company.reputation', operation: 'add', value: 2 }],
          },
        ],
        deadline: week + 2,
        defaultOptionId: `feature_${featureA}_85`,
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: 'auto-first-feature',
        title: 'Time to Build!',
        description: 'Your startup journey begins. Pick your first feature to build.',
        category: 'product',
        decisionId,
      });
    }
  }

  // --- PRICING DECISION (auto-prompt when customers > 10 and still on free) ---
  if (state.product.customers >= 10 && state.finances.pricingModel === 'free' && state.finances.pricePerUnit === 0) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-pricing-prompt',
    );
    const alreadyTriggered = state.eventLog.some(
      (e) => e.eventId === 'auto-pricing-prompt',
    );

    if (!alreadyPending && !alreadyTriggered) {
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: 'auto-pricing-prompt',
        prompt: `You have ${state.product.customers} users but no real pricing. Time to monetize?`,
        options: [
          {
            id: 'pricing_freemium_10',
            label: 'Go Freemium ($10/mo)',
            description: '5% of users pay. Good balance of growth and revenue.',
            effects: [],
          },
          {
            id: 'pricing_subscription_20',
            label: 'Subscription ($20/mo)',
            description: 'All users pay. Higher revenue but slower growth.',
            effects: [],
          },
          {
            id: 'pricing_stay_free',
            label: 'Stay Free (For Now)',
            description: 'Keep growing fast. Monetize later.',
            effects: [],
          },
        ],
        deadline: week + 3,
        defaultOptionId: 'pricing_stay_free',
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: 'auto-pricing-prompt',
        title: 'Time to Monetize?',
        description: 'You have users! Should you start charging?',
        category: 'product',
        decisionId,
      });
    }
  }

  // --- TEAM DECISIONS (every 2-3 weeks, but not too early) ---
  // Don't overwhelm early-game players with hire decisions when they can't afford it
  const canSustainHire = state.finances.cash > 30000; // Need enough cash to sustain a hire
  if (week > 4 && canSustainHire && (week % 2 === 0 || Math.random() < 0.3)) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-team-growth',
    );

    if (!alreadyPending) {
      const baseEngSalary = 3500 + Math.floor(Math.random() * 1500);
      const baseGrowthSalary = 2500 + Math.floor(Math.random() * 1000);
      const engSalary = Math.round(baseEngSalary * salaryScale);
      const growthSalary = Math.round(baseGrowthSalary * salaryScale);
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: 'auto-team-growth',
        prompt: 'Your team needs to grow. Where should you invest?',
        options: [
          {
            id: `team-eng_2_${engSalary}`,
            label: 'Expand Engineering',
            description: `+2 engineers (~$${engSalary.toLocaleString()}/wk avg). Faster feature development.`,
            effects: [
              { path: 'company.reputation', operation: 'add', value: 1 },
            ],
          },
          {
            id: `team-growth_2_${growthSalary}`,
            label: 'Expand Sales & Marketing',
            description: `+2 growth team (~$${growthSalary.toLocaleString()}/wk avg). +$500/wk marketing spend.`,
            effects: [
              { path: 'finances.marketingSpend', operation: 'add', value: 500 },
            ],
          },
          {
            id: 'stay-lean',
            label: 'Stay Lean',
            description: 'Save cash and extend runway. No new hires.',
            effects: [],
          },
        ],
        deadline: week + 3,
        defaultOptionId: 'stay-lean',
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: 'auto-team-growth',
        title: 'Team Growth Decision',
        description: 'Time to decide how to grow the team.',
        category: 'team',
        decisionId,
      });
    }
  }

  // --- PRODUCT DECISIONS (every 2-3 weeks) ---
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

    if (unbuilt.length >= 2) {
      const shuffled = [...unbuilt].sort(() => Math.random() - 0.5);
      const featureA = shuffled[0];
      const featureB = shuffled[1];
      const relevanceA = 60 + Math.floor(Math.random() * 30);
      const relevanceB = 60 + Math.floor(Math.random() * 30);

      const nameA = featureA.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const nameB = featureB.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      const alreadyPending = state.pendingDecisions.some(
        (d) => d.eventId === 'auto-sprint-planning',
      );

      if (!alreadyPending) {
        const decisionId = generateId();

        newDecisions.push({
          id: decisionId,
          eventId: 'auto-sprint-planning',
          prompt: 'Sprint planning: what should the team build next?',
          options: [
            {
              id: `feature_${featureA}_${relevanceA}`,
              label: `Build ${nameA}`,
              description: `User-facing feature, relevance: ${relevanceA}%`,
              effects: [
                { path: 'company.reputation', operation: 'add', value: 1 },
              ],
            },
            {
              id: `feature_${featureB}_${relevanceB}`,
              label: `Build ${nameB}`,
              description: `Enterprise value, relevance: ${relevanceB}%`,
              effects: [
                { path: 'company.reputation', operation: 'add', value: 1 },
              ],
            },
            {
              id: 'fix-tech-debt',
              label: 'Pay Down Tech Debt',
              description: `Reduce tech debt by ~15 points and fix ~2 bugs (currently ${Math.round(state.product.techDebtTotal)}% debt, ${state.product.bugs} bugs)`,
              effects: [
                { path: 'product.techDebtTotal', operation: 'add', value: -15 },
                { path: 'product.bugs', operation: 'add', value: -2 },
              ],
            },
          ],
          deadline: week + 3,
          defaultOptionId: 'fix-tech-debt',
        });

        newLogEntries.push({
          id: generateId(),
          week,
          eventId: 'auto-sprint-planning',
          title: 'Sprint Planning',
          description: 'The team is ready for the next sprint.',
          category: 'product',
          decisionId,
        });
      }
    } else if (unbuilt.length === 1) {
      const feature = unbuilt[0];
      const relevance = 60 + Math.floor(Math.random() * 30);
      const featureName = feature.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      const alreadyPending = state.pendingDecisions.some(
        (d) => d.eventId === 'auto-sprint-planning',
      );

      if (!alreadyPending) {
        const decisionId = generateId();

        newDecisions.push({
          id: decisionId,
          eventId: 'auto-sprint-planning',
          prompt: 'Sprint planning: what should the team build next?',
          options: [
            {
              id: `feature_${feature}_${relevance}`,
              label: `Build ${featureName}`,
              description: `Customers are asking for it (relevance: ${relevance}%)`,
              effects: [
                { path: 'company.reputation', operation: 'add', value: 1 },
              ],
            },
            {
              id: 'fix-tech-debt',
              label: 'Pay Down Tech Debt',
              description: `Reduce tech debt by ~15 points and fix ~2 bugs (currently ${Math.round(state.product.techDebtTotal)}% debt, ${state.product.bugs} bugs)`,
              effects: [
                { path: 'product.techDebtTotal', operation: 'add', value: -15 },
                { path: 'product.bugs', operation: 'add', value: -2 },
              ],
            },
          ],
          deadline: week + 3,
          defaultOptionId: 'fix-tech-debt',
        });

        newLogEntries.push({
          id: generateId(),
          week,
          eventId: 'auto-sprint-planning',
          title: 'Sprint Planning',
          description: 'The team is ready for the next sprint.',
          category: 'product',
          decisionId,
        });
      }
    }
  }

  // --- STRATEGY DECISIONS (every 6-8 weeks) ---
  if (week > 4 && (week % 6 === 0 || (week % 8 === 0))) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-board-meeting',
    );

    if (!alreadyPending) {
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: 'auto-board-meeting',
        prompt: 'Board meeting: investors want to discuss direction.',
        options: [
          {
            id: 'strategy_growth-hack',
            label: 'Go Aggressive',
            description: '2x marketing spend, +reputation, higher burn rate.',
            effects: [
              { path: 'finances.marketingSpend', operation: 'multiply', value: 2 },
              { path: 'company.reputation', operation: 'add', value: 3 },
            ],
          },
          {
            id: 'strategy_sustainable',
            label: 'Focus on Profitability',
            description: 'Cut marketing, reduce churn, lower burn.',
            effects: [
              { path: 'finances.marketingSpend', operation: 'multiply', value: 0.5 },
              { path: 'product.churnRate', operation: 'multiply', value: 0.8 },
            ],
          },
          {
            id: 'strategy_quality-first',
            label: 'Double Down on Product',
            description: 'Boost product quality, slower growth.',
            effects: [
              { path: 'product.overallQuality', operation: 'add', value: 5 },
              { path: 'company.culture', operation: 'add', value: 3 },
            ],
          },
        ],
        deadline: week + 4,
        defaultOptionId: 'strategy_sustainable',
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: 'auto-board-meeting',
        title: 'Board Meeting',
        description: 'Time to set company direction.',
        category: 'market',
        decisionId,
      });
    }
  }

  // --- AI AGENT DECISIONS (every 5-6 weeks, after week 3) ---
  if (week > 3 && (week % 5 === 0 || Math.random() < 0.15)) {
    const providers = [
      { name: 'OpenAI', cost: 500, capability: 75, reliability: 80 },
      { name: 'Anthropic', cost: 600, capability: 80, reliability: 85 },
      { name: 'Google DeepMind', cost: 450, capability: 70, reliability: 75 },
      { name: 'Mistral', cost: 300, capability: 60, reliability: 70 },
      { name: 'Cohere', cost: 250, capability: 55, reliability: 72 },
    ];
    const agentTypes: AIAgentType[] = [
      'coding', 'design', 'marketing', 'analytics', 'support',
    ];
    const provider = providers[Math.floor(Math.random() * providers.length)];
    const agentType = agentTypes[Math.floor(Math.random() * agentTypes.length)];
    const typeLabel = agentType.charAt(0).toUpperCase() + agentType.slice(1);

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
              { path: 'finances.cash', operation: 'add', value: -provider.cost * 2 },
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

  // --- Task 8: LAYOFF DECISIONS (when finances are critical) ---
  const weeklyBurn = state.finances.weeklyBurn > 0 ? state.finances.weeklyBurn : calculateWeeklyBurn(state);
  const weeksOfCash = weeklyBurn > 0 ? state.finances.cash / weeklyBurn : Infinity;
  if (state.team.teamSize > 1 && weeklyBurn > state.finances.weeklyRevenue * 2 && weeksOfCash < 12) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-layoff-crisis',
    );

    if (!alreadyPending) {
      const layoffCount = Math.max(1, Math.floor(state.team.teamSize * 0.3));
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: 'auto-layoff-crisis',
        prompt: `Cash crisis: burn ($${weeklyBurn.toLocaleString()}/wk) far exceeds revenue ($${Math.round(state.finances.weeklyRevenue).toLocaleString()}/wk) with only ${Math.round(weeksOfCash)} weeks of runway. What do you do?`,
        options: [
          {
            id: `layoff_${layoffCount}`,
            label: `Lay Off ${layoffCount} People`,
            description: `Reduce team by 30%. Devastating for morale but extends runway.`,
            effects: [
              { path: 'team.morale', operation: 'add', value: -15 },
              { path: 'company.reputation', operation: 'add', value: -10 },
              { path: 'company.culture', operation: 'add', value: -10 },
            ],
          },
          {
            id: 'salary-cut',
            label: 'Cut Salaries 20%',
            description: 'Everyone takes a pay cut. Cheaper than layoffs.',
            effects: [
              { path: 'team.morale', operation: 'add', value: -8 },
              { path: 'team.avgSalary', operation: 'multiply', value: 0.8 },
            ],
          },
          {
            id: 'stay-the-course',
            label: 'Stay the Course',
            description: 'Hope for a miracle. Revenue might pick up.',
            effects: [],
          },
        ],
        deadline: week + 2,
        defaultOptionId: 'stay-the-course',
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: 'auto-layoff-crisis',
        title: 'Financial Crisis',
        description: 'Your burn rate is unsustainable. Hard decisions are needed.',
        category: 'team',
        decisionId,
      });
    }
  }

  // --- Task 8: SALARY PRESSURE (when morale < 40 for 4+ weeks) ---
  if ((state.meta.lowMoraleWeeks ?? 0) >= 4 && state.team.teamSize > 0) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-salary-demand',
    );

    if (!alreadyPending) {
      const raiseAmount = Math.round(state.team.avgSalary * 0.15);
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: 'auto-salary-demand',
        prompt: `Your team has been unhappy for weeks. They're demanding a 15% raise (~$${raiseAmount.toLocaleString()}/wk per person).`,
        options: [
          {
            id: 'grant-raise',
            label: 'Grant Full Raise',
            description: `+15% salary. +10 morale.`,
            effects: [
              { path: 'team.avgSalary', operation: 'multiply', value: 1.15 },
              { path: 'team.morale', operation: 'add', value: 10 },
            ],
          },
          {
            id: 'partial-raise',
            label: 'Partial Raise (8%)',
            description: 'Compromise. +5 morale.',
            effects: [
              { path: 'team.avgSalary', operation: 'multiply', value: 1.08 },
              { path: 'team.morale', operation: 'add', value: 5 },
            ],
          },
          {
            id: 'refuse-raise',
            label: 'Refuse',
            description: 'Hold the line. -10 morale, risk losing someone.',
            effects: [
              { path: 'team.morale', operation: 'add', value: -10 },
            ],
          },
        ],
        deadline: week + 2,
        defaultOptionId: 'partial-raise',
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: 'auto-salary-demand',
        title: 'Team Demands Raise',
        description: 'Prolonged low morale has led to a salary ultimatum.',
        category: 'team',
        decisionId,
      });
    }
  }

  // --- Task 9: MARKETING BUDGET DECISIONS (every 4 weeks) ---
  if (week > 2 && week % 4 === 0) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-marketing-budget',
    );

    if (!alreadyPending) {
      const currentSpend = state.finances.marketingSpend;
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: 'auto-marketing-budget',
        prompt: `Marketing budget review. Currently spending $${currentSpend.toLocaleString()}/week on marketing.`,
        options: [
          {
            id: 'increase-marketing',
            label: 'Increase Budget (+$1,000/wk)',
            description: 'More customer growth, higher burn.',
            effects: [
              { path: 'finances.marketingSpend', operation: 'add', value: 1000 },
            ],
          },
          {
            id: 'decrease-marketing',
            label: 'Decrease Budget (-$500/wk)',
            description: 'Save money, slower growth.',
            effects: [
              { path: 'finances.marketingSpend', operation: 'add', value: -500 },
            ],
          },
          {
            id: 'viral-campaign',
            label: 'Launch Viral Campaign ($5K)',
            description: 'One-time spend for a big customer boost. 20% chance of PR disaster.',
            effects: [
              { path: 'finances.cash', operation: 'add', value: -5000 },
            ],
          },
          {
            id: 'keep-marketing',
            label: 'Keep Current Budget',
            description: 'No changes.',
            effects: [],
          },
        ],
        deadline: week + 3,
        defaultOptionId: 'keep-marketing',
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: 'auto-marketing-budget',
        title: 'Marketing Budget Review',
        description: 'Time to review your marketing spend.',
        category: 'market',
        decisionId,
      });
    }
  }

  // --- PARTNERSHIP OPPORTUNITIES (every 8-10 weeks after week 5) ---
  if (week > 5 && (week % 8 === 0 || (week % 10 === 0 && Math.random() < 0.4))) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-partnership',
    );

    if (!alreadyPending) {
      const partners = [
        { name: 'AWS', benefit: 'cloud-credits', desc: '$50K in cloud credits, +5 reputation', cashBonus: 50000, repBonus: 5 },
        { name: 'Y Combinator', benefit: 'accelerator', desc: 'Mentorship, network boost, +10 reputation', cashBonus: 25000, repBonus: 10 },
        { name: 'Microsoft', benefit: 'enterprise-access', desc: 'Enterprise customer pipeline, +3 reputation', cashBonus: 0, repBonus: 3 },
        { name: 'Stripe', benefit: 'payments', desc: 'Reduced payment fees, +$20K credits', cashBonus: 20000, repBonus: 2 },
      ];
      const partner = partners[Math.floor(Math.random() * partners.length)];
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: 'auto-partnership',
        prompt: `${partner.name} wants to partner with you. ${partner.desc}.`,
        options: [
          {
            id: `partner_accept_${partner.name}`,
            label: `Partner with ${partner.name}`,
            description: partner.desc,
            effects: [
              { path: 'finances.cash', operation: 'add', value: partner.cashBonus },
              { path: 'company.reputation', operation: 'add', value: partner.repBonus },
            ],
          },
          {
            id: 'partner_decline',
            label: 'Decline',
            description: 'Stay independent. No strings attached.',
            effects: [],
          },
        ],
        deadline: week + 3,
        defaultOptionId: 'partner_decline',
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: 'auto-partnership',
        title: `Partnership Offer: ${partner.name}`,
        description: `${partner.name} reached out about a partnership.`,
        category: 'market',
        decisionId,
      });
    }
  }

  // --- TALENT OPPORTUNITY (random, every ~6 weeks, only if you can afford it) ---
  if (week > 6 && Math.random() < 0.15 && state.finances.cash > 40000) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-talent-opportunity',
    );

    if (!alreadyPending) {
      const candidates = [
        { role: 'Ex-Google engineer', salary: Math.round(5000 * salaryScale), skill: 'engineering', moraleBoost: 3 },
        { role: 'Growth hacker from Uber', salary: Math.round(4500 * salaryScale), skill: 'growth', moraleBoost: 2 },
        { role: 'Stanford AI researcher', salary: Math.round(6000 * salaryScale), skill: 'AI', moraleBoost: 5 },
        { role: 'Serial entrepreneur (COO)', salary: Math.round(5500 * salaryScale), skill: 'operations', moraleBoost: 4 },
      ];
      const candidate = candidates[Math.floor(Math.random() * candidates.length)];
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: 'auto-talent-opportunity',
        prompt: `A ${candidate.role} is interested in joining! They want $${candidate.salary.toLocaleString()}/wk.`,
        options: [
          {
            id: `hire_1_${candidate.salary}`,
            label: `Hire (${candidate.role})`,
            description: `$${candidate.salary.toLocaleString()}/wk + $${(candidate.salary * 2).toLocaleString()} signing bonus. Morale +${candidate.moraleBoost}.`,
            effects: [
              { path: 'team.morale', operation: 'add', value: candidate.moraleBoost },
              { path: 'company.reputation', operation: 'add', value: 2 },
            ],
          },
          {
            id: 'pass-talent',
            label: 'Pass',
            description: 'Not the right time to hire.',
            effects: [],
          },
        ],
        deadline: week + 2,
        defaultOptionId: 'pass-talent',
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: 'auto-talent-opportunity',
        title: `Talent: ${candidate.role}`,
        description: `A strong candidate wants to join your team.`,
        category: 'team',
        decisionId,
      });
    }
  }

  // --- FUNDING PROMPT (when valuation grows and no funding yet) ---
  if (week > 6 && state.finances.fundingHistory.length === 0 && state.product.customers > 5) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-funding-prompt',
    );
    const alreadyTriggered = state.eventLog.some(
      (e) => e.eventId === 'auto-funding-prompt',
    );

    if (!alreadyPending && !alreadyTriggered) {
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: 'auto-funding-prompt',
        prompt: 'Your startup has traction! Have you thought about raising money?',
        options: [
          {
            id: 'seek-funding-now',
            label: 'Seek Pre-Seed Funding',
            description: 'Pitch to investors. Could get $250K-500K.',
            effects: [],
          },
          {
            id: 'bootstrap',
            label: 'Keep Bootstrapping',
            description: 'Grow with your own money. Stay in control.',
            effects: [{ path: 'company.reputation', operation: 'add', value: 1 }],
          },
        ],
        deadline: week + 4,
        defaultOptionId: 'bootstrap',
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: 'auto-funding-prompt',
        title: 'Time to Raise?',
        description: 'You have traction. Investors might be interested.',
        category: 'funding',
        decisionId,
      });
    }
  }

  // --- Task 11: BUBBLE EMERGENCY DECISION (bubble < 15 with funding) ---
  const hasFunding = state.finances.fundingHistory.length > 0;
  if (state.market.bubbleIndex < 15 && hasFunding) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-bubble-emergency',
    );

    if (!alreadyPending) {
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: 'auto-bubble-emergency',
        prompt: 'The bubble has popped. Investors are panicking. You need to make a survival decision NOW.',
        options: [
          {
            id: 'down-round',
            label: 'Take a Down Round',
            description: '50% dilution to survive. Painful but keeps you alive.',
            effects: [
              { path: 'finances.founderEquity', operation: 'multiply', value: 0.5 },
              { path: 'finances.cash', operation: 'add', value: 500000 },
              { path: 'company.reputation', operation: 'add', value: -10 },
            ],
          },
          {
            id: 'pivot-to-profit',
            label: 'Pivot to Profitability',
            description: 'Cut costs ruthlessly, focus on revenue. Hard but independent.',
            effects: [
              { path: 'team.morale', operation: 'add', value: -10 },
              { path: 'finances.marketingSpend', operation: 'set', value: 0 },
              { path: 'product.churnRate', operation: 'multiply', value: 0.8 },
            ],
          },
          {
            id: 'shutdown',
            label: 'Shut Down',
            description: 'Return remaining cash to investors. It\'s over.',
            effects: [],
          },
        ],
        deadline: week + 1,
        defaultOptionId: 'pivot-to-profit',
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: 'auto-bubble-emergency',
        title: 'Bubble Burst Emergency',
        description: 'The AI bubble has popped. Your survival is at stake.',
        category: 'market',
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
  next = simulateTeamAttrition(next);
  next = simulateStageProgression(next);
  next = generateAutoDecisions(next);
  return next;
}
