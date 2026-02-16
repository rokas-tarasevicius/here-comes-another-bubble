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

  // Tech debt consequence: slows feature progress
  const techDebtTotal = state.product.techDebtTotal;
  let techDebtSlowdown = 1.0;
  if (techDebtTotal > 50) techDebtSlowdown = 0.8;
  if (techDebtTotal > 70) techDebtSlowdown = 0.6;
  if (techDebtTotal > 85) techDebtSlowdown = 0.4;

  // Count in-progress features to divide work among them
  const inProgressFeatures = state.product.features.filter(f => f.status === 'in-progress');
  const featureCount = Math.max(1, inProgressFeatures.length);

  // Human contribution: teamSize * morale/100 * 6 base points, divided across features
  const totalHumanProgress = (state.team.teamSize * (state.team.morale / 100) * 6) / featureCount;

  // AI contribution: agents contribute globally, divided across features
  const totalAiProgress = state.team.aiAgents.reduce(
    (sum, agent) => sum + (agent.capability * agent.reliability) / 10000 * 12,
    0,
  ) / featureCount;

  const totalAiTechDebt = state.team.aiAgents.reduce(
    (sum, agent) => sum + (100 - agent.reliability) / 100 * 3,
    0,
  ) / featureCount;

  const updatedFeatures = state.product.features.map((feature): Feature => {
    if (feature.status !== 'in-progress') return feature;

    const totalProgress = (totalHumanProgress + totalAiProgress) * featureProgressMultiplier * techDebtSlowdown;
    const newProgress = clamp(feature.progress + totalProgress, 0, 100);

    // Quality trends toward human skill contribution
    const targetQuality = (state.team.teamSize > 0 ? 40 + 30 : 30) * qualityMultiplier;
    const newQuality = clamp(
      feature.quality + (targetQuality - feature.quality) * 0.1,
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

  // Tech debt accumulation from AI agents
  const newTechDebtTotal = clamp(
    state.product.techDebtTotal + totalAiTechDebt * techDebtMultiplier,
    0,
    100,
  );

  // Bugs accumulate from tech debt
  const newBugs = Math.max(
    0,
    state.product.bugs + Math.floor(newTechDebtTotal / 25) - (shippedFeatures.length > 0 ? 1 : 0),
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
      revenue = 0;
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
      const activityMultiplier = 0.5 + qualityModifier * 1.0;
      const weeklyNoise = 1 + (Math.random() - 0.5) * 0.3;
      revenue = customers * pricePerUnit * activityMultiplier * bugPenalty * weeklyNoise;
      break;
    }

    case 'enterprise': {
      const enterpriseMultiplier = 15;
      revenue = customers * pricePerUnit * enterpriseMultiplier * qualityModifier * bugPenalty;
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

  let newInvestorSentiment = clamp(
    state.market.investorSentiment * 0.85 + newBubbleIndex * 0.15 + rand(-3, 3),
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

  const updatedCompetitors = state.market.competitors.map(
    (comp): Competitor => {
      if (!comp.alive) return comp;
      const qualityDelta = rand(-1, 1.5);
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
  if (state.team.teamSize === 0) return state;

  const totalTeamSize = state.team.teamSize + state.team.aiAgents.length;
  const aiRatio = totalTeamSize > 0 ? state.team.aiAgents.length / totalTeamSize : 0;

  let moraleDelta = 0;

  // AI ratio effect on morale
  moraleDelta += aiRatio * -0.5;

  // Natural drift toward 50
  moraleDelta += (50 - state.team.morale) * 0.02;

  // Culture: good culture helps
  moraleDelta += (state.company.culture - 50) * 0.01;

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

  return {
    ...state,
    team: {
      ...state.team,
      morale: newMorale,
    },
  };
}

// ─── Team Attrition ─────────────────────────────────────────────────

function simulateTeamAttrition(state: GameState): GameState {
  if (state.team.teamSize === 0) return state;

  // If morale < 20, chance of losing team members
  if (state.team.morale >= 20) return state;

  let quitChance = 0;
  if (state.team.morale < 10) {
    quitChance = 0.60;
  } else {
    quitChance = 0.30;
  }

  // Talent market heat: hot market = more options elsewhere
  if (state.market.talentMarketHeat > 70) {
    quitChance += 0.05;
  }

  if (Math.random() >= quitChance) return state;

  // Lose 1-2 team members
  const lostCount = Math.min(state.team.teamSize, Math.random() < 0.3 ? 2 : 1);

  const newLogEntries: EventLogEntry[] = [{
    id: generateId(),
    week: state.meta.week,
    eventId: 'team-attrition',
    title: `${lostCount} Team Member${lostCount > 1 ? 's' : ''} Quit`,
    description: `${lostCount} team member${lostCount > 1 ? 's' : ''} walked out. Morale was at ${state.team.morale}%. They said something about "work-life balance" on their way out.`,
    category: 'team',
  }];

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

  const strategy = state.meta.growthStrategy;
  let customerGrowthMultiplier = 1.0;
  if (strategy === 'growth-hack') {
    customerGrowthMultiplier = 1.5;
  } else if (strategy === 'sustainable') {
    customerGrowthMultiplier = 0.8;
  }

  const pmfGrowth = (pmf / 100) * (currentCustomers * 0.05 + 2);
  const marketGrowthRate = state.market.segmentData.growthRate / 52;
  const marketGrowth = currentCustomers * marketGrowthRate;

  let bubbleCustomerModifier = 1.0;
  if (state.market.bubbleIndex > 85) {
    bubbleCustomerModifier = 1.3;
  } else if (state.market.bubbleIndex < 25) {
    bubbleCustomerModifier = 0.6;
  }

  const reputationGrowth = (state.company.reputation / 100) * 1.5;

  const shippedFeatures = state.product.features.filter((f) => f.status === 'shipped');
  const avgShippedQuality = shippedFeatures.length > 0
    ? shippedFeatures.reduce((s, f) => s + f.quality, 0) / shippedFeatures.length
    : 0;
  const wordOfMouthMultiplier = avgShippedQuality > 70
    ? 1.0 + (avgShippedQuality - 70) / 100
    : 1.0;

  const marketingEffect = state.finances.marketingSpend > 0
    ? Math.sqrt(state.finances.marketingSpend / 1000) * 2
    : 0;

  const pricingGrowthBonus = state.finances.pricingModel === 'free' ? 1.5
    : state.finances.pricingModel === 'freemium' ? 1.3
    : state.finances.pricingModel === 'enterprise' ? 0.5
    : 1.0;

  let churnRate = state.product.churnRate;
  if (state.product.techDebtTotal > 70) {
    churnRate += 0.02;
  }
  const churned = currentCustomers * churnRate / 4;

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

function simulateMarketingSpend(state: GameState): GameState {
  const strategy = state.meta.growthStrategy;
  let marketingSpend = state.finances.marketingSpend;

  if (strategy === 'growth-hack') {
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
    marketingSpend = marketingSpend + (targetSpend - marketingSpend) * 0.2;
    marketingSpend = Math.round(marketingSpend);
  } else if (strategy === 'sustainable') {
    marketingSpend = Math.max(0, marketingSpend * 0.8);
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

  // --- TEAM DECISIONS (every 3-4 weeks) ---
  if (week > 1 && (week % 3 === 0 || (week % 4 === 0 && Math.random() < 0.5))) {
    const alreadyPending = state.pendingDecisions.some(
      (d) => d.eventId === 'auto-team-growth',
    );

    if (!alreadyPending) {
      const engSalary = 3500 + Math.floor(Math.random() * 1500);
      const growthSalary = 2500 + Math.floor(Math.random() * 1000);
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
              description: `Reduce tech debt by ~15 points (currently ${Math.round(state.product.techDebtTotal)}%)`,
              effects: [
                { path: 'product.techDebtTotal', operation: 'add', value: -15 },
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
              description: `Reduce tech debt by ~15 points (currently ${Math.round(state.product.techDebtTotal)}%)`,
              effects: [
                { path: 'product.techDebtTotal', operation: 'add', value: -15 },
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
