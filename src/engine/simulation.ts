import type { GameState, Feature, Competitor, EventLogEntry, PendingDecision, CertificationProgress } from '../types/index.ts';
import { calculateWeeklyBurn, calculatePMF, calculateCurrentPricingTier } from './derived.ts';
import { generateId } from '../utils/id.ts';
import { CERTIFICATION_DEFS, PRICING_TIERS, getAvailableCertifications, getScaledCertCost } from '../data/compliance.ts';

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
    const baseTargetQuality = clamp(30 + state.team.teamSize * 5 + designAgentBonus, 30, 85);
    let targetQuality = baseTargetQuality * clamp(qualityMultiplier * focusQualityMultiplier + founderQualityBonus * 0.3, 0.5, 1.5);

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
      customers,
    },
    eventLog: [...state.eventLog, ...newLogEntries],
  };
}

// ─── Revenue ──────────────────────────────────────────────────────────

function simulateRevenue(state: GameState): GameState {
  // Floor at 0.15 so paying customers always generate some revenue even before
  // features ship (overallQuality starts at 0 until a feature reaches 100%).
  const qualityModifier = Math.max(0.15, state.product.overallQuality / 100);
  const bugPenalty = Math.max(0, 1 - state.product.bugs * 0.02);
  const customers = state.product.customers;
  const pricePerUnit = state.finances.pricePerUnit;
  let revenue = 0;

  // Price sensitivity for usage-based pricing: customers use less at higher prices.
  // Subscriptions are predictable — price impact is handled by churn/acquisition instead.
  const segmentDefault = state.market.segmentData.defaultPrice;
  const priceSensitivity = state.market.segmentData.priceSensitivity;
  const priceRatio = segmentDefault > 0 ? pricePerUnit / segmentDefault : 1;
  const priceEfficiency = priceRatio <= 1
    ? 1 - (1 - priceRatio) * priceSensitivity * 0.3
    : 1 / (1 + Math.log(priceRatio) * priceSensitivity);

  switch (state.finances.pricingModel) {
    case 'subscription':
      // Subscription revenue is predictable: every subscriber pays the fixed price.
      // Quality/bugs affect churn (customers leaving), not per-customer revenue.
      revenue = customers * pricePerUnit;
      break;

    case 'usage-based': {
      // Usage-based: low quality → less engagement → less usage → less revenue.
      const activityMultiplier = qualityModifier;
      const weeklyNoise = 1 + (Math.random() - 0.5) * 0.15;
      revenue = customers * pricePerUnit * activityMultiplier * bugPenalty * weeklyNoise * priceEfficiency;
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
  const totalBurn = calculateWeeklyBurn(state);
  const marketingPortion = state.finances.marketingSpend ?? 0;
  const operationalBurn = totalBurn - marketingPortion;

  const strategy = state.meta.growthStrategy;
  let burnMultiplier = 1.0;
  if (strategy === 'growth-hack') {
    burnMultiplier = 1.2;
  } else if (strategy === 'sustainable') {
    burnMultiplier = 0.85;
  }

  const burn = Math.round(operationalBurn * burnMultiplier + marketingPortion);
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

  // Market size grows each week based on annual growth rate
  const updatedSegmentData = {
    ...state.market.segmentData,
    size: state.market.segmentData.size * (1 + state.market.segmentData.growthRate / 52),
  };

  let bubbleShock = 0;
  if (Math.random() < 0.03) {
    bubbleShock = (Math.random() < 0.5 ? 1 : -1) * rand(5, 12);
  }

  const bubbleNoise = rand(-2, 2);
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
    // High bubble: euphoria — investors are generous, talent is hot
    newInvestorSentiment = clamp(newInvestorSentiment + rand(2, 5), 0, 100);
    newTalentHeat = clamp(newTalentHeat + rand(1, 3), 0, 100);
    // Competitors thrive in high bubble — no death boost
  }

  if (newBubbleIndex < 25) {
    // Bubble popping: competitors run out of funding and die
    newInvestorSentiment = clamp(newInvestorSentiment - rand(2, 5), 0, 100);
    newTalentHeat = clamp(newTalentHeat - rand(2, 4), 0, 100);
    competitorDeathBoost = 0.04;
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

  // Player market pressure: as the player grows, competitors gradually lose share
  const annualRevPerCust = updatedSegmentData.revenuePerCustomer * 52;
  const totalMarketCust = annualRevPerCust > 0
    ? updatedSegmentData.size / annualRevPerCust
    : 1;
  const playerShare = totalMarketCust > 0
    ? state.product.customers / totalMarketCust
    : 0;

  if (playerShare > 0.005) {
    const aliveComps = updatedCompetitors.filter(c => c.alive);
    const compTotal = aliveComps.reduce((s, c) => s + c.marketShare, 0);
    if (compTotal > 0) {
      const pressureFactor = Math.min(0.02, playerShare * 0.1);
      for (const comp of updatedCompetitors) {
        if (!comp.alive) continue;
        const qualityGap = Math.max(0, state.product.overallQuality - comp.productQuality) / 100;
        const basePressure = pressureFactor * (comp.marketShare / compTotal);
        const loss = basePressure * (1 + qualityGap);
        comp.marketShare = clamp(comp.marketShare - loss, 0.005, 1);
      }
    }
  }

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

  // Normalize competitor market shares so they don't exceed 1.0 total
  const aliveComps = updatedCompetitors.filter(c => c.alive);
  const totalShare = aliveComps.reduce((s, c) => s + c.marketShare, 0);
  if (totalShare > 0.95) {
    const scaleFactor = 0.90 / totalShare;
    for (const comp of updatedCompetitors) {
      if (comp.alive) {
        comp.marketShare = Math.round(comp.marketShare * scaleFactor * 1000) / 1000;
      }
    }
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
      segmentData: updatedSegmentData,
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

  // Sync individual member morale toward team morale (drift by 20% per week)
  const updatedMembers = state.team.members?.map(m => ({
    ...m,
    morale: clamp(Math.round(m.morale + (newMorale - m.morale) * 0.2), 0, 100),
  }));

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
      members: updatedMembers ?? state.team.members,
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

  const memberCount = state.team.members?.length ?? state.team.teamSize;
  lostCount = Math.min(memberCount, lostCount);

  const newMembers = (state.team.members ?? []).slice(0, -lostCount);
  const newSize = newMembers.length;
  const newAvg = newSize > 0 ? Math.round(newMembers.reduce((s, m) => s + m.salary, 0) / newSize) : 0;

  return {
    ...state,
    team: {
      ...state.team,
      members: newMembers,
      teamSize: newSize,
      avgSalary: newAvg,
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

  // Segment-specific growth: consumer segments grow faster, enterprise slower
  const segmentGrowthBase = state.market.segmentData.customerGrowthRate;
  // Price sensitivity affects growth — higher prices slow acquisition in price-sensitive segments
  const priceGrowthPenalty = state.finances.pricePerUnit > state.market.segmentData.defaultPrice
    ? 1 / (1 + Math.log(state.finances.pricePerUnit / state.market.segmentData.defaultPrice) * state.market.segmentData.priceSensitivity * 0.5)
    : 1 + (1 - state.finances.pricePerUnit / Math.max(1, state.market.segmentData.defaultPrice)) * state.market.segmentData.priceSensitivity * 0.3;
  // Tier-relative pricing: pricing at the low end of your tier boosts growth,
  // pricing at the high end slightly penalizes it. Range: 0.85 (top) to 1.20 (bottom).
  const currentTier = calculateCurrentPricingTier(state);
  const currentTierDef = PRICING_TIERS.find((t) => t.tier === currentTier)!;
  const tierMin = state.market.segmentData.defaultPrice * currentTierDef.priceMultiplierMin;
  const tierMax = state.market.segmentData.defaultPrice * currentTierDef.priceMultiplierMax;
  const tierRange = tierMax - tierMin;
  const tierPosition = tierRange > 0
    ? clamp((state.finances.pricePerUnit - tierMin) / tierRange, 0, 1)
    : 0.5; // middle if range is 0
  // 0 (bottom of tier) → 1.20 growth boost, 1 (top of tier) → 0.85 growth penalty
  const tierPriceGrowthMultiplier = 1.20 - tierPosition * 0.35;

  const pricingGrowthBonus = state.finances.pricingModel === 'subscription' ? 0.8
    : state.finances.pricingModel === 'usage-based' ? 1.2
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

  // Segment-specific base churn + pricing adjustment
  const segmentBaseChurn = state.market.segmentData.baseChurnRate;
  const pricingChurnAdjust = state.finances.pricingModel === 'subscription' ? -0.01 : 0.01;
  // Overpricing increases churn in price-sensitive segments
  const priceChurnPenalty = state.finances.pricePerUnit > state.market.segmentData.defaultPrice
    ? Math.log(state.finances.pricePerUnit / state.market.segmentData.defaultPrice) * state.market.segmentData.priceSensitivity * 0.03
    : 0;
  const pricingBaseChurn = segmentBaseChurn + pricingChurnAdjust + priceChurnPenalty;

  const calculatedChurn = clamp(
    (pricingBaseChurn + qualityBonus + bugPenalty + competitorPull - supportBonus - channelChurnReduction) * diffMods.churnMultiplier,
    0.01,
    0.25,
  );
  // Preserve decision-driven churn adjustments by taking the min of
  // calculated churn and any decision-modified churn rate
  const decisionChurn = state.product.churnRate;
  const effectiveChurn = decisionChurn > 0 && decisionChurn < calculatedChurn
    ? (calculatedChurn + decisionChurn) / 2  // blend to preserve decision influence
    : calculatedChurn;
  const churned = currentCustomers * effectiveChurn;

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
      userGrowthBonus * channelGrowthMultiplier * segmentGrowthBase * Math.max(0.2, priceGrowthPenalty) * tierPriceGrowthMultiplier + channelExtraCustomers;

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
  // AI agents count at 25% — you can't stage up with just bots
  const teamSize = state.team.teamSize + Math.floor(state.team.aiAgents.length * 0.25);
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
      // Require seed funding OR strong bootstrapped metrics
      if (valuation > 2_000_000 && teamSize > 5 && (state.finances.fundingHistory.some(r => r.stage === 'seed') || revenue > 2000)) {
        newStage = 'seed';
      }
      break;
    case 'seed':
      // Require series-a funding OR profitable with real traction
      if (valuation > 10_000_000 && revenue > 0 && teamSize > 10 && (state.finances.fundingHistory.some(r => r.stage === 'series-a') || revenue > 5000)) {
        newStage = 'series-a';
      }
      break;
    case 'series-a':
      // Use revenue threshold instead of raw customer count
      // so enterprise segments (fewer high-value customers) aren't blocked
      if (valuation > 50_000_000 && (customers > 200 || revenue > 10_000)) {
        newStage = 'series-b';
      }
      break;
    case 'series-b':
      if (valuation > 200_000_000) {
        newStage = 'series-c';
      }
      break;
    case 'series-c':
      if (valuation > 300_000_000) {
        newStage = 'series-d';
      }
      break;
    case 'series-d':
      if (valuation > 800_000_000) {
        newStage = 'series-e';
      }
      break;
    case 'series-e':
      if (valuation > 2_000_000_000) {
        newStage = 'series-f';
      }
      break;
    case 'series-f':
      if (valuation > 5_000_000_000) {
        newStage = 'growth';
      }
      break;
    case 'growth':
      if (valuation > 10_000_000_000) {
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

  // (auto-first-feature and auto-sprint-planning removed — features are built
  // through the Company screen, not forced via decisions)

  // --- STRATEGY DECISIONS (every 6-8 weeks) ---
  if (week > 4 && week % 7 === 0) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-board-meeting',
    );

    if (!alreadyPending) {
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: 'auto-board-meeting',
        prompt: 'The board wants a strategy update. Your lead investor just texted "we need to talk" which is never good.',
        options: [
          {
            id: 'strategy_growth-hack',
            label: 'Pivot to AI (Again)',
            description: 'Slap "AI-powered" on everything. 2x marketing spend, +reputation with VCs who don\'t know better.',
            effects: [
              { path: 'finances.marketingSpend', operation: 'multiply', value: 2 },
              { path: 'company.reputation', operation: 'add', value: 3 },
            ],
          },
          {
            id: 'strategy_sustainable',
            label: 'Actually Try to Make Money',
            description: 'Revolutionary concept: spend less than you earn. Cut marketing, reduce churn.',
            effects: [
              { path: 'finances.marketingSpend', operation: 'multiply', value: 0.5 },
              { path: 'product.churnRate', operation: 'multiply', value: 0.8 },
            ],
          },
          {
            id: 'strategy_quality-first',
            label: 'Ship Something That Works',
            description: 'Radical idea: fix bugs before adding features. +5 quality, +3 culture. Your engineers will cry tears of joy.',
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
        description: 'Your investors want to "align on strategy," which means they want you to grow faster while spending less.',
        category: 'market',
        decisionId,
      });
    }
  }

  // --- (Removed) AI agent decisions — agents are now hired directly from the Team Screen ---

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
            description: 'Hope for a miracle. Team sees you ignoring the crisis. -5 morale.',
            effects: [
              { path: 'team.morale', operation: 'add', value: -5 },
            ],
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

  // --- PARTNERSHIP OPPORTUNITIES (every 8-10 weeks after week 5, max 3 total) ---
  const partnershipCount = state.eventLog.filter(e => e.eventId === 'auto-partnership').length;
  if (week > 5 && partnershipCount < 3 && (week % 8 === 0 || (week % 10 === 0 && Math.random() < 0.4))) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-partnership',
    );

    if (!alreadyPending) {
      const allPartners = [
        { name: 'AWS', benefit: 'cloud-credits', desc: '$50K in cloud credits. First taste is free — the addiction comes later. +5 reputation', cashBonus: 50000, repBonus: 5 },
        { name: 'Google Cloud', benefit: 'cloud-credits', desc: '$40K in GCP credits and a "startup partner" badge for your website. +4 reputation', cashBonus: 40000, repBonus: 4 },
        { name: 'Microsoft', benefit: 'enterprise-access', desc: 'Enterprise customer pipeline. Your product will be buried somewhere in Microsoft Teams where no one will find it. +3 reputation', cashBonus: 0, repBonus: 3 },
        { name: 'Stripe', benefit: 'payments', desc: 'Stripe takes 2.9% of your dreams, but at least the API is nice. +$20K credits', cashBonus: 20000, repBonus: 2 },
      ];
      // Filter out partners already accepted
      const acceptedPartners = state.eventLog
        .filter(e => e.eventId === 'auto-partnership' && e.resolvedOptionId?.startsWith('partner_accept'))
        .map(e => e.resolvedOptionId?.replace('partner_accept_', ''));
      const partners = allPartners.filter(p => !acceptedPartners.includes(p.name));
      if (partners.length === 0) return state;
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

  // --- FOUNDER LIFE DECISIONS (random funny events every 2-4 weeks) ---
  if (week > 2 && Math.random() < 0.4) {
    const founderEvents = [
      {
        eventId: 'auto-founder-pitch-deck',
        prompt: 'Your co-founder spent the entire weekend redesigning the pitch deck instead of shipping features. It does have really nice gradients now.',
        options: [
          { id: 'pitch-approve', label: 'It\'s Beautiful, Ship It', description: 'The gradients ARE really nice. Investors love design. +3 reputation, -1 week of eng productivity.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 3 }, { path: 'product.techDebtTotal', operation: 'add' as const, value: 2 }] },
          { id: 'pitch-reject', label: 'Back to Coding', description: 'Pitch decks don\'t write code. Neither does your co-founder, apparently. +2 quality.', effects: [{ path: 'product.overallQuality', operation: 'add' as const, value: 2 }] },
          { id: 'pitch-hire', label: 'Hire a Designer', description: 'Maybe if someone else handles the pixels, your co-founder will write actual code. -$2K.', effects: [{ path: 'finances.cash', operation: 'add' as const, value: -2000 }, { path: 'company.reputation', operation: 'add' as const, value: 2 }] },
        ],
        log: { title: 'Pitch Deck Perfectionism', description: 'The pitch deck has been redesigned for the 14th time.', category: 'product' as const },
      },
      {
        eventId: 'auto-founder-twitter',
        prompt: 'A tech influencer with 500K followers just roasted your product on Twitter. The thread is going viral. Your DMs are a war zone.',
        options: [
          { id: 'twitter-clap-back', label: 'Clap Back Publicly', description: 'Ratio them. High risk, high reward. Could go viral in a good way or become a meme. ±5 reputation.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: Math.random() > 0.5 ? 5 : -5 }] },
          { id: 'twitter-ignore', label: 'Touch Grass', description: 'Close Twitter. Go for a walk. The internet has a 48-hour memory anyway.', effects: [{ path: 'team.morale', operation: 'add' as const, value: 2 }] },
          { id: 'twitter-dm', label: 'DM Them Free Access', description: 'Turn a hater into an advocate. The influencer playbook. +3 reputation, -$1K in credits.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 3 }, { path: 'finances.cash', operation: 'add' as const, value: -1000 }] },
        ],
        log: { title: 'Twitter Drama', description: 'Someone with too many followers has opinions about your product.', category: 'market' as const },
      },
      {
        eventId: 'auto-founder-vc-coffee',
        prompt: 'A VC partner wants to "grab coffee and learn more about your space." Translation: free consulting disguised as networking.',
        options: [
          { id: 'vc-go', label: 'Take the Meeting', description: 'Spend 3 hours preparing, 1 hour talking, get a "let\'s stay in touch" email. +2 reputation, lose a day.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 2 }, { path: 'product.techDebtTotal', operation: 'add' as const, value: 1 }] },
          { id: 'vc-skip', label: 'Politely Decline', description: '"My calendar is packed this quarter." They\'ll respect the hustle. Or forget you exist.', effects: [{ path: 'product.overallQuality', operation: 'add' as const, value: 1 }] },
          { id: 'vc-reverse', label: 'Reverse-Pitch Them', description: 'Show up with a term sheet. Power move. Either genius or delusional. +5 reputation if it works.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 5 }] },
        ],
        log: { title: 'VC Coffee Chat', description: 'A venture capitalist wants to "pick your brain." Your brain has been picked enough.', category: 'funding' as const },
      },
      {
        eventId: 'auto-founder-imposter',
        prompt: 'You just saw your competitor\'s Series B announcement on TechCrunch. They raised $40M. You\'re eating ramen. Imposter syndrome hits different today.',
        options: [
          { id: 'imposter-grind', label: 'Channel It Into Work', description: 'Nothing cures imposter syndrome like shipping features at 2 AM. +3 quality, -2 morale.', effects: [{ path: 'product.overallQuality', operation: 'add' as const, value: 3 }, { path: 'team.morale', operation: 'add' as const, value: -2 }] },
          { id: 'imposter-team', label: 'Rally the Team', description: '"They have money. We have conviction." Give a speech. +5 morale, +2 culture.', effects: [{ path: 'team.morale', operation: 'add' as const, value: 5 }, { path: 'company.culture', operation: 'add' as const, value: 2 }] },
          { id: 'imposter-stalk', label: 'Deep-Dive Their Product', description: 'Study the enemy. Their product is actually kind of mid. +2 reputation from competitive intel.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 2 }] },
        ],
        log: { title: 'Imposter Syndrome', description: 'Your competitor just raised more money than you\'ve ever seen in your life.', category: 'market' as const },
      },
      {
        eventId: 'auto-founder-conference',
        prompt: 'There\'s a huge AI conference next week. Tickets are $2,500. Everyone who\'s anyone will be there. Also everyone who\'s no one.',
        options: [
          { id: 'conf-attend', label: 'Attend & Network', description: 'Collect 200 business cards you\'ll never follow up on. +5 reputation, -$2,500.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 5 }, { path: 'finances.cash', operation: 'add' as const, value: -2500 }] },
          { id: 'conf-speak', label: 'Apply to Speak', description: 'Give a talk called "Scaling AI in Production" despite having 12 users. +8 reputation if accepted, -$2,500.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 8 }, { path: 'finances.cash', operation: 'add' as const, value: -2500 }] },
          { id: 'conf-skip', label: 'Skip It, Ship Instead', description: 'While everyone\'s networking, you\'re coding. Contrarian alpha. +3 quality.', effects: [{ path: 'product.overallQuality', operation: 'add' as const, value: 3 }] },
        ],
        log: { title: 'Conference FOMO', description: 'Another AI conference. Another opportunity to feel inadequate while wearing a lanyard.', category: 'market' as const },
      },
      {
        eventId: 'auto-founder-acquihire',
        prompt: 'A FAANG company just offered your lead engineer $450K/year to come work on "AI infrastructure." They\'re currently making $80K at your startup.',
        options: [
          { id: 'acqui-match', label: 'Counter-Offer with Equity', description: 'Promise them 1% equity. "This will be worth millions!" They\'ve heard that before. -2% equity, might keep them.', effects: [{ path: 'finances.founderEquity', operation: 'multiply' as const, value: 0.98 }, { path: 'team.morale', operation: 'add' as const, value: 3 }] },
          { id: 'acqui-speech', label: 'Give the Mission Speech', description: '"We\'re not building a product, we\'re changing the world." 50% chance they stay. +3 culture.', effects: [{ path: 'company.culture', operation: 'add' as const, value: 3 }, { path: 'team.morale', operation: 'add' as const, value: Math.random() > 0.5 ? 5 : -5 }] },
          { id: 'acqui-let-go', label: 'Wish Them Well', description: 'You can\'t compete with FAANG money. At least they\'ll refer candidates. -1 team size but +3 reputation.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 3 }, { path: 'team.morale', operation: 'add' as const, value: -5 }] },
        ],
        log: { title: 'FAANG Poaching', description: 'Big tech is waving big checks at your team again.', category: 'team' as const },
      },
      {
        eventId: 'auto-founder-pivotitis',
        prompt: 'Your advisor just sent a 3,000-word email about why you should pivot to B2B enterprise. Your other advisor says consumer is the future. They\'re both wrong.',
        options: [
          { id: 'pivot-b2b', label: 'Pivot to Enterprise', description: 'Longer sales cycles, bigger contracts, more meetings about meetings. +3 reputation with VCs.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 3 }, { path: 'product.churnRate', operation: 'multiply' as const, value: 0.9 }] },
          { id: 'pivot-stay', label: 'Stay the Course', description: 'Ignore the advice. They\'re advisors — advising is literally all they do. +2 culture for having conviction.', effects: [{ path: 'company.culture', operation: 'add' as const, value: 2 }] },
          { id: 'pivot-fire-advisor', label: 'Fire the Advisor', description: 'Remove them from the cap table while you\'re at it. Just kidding. Burn the bridge, gain peace of mind.', effects: [{ path: 'company.culture', operation: 'add' as const, value: 3 }, { path: 'founder.network', operation: 'add' as const, value: -5 }] },
        ],
        log: { title: 'Advisor Pivot Pressure', description: 'Everyone has an opinion about what you should be building. None of them are building it.', category: 'market' as const },
      },
      {
        eventId: 'auto-founder-hackernews',
        prompt: 'Someone posted your landing page on Hacker News. The comments are... a lot. "This is just a wrapper around GPT" has 847 upvotes.',
        options: [
          { id: 'hn-engage', label: 'Reply in the Thread', description: 'Explain your moat. They won\'t care but at least you tried. 50/50 it helps. ±3 reputation.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: Math.random() > 0.5 ? 3 : -3 }] },
          { id: 'hn-ignore', label: 'Close the Tab', description: 'HN comments are where dreams go to die. Protect your mental health. +2 morale.', effects: [{ path: 'team.morale', operation: 'add' as const, value: 2 }] },
          { id: 'hn-launch', label: 'Do a Proper Show HN', description: 'Launch with a detailed technical post. The nerds will respect the engineering. +5 reputation, +10 customers.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 5 }, { path: 'product.customers', operation: 'add' as const, value: 10 }] },
        ],
        log: { title: 'Hacker News Roast', description: 'The orange website has opinions about your startup.', category: 'market' as const },
      },
      {
        eventId: 'auto-founder-burnout',
        prompt: 'You\'ve worked 80-hour weeks for 3 months straight. Your eye is twitching. You forgot your mom\'s birthday. Your houseplant is dead.',
        options: [
          { id: 'burnout-vacation', label: 'Take a Week Off', description: 'Radical self-care. The startup will survive without you. Probably. +10 morale, lose a week of progress.', effects: [{ path: 'team.morale', operation: 'add' as const, value: 10 }, { path: 'product.techDebtTotal', operation: 'add' as const, value: 3 }] },
          { id: 'burnout-push', label: 'Push Through', description: '"I\'ll sleep when I\'m funded." This is fine. Everything is fine. -5 morale, +2 quality.', effects: [{ path: 'team.morale', operation: 'add' as const, value: -5 }, { path: 'product.overallQuality', operation: 'add' as const, value: 2 }] },
          { id: 'burnout-delegate', label: 'Learn to Delegate', description: 'Let the team handle things. It won\'t be done YOUR way, but it\'ll be done. +5 culture, +3 morale.', effects: [{ path: 'company.culture', operation: 'add' as const, value: 5 }, { path: 'team.morale', operation: 'add' as const, value: 3 }] },
        ],
        log: { title: 'Founder Burnout', description: 'The startup grind is grinding you down.', category: 'team' as const },
      },
      {
        eventId: 'auto-founder-copycat',
        prompt: 'A YC startup just launched with your EXACT same idea. Same landing page layout. Same tagline. Different font though, so legally distinct.',
        options: [
          { id: 'copy-outship', label: 'Outship Them', description: 'Move faster. Ship more. Be better. The best revenge is a better product. +3 quality, +2 morale.', effects: [{ path: 'product.overallQuality', operation: 'add' as const, value: 3 }, { path: 'team.morale', operation: 'add' as const, value: 2 }] },
          { id: 'copy-differentiate', label: 'Differentiate Hard', description: 'Pivot your positioning to something they can\'t copy. +5 reputation.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 5 }] },
          { id: 'copy-tweet', label: 'Subtweet Them', description: '"Interesting seeing our exact product with a different CSS theme." Tech Twitter will eat this up. ±5 reputation.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: Math.random() > 0.4 ? 5 : -5 }] },
        ],
        log: { title: 'Copycat Competitor', description: 'Imitation is the sincerest form of IP theft.', category: 'market' as const },
      },
      {
        eventId: 'auto-founder-tiktok',
        prompt: 'Your intern posted a "day in the life at a startup" TikTok. It went viral. 2M views. It shows your "office" which is a WeWork hot desk. The comments are brutal.',
        options: [
          { id: 'tiktok-lean-in', label: 'Lean Into It', description: 'Authenticity is the brand now. Post more behind-the-scenes chaos. +5 reputation, +15 customers.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 5 }, { path: 'product.customers', operation: 'add' as const, value: 15 }] },
          { id: 'tiktok-delete', label: 'Ask Them to Delete It', description: 'Too late. The internet already has screenshots. -2 morale (intern is upset).', effects: [{ path: 'team.morale', operation: 'add' as const, value: -2 }] },
          { id: 'tiktok-hire', label: 'Make Them Head of Content', description: 'This intern has more marketing instinct than your entire team. +3 reputation, +5 customers/week from content.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 3 }, { path: 'product.customers', operation: 'add' as const, value: 20 }] },
        ],
        log: { title: 'Viral TikTok', description: 'Your startup is famous on TikTok. This is either great or terrible.', category: 'market' as const },
      },
      {
        eventId: 'auto-founder-naming',
        prompt: 'Your domain name costs $15/year. A "brand consultant" is offering to help you rebrand for $25,000. They suggest changing from your current name to something ending in ".ai".',
        options: [
          { id: 'name-rebrand', label: 'Rebrand to .ai', description: 'Every serious AI company has a .ai domain. You ARE a serious AI company. Right? +3 reputation, -$25K.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 3 }, { path: 'finances.cash', operation: 'add' as const, value: -25000 }] },
          { id: 'name-keep', label: 'Keep the Name', description: 'Google started in a garage with a misspelled word. You\'re fine. +2 culture.', effects: [{ path: 'company.culture', operation: 'add' as const, value: 2 }] },
          { id: 'name-diy', label: 'DIY Rebrand', description: 'Buy the .ai domain for $50 and update the logo in Figma yourself. +1 reputation, -$50.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 1 }, { path: 'finances.cash', operation: 'add' as const, value: -50 }] },
        ],
        log: { title: 'Rebranding Pressure', description: 'Someone thinks your startup name isn\'t "AI enough."', category: 'product' as const },
      },
      {
        eventId: 'auto-founder-standup',
        prompt: 'Your daily standup has ballooned to 45 minutes. Half the team is on mute doing other work. Someone\'s cat walked across their keyboard and unmuted them.',
        options: [
          { id: 'standup-async', label: 'Switch to Async Updates', description: 'Slack threads instead of meetings. Engineers rejoice. +3 morale, +2 culture.', effects: [{ path: 'team.morale', operation: 'add' as const, value: 3 }, { path: 'company.culture', operation: 'add' as const, value: 2 }] },
          { id: 'standup-strict', label: 'Enforce 15-Min Max', description: 'Timer on screen. Hard cutoff. Brutal but effective. +1 quality from recovered eng time.', effects: [{ path: 'product.overallQuality', operation: 'add' as const, value: 1 }] },
          { id: 'standup-cancel', label: 'Cancel Standups Entirely', description: 'Meetings are where productivity goes to die. Ship faster. +5 morale, -2 culture (less alignment).', effects: [{ path: 'team.morale', operation: 'add' as const, value: 5 }, { path: 'company.culture', operation: 'add' as const, value: -2 }] },
        ],
        log: { title: 'Meeting Bloat', description: 'Your 15-minute standup has become a 45-minute therapy session.', category: 'team' as const },
      },
      {
        eventId: 'auto-founder-free-pizza',
        prompt: 'The team has been crunching hard. Do you order pizza for the office? (This is somehow a controversial decision in startup culture.)',
        options: [
          { id: 'pizza-fancy', label: 'Artisanal Pizza ($500)', description: 'Wood-fired, organic, locally-sourced. Because your startup has "culture." +5 morale, -$500.', effects: [{ path: 'team.morale', operation: 'add' as const, value: 5 }, { path: 'finances.cash', operation: 'add' as const, value: -500 }] },
          { id: 'pizza-dominos', label: 'Dominos ($50)', description: 'It\'s pizza. It does the job. Your engineers don\'t care about artisanal anything. +3 morale, -$50.', effects: [{ path: 'team.morale', operation: 'add' as const, value: 3 }, { path: 'finances.cash', operation: 'add' as const, value: -50 }] },
          { id: 'pizza-none', label: 'No Pizza, Ship Faster', description: '"We\'re not a pizza company, we\'re a tech company." -2 morale. You monster.', effects: [{ path: 'team.morale', operation: 'add' as const, value: -2 }] },
        ],
        log: { title: 'Pizza Diplomacy', description: 'The eternal startup question: is pizza a perk or a bribe?', category: 'team' as const },
      },
      {
        eventId: 'auto-founder-metrics',
        prompt: 'Your investor just asked for your "north star metric." You have 47 dashboards and none of them agree on anything. Your Mixpanel, Amplitude, and Google Analytics show three different user counts.',
        options: [
          { id: 'metrics-pick', label: 'Pick the Best-Looking Number', description: 'DAUs are up if you squint at the chart from the right angle. Technically not lying. +2 reputation.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: 2 }] },
          { id: 'metrics-fix', label: 'Actually Fix Analytics', description: 'Spend a week unfucking your event tracking. No features shipped, but at least you\'ll know your real numbers. +3 quality.', effects: [{ path: 'product.overallQuality', operation: 'add' as const, value: 3 }, { path: 'product.techDebtTotal', operation: 'add' as const, value: -5 }] },
          { id: 'metrics-vibes', label: '"We Track Vibes"', description: 'Tell your investor you\'re "pre-metrics." They\'ll either respect the honesty or never return your calls. ±3 reputation.', effects: [{ path: 'company.reputation', operation: 'add' as const, value: Math.random() > 0.5 ? 3 : -3 }] },
        ],
        log: { title: 'Metrics Crisis', description: 'Your analytics are a mess and your investor wants numbers.', category: 'product' as const },
      },
      {
        eventId: 'auto-founder-remote',
        prompt: 'Half your team wants to work from Bali. The other half wants a real office. You\'re currently operating out of a garage that smells like your roommate\'s cat.',
        options: [
          { id: 'remote-full', label: 'Go Fully Remote', description: 'Save on rent. Lose on whiteboard sessions. Everyone works in their pajamas. +3 morale, -1 culture.', effects: [{ path: 'team.morale', operation: 'add' as const, value: 3 }, { path: 'company.culture', operation: 'add' as const, value: -1 }] },
          { id: 'remote-office', label: 'Get a Real Office', description: 'WeWork it is. $3K/month but at least you have a "headquarters" for the pitch deck. +3 culture, -$3K.', effects: [{ path: 'company.culture', operation: 'add' as const, value: 3 }, { path: 'finances.cash', operation: 'add' as const, value: -3000 }] },
          { id: 'remote-hybrid', label: 'Hybrid (Please Everyone)', description: 'Tuesdays and Thursdays in person. Nobody is happy. The true startup compromise. +1 morale, +1 culture.', effects: [{ path: 'team.morale', operation: 'add' as const, value: 1 }, { path: 'company.culture', operation: 'add' as const, value: 1 }] },
        ],
        log: { title: 'Remote Work Debate', description: 'The where-should-we-work conversation that never ends.', category: 'team' as const },
      },
    ];

    // Pick a random event that isn't already pending
    const available = founderEvents.filter(
      (e) => !state.pendingDecisions.some((d) => d.eventId === e.eventId)
        && !newDecisions.some((d) => d.eventId === e.eventId)
    );

    if (available.length > 0) {
      const event = available[Math.floor(Math.random() * available.length)];
      const decisionId = generateId();

      newDecisions.push({
        id: decisionId,
        eventId: event.eventId,
        prompt: event.prompt,
        options: event.options,
        deadline: week + 1,
        defaultOptionId: event.options[1].id,
      });

      newLogEntries.push({
        id: generateId(),
        week,
        eventId: event.eventId,
        title: event.log.title,
        description: event.log.description,
        category: event.log.category,
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

// ─── Compliance Certification Progress ────────────────────────────────

function simulateCompliance(state: GameState): GameState {
  if (!state.compliance) return state;

  const difficulty = state.meta.difficulty;
  let certs = state.compliance.certifications.map((c) => ({ ...c }));
  const newLogEntries: EventLogEntry[] = [];
  let totalWeeklyCost = 0;

  for (let i = 0; i < certs.length; i++) {
    const cert = certs[i];
    if (cert.status !== 'in-progress') continue;

    const def = CERTIFICATION_DEFS[cert.id];
    const scaled = getScaledCertCost(def, difficulty);

    // Auto-pause if cash would go negative
    if (state.finances.cash - cert.weeklySpend < 0) {
      certs[i] = { ...cert, status: 'available', weeklySpend: 0 };
      newLogEntries.push({
        id: generateId(),
        week: state.meta.week,
        eventId: 'cert-paused-no-cash',
        title: `${def.name} Paused`,
        description: `${def.name} certification paused due to insufficient funds.`,
        category: 'product',
      });
      continue;
    }

    // Calculate progress based on expedite spending
    // effectiveWeeksPerTick = 1 + (extraSpend / baseWeeklyCost) * 0.5, capped at 2.0
    const baseWeekly = scaled.weeklyCost;
    const extraSpend = Math.max(0, cert.weeklySpend - baseWeekly);
    const effectiveWeeks = Math.min(2.0, 1 + (extraSpend / baseWeekly) * 0.5);

    const newWeeksRemaining = Math.max(0, cert.weeksRemaining - effectiveWeeks);
    const newTotalSpent = cert.totalSpent + cert.weeklySpend;
    totalWeeklyCost += cert.weeklySpend;

    if (newWeeksRemaining <= 0) {
      // Certification completed
      certs[i] = {
        ...cert,
        status: 'completed',
        weeksRemaining: 0,
        totalSpent: newTotalSpent,
        weekCompleted: state.meta.week,
        weeklySpend: 0,
      };

      newLogEntries.push({
        id: generateId(),
        week: state.meta.week,
        eventId: 'cert-completed',
        title: `${def.name} Certified!`,
        description: `${def.name} certification completed. ${def.flavorText}`,
        category: 'product',
      });

      // Reputation bonus for GDPR and AI Safety
      let reputationBonus = 0;
      if (cert.id === 'gdpr') reputationBonus = 3;
      if (cert.id === 'ai-safety-audit') reputationBonus = 2;
      if (reputationBonus > 0) {
        state = {
          ...state,
          company: {
            ...state.company,
            reputation: Math.min(100, state.company.reputation + reputationBonus),
          },
        };
      }

      // Regulatory heat reduction for AI Safety
      if (cert.id === 'ai-safety-audit') {
        state = {
          ...state,
          meta: {
            ...state.meta,
            regulatoryHeat: Math.max(0, state.meta.regulatoryHeat - 10),
          },
        };
      }
    } else {
      certs[i] = {
        ...cert,
        weeksRemaining: newWeeksRemaining,
        totalSpent: newTotalSpent,
      };
    }
  }

  // Unlock certs whose prerequisites are now met
  const completedIds = certs.filter((c) => c.status === 'completed').map((c) => c.id);
  const newlyAvailable = getAvailableCertifications(completedIds);
  certs = certs.map((c) => {
    if (c.status === 'locked' && newlyAvailable.includes(c.id)) {
      return { ...c, status: 'available' as CertificationProgress['status'] };
    }
    return c;
  });

  return {
    ...state,
    compliance: {
      certifications: certs,
      totalComplianceCost: state.compliance.totalComplianceCost + totalWeeklyCost,
    },
    eventLog: [...state.eventLog, ...newLogEntries],
  };
}

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
  next = simulateCompliance(next);
  next = simulateStageProgression(next);
  next = generateAutoDecisions(next);
  return next;
}
