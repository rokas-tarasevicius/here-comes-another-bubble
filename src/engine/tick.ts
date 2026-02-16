import type {
  GameState,
  WeekSummary,
  Feature,
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
      return state; // Handled by events system, placeholder
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

// ─── Check game over conditions ───────────────────────────────────────

function checkGameOver(state: GameState): GameState {
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

  return state;
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

  // 6. Record week history
  const summary = createWeekSummary(next);
  next = {
    ...next,
    weekHistory: [...next.weekHistory, summary],
  };

  // 7. Check game over
  next = checkGameOver(next);

  return next;
}
